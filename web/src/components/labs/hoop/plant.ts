/**
 * What grows out of one typed character.
 *
 * Every number here is in em, with the origin on the baseline at the
 * character's left edge and y pointing down. That one choice does two jobs: a
 * plant scales with the type for free, since the stage sets a single font size
 * and every vine, leaf and rose follows it, and the stitch estimate can read
 * lengths and areas straight off the same outlines that are drawn, then turn
 * them into millimetres with one multiplication.
 *
 * Nothing in this file touches the DOM, so it runs the same in a test as on
 * the page, and the same seed always grows the same plant.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Vine {
  d: string;
  /** measured along the drawn polyline, tendril included */
  length: number;
  /** ms after the character was typed */
  delay: number;
}

export interface Leaf {
  x: number;
  y: number;
  /** degrees, clockwise, 0 pointing along +x */
  angle: number;
  /** outline with the base at the origin and the tip along +x */
  d: string;
  area: number;
  /** drawn over the letters rather than behind them */
  front: boolean;
  delay: number;
}

export interface Bloom {
  x: number;
  y: number;
  /** outline around the origin */
  d: string;
  area: number;
  /** the petal spiral, roses only, around the same origin */
  detail: string | null;
  detailLength: number;
  delay: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Plant {
  /** where the first vine leaves the letter, which is what the wind pivots on */
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
}

/** Cap height of the display face, as a fraction of the em. */
export const CAP = 0.68;

/**
 * The band the text's ink occupies, top of the highest mark to the bottom of
 * the lowest descender, em. Flowers drawn over the letters are kept out of it
 * so a name stays readable at full bloom, which the reel this study comes from
 * gets wrong: its roses sit on the counters of the letters. In Thai it matters
 * more than legibility. A rose over the tone mark of ข้าว leaves ขาว, which is
 * a different word.
 */
export interface Clearance {
  top: number;
  bottom: number;
}

export const LATIN_CLEARANCE: Clearance = { top: -(CAP + 0.06), bottom: 0.06 };

/** How long a vine takes to draw, ms. Leaves and roses are timed against it. */
export const VINE_MS = 700;

/**
 * How far a rose's rim can reach from its centre, vertically, as a multiple of
 * its radius: the lobes add at most 0.11 + 0.05 + 0.035, and the head is
 * squashed to 0.94 of its width. A rose whose centre is this far clear of the
 * ink cannot touch it.
 */
const ROSE_REACH = 1.195 * 0.94;
/** The largest bud's reach, em: radius 0.046, its one long lobe 1.35, plus noise. */
const BUD_REACH = 0.07;

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

/** FNV-1a over the character, mixed with the sprout's id. */
export function seedFor(text: string, id: number): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash ^ Math.imul(id + 1, 0x9e3779b1)) >>> 0;
}

// ── Geometry helpers ────────────────────────────────────────────────────────

const round = (value: number) => Math.round(value * 1000) / 1000;

function cubicAt(p0: Point, c1: Point, c2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * c1.x + c * c2.x + d * p3.x,
    y: a * p0.y + b * c1.y + c * c2.y + d * p3.y,
  };
}

interface Segment {
  from: Point;
  c1: Point;
  c2: Point;
  to: Point;
}

/** Catmull-Rom through the points, as cubic Bezier segments. */
function smoothThrough(points: Point[], closed: boolean): Segment[] {
  const n = points.length;
  const at = (i: number) =>
    closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))];
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

function sampleSegments(segments: Segment[], perSegment: number): Point[] {
  const points: Point[] = [segments[0].from];
  for (const s of segments) {
    for (let k = 1; k <= perSegment; k++) {
      points.push(cubicAt(s.from, s.c1, s.c2, s.to, k / perSegment));
    }
  }
  return points;
}

export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

/** Shoelace area of a closed outline. */
export function polygonArea(points: Point[]): number {
  let twice = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    twice += a.x * b.y - b.x * a.y;
  }
  return Math.abs(twice) / 2;
}

function polylinePath(points: Point[]): string {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`)
    .join("");
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Outside the ink band, with room for something of this radius. */
const clearOf = (band: Clearance, p: Point, radius = 0) =>
  p.y < band.top - radius || p.y > band.bottom + radius;

// ── Parts ───────────────────────────────────────────────────────────────────

interface GrownVine {
  vine: Vine;
  /** the drawn body, densely sampled, without the tendril */
  path: Point[];
}

/**
 * A vine leaves the letter and climbs above the cap or drops below the
 * baseline, bending once on the way, and ends in a curl the way a real tendril
 * does when it has nothing to hold.
 */
function growVine(
  rng: () => number,
  start: Point,
  up: boolean,
  reach: number,
  delay: number,
  band: Clearance,
): GrownVine {
  // Wide rather than tall: the vines in the reel run along the line and tie
  // neighbouring letters together, which is most of what makes it read as one
  // garden rather than a row of separate plants. They end clear of the ink, so
  // a vine always has somewhere to put its rose.
  const end: Point = {
    x: start.x + (rng() < 0.5 ? -1 : 1) * (0.35 + 0.75 * rng()) * reach,
    y: up ? band.top - (0.14 + 0.4 * rng()) * reach : band.bottom + (0.1 + 0.34 * rng()) * reach,
  };

  // Two inner points pushed sideways off the straight line give the S-bend.
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const span = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / span, y: dx / span };
  const bend = (t: number) => {
    const push = (rng() - 0.5) * 0.5 * reach;
    return {
      x: lerp(start.x, end.x, t) + normal.x * push,
      y: lerp(start.y, end.y, t) + normal.y * push,
    };
  };

  const segments = smoothThrough([start, bend(0.33), bend(0.66), end], false);
  const body = sampleSegments(segments, 20);

  // The curl continues the vine's own direction, so there is no kink where the
  // body becomes the tendril. Circle maths: with the centre one radius off to
  // one side, an increasing angle runs along the tangent when that side is +1.
  const last = body[body.length - 1];
  const prev = body[body.length - 2];
  const heading = Math.atan2(last.y - prev.y, last.x - prev.x);
  const side = rng() < 0.5 ? 1 : -1;
  const radius = (0.055 + 0.03 * rng()) * reach;
  const centre = {
    x: last.x + side * radius * -Math.sin(heading),
    y: last.y + side * radius * Math.cos(heading),
  };
  const startAngle = Math.atan2(last.y - centre.y, last.x - centre.x);
  const turns = 1.25 + 0.3 * rng();
  const steps = 26;
  const curl: Point[] = [];
  for (let k = 1; k <= steps; k++) {
    const angle = startAngle + side * (k / steps) * turns * Math.PI * 2;
    const r = radius * (1 - 0.82 * (k / steps));
    curl.push({ x: centre.x + r * Math.cos(angle), y: centre.y + r * Math.sin(angle) });
  }

  const d = `${segmentsToPath(segments, false)}${curl
    .map((p) => `L${round(p.x)} ${round(p.y)}`)
    .join("")}`;

  return {
    vine: { d, length: polylineLength([...body, ...curl]), delay },
    path: body,
  };
}

/**
 * A pointed leaf, slightly fuller on one side, base at the origin. It is drawn
 * in front of the letters only if asked to and only if its whole outline, turned
 * and placed, stays clear of the ink; otherwise it goes behind them.
 */
function growLeaf(
  rng: () => number,
  at: Point,
  angle: number,
  delay: number,
  wantFront: boolean,
  band: Clearance,
  scale = 1,
): Leaf {
  const length = (0.15 + 0.12 * rng()) * scale;
  const half = length * (0.15 + 0.05 * rng());
  const upper: Segment = {
    from: { x: 0, y: 0 },
    c1: { x: length * 0.22, y: -half * 1.25 },
    c2: { x: length * 0.62, y: -half * 1.1 },
    to: { x: length, y: 0 },
  };
  const lower: Segment = {
    from: { x: length, y: 0 },
    c1: { x: length * 0.62, y: half * 0.9 },
    c2: { x: length * 0.22, y: half * 1.1 },
    to: { x: 0, y: 0 },
  };
  const outline = sampleSegments([upper, lower], 16);
  const turn = (Math.round(angle) * Math.PI) / 180;
  const placed = outline.map((p) => at.y + p.x * Math.sin(turn) + p.y * Math.cos(turn));
  const front = wantFront && (placed.every((y) => y < band.top) || placed.every((y) => y > band.bottom));
  return {
    x: round(at.x),
    y: round(at.y),
    angle: Math.round(angle),
    d: segmentsToPath([upper, lower], true),
    area: polygonArea(outline),
    front,
    delay,
  };
}

/**
 * A rose head: a scalloped outline from two overlaid ripples plus noise, and a
 * spiral of petal edges drawn inside it in the lighter thread.
 */
function growRose(rng: () => number, at: Point, radius: number, delay: number): Bloom {
  const count = 20;
  const phaseA = rng() * Math.PI * 2;
  const phaseB = rng() * Math.PI * 2;
  const rim: Point[] = [];
  for (let k = 0; k < count; k++) {
    const angle = (k / count) * Math.PI * 2;
    // Five or six petal lobes, then a finer ripple on top so no two match.
    const r =
      radius *
      (1 +
        0.11 * Math.abs(Math.sin(2.5 * angle + phaseA)) +
        0.05 * Math.sin(7 * angle + phaseB) +
        0.07 * (rng() - 0.5));
    rim.push({ x: r * Math.cos(angle) * 1.08, y: r * Math.sin(angle) * 0.94 });
  }
  const segments = smoothThrough(rim, true);

  // A loose centre spiral and two or three petal edges, rather than a perfect
  // coil: a regular spiral reads as a snail shell, not a rose.
  const strokes: Point[][] = [];
  const centre: Point[] = [];
  const turns = 1.5 + 0.5 * rng();
  const twist = rng() < 0.5 ? 1 : -1;
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    const angle = twist * t * turns * Math.PI * 2 + phaseA;
    const r = radius * (0.06 + 0.42 * t) * (1 + 0.14 * Math.sin(3 * angle + phaseB));
    centre.push({ x: -0.05 * radius + r * Math.cos(angle), y: -0.08 * radius + r * Math.sin(angle) });
  }
  strokes.push(centre);
  const petals = 2 + Math.floor(rng() * 2);
  for (let p = 0; p < petals; p++) {
    const from = phaseB + (p / petals) * Math.PI * 2 + rng() * 0.6;
    const span = (0.38 + 0.22 * rng()) * Math.PI;
    const r = radius * (0.6 + 0.18 * rng());
    const arc: Point[] = [];
    for (let k = 0; k <= 14; k++) {
      const angle = from + (k / 14) * span;
      const rr = r * (1 + 0.06 * Math.sin(k));
      arc.push({ x: rr * Math.cos(angle), y: rr * Math.sin(angle) * 0.92 });
    }
    strokes.push(arc);
  }

  return {
    x: round(at.x),
    y: round(at.y),
    d: segmentsToPath(segments, true),
    area: polygonArea(sampleSegments(segments, 8)),
    detail: strokes.map(polylinePath).join(""),
    detailLength: strokes.reduce((sum, s) => sum + polylineLength(s), 0),
    delay,
  };
}

/** A closed bud, the same rose colour, no petal line. */
function growBud(rng: () => number, at: Point, delay: number): Bloom {
  const radius = 0.028 + 0.018 * rng();
  const rim: Point[] = [];
  for (let k = 0; k < 8; k++) {
    const angle = (k / 8) * Math.PI * 2;
    const r = radius * (1 + 0.12 * (rng() - 0.5)) * (k === 6 ? 1.35 : 1);
    rim.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  const segments = smoothThrough(rim, true);
  return {
    x: round(at.x),
    y: round(at.y),
    d: segmentsToPath(segments, true),
    area: polygonArea(sampleSegments(segments, 8)),
    detail: null,
    detailLength: 0,
    delay,
  };
}

// ── The plant ───────────────────────────────────────────────────────────────

/**
 * @param seed     from `seedFor`, so retyping the same letter grows a new plant
 * @param advance  the character's advance width, em
 * @param index    its position in the line, which alternates climbing and hanging
 * @param band     the ink of the whole line, which flowers in front must stay off
 */
export function growPlant(
  seed: number,
  advance: number,
  index: number,
  band: Clearance = LATIN_CLEARANCE,
): Plant {
  const rng = mulberry32(seed);
  const width = Math.max(advance, 0.2);

  const climbs = index % 2 === 0 ? rng() > 0.22 : rng() < 0.22;
  const root: Point = {
    x: width * (0.25 + 0.5 * rng()),
    y: climbs ? -CAP * (0.55 + 0.4 * rng()) : -CAP * (0.03 + 0.22 * rng()),
  };

  const grown = [growVine(rng, root, climbs, 1, 0, band)];
  if (rng() < 0.42) {
    const second: Point = {
      x: width * (0.2 + 0.6 * rng()),
      y: climbs ? -CAP * (0.05 + 0.2 * rng()) : -CAP * (0.6 + 0.35 * rng()),
    };
    grown.push(growVine(rng, second, !climbs, 0.7, 160, band));
  }

  const leaves: Leaf[] = [];
  const roses: Bloom[] = [];
  const buds: Bloom[] = [];

  const headingAt = (path: Point[], i: number) => {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    return Math.atan2(b.y - a.y, b.x - a.x);
  };

  grown.forEach(({ vine, path }) => {
    // Leaves sprout behind the drawing tip, alternating sides.
    const count = 3 + Math.floor(rng() * 3);
    let side = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < count; k++) {
      const t = 0.18 + (0.66 * (k + rng() * 0.6)) / count;
      const i = Math.min(path.length - 2, Math.max(1, Math.round(t * (path.length - 1))));
      const angle = (headingAt(path, i) * 180) / Math.PI + side * (36 + 28 * rng());
      leaves.push(growLeaf(rng, path[i], angle, vine.delay + VINE_MS * t + 60, rng() < 0.3, band));
      side = -side;
    }

    // Roses only where their whole head clears the ink, sized before they are
    // placed so a big rose needs a point further out than a small one.
    const roll = rng();
    const wanted = roll < 0.2 ? 0 : roll < 0.75 ? 1 : 2;
    const radius = () => 0.09 + 0.13 * rng();
    let endTaken = false;
    let size = radius();
    const open = path
      .map((p, i) => ({ p, t: i / (path.length - 1) }))
      .filter(({ p, t }) => t > 0.5 && clearOf(band, p, size * ROSE_REACH));
    for (let k = 0; k < wanted && open.length > 0; k++) {
      // The first rose takes the far end when it can, the way the reel's do.
      const index = k === 0 ? open.length - 1 - Math.floor(rng() * Math.min(4, open.length)) : Math.floor(rng() * open.length);
      const pick = open[index];
      endTaken ||= pick.t > 0.9;
      roses.push(growRose(rng, pick.p, size, vine.delay + VINE_MS * pick.t + 140));
      const placed = size;
      size = Math.min(size, radius());
      // Keep the next rose clear of this one.
      for (let j = open.length - 1; j >= 0; j--) {
        if (Math.hypot(open[j].p.x - pick.p.x, open[j].p.y - pick.p.y) < (placed + size) * 1.1) open.splice(j, 1);
      }
    }

    // A tip with no rose on it fans out into a spray of two or three leaves.
    if (!endTaken) {
      const i = path.length - 2;
      const heading = (headingAt(path, i) * 180) / Math.PI;
      const spray = 2 + Math.floor(rng() * 2);
      for (let k = 0; k < spray; k++) {
        const spread = (k - (spray - 1) / 2) * (34 + 14 * rng());
        leaves.push(growLeaf(rng, path[i], heading + spread, vine.delay + VINE_MS + 40 * k, rng() < 0.5, band, 1.15));
      }
    }

    if (rng() < 0.55) {
      const t = 0.35 + 0.35 * rng();
      const i = Math.round(t * (path.length - 1));
      if (clearOf(band, path[i], BUD_REACH)) buds.push(growBud(rng, path[i], vine.delay + VINE_MS * t + 200));
    }
  });

  return {
    root,
    vines: grown.map((g) => g.vine),
    leaves,
    roses,
    buds,
    bounds: boundsOf(grown.map((g) => g.path), leaves, [...roses, ...buds]),
    swaySeconds: 4.2 + 2.6 * rng(),
    swayOffset: -rng() * 6,
  };
}

function boundsOf(paths: Point[][], leaves: Leaf[], blooms: Bloom[]): Bounds {
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const take = (x: number, y: number, pad: number) => {
    box.minX = Math.min(box.minX, x - pad);
    box.minY = Math.min(box.minY, y - pad);
    box.maxX = Math.max(box.maxX, x + pad);
    box.maxY = Math.max(box.maxY, y + pad);
  };
  // Tendrils curl within about 0.1em of the end, and strokes are 0.02em wide.
  paths.forEach((path) => path.forEach((p) => take(p.x, p.y, 0.12)));
  leaves.forEach((leaf) => take(leaf.x, leaf.y, 0.2));
  blooms.forEach((bloom) => take(bloom.x, bloom.y, 0.24));
  return {
    minX: round(box.minX),
    minY: round(box.minY),
    maxX: round(box.maxX),
    maxY: round(box.maxY),
  };
}

/** Everything a plant will be stitched as, in em and em². */
export function plantMaterial(plant: Plant) {
  return {
    vineLength: plant.vines.reduce((sum, v) => sum + v.length, 0),
    leafArea: plant.leaves.reduce((sum, l) => sum + l.area, 0),
    roseArea: plant.roses.reduce((sum, r) => sum + r.area, 0) + plant.buds.reduce((sum, b) => sum + b.area, 0),
    detailLength: plant.roses.reduce((sum, r) => sum + r.detailLength, 0),
  };
}
