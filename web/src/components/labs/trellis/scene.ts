/**
 * What gets drawn, worked out once per layout and shared by the stage and the
 * exports, so a saved picture is the garden on screen and not a second guess
 * at it: the pieces of vine that cross letters in front, and the windows where
 * marks are drawn again above everything.
 */

import type { Glyph } from "./glyph";
import type { Layout, Sprout } from "./use-garden";
import { frontPieces, type PlacedGlyph, type Piece } from "./weave";

/** A rectangle, em, where a letter's marks are drawn again on top. */
export interface MarkWindow {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** which line's text shows through it */
  line: number;
}

/**
 * How far past its window a mark's letter is drawn, em, beyond the edge drawn
 * round it. A window can cut through a stroke (the top of ฟ, the tail of ไ),
 * and the pixel its clip crosses would otherwise blend the edge into the
 * stroke as a dark seam; drawn this far past, the letter always finishes it.
 */
export const MARK_BLEED = 0.02;

type GlyphOf = (sprout: Sprout) => Glyph | null;

export function placedGlyphs(sprouts: Sprout[], layout: Layout | null, glyphOf: GlyphOf): PlacedGlyph[] {
  if (!layout) return [];
  return sprouts.flatMap((sprout) => {
    const at = layout.at.get(sprout.id);
    const glyph = glyphOf(sprout);
    return at && glyph ? [{ x: at.x, y: at.y, glyph }] : [];
  });
}

export function piecesFor(sprouts: Sprout[], layout: Layout | null, placed: PlacedGlyph[]): Map<number, Piece[]> {
  const result = new Map<number, Piece[]>();
  if (!layout) return result;
  for (const sprout of sprouts) {
    const at = layout.at.get(sprout.id);
    if (sprout.plant && at) result.set(sprout.id, frontPieces(sprout.plant, at.x, at.y, placed));
  }
  return result;
}

/** Slack around a window, em, so the edge drawn round a mark is not clipped. */
const PAD = 0.03;

export function markWindows(lines: Sprout[][], layout: Layout | null, glyphOf: GlyphOf): MarkWindow[] {
  if (!layout) return [];
  const windows: MarkWindow[] = [];
  lines.forEach((line, l) => {
    for (const sprout of line) {
      const glyph = glyphOf(sprout);
      const at = layout.at.get(sprout.id);
      if (!glyph?.marks || !at) continue;
      const x = at.x + glyph.left - PAD;
      const width = glyph.right - glyph.left + 2 * PAD;
      if (glyph.marks.hasAbove) {
        const y = at.y + glyph.top - PAD;
        windows.push({ key: `${sprout.id}a`, x, y, width, height: at.y + glyph.marks.above - y, line: l });
      }
      if (glyph.marks.hasBelow) {
        const y = at.y + glyph.marks.below;
        windows.push({ key: `${sprout.id}b`, x, y, width, height: at.y + glyph.bottom + PAD - y, line: l });
      }
    }
  });
  return windows;
}
