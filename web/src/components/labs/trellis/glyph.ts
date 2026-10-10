/**
 * Letters read off a canvas, in em, with the origin on the baseline at the
 * cluster's left edge and y pointing down: the same space the plants grow in.
 *
 * Each typed cluster is drawn once and three things are read off its pixels:
 *
 *   ink    which cells are covered, so a vine can tell when it passes over a
 *          stroke, and a rose can tell what it would hide
 *   stems  strokes that stand upright long enough for a vine to coil around
 *   marks  the ink above the body of a Thai letter or below its baseline, and
 *          any combining mark on a Latin one. Nothing may cover these, because
 *          hiding one changes the word: ข้าว without its tone mark is ขาว, and
 *          ป without its tall stroke is บ.
 *
 * Browser only. Results are cached per font and cluster for the life of the page.
 */

/** Pixels per em in the raster everything here is read from. */
const SIZE = 160;
const PAD = 3;
/** Coverage counted as ink: half, so an antialiased edge lands where the eye puts it. */
const HALF = 128;

export interface Point {
  x: number;
  y: number;
}

export interface InkMap {
  /** em, the left edge of the first column and the top edge of the first row */
  x0: number;
  y0: number;
  cols: number;
  rows: number;
  /** 1 where the cell is ink */
  data: Uint8Array;
}

/** An upright stroke, trimmed to the height every column of it shares. */
export interface Stem {
  x: number;
  half: number;
  top: number;
  bottom: number;
}

/**
 * Where marks begin. Ink above `above` or below `below` is a mark; the flags
 * say whether this cluster actually has any there.
 */
export interface Marks {
  above: number;
  below: number;
  hasAbove: boolean;
  hasBelow: boolean;
}

export interface Glyph {
  advance: number;
  /** the ink box; `top` is negative, above the baseline */
  left: number;
  right: number;
  top: number;
  bottom: number;
  ink: InkMap | null;
  /** tallest first */
  stems: Stem[];
  /** the top of the letter's body across its width, marks left out */
  crown: Point[];
  marks: Marks | null;
  /** Thai, whose letters a rose must not sit on at all */
  thai: boolean;
}

export function inkAt(map: InkMap | null, x: number, y: number): boolean {
  if (!map) return false;
  const col = Math.floor((x - map.x0) * SIZE);
  const row = Math.floor((y - map.y0) * SIZE);
  if (col < 0 || row < 0 || col >= map.cols || row >= map.rows) return false;
  return map.data[row * map.cols + col] === 1;
}

/** Ink no flower may cover. */
export function markAt(glyph: Glyph, x: number, y: number): boolean {
  const { marks } = glyph;
  if (!marks || !(y < marks.above || y > marks.below)) return false;
  return inkAt(glyph.ink, x, y);
}

const THAI = /[฀-๿]/;
const COMBINING = /\p{M}/u;
/**
 * Consonants without a tall stroke or a tail, so their tops give the body line.
 * ส is not one of them: in a looped face its tail rises well clear of the rest
 * (0.77em against 0.6em in Mali), which put the line above where the marks
 * begin. That tail is also all that tells ส from ล, so it is a mark to keep clear.
 */
const THAI_BODY = "กขคงจดตถทนบพมยรลวหอ";
/** A vine needs this much upright stroke to coil around, em. */
const MIN_STEM = 0.15;
/** Thinner than this is a hairline, not something to climb. */
const MIN_STEM_WIDTH = 0.022;
/** Clearance between a letter's body and where its marks begin. */
const MARK_GAP = 0.03;

const cache = new Map<string, Glyph>();
const bodyTops = new Map<string, number>();
let canvas: HTMLCanvasElement | null = null;

function context(): CanvasRenderingContext2D {
  canvas ??= document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  return ctx;
}

const fontFor = (family: string) => `400 ${SIZE}px ${family}`;

function ascentOf(text: string, family: string): { ascent: number; descent: number } {
  const ctx = context();
  ctx.font = fontFor(family);
  const m = ctx.measureText(text);
  return { ascent: m.actualBoundingBoxAscent / SIZE, descent: m.actualBoundingBoxDescent / SIZE };
}

/** The height of a Thai letter's body, em, measured once per font. */
function thaiBodyTop(family: string): number {
  const hit = bodyTops.get(family);
  if (hit !== undefined) return hit;
  let top = 0;
  for (const letter of THAI_BODY) top = Math.max(top, ascentOf(letter, family).ascent);
  bodyTops.set(family, top);
  return top;
}

/** Where this cluster's marks start, or null when it cannot carry any. */
function marksFor(cluster: string, family: string): Omit<Marks, "hasAbove" | "hasBelow"> | null {
  if (THAI.test(cluster)) {
    return { above: -(thaiBodyTop(family) + MARK_GAP), below: MARK_GAP };
  }
  const decomposed = cluster.normalize("NFD");
  if (!COMBINING.test(decomposed)) return null;
  const base = ascentOf(Array.from(decomposed)[0], family);
  return { above: -(base.ascent + MARK_GAP), below: base.descent + MARK_GAP };
}

export function measureGlyph(cluster: string, family: string): Glyph {
  const key = `${family}\u0000${cluster}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const ctx = context();
  ctx.font = fontFor(family);
  const metrics = ctx.measureText(cluster);
  const advance = metrics.width / SIZE;
  const thai = THAI.test(cluster);

  if (cluster.trim() === "") {
    const blank: Glyph = {
      advance,
      left: 0,
      right: advance,
      top: 0,
      bottom: 0,
      ink: null,
      stems: [],
      crown: [],
      marks: null,
      thai,
    };
    cache.set(key, blank);
    return blank;
  }

  const left = Math.ceil(metrics.actualBoundingBoxLeft) + PAD;
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent) + PAD;
  const width = Math.max(1, left + Math.ceil(metrics.actualBoundingBoxRight) + PAD);
  const height = Math.max(1, ascent + Math.ceil(metrics.actualBoundingBoxDescent) + PAD);

  // Resizing a canvas resets its context, font included.
  const surface = ctx.canvas;
  surface.width = width;
  surface.height = height;
  ctx.font = fontFor(family);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  ctx.fillText(cluster, left, ascent);

  const alpha = ctx.getImageData(0, 0, width, height).data;
  const data = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i++) data[i] = alpha[i * 4 + 3] >= HALF ? 1 : 0;
  const ink: InkMap = { x0: -left / SIZE, y0: -ascent / SIZE, cols: width, rows: height, data };

  const zone = marksFor(cluster, family);
  const yOf = (row: number) => (row + 0.5) / SIZE + ink.y0;
  const xOf = (col: number) => (col + 0.5) / SIZE + ink.x0;
  const isBody = (row: number) => !zone || (yOf(row) >= zone.above && yOf(row) <= zone.below);

  let hasAbove = false;
  let hasBelow = false;
  let inkLeft = Infinity;
  let inkRight = -Infinity;
  let inkTop = Infinity;
  let inkBottom = -Infinity;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (!data[row * width + col]) continue;
      inkLeft = Math.min(inkLeft, col);
      inkRight = Math.max(inkRight, col);
      inkTop = Math.min(inkTop, row);
      inkBottom = Math.max(inkBottom, row);
      if (zone) {
        const y = yOf(row);
        if (y < zone.above) hasAbove = true;
        if (y > zone.below) hasBelow = true;
      }
    }
  }
  const empty = inkLeft === Infinity;

  const glyph: Glyph = {
    advance,
    left: empty ? 0 : inkLeft / SIZE + ink.x0,
    right: empty ? advance : (inkRight + 1) / SIZE + ink.x0,
    top: empty ? 0 : inkTop / SIZE + ink.y0,
    bottom: empty ? 0 : (inkBottom + 1) / SIZE + ink.y0,
    ink: empty ? null : ink,
    stems: empty ? [] : findStems(data, width, height, isBody, xOf, yOf),
    crown: empty ? [] : crownOf(data, width, height, isBody, xOf, yOf),
    marks: zone ? { ...zone, hasAbove, hasBelow } : null,
    thai,
  };
  cache.set(key, glyph);
  return glyph;
}

/**
 * Columns whose longest run of body ink is tall, grouped while neighbouring
 * runs overlap. Each group is cut to the height all its columns share, so a
 * vine coiled around it never wraps empty air at a serif or a curve.
 */
function findStems(
  data: Uint8Array,
  width: number,
  height: number,
  isBody: (row: number) => boolean,
  xOf: (col: number) => number,
  yOf: (row: number) => number,
): Stem[] {
  const runs: ({ top: number; bottom: number } | null)[] = [];
  for (let col = 0; col < width; col++) {
    let best: { top: number; bottom: number } | null = null;
    let start = -1;
    for (let row = 0; row <= height; row++) {
      const on = row < height && data[row * width + col] === 1 && isBody(row);
      if (on && start < 0) start = row;
      if (!on && start >= 0) {
        if (!best || row - start > best.bottom - best.top) best = { top: start, bottom: row };
        start = -1;
      }
    }
    runs.push(best && (best.bottom - best.top) / SIZE >= MIN_STEM ? best : null);
  }

  const stems: Stem[] = [];
  let group: { from: number; top: number; bottom: number } | null = null;
  const close = (to: number) => {
    if (!group) return;
    const cols = to - group.from;
    if (cols / SIZE >= MIN_STEM_WIDTH && (group.bottom - group.top) / SIZE >= MIN_STEM) {
      stems.push({
        x: (xOf(group.from) + xOf(to - 1)) / 2,
        half: cols / SIZE / 2,
        top: yOf(group.top),
        bottom: yOf(group.bottom - 1),
      });
    }
    group = null;
  };
  for (let col = 0; col < width; col++) {
    const run = runs[col];
    if (run && group) {
      const top = Math.max(group.top, run.top);
      const bottom = Math.min(group.bottom, run.bottom);
      if ((bottom - top) / SIZE >= MIN_STEM) {
        group.top = top;
        group.bottom = bottom;
        continue;
      }
    }
    close(col);
    if (run) group = { from: col, top: run.top, bottom: run.bottom };
  }
  close(width);

  return stems.sort((a, b) => b.bottom - b.top - (a.bottom - a.top));
}

/** The highest body ink every 0.02em across the letter. */
function crownOf(
  data: Uint8Array,
  width: number,
  height: number,
  isBody: (row: number) => boolean,
  xOf: (col: number) => number,
  yOf: (row: number) => number,
): Point[] {
  const step = Math.max(1, Math.round(0.02 * SIZE));
  const crown: Point[] = [];
  for (let col = 0; col < width; col += step) {
    for (let row = 0; row < height; row++) {
      if (data[row * width + col] === 1 && isBody(row)) {
        crown.push({ x: xOf(col), y: yOf(row) });
        break;
      }
    }
  }
  return crown;
}

/** Splits text the way a reader counts characters, not the way UTF-16 does. */
export function clustersOf(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("th", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}
