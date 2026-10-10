/**
 * How big one em is, and where the design's origin lands, for a given surface.
 *
 * The same rule fits the live stage and the exported picture, so a PNG is the
 * garden on screen at another size rather than a second composition.
 *
 * Type keeps its baseline still while you type. The text is centred on its own
 * width, the plants are given room around that centre on both sides, and the
 * type only gets smaller when a line no longer fits: a garden that jumped about
 * on every keystroke would be hard to watch grow. Poster is a composition, so it
 * is centred on everything, flowers included, inside a 4:5 sheet.
 */

import type { Bounds } from "./plant";
import type { Layout, Mode } from "./use-garden";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Fit {
  /** px per em */
  fontPx: number;
  /** px, where the first baseline starts */
  originX: number;
  originY: number;
  /** the sheet, in Poster */
  frame: Rect | null;
}

export interface Surface {
  width: number;
  height: number;
}

/**
 * Room kept for the controls laid over the stage, px. The bottom row is the
 * palettes above the lab switcher at every width, so it keeps the same room.
 */
function chromeFor(width: number) {
  const phone = width < 640;
  return { top: phone ? 64 : 76, bottom: 136, side: phone ? 16 : 48 };
}

/** Space the plants usually take above and below a line, em: the floor for the fit. */
const ROOM_UP = 1.1;
const ROOM_DOWN = 0.72;
/** How far past the text, em, a vine may reach before the fit makes room for it. */
const SPILL = 0.7;
/** Where the baseline sits in the free band, from its top. Plants climb more than they hang. */
const BASELINE_AT = 0.58;
const POSTER_ASPECT = 4 / 5;

export function fitDesign(surface: Surface, mode: Mode, layout: Layout, box: Bounds, withChrome = true): Fit {
  const chrome = withChrome ? chromeFor(surface.width) : { top: 0, bottom: 0, side: 0 };
  const band = {
    top: chrome.top,
    height: Math.max(80, surface.height - chrome.top - chrome.bottom),
    width: Math.max(80, surface.width - 2 * chrome.side),
  };

  if (mode === "poster") {
    const height = Math.min(band.height, band.width / POSTER_ASPECT);
    const width = height * POSTER_ASPECT;
    const frame = { x: (surface.width - width) / 2, y: band.top + (band.height - height) / 2, width, height };
    const inner = {
      x: frame.x + width * 0.1,
      y: frame.y + height * 0.08,
      width: width * 0.8,
      height: height * 0.78,
    };
    const boxWidth = Math.max(0.5, box.maxX - box.minX);
    const boxHeight = Math.max(0.5, box.maxY - box.minY);
    const fontPx = Math.min(inner.width / boxWidth, inner.height / boxHeight, inner.width / 2.2);
    return {
      fontPx,
      originX: inner.x + inner.width / 2 - ((box.minX + box.maxX) / 2) * fontPx,
      originY: inner.y + inner.height / 2 - ((box.minY + box.maxY) / 2) * fontPx,
      frame,
    };
  }

  const margin = withChrome ? 0 : 0.06;
  const usableWidth = band.width * (1 - 2 * margin);
  const usableHeight = band.height * (1 - 2 * margin);
  const top = band.top + band.height * margin;

  // On screen the text always fits, and a vine reaching further out than SPILL
  // may run off the edge, the way a photograph crops a hedge, rather than
  // shrink the word. A saved picture keeps every leaf.
  // A phone has height to spare and no width, so there more of the hedge goes.
  const spill = !withChrome ? Infinity : surface.width < 640 ? SPILL / 2 : SPILL;
  const centre = (layout.lines[0]?.width ?? 0) / 2;
  const reach = Math.max(centre - box.minX, box.maxX - centre);
  const half = Math.max(centre + 0.3, Math.min(reach, centre + spill), 0.6);
  const up = Math.max(ROOM_UP, Math.min(-box.minY, ROOM_UP + spill / 2));
  const down = Math.max(ROOM_DOWN, Math.min(box.maxY, ROOM_DOWN + spill / 2));
  const baseline = top + usableHeight * BASELINE_AT;

  const fontPx = Math.min(
    usableHeight * 0.42,
    usableWidth * 0.25,
    usableWidth / (2 * half),
    (usableHeight * BASELINE_AT) / up,
    (usableHeight * (1 - BASELINE_AT)) / down,
  );
  return { fontPx, originX: surface.width / 2 - centre * fontPx, originY: baseline, frame: null };
}
