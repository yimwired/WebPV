"use client";

import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  BackSide,
  Color,
  Euler,
  LatheGeometry,
  MathUtils,
  NeutralToneMapping,
  Quaternion,
  Vector2,
  Vector3,
  type Group,
  type Mesh,
  type MeshPhysicalMaterial,
} from "three";

import { SceneCanvas } from "./scene-canvas";
import type { Finish } from "./trine-finishes";

const BAND_COUNT = 3;

/** Half the band's depth from inner to outer face, and half its width across the finger. */
const THICKNESS = 0.07;
const WIDTH = 0.13;

/** Under 1 squares off the profile: flat enough to catch a long highlight, soft enough to wear. */
const SQUARENESS = 0.7;

/**
 * A pose of the three bands. Each one is tipped about its own in-plane axis, 120 degrees
 * from the next, and moved along that axis in proportion to the tip. That is what links
 * them: every band passes through the disc of the other two exactly once, like the real
 * object, rather than three hoops stacked up a finger.
 */
interface Sitting {
  tip: number[];
  phase: number[];
}

const OFFSET_PER_RADIAN = 0.9;

/**
 * The poses a ring may settle into. A numerical sweep over this range (surfaces sampled,
 * every pair checked for clearance and for still being linked) found no two bands
 * touching, so anything drawn from here, or between two poses drawn from here, is a pose
 * the object could really hold.
 */
const TIP_RANGE = [0.24, 0.46] as const;
const PHASE_RANGE = 0.2;

/** What a hard drag adds to the tip, inside the same checked range. */
const SWING_OPEN = 0.06;
const SWING_FULL_AT = 5;

const FIRST_SITTING: Sitting = {
  tip: [0.3, 0.36, 0.27],
  phase: [0.08, -0.12, 0.05],
};

function randomSitting(): Sitting {
  const draw = (low: number, high: number) => low + Math.random() * (high - low);
  return {
    tip: Array.from({ length: BAND_COUNT }, () => draw(TIP_RANGE[0], TIP_RANGE[1] - SWING_OPEN)),
    phase: Array.from({ length: BAND_COUNT }, () => draw(-PHASE_RANGE, PHASE_RANGE)),
  };
}

/** Each band answers at its own rate, so a ring settles one band after another. */
const SETTLE_RATE = [2.4, 3.3, 4.4];

/** How slowly the bands wander when nobody is touching the ring. */
const IDLE_RATE_SHARE = 0.22;
const IDLE_WANDER_EVERY = 5.5;

const OWN_AXIS_SPEED = 0.12;
const RADIANS_PER_PIXEL = 0.011;
const THROW_DECAY = 2.6;

/** Follows the hand closely, but smooths over frames in which no pointer event arrived. */
const THROW_TRACKING_RATE = 18;

/** One press of an arrow key counts as this far of a drag: about five degrees. */
const KEY_PIXELS = 8;

/**
 * How the ring faces between finger and thumb: open towards the camera, so it spans the
 * gap between them. Worked out over every sitting above, it is never narrower than the gap.
 */
const HELD_POSE = new Quaternion().setFromEuler(new Euler(-0.5, 0.25, 0, "YXZ"));

/** Tipped further and rolled, for the close-up, where the bands read best as long ellipses. */
const CLOSE_UP_POSE = new Quaternion().setFromAxisAngle(
  new Vector3(0.82, 0.28, -0.5).normalize(),
  0.82,
);

/** Whatever a drag does to the ring, it goes back to the hand once left alone this long. */
const RETURN_AFTER = 0.9;
const RETURN_RATE = 2.2;

const WORLD_X = new Vector3(1, 0, 0);
const WORLD_Y = new Vector3(0, 1, 0);
const WORLD_Z = new Vector3(0, 0, 1);
const turnX = new Quaternion();
const turnY = new Quaternion();
const bandAxis = new Vector3();

function buildBandGeometry() {
  const steps = 40;
  const profile: Vector2[] = [];
  for (let step = 0; step <= steps; step += 1) {
    // Starts on the inner face, so the lathe's seam sits where nobody looks.
    const angle = Math.PI + (step / steps) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    profile.push(
      new Vector2(
        1 + THICKNESS * Math.sign(cos) * Math.abs(cos) ** SQUARENESS,
        WIDTH * Math.sign(sin) * Math.abs(sin) ** SQUARENESS,
      ),
    );
  }
  // A lathe turns about Y; the rest of this file treats Z as the ring's own axis.
  const geometry = new LatheGeometry(profile, 220).rotateX(Math.PI / 2);

  // Without these the anisotropic highlight takes its direction from each triangle
  // in turn, and shows the band's segments as ribs.
  geometry.computeTangents();
  return geometry;
}

interface Handling {
  dragging: boolean;
  lastX: number;
  lastY: number;
  /** Pixels asked for since the last frame, by a pointer or an arrow key. */
  movedX: number;
  movedY: number;
  /** Radians per second, carried on after a throw. */
  speedX: number;
  speedY: number;
  /** Set on release: the frame loop picks where the ring settles next. */
  released: boolean;
}

function newHandling(): Handling {
  return {
    dragging: false,
    lastX: 0,
    lastY: 0,
    movedX: 0,
    movedY: 0,
    speedX: 0,
    speedY: 0,
    released: false,
  };
}

function Trine({
  finishes,
  moving,
  pose,
  handlingRef,
}: {
  finishes: Finish[];
  moving: boolean;
  pose: Quaternion;
  handlingRef: RefObject<Handling>;
}) {
  const turn = useRef<Group>(null);
  const ownAxis = useRef<Group>(null);
  const bands = useRef<(Mesh | null)[]>([]);
  const metals = useRef<(MeshPhysicalMaterial | null)[]>([]);

  // Everything below changes every frame, so it lives outside React state.
  const live = useRef({
    tip: [...FIRST_SITTING.tip],
    phase: [...FIRST_SITTING.phase],
    target: FIRST_SITTING,
    rateShare: 1,
    sinceWander: 0,
    sinceHandled: 0,
  });

  const geometry = useMemo(() => buildBandGeometry(), []);

  // The first paint uses these; later choices are eased in by the frame loop.
  const [firstFinishes] = useState(finishes);
  const metalTargets = useMemo(() => finishes.map((finish) => new Color(finish.color)), [finishes]);

  useFrame((_, frameDelta) => {
    if (!turn.current || !ownAxis.current) return;
    const delta = Math.min(frameDelta, 0.05);
    const hand = handlingRef.current;
    const state = live.current;

    const askedY = hand.movedX * RADIANS_PER_PIXEL;
    const askedX = hand.movedY * RADIANS_PER_PIXEL;
    hand.movedX = 0;
    hand.movedY = 0;

    if (hand.dragging) {
      hand.speedX = MathUtils.damp(hand.speedX, askedY / delta, THROW_TRACKING_RATE, delta);
      hand.speedY = MathUtils.damp(hand.speedY, askedX / delta, THROW_TRACKING_RATE, delta);
    } else if (moving) {
      const decay = Math.exp(-delta * THROW_DECAY);
      hand.speedX *= decay;
      hand.speedY *= decay;
    } else {
      // Reduced motion: the ring goes where it is put and stops there.
      hand.speedX = 0;
      hand.speedY = 0;
    }

    const carriedY = hand.dragging ? 0 : hand.speedX * delta;
    const carriedX = hand.dragging ? 0 : hand.speedY * delta;
    turnY.setFromAxisAngle(WORLD_Y, askedY + carriedY);
    turnX.setFromAxisAngle(WORLD_X, askedX + carriedX);
    turn.current.quaternion.premultiply(turnY).premultiply(turnX);
    if (moving && !hand.dragging) ownAxis.current.rotateOnAxis(WORLD_Z, delta * OWN_AXIS_SPEED);

    state.sinceHandled = hand.dragging || askedY !== 0 || askedX !== 0 ? 0 : state.sinceHandled + delta;
    if (moving && state.sinceHandled > RETURN_AFTER) {
      turn.current.quaternion.slerp(pose, 1 - Math.exp(-delta * RETURN_RATE));
    }

    state.sinceWander += delta;
    if (hand.released) {
      hand.released = false;
      // Reduced motion: no glide home, it is simply back in the hand.
      if (!moving) turn.current.quaternion.copy(pose);
      state.target = randomSitting();
      state.rateShare = 1;
      state.sinceWander = 0;
      if (!moving) {
        state.tip = [...state.target.tip];
        state.phase = [...state.target.phase];
      }
    } else if (moving && !hand.dragging && state.sinceWander > IDLE_WANDER_EVERY) {
      state.target = randomSitting();
      state.rateShare = IDLE_RATE_SHARE;
      state.sinceWander = 0;
    }

    const speed = Math.hypot(hand.speedX, hand.speedY);
    const swing = moving ? Math.min(speed / SWING_FULL_AT, 1) * SWING_OPEN : 0;
    const blend = moving ? 1 - Math.exp(-delta * 7) : 1;

    for (let index = 0; index < BAND_COUNT; index += 1) {
      const rate = SETTLE_RATE[index] * state.rateShare;
      state.tip[index] = MathUtils.damp(state.tip[index], state.target.tip[index] + swing, rate, delta);
      state.phase[index] = MathUtils.damp(state.phase[index], state.target.phase[index], rate, delta);

      const band = bands.current[index];
      if (band) {
        const angle = (index * Math.PI * 2) / BAND_COUNT + state.phase[index];
        bandAxis.set(Math.cos(angle), Math.sin(angle), 0);
        band.quaternion.setFromAxisAngle(bandAxis, state.tip[index]);
        band.position.copy(bandAxis).multiplyScalar(OFFSET_PER_RADIAN * state.tip[index]);
      }

      const metal = metals.current[index];
      if (metal) {
        metal.color.lerp(metalTargets[index], blend);
        metal.roughness = MathUtils.lerp(metal.roughness, finishes[index].roughness, blend);
      }
    }
  });

  return (
    <group ref={turn} quaternion={pose}>
      <group ref={ownAxis}>
        {firstFinishes.map((finish, index) => (
          <mesh
            key={index}
            ref={(mesh) => {
              bands.current[index] = mesh;
            }}
            geometry={geometry}
          >
            <meshPhysicalMaterial
              ref={(metal) => {
                metals.current[index] = metal;
              }}
              color={finish.color}
              roughness={finish.roughness}
              metalness={1}
              // The felt wheel leaves a direction in the surface, so highlights stretch along the band.
              anisotropy={0.3}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Both sets are module level, because a new element here re-renders the environment map
 * whenever a metal is chosen.
 *
 * The hero's is a light tent, as for any jewellery shot on white: the metal mostly sees a
 * pale room, so white gold reads as white and each gold as its own colour, and black flags
 * draw the dark lines that give it an edge against the paper.
 */
const LIGHT_TENT = (
  <Environment resolution={256}>
    <mesh scale={40}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial side={BackSide} color="#a9a6a0" toneMapped={false} />
    </mesh>
    <Lightformer intensity={3} position={[0, 5, 3]} scale={[10, 3, 1]} />
    <Lightformer intensity={9} position={[2.5, 1.5, 5]} rotation-z={-0.6} scale={[0.4, 9, 1]} />
    <Lightformer intensity={6} position={[-2.5, -1, 5]} rotation-z={0.7} scale={[0.3, 8, 1]} />
    <Lightformer color="#000000" position={[-4, 0, 3]} rotation-y={Math.PI / 2} scale={[1.6, 12, 1]} />
    <Lightformer color="#000000" position={[4, -1, 3]} rotation-y={-Math.PI / 2} scale={[1.2, 12, 1]} />
    <Lightformer color="#000000" position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[12, 1.4, 1]} />
  </Environment>
);

/**
 * The close-up's is the opposite: a soft key above, long strips to draw a line along each
 * band, a warm bounce from below, and darkness everywhere else.
 */
const DARK_SET = (
  <Environment resolution={256}>
    <Lightformer intensity={1.5} position={[0, 5, 2]} scale={[10, 5, 1]} />
    <Lightformer intensity={7} position={[2.5, 1.5, 5]} rotation-z={-0.6} scale={[0.5, 9, 1]} />
    <Lightformer intensity={3} position={[-3, -1.5, 5]} rotation-z={0.5} scale={[0.35, 7, 1]} />
    <Lightformer intensity={0.9} color="#f5e6d3" position={[0, -4, 2]} scale={[10, 4, 1]} />
  </Environment>
);

/**
 * Neutral tone mapping, made for product pictures, rather than the default ACES: ACES
 * turns a bright reflection white whatever the metal, and rose gold on this paper vanished.
 */
const GL_OPTIONS = { antialias: true, alpha: true, toneMapping: NeutralToneMapping };

const ARROW_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-KEY_PIXELS, 0],
  ArrowRight: [KEY_PIXELS, 0],
  ArrowUp: [0, -KEY_PIXELS],
  ArrowDown: [0, KEY_PIXELS],
};

/**
 * The ring held in the Trine hero, on a transparent canvas under the cut-out hand.
 *
 * Hand-rolled drag rather than OrbitControls, which forces `touch-action: none` on its
 * element: this box covers much of a phone's width, and a swipe that starts on it still
 * has to scroll the page. Vertical swipes scroll, sideways ones turn the ring.
 */
export default function TrineScene({
  finishes,
  moving,
}: {
  finishes: Finish[];
  moving: boolean;
}) {
  const handlingRef = useRef(newHandling());

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const hand = handlingRef.current;
    hand.dragging = true;
    hand.lastX = event.clientX;
    hand.lastY = event.clientY;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const hand = handlingRef.current;
    if (!hand.dragging) return;
    hand.movedX += event.clientX - hand.lastX;
    hand.movedY += event.clientY - hand.lastY;
    hand.lastX = event.clientX;
    hand.lastY = event.clientY;
  };

  const onPointerEnd = () => {
    const hand = handlingRef.current;
    if (!hand.dragging) return;
    hand.dragging = false;
    hand.released = true;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const push = ARROW_KEYS[event.key];
    if (!push) return;
    event.preventDefault();
    handlingRef.current.movedX += push[0];
    handlingRef.current.movedY += push[1];
  };

  const onKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (ARROW_KEYS[event.key]) handlingRef.current.released = true;
  };

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label="The ring. Drag it, or use the arrow keys, to turn it."
      className="h-full w-full cursor-grab touch-pan-y rounded-full outline-offset-4 outline-[#141210] select-none focus-visible:outline-1 active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    >
      <SceneCanvas camera={{ position: [0, 0, 7.8], fov: 30 }} gl={GL_OPTIONS}>
        <Trine finishes={finishes} moving={moving} pose={HELD_POSE} handlingRef={handlingRef} />
        {LIGHT_TENT}
      </SceneCanvas>
    </div>
  );
}

/** The same ring, close enough to crop, for the dark band further down. Nothing to hold here. */
export function TrineCloseUp({
  finishes,
  moving,
}: {
  finishes: Finish[];
  moving: boolean;
}) {
  const handlingRef = useRef(newHandling());

  return (
    <SceneCanvas camera={{ position: [0, 0, 4.2], fov: 30 }} gl={GL_OPTIONS}>
      <Trine finishes={finishes} moving={moving} pose={CLOSE_UP_POSE} handlingRef={handlingRef} />
      {DARK_SET}
    </SceneCanvas>
  );
}
