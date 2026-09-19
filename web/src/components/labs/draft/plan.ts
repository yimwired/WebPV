// Laying the room out, in centimetres. Kept away from the drawing because the
// drawing is only the picture of it: the same numbers set the rectangles on the
// sheet, the dimension strings beside them and the notes in the margin, so
// there is no way for the plan to say one thing and show another.

import type { Layout, Piece } from "./data";

export interface Placed extends Piece {
  /** centimetres from the left wall */
  x: number;
  /** centimetres from the top wall */
  y: number;
}

export interface Problem {
  piece: string;
  /** how much too wide or too shallow the room is for it, in centimetres */
  short: number;
  reason: "width" | "walkway";
}

export interface Plan {
  room: { width: number; depth: number };
  placed: Placed[];
  /** what is left between the two facing pieces */
  walkway: number;
  /** what the layout asks for */
  wanted: number;
  problems: Problem[];
  areaSqm: number;
  /** the side piece only goes in if the wall beside the anchor has room */
  sideFits: boolean;
}

/** Centred against a wall, which is how both of the big pieces sit. */
const centred = (piece: Piece, roomWidth: number, y: number): Placed => ({
  ...piece,
  x: Math.round((roomWidth - piece.width) / 2),
  y,
});

export function planRoom(layout: Layout, width: number, depth: number): Plan {
  const problems: Problem[] = [];

  const anchor = centred(layout.anchor, width, 0);
  const facing = centred(layout.facing, width, depth - layout.facing.depth);

  // The gap between the two pieces that face each other. Negative means they
  // overlap, which is the room being too small rather than a tight squeeze.
  const walkway = depth - layout.anchor.depth - layout.facing.depth;
  if (walkway < layout.walkway) {
    problems.push({
      piece: "ทางเดินกลางห้อง",
      short: layout.walkway - walkway,
      reason: "walkway",
    });
  }

  for (const piece of [layout.anchor, layout.facing]) {
    if (piece.width > width) {
      problems.push({
        piece: piece.name,
        short: piece.width - width,
        reason: "width",
      });
    }
  }

  // The side piece stands beside the anchor, so what it needs is the wall left
  // over next to it, not the whole width.
  const besideAnchor = (width - layout.anchor.width) / 2;
  const sideFits = besideAnchor >= layout.side.width;

  // Beside the anchor at the wall end of it, which is where a bedside table,
  // a side table or a shelf actually goes. Hung off the foot instead, it read
  // as a second piece of furniture stranded in the middle of the room.
  const placed: Placed[] = [anchor, facing];
  if (sideFits) {
    placed.push({
      ...layout.side,
      x: Math.round(anchor.x - layout.side.width),
      y: 0,
    });
  }

  return {
    room: { width, depth },
    placed,
    walkway,
    wanted: layout.walkway,
    problems,
    areaSqm: (width * depth) / 10_000,
    sideFits,
  };
}

/** Metres, to one decimal, which is how a plan is spoken about out loud. */
export const metres = (cm: number): string => (cm / 100).toFixed(2);
