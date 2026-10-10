/**
 * Where vines pass in front of letters.
 *
 * A plant knows only its own letter when it grows, but its vines reach over
 * the neighbours too, and those may be typed after it. So crossings are found
 * here, once the line is laid out, against every letter in it. Each vine is
 * drawn whole behind the text, and the stretches that should pass in front are
 * drawn again on top, cut a little long so the joins land off the ink, where
 * the two copies sit exactly on each other and no seam can show.
 *
 * Which crossings go in front follows one rule per plant (`Plant.weave`): the
 * ones made while travelling one way. For a coil that is exactly the near side
 * of every turn, so it reads as wrapped. For a runner crossing a neighbour it
 * is arbitrary but stable, because it depends only on the geometry: a letter
 * typed later adds crossings and never flips one that was already there.
 *
 * Marks never get a vine in front of them. A vine over the tone mark of ข้าว
 * would make it hard to read, and the overlay in the stage draws marks above
 * everything anyway.
 */

import { inkAt, markAt, type Glyph } from "./glyph";
import { polylinePath, type Plant } from "./plant";

export interface PlacedGlyph {
  /** em, the cluster's origin on its baseline */
  x: number;
  y: number;
  glyph: Glyph;
}

export interface Piece {
  /** stable while the crossing exists, so React keeps the element and its animation */
  key: string;
  d: string;
  /** when the vine's drawing tip reaches the start of it, ms after typing */
  delay: number;
  duration: number;
}

/** How much vine each front piece carries past the ink at either end, em. */
const MARGIN = 0.026;

export function frontPieces(plant: Plant, px: number, py: number, glyphs: PlacedGlyph[]): Piece[] {
  const b = plant.bounds;
  const near = glyphs.filter(({ x, y, glyph }) => {
    if (!glyph.ink) return false;
    return !(
      x + glyph.right < px + b.minX ||
      x + glyph.left > px + b.maxX ||
      y + glyph.bottom < py + b.minY ||
      y + glyph.top > py + b.maxY
    );
  });
  if (near.length === 0) return [];

  const overInk = (wx: number, wy: number) => {
    for (const { x, y, glyph } of near) {
      const lx = wx - x;
      const ly = wy - y;
      if (lx < glyph.left || lx > glyph.right || ly < glyph.top || ly > glyph.bottom) continue;
      if (markAt(glyph, lx, ly)) return false;
      if (inkAt(glyph.ink, lx, ly)) return true;
    }
    return false;
  };

  const pieces: Piece[] = [];
  plant.vines.forEach((vine, v) => {
    const { points, along } = vine;
    const over = points.map((p) => overInk(px + p.x, py + p.y));

    const spans: [number, number][] = [];
    for (let i = 0; i < over.length; ) {
      if (!over[i]) {
        i++;
        continue;
      }
      let j = i;
      while (j + 1 < over.length && over[j + 1]) j++;
      const dx = points[j].x - points[i].x;
      // Running along a stroke rather than across it, there is no direction to
      // follow; alternate instead, so a long climb is not all on one side.
      const front = Math.abs(dx) < 0.004 ? (i + v) % 2 === 0 : Math.sign(dx) === plant.weave;
      if (front) spans.push([i, j]);
      i = j + 1;
    }

    // Carry each piece a little past the ink, but never onto the next stretch
    // of ink, which may be a crossing that goes behind.
    const widened: [number, number][] = spans.map(([i, j]) => {
      let a = i;
      while (a > 0 && !over[a - 1] && along[i] - along[a - 1] <= MARGIN) a--;
      let z = j;
      while (z < points.length - 1 && !over[z + 1] && along[z + 1] - along[j] <= MARGIN) z++;
      return [a, z];
    });

    const merged: [number, number][] = [];
    for (const span of widened) {
      const last = merged[merged.length - 1];
      if (last && span[0] <= last[1] + 1) last[1] = Math.max(last[1], span[1]);
      else merged.push([...span]);
    }

    for (const [a, z] of merged) {
      if (z <= a) continue;
      pieces.push({
        key: `${v}.${a}.${z}`,
        d: polylinePath(points.slice(a, z + 1)),
        delay: vine.delay + (along[a] / vine.length) * vine.duration,
        duration: Math.max(16, ((along[z] - along[a]) / vine.length) * vine.duration),
      });
    }
  });
  return pieces;
}
