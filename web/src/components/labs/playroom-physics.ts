// ─────────────────────────────────────────────────────────────
//  The physics behind the Playroom lab: a jar of sweets you can
//  tip, drag and throw.
//
//  Written rather than installed. matter-js is the obvious reach here, but it
//  is ~90 KB gzipped for a general rigid-body solver — polygons, constraints,
//  compound bodies, a broadphase — and this jar holds nothing but circles.
//  Circle-circle is the one collision pair with a closed-form answer, so the
//  whole solver is the file you are reading and there is no dependency to
//  keep current.
//
//  Everything is in CSS pixels and seconds. The renderer owns the device
//  pixel ratio; the solver never hears about it.
// ─────────────────────────────────────────────────────────────

/** Downward pull. Tuned by eye against the jar's height, not to earth: at a
 *  true 9.8 m/s² a 500 px jar empties in a blink and reads as a glitch. */
const GRAVITY = 2100;

/** How much speed survives a bounce. Sweets are not superballs — most of the
 *  drop should be spent by the second contact, or the jar never settles. */
const RESTITUTION = 0.32;

/** Air drag per second, applied as a multiplier. Keeps a thrown sweet from
 *  crossing the jar forever and helps the pile come to rest. */
const DRAG = 0.6;

/** Tangential loss against the floor. This is what stops sweets sliding across
 *  it like hockey pucks after they land. */
const FRICTION = 0.78;

/**
 * Tangential loss between two sweets, as a fraction of their sliding speed
 * removed per contact.
 *
 * Without it only the floor has friction, so a sweet resting on the pile is on
 * ice: the smallest sideways nudge sends it skating until it hits the glass,
 * bounces, and starts back the other way. On a narrow phone jar that never
 * ends, and a pile that never stops moving is a render loop that never sleeps.
 */
const PAIR_FRICTION = 0.28;

/** Fraction of an overlap corrected per iteration. Correcting all of it at
 *  once makes a deep pile explode: every pair shoves at full strength on the
 *  same tick, and the corrections add up. */
const CORRECTION = 0.55;

/**
 * How many times the contacts are solved per substep.
 *
 * One pass leaves a pile visibly interpenetrating: fixing A against B pushes B
 * into C, and there is nothing left in the tick to fix that. Going round again
 * on the same positions is what turns a heap of overlapping discs into sweets
 * resting on each other, and at this body count it is nearly free.
 */
const RELAXATIONS = 3;

/**
 * Closing speed under which a contact is treated as resting rather than as an
 * impact, in px/s.
 *
 * Without this the pile never stops. Gravity adds ~12 px/s to every body on
 * every substep, a bounce hands a fraction of that straight back, and the two
 * settle into a permanent shiver that is too small to see and quite large
 * enough to keep the render loop awake forever. Below this speed the collision
 * is inelastic, which is what a sweet lying on another sweet actually is.
 */
const REST_SPEED = 60;

/**
 * Movement under which a body counts as still, in px per frame.
 *
 * Measured on position rather than velocity on purpose. A body resting on the
 * pile carries a real residual velocity — one substep of gravity that the
 * contact cancels on the next — so by speed it never looks asleep, while by
 * position it has not moved in seconds. Position is also the thing that
 * matters here: the loop exists to redraw, and nothing that has not moved
 * needs redrawing.
 */
const SLEEP_MOVEMENT = 0.2;

/** How many consecutive still frames before the world reports itself settled
 *  and the caller can stop asking for frames. A single frame is not enough —
 *  a body at the top of a bounce is momentarily still. */
const SLEEP_FRAMES = 24;

/** Ceiling on one integration step. A backgrounded tab hands back a delta of
 *  several seconds, and at that size a body moves through a wall before
 *  anything gets a chance to push it back. */
const MAX_STEP = 1 / 30;

/** Substeps per frame. More, smaller steps is what keeps a tall pile from
 *  sinking into itself; it costs the same total work as one big step. */
const SUBSTEPS = 3;

export interface Body {
  id: number;
  /** Index into the caller's flavour list. The solver never reads it. */
  flavour: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** Radians. Only exists so the renderer can spin the stripe on the sweet. */
  angle: number;
  /** Set true while a pointer is holding this body: it then follows the
   *  pointer instead of the solver, and pushes others without being pushed. */
  held: boolean;
  /** Position at the end of the previous frame, for the sleep test. */
  lastX: number;
  lastY: number;
}

export interface World {
  bodies: Body[];
  width: number;
  height: number;
  /** True once nothing has moved for SLEEP_FRAMES. The caller stops the loop
   *  on this and restarts it on any change. */
  settled: boolean;
  stillFrames: number;
  nextId: number;
}

export function createWorld(width: number, height: number): World {
  return { bodies: [], width, height, settled: false, stillFrames: 0, nextId: 1 };
}

/** Any change to the contents has to cancel the settled flag, or a sweet
 *  added to a sleeping jar hangs in the air until something else wakes it. */
export function wake(world: World) {
  world.settled = false;
  world.stillFrames = 0;
}

/**
 * Drops one body in from above the jar.
 *
 * `spread` is a 0..1 position across the width rather than a pixel, so the
 * caller can aim a sweet under the flavour button that produced it without
 * knowing how wide the jar currently is.
 */
export function addBody(world: World, flavour: number, r: number, spread: number): Body {
  const margin = r + 6;
  const body: Body = {
    id: world.nextId++,
    flavour,
    x: margin + spread * Math.max(1, world.width - margin * 2),
    // above the lip, so it falls in rather than appearing in the pile
    y: -r - 20 - Math.random() * 40,
    vx: (Math.random() - 0.5) * 90,
    vy: 0,
    r,
    angle: Math.random() * Math.PI * 2,
    held: false,
    lastX: 0,
    lastY: 0,
  };
  world.bodies.push(body);
  wake(world);
  return body;
}

/** Removes the most recently added body of a flavour — the one nearest the
 *  top of the pile, which is the one a person watching would expect to go. */
export function removeLast(world: World, flavour: number): boolean {
  for (let i = world.bodies.length - 1; i >= 0; i--) {
    if (world.bodies[i].flavour === flavour) {
      world.bodies.splice(i, 1);
      wake(world);
      return true;
    }
  }
  return false;
}

/** The topmost body under a point, or null. Topmost because that is the one
 *  drawn last and so the one the visitor believes they are touching. */
export function bodyAt(world: World, x: number, y: number): Body | null {
  for (let i = world.bodies.length - 1; i >= 0; i--) {
    const b = world.bodies[i];
    const dx = x - b.x;
    const dy = y - b.y;
    // a little slack, because a fingertip is not a pixel
    if (dx * dx + dy * dy <= (b.r + 8) ** 2) return b;
  }
  return null;
}

/**
 * Resizes the jar and pulls anything now outside back in.
 *
 * Without the second half, rotating a phone leaves half the sweets stranded
 * beyond the wall with nothing to push them back: the wall check only reflects
 * a body that is *moving* into it, and these are asleep.
 */
export function resize(world: World, width: number, height: number) {
  world.width = width;
  world.height = height;
  for (const b of world.bodies) {
    b.x = Math.min(Math.max(b.x, b.r), width - b.r);
    if (b.y > height - b.r) b.y = height - b.r;
  }
  wake(world);
}

/** Restitution for a contact arriving at this speed. Slow ones do not bounce;
 *  see REST_SPEED for why the pile depends on it. */
function bounceAt(speed: number): number {
  return speed > REST_SPEED ? RESTITUTION : 0;
}

function collidePair(a: Body, b: Body) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const minDistance = a.r + b.r;
  const squared = dx * dx + dy * dy;
  if (squared >= minDistance * minDistance || squared === 0) return;

  const distance = Math.sqrt(squared);
  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = minDistance - distance;

  // A held body is infinitely heavy: it keeps following the pointer and shoves
  // everything else aside. Sharing the correction with it would drag it out of
  // the visitor's grip, which feels like the page fighting back.
  const aMoves = a.held ? 0 : b.held ? 1 : 0.5;
  const bMoves = b.held ? 0 : a.held ? 1 : 0.5;

  a.x -= nx * overlap * aMoves * CORRECTION;
  a.y -= ny * overlap * aMoves * CORRECTION;
  b.x += nx * overlap * bMoves * CORRECTION;
  b.y += ny * overlap * bMoves * CORRECTION;

  // Only the closing speed carries an impulse; two sweets drifting apart that
  // happen to still overlap must not be yanked back together.
  const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (closing > 0) return;

  // A slow contact is a sweet lying on another sweet, not a collision.
  const impulse = -(1 + bounceAt(-closing)) * closing * 0.5;

  // Friction acts along the contact, at right angles to the normal.
  const tx = -ny;
  const ty = nx;
  const sliding = ((b.vx - a.vx) * tx + (b.vy - a.vy) * ty) * 0.5 * PAIR_FRICTION;

  if (!a.held) {
    a.vx -= impulse * nx - sliding * tx;
    a.vy -= impulse * ny - sliding * ty;
  }
  if (!b.held) {
    b.vx += impulse * nx - sliding * tx;
    b.vy += impulse * ny - sliding * ty;
  }
}

function collideWalls(body: Body, world: World) {
  const { r } = body;

  if (body.x < r) {
    body.x = r;
    if (body.vx < 0) body.vx *= -bounceAt(-body.vx);
  } else if (body.x > world.width - r) {
    body.x = world.width - r;
    if (body.vx > 0) body.vx *= -bounceAt(body.vx);
  }

  if (body.y > world.height - r) {
    body.y = world.height - r;
    if (body.vy > 0) body.vy *= -bounceAt(body.vy);
    body.vx *= FRICTION;
    // Rolling without slipping: the contact point is stationary, so the spin
    // follows from the speed along the floor. Doing it this way instead of
    // integrating a torque means a sweet at rest never creeps.
    body.angle += (body.vx / r) * 0.016;
  }

  // No ceiling. Sweets are dropped in from above the lip and have to fall
  // through that line to arrive.
}

/**
 * Advances the world by `dt` seconds and reports whether anything moved.
 *
 * The pair loop is O(n²) with no broadphase on purpose. The jar is capped at
 * under a hundred bodies, which is ~4k pair tests per substep — well inside a
 * frame's budget — and a grid would add bookkeeping and a class of bug for a
 * saving nobody could measure here.
 */
export function step(world: World, dt: number): boolean {
  if (world.settled) return false;

  const clamped = Math.min(dt, MAX_STEP);
  const h = clamped / SUBSTEPS;
  const damping = Math.pow(DRAG, h);

  for (let s = 0; s < SUBSTEPS; s++) {
    for (const body of world.bodies) {
      if (body.held) continue;
      body.vy += GRAVITY * h;
      body.vx *= damping;
      body.vy *= damping;
      body.x += body.vx * h;
      body.y += body.vy * h;
    }

    for (let pass = 0; pass < RELAXATIONS; pass++) {
      for (let i = 0; i < world.bodies.length; i++) {
        for (let j = i + 1; j < world.bodies.length; j++) {
          collidePair(world.bodies[i], world.bodies[j]);
        }
      }
      // Walls take part in every pass: a body shoved sideways by the last
      // contact has to be put back inside before the next one reads its
      // position, or the pile learns to lean through the glass.
      for (const body of world.bodies) collideWalls(body, world);
    }
  }

  let moved = 0;
  for (const body of world.bodies) {
    if (body.held) return true;
    moved = Math.max(moved, Math.abs(body.x - body.lastX) + Math.abs(body.y - body.lastY));
    body.lastX = body.x;
    body.lastY = body.y;
  }

  if (moved > SLEEP_MOVEMENT) {
    world.stillFrames = 0;
    return true;
  }

  world.stillFrames++;
  if (world.stillFrames <= SLEEP_FRAMES) return true;

  world.settled = true;
  // Park the residue, so a sleeping pile is not storing a nudge it would spend
  // the moment something wakes it.
  for (const body of world.bodies) {
    body.vx = 0;
    body.vy = 0;
  }
  return false;
}

/**
 * Lays the jar out without running any physics, for `prefers-reduced-motion`.
 *
 * Sweets are packed in offset rows from the floor up, which is roughly where
 * the solver would have put them anyway. Nobody who asked for less motion
 * should have to watch a pile bounce itself flat to find out what is in it.
 */
export function settleInstantly(world: World) {
  const sorted = [...world.bodies].sort((a, b) => a.id - b.id);
  if (sorted.length === 0) return;

  const r = sorted[0].r;
  const perRow = Math.max(1, Math.floor(world.width / (r * 2.05)));
  const rowHeight = r * 1.78;

  sorted.forEach((body, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    // half-step every other row, the way circles actually stack
    const offset = row % 2 === 0 ? 0 : r;
    body.x = Math.min(world.width - r, r + offset + col * r * 2.05);
    body.y = world.height - r - row * rowHeight;
    body.vx = 0;
    body.vy = 0;
    body.lastX = body.x;
    body.lastY = body.y;
    body.angle = 0;
  });

  world.settled = true;
}
