/**
 * Letters measured off a canvas, in em: how far a typed cluster advances, and
 * how much outline it has for the satin estimate.
 *
 * The outline is counted rather than looked up because the page takes Thai as
 * readily as Latin, and a Thai cluster carries its vowels and tone marks with
 * it. Each cluster is drawn once at 200px and two numbers are read off the
 * pixels:
 *
 *   area       coverage summed, so antialiased edges count fractionally
 *   perimeter  the half-coverage contour traced by marching squares, with
 *              the antialiasing giving each crossing a sub-pixel position
 *
 * Browser only. Results are cached per font and cluster for the life of the page.
 */

const SIZE = 200;
const PAD = 4;

export interface GlyphMetrics {
  advance: number;
  perimeter: number;
  area: number;
  /** ink above the baseline, marks included */
  ascent: number;
  /** ink below it */
  descent: number;
}

const cache = new Map<string, GlyphMetrics>();
let canvas: HTMLCanvasElement | null = null;

function context(): CanvasRenderingContext2D {
  canvas ??= document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  return ctx;
}

const fontFor = (family: string) => `400 ${SIZE}px ${family}`;

export function measureGlyph(cluster: string, family: string): GlyphMetrics {
  const key = `${family}\u0000${cluster}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const ctx = context();
  ctx.font = fontFor(family);
  const metrics = ctx.measureText(cluster);
  const advance = metrics.width / SIZE;

  if (cluster.trim() === "") {
    const blank = { advance, perimeter: 0, area: 0, ascent: 0, descent: 0 };
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
  const value = (x: number, y: number) => alpha[(y * width + x) * 4 + 3] / 255;

  let coverage = 0;
  for (let i = 3; i < alpha.length; i += 4) coverage += alpha[i] / 255;

  const measured = {
    advance,
    perimeter: contourLength(value, width, height) / SIZE,
    area: coverage / (SIZE * SIZE),
    ascent: metrics.actualBoundingBoxAscent / SIZE,
    descent: metrics.actualBoundingBoxDescent / SIZE,
  };
  cache.set(key, measured);
  return measured;
}

const EDGE = 0.5;

/**
 * Length of the outline where coverage crosses one half, by marching squares:
 * each 2x2 block of pixels contributes the segment between the points where the
 * half-coverage line crosses its sides, found by linear interpolation, so the
 * antialiasing the browser already did gives sub-pixel positions for free.
 *
 * Counting crossings along rows and columns would be simpler, but it reads a
 * vertical stem 21% short (pi/4 for an edge aligned with the grid), and type is
 * mostly vertical and horizontal strokes.
 */
function contourLength(value: (x: number, y: number) => number, width: number, height: number): number {
  let length = 0;
  const segment = (ax: number, ay: number, bx: number, by: number) => {
    length += Math.hypot(bx - ax, by - ay);
  };
  const cross = (from: number, to: number) => (EDGE - from) / (to - from);

  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const tl = value(x, y);
      const tr = value(x + 1, y);
      const br = value(x + 1, y + 1);
      const bl = value(x, y + 1);
      const index = (tl >= EDGE ? 8 : 0) | (tr >= EDGE ? 4 : 0) | (br >= EDGE ? 2 : 0) | (bl >= EDGE ? 1 : 0);
      if (index === 0 || index === 15) continue;

      // Where the half line crosses each side of the block. Only the sides a
      // case uses are ever read, and those always straddle the threshold.
      const top = () => [x + cross(tl, tr), y] as const;
      const right = () => [x + 1, y + cross(tr, br)] as const;
      const bottom = () => [x + cross(bl, br), y + 1] as const;
      const left = () => [x, y + cross(tl, bl)] as const;
      const join = (a: () => readonly [number, number], b: () => readonly [number, number]) => {
        const [ax, ay] = a();
        const [bx, by] = b();
        segment(ax, ay, bx, by);
      };

      switch (index) {
        case 1:
        case 14:
          join(left, bottom);
          break;
        case 2:
        case 13:
          join(bottom, right);
          break;
        case 3:
        case 12:
          join(left, right);
          break;
        case 4:
        case 11:
          join(top, right);
          break;
        case 6:
        case 9:
          join(top, bottom);
          break;
        case 7:
        case 8:
          join(left, top);
          break;
        case 5:
        case 10: {
          // A saddle: the average of the four corners decides which pair of
          // opposite corners the inside joins up through the middle.
          const centreInside = (tl + tr + br + bl) / 4 >= EDGE;
          const cutTopLeft = index === 5 ? centreInside : !centreInside;
          if (cutTopLeft) {
            join(left, top);
            join(bottom, right);
          } else {
            join(left, bottom);
            join(top, right);
          }
          break;
        }
      }
    }
  }
  return length;
}

/** Splits text the way a reader counts characters, not the way UTF-16 does. */
export function clustersOf(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("th", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}
