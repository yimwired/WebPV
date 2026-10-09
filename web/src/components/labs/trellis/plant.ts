/**
 * What grows out of one typed character.
 *
 * Every number is in em, with the origin on the baseline at the character's
 * left edge and y pointing down: the space glyph.ts measures letters in. That
 * is how a plant reads its own letter. A vine coils up the tallest upright
 * stroke, a rose settles on the letter's top edge, a runner leaves from its
 * side toward whatever comes next. What a plant cannot know is its neighbours,
 * since they may not be typed yet, so where its vines cross them is worked out
 * later, once the line is laid out (weave.ts).
 *
 * Thai gets stricter rules than Latin. A rose may sit on a Latin letter, the
 * way it does in the reel this comes from, because a covered serif is still the
 * same letter. A Thai letter is told apart by small things, a loop, a notch, a
 * tall stroke, so nothing solid is placed over a Thai letter's body at all:
 * only vines cross it, and they are thin.
 *
 * Nothing here touches the DOM. The same seed and the same letter always grow
 * the same plant, which is what lets a shared link rebuild a garden exactly.
 */

import { inkAt, markAt, type Glyph, type Point, type Stem } from "./glyph";

export type { Point };

export interface Vine {
  /** the drawn stroke, tendril included, as a polyline */
  d: string;
  /** the same points, so the stretches that pass in front of a letter can be cut out */
  points: Point[];
  /** distance along the vine at each point, em */
  along: number[];
  length: number;
  /** ms after the character was typed */
  delay: number;
  /** ms to draw: every vine grows at the same speed, so a long one takes longer */
  duration: number;
  /** short strokes along the stem, the way a rose cane has thorns */
  thorns: string;
}

export interface Leaf {
  x: number;
  y: number;
  /** degrees, clockwise, 0 pointing along +x */
  angle: number;
  /** outline, base at the origin, tip along +x */
  d: string;
  /** the midrib, drawn in the ground colour */
  rib: string;
  delay: number;
}

export interface Bloom {
  x: number;
  y: number;
  radius: number;
  /** outline around the origin */
  d: string;
  /** the petal lines, roses only */
  detail: string | null;
  delay: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Plant {
  /** where it holds on to its letter, which the wind pivots on */
  root: Point;
  vines: Vine[];
  leaves: Leaf[];
  roses: Bloom[];
  buds: Bloom[];
  bounds: Bounds;
  /** one sway cycle, seconds */
  swaySeconds: number;
  /** negative, so the plants are already out of phase on the first frame */
  swayOffset: number;
  /**
   * Which way a vine is travelling when it passes in front of a stroke: +1
   * rightward, -1 leftward. A coil is a helix, and seen from the front every
   * near-side crossing runs the same way, so following this one rule at every
   * crossing makes the coils read as wrapped rather than drawn on.
   */
  weave: 1 | -1;
}

/** How fast a vine draws, em per second. */
const GROW_SPEED = 1.9;
const MS_PER_EM = 1000 / GROW_SPEED;
/** Spacing of the points a vine is drawn through, em. */
const STEP = 0.012;
/** How far a rose's rim reaches from its centre, as a multiple of its radius. */
const ROSE_REACH = 1.2;
/** When a rose's petal lines start drawing, after it begins to open, ms. The CSS mirrors it. */
export const DETAIL_AT = 380;

// ── Randomness ──────────────────────────────────────────────────────────────

/** Small, fast, and the same in every engine, which Math.random is not. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a over the character, mixed with the sprout's own seed. */
export function seedFor(text: string, seed: number): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash ^ Math.imul(seed + 1, 0x9e3779b1)) >>> 0;
}

// ── Geometry helpers ────────────────────────────────────────────────────────

const round = (value: number) => Math.round(value * 1000) / 1000;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

interface Segment {
  from: Point;
  c1: Point;
  c2: Point;
  to: Point;
}

function cubicAt(s: Segment, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * s.from.x + b * s.c1.x + c * s.c2.x + d * s.to.x,
    y: a * s.from.y + b * s.c1.y + c * s.c2.y + d * s.to.y,
  };
}

/** Catmull-Rom through the points, as cubic Bezier segments. */
function smoothThrough(points: Point[], closed: boolean): Segment[] {
  const n = points.length;
  const at = (i: number) => (closed ? points[(i + n) % n] : points[clamp(i, 0, n - 1)]);
  const segments: Segment[] = [];
  const count = closed ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    segments.push({
      from: p1,
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      to: p2,
    });
  }
  return segments;
}

function segmentsToPath(segments: Segment[], closed: boolean): string {
  const first = segments[0].from;
  let d = `M${round(first.x)} ${round(first.y)}`;
  for (const s of segments) {
    d += `C${round(s.c1.x)} ${round(s.c1.y)} ${round(s.c2.x)} ${round(s.c2.y)} ${round(s.to.x)} ${round(s.to.y)}`;
  }
  return closed ? `${d}Z` : d;
}

/** Points along the segments, never further apart than STEP. */
function trace(segments: Segment[]): Point[] {
  const points: Point[] = [segments[0].from];
  for (const s of segments) {
    // The control polygon is never shorter than the curve, so this spacing errs fine.
    const n = Math.max(2, Math.ceil((dist(s.from, s.c1) + dist(s.c1, s.c2) + dist(s.c2, s.to)) / STEP));
    for (let k = 1; k <= n; k++) points.push(cubicAt(s, k / n));
  }
  return points;
}

export function polylinePath(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`).join("");
}

function headingAt(points: Point[], i: number): number {
  const a = points[clamp(i - 1, 0, points.length - 1)];
  const b = points[clamp(i + 1, 0, points.length - 1)];
  return Math.atan2(b.y - a.y, b.x - a.x);
}

const toDegrees = (radians: number) => (radians * 180) / Math.PI;

// ── Shapes ──────────────────────────────────────────────────────────────────

/**
 * A curl that continues the vine's own direction, so there is no kink where
 * the stem becomes the tendril. With the centre one radius off to one side, an
 * increasing angle runs along the tangent when that side is +1.
 */
function tendril(rng: () => number, points: Point[]): Point[] {
  const last = points[points.length - 1];
  const heading = headingAt(points, points.length - 1);
  const side = rng() < 0.5 ? 1 : -1;
  const radius = 0.04 + 0.025 * rng();
  const centre = {
    x: last.x + side * radius * -Math.sin(heading),
    y: last.y + side * radius * Math.cos(heading),
  };
  const start = Math.atan2(last.y - centre.y, last.x - centre.x);
  const turns = 1.2 + 0.35 * rng();
  const steps = 30;
  const curl: Point[] = [];
  for (let k = 1; k <= steps; k++) {
    const angle = start + side * (k / steps) * turns * Math.PI * 2;
    const r = radius * (1 - 0.8 * (k / steps));
    curl.push({ x: centre.x + r * Math.cos(angle), y: centre.y + r * Math.sin(angle) });
  }
  return curl;
}

/** A narrow pointed leaf, widest a third of the way out, base at the origin. */
function leafShape(rng: () => number, scale: number) {
  const length = (0.13 + 0.08 * rng()) * scale;
  const half = length * (0.15 + 0.04 * rng());
  const upper: Segment = {
    from: { x: 0, y: 0 },
    c1: { x: length * 0.2, y: -half * 1.3 },
    c2: { x: length * 0.6, y: -half * 1.15 },
    to: { x: length, y: 0 },
  };
  const lower: Segment = {
    from: { x: length, y: 0 },
    c1: { x: length * 0.6, y: half * 1.0 },
    c2: { x: length * 0.2, y: half * 1.15 },
    to: { x: 0, y: 0 },
  };
  return {
    length,
    d: segmentsToPath([upper, lower], true),
    rib: `M${round(length * 0.06)} 0Q${round(length * 0.45)} ${round(half * 0.12)} ${round(length * 0.84)} 0`,
    outline: trace([upper, lower]),
  };
}

/**
 * A rose head: a scalloped outline from two overlaid ripples plus noise, and
 * inside it, in the lighter colour, a loose spiral with wavy petal edges below
 * it. A regular spiral alone reads as a snail shell, not a rose.
 */
function roseShape(rng: () => number, radius: number) {
  const count = 22;
  const phaseA = rng() * Math.PI * 2;
  const phaseB = rng() * Math.PI * 2;
  const rim: Point[] = [];
  for (let k = 0; k < count; k++) {
    const angle = (k / count) * Math.PI * 2;
    // Five or six petal lobes, then a finer ripple so no two roses match.
    const r =
      radius *
      (1 +
        0.12 * Math.abs(Math.sin(2.5 * angle + phaseA)) +
        0.05 * Math.sin(7 * angle + phaseB) +
        0.06 * (rng() - 0.5));
    rim.push({ x: r * Math.cos(angle) * 1.08, y: r * Math.sin(angle) * 0.94 });
  }
  const segments = smoothThrough(rim, true);

  const strokes: Point[][] = [];
  const spiral: Point[] = [];
  const turns = 1.6 + 0.5 * rng();
  const twist = rng() < 0.5 ? 1 : -1;
  for (let k = 0; k <= 44; k++) {
    const t = k / 44;
    const angle = twist * t * turns * Math.PI * 2 + phaseA;
    const r = radius * (0.05 + 0.36 * t) * (1 + 0.14 * Math.sin(3 * angle + phaseB));
    spiral.push({ x: -0.04 * radius + r * Math.cos(angle) * 1.12, y: -0.18 * radius + r * Math.sin(angle) * 0.82 });
  }
  strokes.push(spiral);

  // Wavy petal edges across the lower half, the way the outer petals fold.
  const lips = 1 + Math.floor(rng() * 2);
  for (let p = 0; p < lips; p++) {
    const r = radius * (0.6 + 0.2 * p + 0.06 * rng());
    const from = (0.12 + 0.12 * rng()) * Math.PI;
    const to = (0.88 - 0.12 * rng()) * Math.PI;
    const arc: Point[] = [];
    for (let k = 0; k <= 22; k++) {
      const angle = lerp(from, to, k / 22);
      const rr = r * (1 + 0.09 * Math.sin((k / 22) * Math.PI * (4 + p)));
      arc.push({ x: rr * Math.cos(angle) * 1.05, y: rr * Math.sin(angle) * 0.86 });
    }
    strokes.push(arc);
  }

  return {
    d: segmentsToPath(segments, true),
    detail: strokes.map(polylinePath).join(""),
    rim: trace(segments),
  };
}

/** A closed bud with one pointed side, the rose colour, no petal line. */
function budShape(rng: () => number) {
  const radius = 0.026 + 0.016 * rng();
  const rim: Point[] = [];
  for (let k = 0; k < 8; k++) {
    const angle = (k / 8) * Math.PI * 2;
    const r = radius * (1 + 0.12 * (rng() - 0.5)) * (k === 6 ? 1.4 : 1);
    rim.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  const segments = smoothThrough(rim, true);
  return { radius, d: segmentsToPath(segments, true), rim: trace(segments) };
}

// ── The plant ───────────────────────────────────────────────────────────────

/** Everything one plant has grown so far, and the rules it grows by. */
class Growth {
  readonly vines: Vine[] = [];
  readonly leaves: Leaf[] = [];
  readonly roses: Bloom[] = [];
  readonly buds: Bloom[] = [];
  private readonly extents: { x: number; y: number; r: number }[] = [];

  constructor(
    readonly rng: () => number,
    readonly glyph: Glyph,
  ) {}

  /**
   * Whether a solid shape may go here. Never over a mark; on a Thai letter,
   * never across its body either, which covers every Thai letter in the line,
   * since they all share one body height.
   */
  private allowed(points: Point[]): boolean {
    const { glyph } = this;
    if (points.some((p) => markAt(glyph, p.x, p.y))) return false;
    if (glyph.thai && glyph.marks) {
      const { above, below } = glyph.marks;
      if (!points.every((p) => p.y < above) && !points.every((p) => p.y > below)) return false;
    }
    return true;
  }

  /**
   * @param body  the stem, without its tendril
   * @param options.thornsFrom  index of the first point thorns may grow at,
   *        so a coil hugging a stroke stays smooth
   */
  vine(body: Point[], delay: number, options: { curl?: boolean; thorns?: boolean; thornsFrom?: number } = {}) {
    const drawn = options.curl ? [...body, ...tendril(this.rng, body)] : body;
    const along = [0];
    for (let i = 1; i < drawn.length; i++) along.push(along[i - 1] + dist(drawn[i - 1], drawn[i]));
    const length = along[along.length - 1];
    const duration = length * MS_PER_EM;

    let thorns = "";
    if (options.thorns) {
      let side = this.rng() < 0.5 ? 1 : -1;
      let next = along[options.thornsFrom ?? 0] + 0.08 + 0.06 * this.rng();
      for (let i = 1; i < body.length - 1; i++) {
        if (along[i] < next) continue;
        if (along[i] > along[body.length - 1] - 0.05) break;
        const heading = headingAt(body, i);
        // Thorns lean back toward the root, out to alternating sides.
        const lean = heading + Math.PI + side * 0.75;
        const size = 0.013 + 0.006 * this.rng();
        const p = body[i];
        thorns += `M${round(p.x)} ${round(p.y)}L${round(p.x + size * Math.cos(lean))} ${round(p.y + size * Math.sin(lean))}`;
        side = -side;
        next = along[i] + 0.11 + 0.08 * this.rng();
      }
    }

    const vine: Vine = { d: polylinePath(drawn), points: drawn, along, length, delay, duration, thorns };
    this.vines.push(vine);
    drawn.forEach((p) => this.extents.push({ x: p.x, y: p.y, r: 0.03 }));
    /** when the drawing tip reaches point i */
    return { vine, at: (i: number) => delay + along[i] * MS_PER_EM };
  }

  leaf(at: Point, angle: number, delay: number, scale = 1): boolean {
    const shape = leafShape(this.rng, scale);
    const turn = (angle * Math.PI) / 180;
    const placed = shape.outline.map((p) => ({
      x: at.x + p.x * Math.cos(turn) - p.y * Math.sin(turn),
      y: at.y + p.x * Math.sin(turn) + p.y * Math.cos(turn),
    }));
    if (!this.allowed(placed)) return false;
    this.leaves.push({ x: round(at.x), y: round(at.y), angle: Math.round(angle), d: shape.d, rib: shape.rib, delay });
    placed.forEach((p) => this.extents.push({ x: p.x, y: p.y, r: 0.01 }));
    return true;
  }

  rose(at: Point, radius: number, delay: number): boolean {
    // Roses may crowd each other, the way the reel's do, but not stack.
    if (this.roses.some((r) => dist(r, at) < (r.radius + radius) * 0.8)) return false;
    const shape = roseShape(this.rng, radius);
    const placed = shape.rim.map((p) => ({ x: at.x + p.x, y: at.y + p.y }));
    if (!this.allowed([...placed, ...discInterior(at, radius)])) return false;
    this.roses.push({ x: round(at.x), y: round(at.y), radius, d: shape.d, detail: shape.detail, delay });
    this.extents.push({ x: at.x, y: at.y, r: radius * ROSE_REACH });
    return true;
  }

  bud(at: Point, delay: number): boolean {
    const shape = budShape(this.rng);
    const placed = shape.rim.map((p) => ({ x: at.x + p.x, y: at.y + p.y }));
    if (!this.allowed(placed)) return false;
    this.buds.push({ x: round(at.x), y: round(at.y), radius: shape.radius, d: shape.d, detail: null, delay });
    this.extents.push({ x: at.x, y: at.y, r: shape.radius * 1.4 });
    return true;
  }

  /** Leaves behind the drawing tip, alternating sides, sometimes in pairs. */
  leavesAlong(path: Point[], at: (i: number) => number, from: number, to: number, spacing: number) {
    const along = [0];
    for (let i = 1; i < path.length; i++) along.push(along[i - 1] + dist(path[i - 1], path[i]));
    let side = this.rng() < 0.5 ? 1 : -1;
    let next = along[from] + spacing * (0.5 + 0.5 * this.rng());
    for (let i = from; i <= to && i < path.length - 1; i++) {
      if (along[i] < next) continue;
      const heading = toDegrees(headingAt(path, i));
      const spread = 38 + 26 * this.rng();
      this.leaf(path[i], heading + side * spread, at(i) + 40);
      if (this.rng() < 0.35) this.leaf(path[i], heading - side * spread, at(i) + 90);
      side = -side;
      next = along[i] + spacing * (0.8 + 0.4 * this.rng());
    }
  }

  /** Two or three leaves fanned out at a tip. */
  fan(tip: Point, heading: number, delay: number) {
    const count = 2 + Math.floor(this.rng() * 2);
    for (let k = 0; k < count; k++) {
      const spread = (k - (count - 1) / 2) * (30 + 14 * this.rng());
      this.leaf(tip, heading + spread, delay + 50 * k, 1.15);
    }
  }

  bounds(): Bounds {
    const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (const e of this.extents) {
      box.minX = Math.min(box.minX, e.x - e.r);
      box.minY = Math.min(box.minY, e.y - e.r);
      box.maxX = Math.max(box.maxX, e.x + e.r);
      box.maxY = Math.max(box.maxY, e.y + e.r);
    }
    if (box.minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { minX: round(box.minX), minY: round(box.minY), maxX: round(box.maxX), maxY: round(box.maxY) };
  }
}

/** A few points inside a disc, so a rose cannot swallow a small mark whole. */
function discInterior(at: Point, radius: number): Point[] {
  const points: Point[] = [];
  for (let r = 0.25; r < 1; r += 0.25) {
    for (let k = 0; k < 12; k++) {
      const angle = (k / 12) * Math.PI * 2;
      points.push({ x: at.x + radius * r * Math.cos(angle), y: at.y + radius * r * Math.sin(angle) });
    }
  }
  points.push(at);
  return points;
}

/**
 * A helix around a stem, seen from the front and a little above: x swings
 * across the stroke, and the near half of every turn sits slightly lower than
 * the far half, which is what makes the loops read as loops.
 */
function coil(rng: () => number, stem: Stem, up: boolean, spin: 1 | -1): Point[] {
  const height = stem.bottom - stem.top;
  const inset = Math.min(0.05, height * 0.12);
  const from = up ? stem.bottom - inset : stem.top + inset;
  const to = up ? stem.top + inset * 1.2 : stem.bottom - inset * 1.2;
  const turns = clamp(Math.abs(to - from) / 0.2, 0.75, 2.4);
  const amp = stem.half + 0.034 + 0.026 * rng();
  const tilt = 0.32;
  const phase = rng() * Math.PI * 2;
  const n = Math.ceil(turns * 40);
  const points: Point[] = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const angle = phase + spin * u * turns * Math.PI * 2;
    points.push({
      x: stem.x + amp * Math.sin(angle),
      y: lerp(from, to, u) + tilt * amp * Math.cos(angle),
    });
  }
  return points;
}

/**
 * A stem from `from` to `to` with one S-bend. Given the point `before` it,
 * it carries on in the direction it was already going, so it leaves a coil
 * without a kink.
 */
function reach(rng: () => number, from: Point, to: Point, bend: number, before?: Point): Point[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const span = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / span, y: dx / span };
  const push = () => (rng() - 0.5) * bend;
  const a = { x: lerp(from.x, to.x, 0.36), y: lerp(from.y, to.y, 0.36) };
  const b = { x: lerp(from.x, to.x, 0.7), y: lerp(from.y, to.y, 0.7) };
  const pa = push();
  const pb = push();
  const mid1 = { x: a.x + normal.x * pa, y: a.y + normal.y * pa };
  const mid2 = { x: b.x + normal.x * pb, y: b.y + normal.y * pb };
  const through = before ? [before, from, mid1, mid2, to] : [from, mid1, mid2, to];
  const segments = smoothThrough(through, false);
  return trace(before ? segments.slice(1) : segments);
}

/** The y of the letter's top edge nearest to x. */
function crownAt(glyph: Glyph, x: number): number {
  let best = glyph.top;
  let gap = Infinity;
  for (const p of glyph.crown) {
    if (Math.abs(p.x - x) < gap) {
      gap = Math.abs(p.x - x);
      best = p.y;
    }
  }
  return best;
}

/** The outside edge of the ink on this row, scanning in from one side. */
function edgeAt(glyph: Glyph, y: number, side: 1 | -1): number | null {
  const from = side > 0 ? glyph.right : glyph.left;
  const to = side > 0 ? glyph.left : glyph.right;
  const steps = Math.ceil(Math.abs(to - from) / 0.006);
  for (let k = 0; k <= steps; k++) {
    const x = lerp(from, to, k / steps);
    if (inkAt(glyph.ink, x, y)) return x;
  }
  return null;
}

/**
 * @param seed   from `seedFor`
 * @param glyph  the letter it grows from, measured
 * @param index  its position in the line; even and odd lean opposite ways, so
 *               a word has plants above and below it rather than all on one side
 */
export function growPlant(seed: number, glyph: Glyph, index: number): Plant {
  const rng = mulberry32(seed);
  const g = new Growth(rng, glyph);
  const spin: 1 | -1 = rng() < 0.5 ? 1 : -1;

  const tall = glyph.top < -0.6;
  const descends = glyph.bottom > 0.12;
  const lean = index % 2 === 0 ? 0.12 : -0.12;
  const climbs = rng() < (descends ? 0.3 : tall ? 0.78 : 0.62) + lean;

  // The ceiling is the top of everything the letter has, marks included, and
  // the floor its lowest ink, so a vine that leaves the letter ends clear of it.
  const ceiling = Math.min(glyph.top, -0.3);
  const floor = Math.max(glyph.bottom, 0.02);
  // A Thai letter's body sits between these; nothing solid may cross it.
  const band = glyph.marks && glyph.thai ? glyph.marks : null;

  const stem = glyph.stems.length > 1 && rng() < 0.35 ? glyph.stems[1] : (glyph.stems[0] ?? null);
  const centre = { x: (glyph.left + glyph.right) / 2, y: (glyph.top + Math.min(glyph.bottom, 0)) / 2 };
  const side: 1 | -1 = rng() < 0.5 ? 1 : -1;

  // ── The main vine: up its stroke and out over the top, or down and below.
  let main: Point[];
  let coilEnd = 0;
  if (stem) {
    const wound = coil(rng, stem, climbs, spin);
    coilEnd = wound.length - 1;
    const out = climbs
      ? { x: stem.x + side * (0.18 + 0.42 * rng()), y: ceiling - (0.16 + 0.34 * rng()) }
      : { x: stem.x + side * (0.12 + 0.36 * rng()), y: floor + (0.16 + 0.3 * rng()) };
    main = [...wound, ...reach(rng, wound[coilEnd], out, 0.3, wound[coilEnd - 1]).slice(1)];
  } else {
    const start = { x: centre.x, y: centre.y };
    const out = climbs
      ? { x: centre.x + side * (0.12 + 0.3 * rng()), y: ceiling - (0.14 + 0.28 * rng()) }
      : { x: centre.x + side * (0.1 + 0.3 * rng()), y: floor + (0.14 + 0.26 * rng()) };
    main = reach(rng, start, out, 0.24);
  }

  const ending = rng();
  const mainEndsInRose = ending < (climbs ? 0.62 : 0.3);
  const mainCurls = !mainEndsInRose && ending > (climbs ? 0.85 : 0.72);
  const { at: mainAt } = g.vine(main, 0, { curl: mainCurls, thorns: true, thornsFrom: coilEnd });

  // A rose resting on the top of a Latin letter, where the coil comes out.
  if (stem && climbs && !glyph.thai && rng() < 0.55) {
    const radius = 0.13 + 0.06 * rng();
    const x = stem.x + (rng() - 0.5) * 0.08;
    const sink = 0.12 + 0.28 * rng();
    g.rose({ x, y: crownAt(glyph, x) - radius * (1 - sink) * 0.9 }, radius, mainAt(coilEnd) + 60);
  }

  // One leaf off the outermost swing of the coil, so the plant visibly holds on.
  if (stem && coilEnd > 8) {
    const i = Math.floor(coilEnd * (0.35 + 0.3 * rng()));
    let widest = i;
    for (let k = i - 8; k <= i + 8; k++) {
      if (k > 0 && k < coilEnd && Math.abs(main[k].x - stem.x) > Math.abs(main[widest].x - stem.x)) widest = k;
    }
    const outward = main[widest].x > stem.x ? 0 : 180;
    g.leaf(main[widest], outward + (climbs ? -28 : 28) + (rng() - 0.5) * 30, mainAt(widest) + 40, 0.9);
  }

  g.leavesAlong(main, mainAt, coilEnd + 4, main.length - 3, 0.2 + 0.08 * rng());

  const tip = main[main.length - 1];
  const tipHeading = toDegrees(headingAt(main, main.length - 1));
  if (mainEndsInRose) {
    const last = main.length - 1;
    const radius = climbs ? 0.12 + 0.08 * rng() : 0.08 + 0.04 * rng();
    // Leaves first, so the rose opens over them and they show round its edge.
    for (const turn of rng() < 0.5 ? [-1, 1] : [rng() < 0.5 ? -1 : 1]) {
      g.leaf(tip, tipHeading + turn * (55 + 30 * rng()), mainAt(last) + 40, 1.1);
    }
    if (!g.rose(tip, radius, mainAt(last) + 100)) {
      g.fan(tip, tipHeading, mainAt(last) + 40);
    } else if (rng() < 0.4) {
      // Roses in the reel come in twos as often as not.
      const back = Math.max(coilEnd, last - Math.round((radius * 1.6) / STEP));
      g.rose(main[back], radius * (0.6 + 0.2 * rng()), mainAt(back) + 160);
    }
  } else if (!mainCurls) {
    g.fan(tip, tipHeading, mainAt(main.length - 1) + 40);
  }

  // A twig off the way out, ending in a pair of leaves or a bud.
  if (main.length - coilEnd > 30 && rng() < 0.5) {
    const i = coilEnd + Math.floor((main.length - coilEnd) * (0.3 + 0.35 * rng()));
    const heading = headingAt(main, i) + (rng() < 0.5 ? 1 : -1) * (0.7 + 0.4 * rng());
    const length = 0.1 + 0.08 * rng();
    const end = { x: main[i].x + length * Math.cos(heading), y: main[i].y + length * Math.sin(heading) };
    const twig = reach(rng, main[i], end, 0.06);
    const { at: twigAt } = g.vine(twig, mainAt(i) + 30);
    if (rng() < 0.55) g.fan(end, toDegrees(heading), twigAt(twig.length - 1) + 30);
    else g.bud(end, twigAt(twig.length - 1) + 60);
  }

  // ── A runner out of the letter's side, toward its neighbour.
  if (rng() < 0.42) {
    const out: 1 | -1 = rng() < 0.6 ? (side === 1 ? -1 : 1) : side;
    const low = band ? band.above + 0.08 : glyph.top + 0.06;
    const high = band ? band.below - 0.08 : Math.min(glyph.bottom, 0) - 0.06;
    const y = lerp(Math.max(low, -0.5), high, 0.25 + 0.6 * rng());
    const edge = edgeAt(glyph, y, out);
    if (edge !== null) {
      const start = { x: edge - out * 0.016, y };
      const length = 0.28 + 0.3 * rng();
      // Off at an angle, up or down, so it reads as a shoot and not a strike-through.
      const drift = (rng() < 0.5 ? -1 : 1) * (0.16 + 0.2 * rng());
      const endY = band ? clamp(y + drift, band.above + 0.05, band.below - 0.05) : y + drift;
      const end = { x: start.x + out * length, y: endY };
      const runner = reach(rng, start, end, 0.16);
      const curls = rng() < 0.55;
      const delay = 140 + 120 * rng();
      const { at: runnerAt } = g.vine(runner, delay, { curl: curls, thorns: true });
      g.leavesAlong(runner, runnerAt, 8, runner.length - 2, 0.24);
      if (!curls) {
        if (rng() < 0.5) g.bud(end, runnerAt(runner.length - 1) + 60);
        else g.fan(end, toDegrees(headingAt(runner, runner.length - 1)), runnerAt(runner.length - 1) + 30);
      }
    }
  }

  // ── Something on the other side of the line: a hanging spray under a
  // climbing plant, a short sprig over a hanging one.
  if (rng() < 0.45) {
    const x = lerp(glyph.left, glyph.right, 0.2 + 0.6 * rng());
    const delay = 220 + 160 * rng();
    if (climbs) {
      const start = { x, y: Math.min(-0.02, (band?.below ?? 0) - 0.06) };
      const end = { x: x + (rng() - 0.5) * 0.5, y: floor + 0.14 + 0.26 * rng() };
      const spray = reach(rng, start, end, 0.18);
      const curls = rng() < 0.3;
      const { at: sprayAt } = g.vine(spray, delay, { curl: curls, thorns: true });
      g.leavesAlong(spray, sprayAt, 6, spray.length - 3, 0.2);
      const last = spray.length - 1;
      if (!curls && rng() < 0.6) {
        const radius = 0.07 + 0.04 * rng();
        g.rose(spray[last], radius, sprayAt(last) + 90);
        const near = Math.max(0, last - Math.round(0.12 / STEP));
        if (rng() < 0.6) g.rose(spray[near], 0.06 + 0.03 * rng(), sprayAt(near) + 140);
      } else if (!curls) {
        g.bud(spray[last], sprayAt(last) + 60);
      }
    } else {
      const start = { x, y: crownAt(glyph, x) + 0.02 };
      const end = { x: x + (rng() - 0.5) * 0.4, y: ceiling - (0.08 + 0.22 * rng()) };
      const sprig = reach(rng, start, end, 0.14);
      const { at: sprigAt } = g.vine(sprig, delay, { thorns: true });
      g.leavesAlong(sprig, sprigAt, 5, sprig.length - 3, 0.22);
      const last = sprig.length - 1;
      if (rng() < 0.5) g.bud(sprig[last], sprigAt(last) + 60);
      else g.fan(sprig[last], toDegrees(headingAt(sprig, last)), sprigAt(last) + 30);
    }
  }

  const root = stem ? { x: stem.x, y: climbs ? stem.bottom : stem.top } : centre;
  return {
    root: { x: round(root.x), y: round(root.y) },
    vines: g.vines,
    leaves: g.leaves,
    roses: g.roses,
    buds: g.buds,
    bounds: g.bounds(),
    swaySeconds: 4.4 + 2.6 * rng(),
    swayOffset: -rng() * 6,
    weave: spin,
  };
}
