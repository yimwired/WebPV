/**
 * The ball as a physical thing: how it turns, how each cap rises and sinks,
 * and the waves a press sends around it. No WebGL in here; the renderer reads
 * the state this leaves behind.
 *
 * Each cap's height is a spring pulled toward rest, toward the hover height or
 * toward the bottom of its travel while pressed. Waves are added on top
 * rather than through the springs, so a crest passes over a cap at exactly
 * the speed it travels instead of lagging behind it.
 */

import { CAP } from "./geometry";
import { BALL_RADIUS, layoutBall, type BallLayout } from "./layout";
import {
  add,
  clamp,
  cross,
  dot,
  length,
  normalize,
  quatConjugate,
  quatFromAxisAngle,
  quatMultiply,
  quatNormalize,
  quatRotate,
  scale,
  type Quat,
  type Vec3,
} from "./math";

/** How far a hovered cap rises and a pressed one sinks, in cap widths. */
const HOVER_LIFT = 0.3;
const PRESS_DEPTH = -0.24;
/**
 * Seconds a press holds its cap down: long enough for a cap pressed from its
 * hovered height, the usual case with a mouse, to travel all the way below
 * the caps around it before the spring brings it back.
 */
const PRESS_HOLD = 0.12;
/** A little under critical damping: a released cap overshoots once and settles. */
const STIFFNESS = 380;
const DAMPING = 2 * Math.sqrt(STIFFNESS) * 0.55;

/** Speed of a wave's front over the ball, in radians of arc per second. */
const WAVE_SPEED = 2.8;
const WAVE_WIDTH = 0.26;
const WAVE_HEIGHT = 0.5;
/**
 * How far a cap tips to follow the slope of a passing wave, as a share of the
 * slope itself. Rising alone, a cap facing the viewer only grows a little;
 * tipping turns its top through the light, which is what makes a wave read on
 * the face of the ball and not only at its edge.
 */
const WAVE_TILT = 0.8;
/** Seconds for a wave's height to fall to about a third. */
const WAVE_DECAY = 1.7;
/** The wave leaves once the key has bottomed out, from just clear of it. */
const WAVE_DELAY = 0.05;
const WAVE_START = 0.16;
const MAX_WAVES = 12;
/** A cap is never pushed further than this off the ball, however many crests meet on it. */
const MAX_LIFT = 0.85;

/** The ball turns on its own at about a turn every forty seconds. */
const IDLE_SPIN: Vec3 = [0, 0.16, 0];
/** Seconds for a flick to settle back into the idle turn. */
const SPIN_SETTLE = 1.5;
const MAX_SPIN = 9;

/** The radius picking hits, near the tops of the caps. */
const PICK_RADIUS = BALL_RADIUS + CAP.height * 0.9;
/** A hit further than this from the nearest cap's centre landed in a gap. */
const PICK_REACH = Math.cos(0.64 / BALL_RADIUS);

/** Tipped toward the viewer and rolled, so the rows cross the ball on a slant. */
const RESTING_POSE = quatNormalize(
  quatMultiply(quatFromAxisAngle([0, 0, 1], -0.42), quatFromAxisAngle([1, 0, 0], 0.38)),
);

interface Wave {
  /** the cap it started from */
  origin: number;
  start: number;
  /** every cap's angle from the origin, worked out once */
  distance: Float32Array;
  /** the axis each cap tips about as the wave passes, at right angles to its travel; xyz per cap */
  axis: Float32Array;
}

export class Ball {
  readonly layout: BallLayout = layoutBall();
  readonly count = this.layout.count;

  orientation: Quat = RESTING_POSE;
  /** angular velocity in world space, radians per second */
  spin: Vec3 = [IDLE_SPIN[0], IDLE_SPIN[1], IDLE_SPIN[2]];
  dragging = false;
  reducedMotion = false;
  /** whether the ball turns by itself when nobody is touching it */
  idleTurn = true;
  hovered = -1;
  /** seconds since the ball was made, on the clock `step` is given */
  time = 0;

  /** what is drawn: each cap's distance off the ball, how brightly it glows, and how it is tipped */
  readonly lift: Float32Array;
  readonly glow: Float32Array;
  /** a rotation vector per cap (axis times angle, in the ball's frame), xyz per cap */
  readonly tilt: Float32Array;

  private readonly springLift: Float32Array;
  private readonly springVelocity: Float32Array;
  private readonly pressedUntil: Float32Array;
  private readonly flash: Float32Array;
  private waves: Wave[] = [];

  constructor() {
    this.lift = new Float32Array(this.count);
    this.glow = new Float32Array(this.count);
    this.tilt = new Float32Array(this.count * 3);
    this.springLift = new Float32Array(this.count);
    this.springVelocity = new Float32Array(this.count);
    this.pressedUntil = new Float32Array(this.count);
    this.flash = new Float32Array(this.count);
  }

  capDir(cap: number): Vec3 {
    const dirs = this.layout.dirs;
    return [dirs[cap * 3], dirs[cap * 3 + 1], dirs[cap * 3 + 2]];
  }

  /** A cap's centre direction as the ball is turned now. */
  capWorldDir(cap: number): Vec3 {
    return quatRotate(this.orientation, this.capDir(cap));
  }

  /** Turns the ball by `angle` about a world axis, as a drag does. */
  rotateBy(axis: Vec3, angle: number) {
    this.orientation = quatNormalize(quatMultiply(quatFromAxisAngle(axis, angle), this.orientation));
  }

  /** Under reduced motion the ball stops where it is and any wave under way is called off. */
  setReducedMotion(reduce: boolean) {
    this.reducedMotion = reduce;
    if (reduce) {
      this.spin = [0, 0, 0];
      this.waves = [];
    }
  }

  /** Stops (or restarts) the turn the ball makes on its own; a flick still spins it. */
  setIdleTurn(turning: boolean) {
    this.idleTurn = turning;
    if (!turning) this.spin = [0, 0, 0];
  }

  beginDrag() {
    this.dragging = true;
    this.spin = [0, 0, 0];
  }

  /** Lets go with the pointer's last angular velocity; under reduced motion the ball simply stops. */
  endDrag(velocity: Vec3) {
    this.dragging = false;
    if (this.reducedMotion) {
      this.spin = [0, 0, 0];
      return;
    }
    const speed = length(velocity);
    this.spin = speed > MAX_SPIN ? scale(velocity, MAX_SPIN / speed) : velocity;
  }

  /** The cap under a ray from `origin`, or -1 for the gaps, the background and the far side. */
  capAt(origin: Vec3, direction: Vec3): number {
    const b = dot(origin, direction);
    const c = dot(origin, origin) - PICK_RADIUS * PICK_RADIUS;
    const discriminant = b * b - c;
    if (discriminant < 0) return -1;
    const t = -b - Math.sqrt(discriminant);
    if (t < 0) return -1;
    const hit = normalize(add(origin, scale(direction, t)));
    const local = quatRotate(quatConjugate(this.orientation), hit);
    const dirs = this.layout.dirs;
    let best = -1;
    let closest = -2;
    for (let cap = 0; cap < this.count; cap++) {
      const d = local[0] * dirs[cap * 3] + local[1] * dirs[cap * 3 + 1] + local[2] * dirs[cap * 3 + 2];
      if (d > closest) {
        closest = d;
        best = cap;
      }
    }
    return closest >= PICK_REACH ? best : -1;
  }

  /** Of the caps printed with `key`, the one turned most toward `toEye`. */
  facingCopy(key: number, toEye: Vec3): number {
    let best = -1;
    let facing = -2;
    for (const cap of this.layout.capsOfKey[key] ?? []) {
      const d = dot(this.capWorldDir(cap), toEye);
      if (d > facing) {
        facing = d;
        best = cap;
      }
    }
    return best;
  }

  /** Presses a cap: it sinks, and unless motion is reduced, a wave leaves it. */
  press(cap: number) {
    this.pressedUntil[cap] = this.time + PRESS_HOLD;
    this.flash[cap] = 0.5;
    if (this.reducedMotion) return;

    const origin = this.capDir(cap);
    const distance = new Float32Array(this.count);
    const axis = new Float32Array(this.count * 3);
    for (let i = 0; i < this.count; i++) {
      const dir = this.capDir(i);
      distance[i] = Math.acos(clamp(dot(origin, dir), -1, 1));
      // origin × dir points along the axis a cap tips about to lean along the wave's travel
      const across = cross(origin, dir);
      const span = length(across);
      if (span > 1e-6) axis.set(scale(across, 1 / span), i * 3);
    }
    this.waves.push({ origin: cap, start: this.time + WAVE_DELAY, distance, axis });
    if (this.waves.length > MAX_WAVES) this.waves.shift();
  }

  /** The waves under way: where each started and how long ago, for inspection. */
  get activeWaves(): { origin: number; age: number }[] {
    return this.waves.map((wave) => ({ origin: wave.origin, age: this.time - wave.start }));
  }

  /**
   * Advances everything by `dt` seconds. Returns whether anything is still
   * moving, so the loop can sleep when nothing is.
   */
  step(dt: number): boolean {
    this.time += dt;
    const now = this.time;
    let moving = this.dragging;

    if (!this.dragging) {
      const target = this.reducedMotion || !this.idleTurn ? [0, 0, 0] : IDLE_SPIN;
      const settle = 1 - Math.exp(-dt / SPIN_SETTLE);
      this.spin = [
        this.spin[0] + (target[0] - this.spin[0]) * settle,
        this.spin[1] + (target[1] - this.spin[1]) * settle,
        this.spin[2] + (target[2] - this.spin[2]) * settle,
      ];
      const speed = length(this.spin);
      // With nothing to settle back into, a spin that has died away stops, so the loop can sleep.
      if ((this.reducedMotion || !this.idleTurn) && speed < 1e-3) this.spin = [0, 0, 0];
      else if (speed > 0) {
        this.rotateBy(this.spin, speed * dt);
        moving = true;
      }
    }

    // Springs, in two half steps: a dropped frame at 30fps is still stable.
    const half = dt / 2;
    for (let cap = 0; cap < this.count; cap++) {
      const target =
        this.pressedUntil[cap] > now ? PRESS_DEPTH : cap === this.hovered ? HOVER_LIFT : 0;
      let x = this.springLift[cap];
      let v = this.springVelocity[cap];
      for (let i = 0; i < 2; i++) {
        v += (STIFFNESS * (target - x) - DAMPING * v) * half;
        x += v * half;
      }
      if (Math.abs(x - target) < 1e-4 && Math.abs(v) < 1e-3) {
        x = target;
        v = 0;
      } else {
        moving = true;
      }
      this.springLift[cap] = x;
      this.springVelocity[cap] = v;
      this.flash[cap] = Math.max(0, this.flash[cap] - dt * 2.2);
      if (this.flash[cap] > 0) moving = true;
    }

    this.waves = this.waves.filter((wave) => WAVE_START + WAVE_SPEED * (now - wave.start) < Math.PI + WAVE_WIDTH * 4);
    if (this.waves.length > 0) moving = true;

    for (let cap = 0; cap < this.count; cap++) {
      let crest = 0;
      let tiltX = 0;
      let tiltY = 0;
      let tiltZ = 0;
      for (const wave of this.waves) {
        const age = now - wave.start;
        if (age < 0) continue;
        const front = WAVE_START + WAVE_SPEED * age;
        const offset = wave.distance[cap] - front;
        const height = WAVE_HEIGHT * Math.exp(-age / WAVE_DECAY);
        // A crest, and a shallow trough following it, as on water.
        const ahead = offset / WAVE_WIDTH;
        const behind = (offset + WAVE_WIDTH * 1.6) / (WAVE_WIDTH * 1.3);
        const crestShape = Math.exp(-ahead * ahead);
        const troughShape = Math.exp(-behind * behind);
        crest += height * (crestShape - 0.28 * troughShape);
        // The profile's slope per unit of the ball's surface. A cap on a slope
        // that falls away from the origin leans away from it, and the other way.
        const slope =
          (height * ((-2 * ahead * crestShape) / WAVE_WIDTH + (0.56 * behind * troughShape) / (WAVE_WIDTH * 1.3))) /
          BALL_RADIUS;
        const lean = -Math.atan(slope) * WAVE_TILT;
        tiltX += wave.axis[cap * 3] * lean;
        tiltY += wave.axis[cap * 3 + 1] * lean;
        tiltZ += wave.axis[cap * 3 + 2] * lean;
      }
      this.tilt[cap * 3] = tiltX;
      this.tilt[cap * 3 + 1] = tiltY;
      this.tilt[cap * 3 + 2] = tiltZ;
      this.lift[cap] = clamp(this.springLift[cap] + crest, PRESS_DEPTH, MAX_LIFT);
      const hover = cap === this.hovered ? 0.1 : 0;
      this.glow[cap] = hover + this.flash[cap] + Math.max(crest, 0) * 0.9;
    }

    return moving;
  }
}
