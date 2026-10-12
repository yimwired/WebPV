/**
 * How the caps sit on the ball, and which cap is which.
 *
 * The caps run in rings of latitude, the way they would be glued onto a real
 * ball: every cap square to its row, each row as full as it can be without two
 * caps touching where the row is narrowest. The row nearest each pole has no
 * room for a ring, so one cap sits on the pole itself.
 *
 * Legends are dealt so that the copies of one key land as far apart as the
 * free caps allow, which means a key pressed on a real keyboard nearly always
 * has a copy on the side of the ball facing the viewer.
 */

import { KEYS } from "./keys";
import { dot, seededRandom, type Vec3 } from "./math";

/** Radius of the sphere the caps' bases sit on, in cap widths. */
export const BALL_RADIUS = 4.9;

/** Centre-to-centre spacing of the rows, and the least spacing of caps in a row. */
const ROW_PITCH = 1.06;
const CAP_PITCH = 1.06;

/** Glass caps with an object set inside, spread evenly over the ball. */
const ARTISAN_COUNT = 12;
/** How many different objects are cast into them. */
export const ARTISAN_DESIGNS = 4;

const SEED = 0x7c0ffee;

/** Colour slots, in the order a colourway lists its plastics. */
export const SLOT = { main: 0, dark: 1, light: 2, accent: 3 } as const;

export interface BallLayout {
  count: number;
  /** each cap's centre as a unit vector in the ball's own frame, xyz per cap */
  dirs: Float32Array;
  /** each cap's east tangent, the direction its legend reads along */
  easts: Float32Array;
  /** index into KEYS, or -1 for a blank cap or a glass one */
  keyOf: Int16Array;
  /** which of the colourway's four plastics the cap is cut from */
  slotOf: Uint8Array;
  /** which object a glass cap holds, or -1 for an ordinary cap */
  artisanOf: Int8Array;
  /** every cap that carries each key's legend, by index into KEYS */
  capsOfKey: number[][];
}

function placeCaps(): { dirs: Vec3[]; easts: Vec3[] } {
  const dirs: Vec3[] = [];
  const easts: Vec3[] = [];
  const rows = Math.round((Math.PI * BALL_RADIUS) / ROW_PITCH);
  const step = Math.PI / rows;
  const halfCap = 0.5 / BALL_RADIUS;

  for (let row = 0; row < rows; row++) {
    const latitude = -Math.PI / 2 + (row + 0.5) * step;
    const narrowest = Math.abs(latitude) + halfCap;
    const fit = Math.floor((2 * Math.PI * BALL_RADIUS * Math.cos(narrowest)) / CAP_PITCH);
    if (fit < 2) {
      dirs.push([0, Math.sign(latitude), 0]);
      easts.push([1, 0, 0]);
      continue;
    }
    // Rows start at golden-ratio offsets, so no seam of aligned caps runs pole to pole.
    const offset = (((row * 0.6180339887) % 1) * 2 * Math.PI) / fit;
    for (let i = 0; i < fit; i++) {
      const longitude = offset + (i / fit) * 2 * Math.PI;
      dirs.push([
        Math.cos(latitude) * Math.sin(longitude),
        Math.sin(latitude),
        Math.cos(latitude) * Math.cos(longitude),
      ]);
      easts.push([Math.cos(longitude), 0, -Math.sin(longitude)]);
    }
  }
  return { dirs, easts };
}

/**
 * Picks `count` caps from `candidates`, each as far as possible from those
 * already picked (and from `avoid`): farthest-point sampling on the sphere.
 */
function spreadPick(dirs: Vec3[], candidates: Set<number>, count: number, first: number, avoid: number[] = []): number[] {
  const picked = [first];
  candidates.delete(first);
  while (picked.length < count && candidates.size > 0) {
    let best = -1;
    let bestClosest = Infinity;
    for (const candidate of candidates) {
      // the nearest picked cap is the one with the largest dot product
      let closest = -Infinity;
      for (const other of picked) closest = Math.max(closest, dot(dirs[candidate], dirs[other]));
      for (const other of avoid) closest = Math.max(closest, dot(dirs[candidate], dirs[other]));
      if (closest < bestClosest) {
        bestClosest = closest;
        best = candidate;
      }
    }
    picked.push(best);
    candidates.delete(best);
  }
  return picked;
}

function randomMember(set: Set<number>, random: () => number): number {
  const members = [...set];
  return members[Math.floor(random() * members.length)];
}

export function layoutBall(): BallLayout {
  const random = seededRandom(SEED);
  const { dirs, easts } = placeCaps();
  const count = dirs.length;

  const keyOf = new Int16Array(count).fill(-1);
  const slotOf = new Uint8Array(count);
  const artisanOf = new Int8Array(count).fill(-1);
  const capsOfKey: number[][] = KEYS.map(() => []);

  const everyCap = new Set(dirs.keys());
  const artisans = spreadPick(dirs, everyCap, ARTISAN_COUNT, randomMember(everyCap, random));
  artisans.forEach((cap, i) => (artisanOf[cap] = i % ARTISAN_DESIGNS));

  // `everyCap` is now the caps left for legends. Keys with the most copies are
  // dealt first, while there is still room to spread them.
  const order = [...KEYS.keys()].sort((a, b) => KEYS[b].copies - KEYS[a].copies);
  for (const key of order) {
    if (everyCap.size === 0) break;
    const caps = spreadPick(dirs, everyCap, KEYS[key].copies, randomMember(everyCap, random));
    for (const cap of caps) keyOf[cap] = key;
    capsOfKey[key] = caps;
  }

  for (let cap = 0; cap < count; cap++) {
    if (artisanOf[cap] >= 0) continue;
    const key = keyOf[cap];
    if (key >= 0 && KEYS[key].accent) {
      slotOf[cap] = SLOT.accent;
      continue;
    }
    // A blank cap is more often an accent than a printed one: on a real set
    // the novelty colours go on the keys nobody needs to read.
    const accentChance = key < 0 ? 0.12 : 0.04;
    const roll = random();
    if (roll < accentChance) slotOf[cap] = SLOT.accent;
    else if (roll < accentChance + (1 - accentChance) * 0.36) slotOf[cap] = SLOT.main;
    else if (roll < accentChance + (1 - accentChance) * 0.68) slotOf[cap] = SLOT.dark;
    else slotOf[cap] = SLOT.light;
  }

  return {
    count,
    dirs: new Float32Array(dirs.flat()),
    easts: new Float32Array(easts.flat()),
    keyOf,
    slotOf,
    artisanOf,
    capsOfKey,
  };
}
