// The trigonometry, kept away from anything that draws. Every shadow in the
// scene, every figure in the table and every sentence in the note comes out of
// these two formulas, so the picture cannot show one thing while the page says
// another.
//
//   something standing on the ground   length = height / tan(elevation)
//   a sphere floating above it         the shadow is an ellipse, half of its
//                                      long axis is radius / sin(elevation),
//                                      thrown lift / tan(elevation) away from
//                                      the thing itself

import { RATES, type Borrowed, type Piece, type Side } from "./data";

export interface Light {
  /** degrees above the horizon */
  elevation: number;
  side: Side;
}

export interface Cast {
  id: string;
  /** decimetres: where the shadow begins along the ground */
  from: number;
  /** decimetres: where it ends */
  to: number;
  /** decimetres of shadow, not counting the object's own footprint */
  length: number;
  /** a floating object's shadow does not touch it */
  detached: boolean;
  /** set for the sphere, whose shadow is an ellipse rather than a band */
  ellipse?: { cx: number; rx: number; ry: number };
}

const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** Light from the left throws shadows to the right. */
const direction = (side: Side) => (side === "left" ? 1 : -1);

/** How flat the ground reads from this camera, which sits close to it. */
const GROUND_SQUASH = 0.3;

export function castFor(piece: Piece, light: Light): Cast {
  const sign = direction(light.side);
  const tangent = Math.tan(radians(light.elevation));

  if (piece.lift !== undefined) {
    const radius = piece.width / 2;
    const centre = piece.x + radius + (sign * piece.lift) / tangent;
    const rx = radius / Math.sin(radians(light.elevation));
    return {
      id: piece.id,
      from: centre - rx,
      to: centre + rx,
      length: rx * 2,
      detached: true,
      ellipse: { cx: centre, rx, ry: radius * GROUND_SQUASH },
    };
  }

  const length = piece.height / tangent;
  return {
    id: piece.id,
    from: sign > 0 ? piece.x : piece.x - length,
    to: sign > 0 ? piece.x + piece.width + length : piece.x + piece.width,
    length,
    detached: false,
  };
}

export type Fix = "match" | "stretch" | "redraw" | "reshoot";

export interface Mismatch {
  /** the shadow the scene asks for, in decimetres */
  wanted: number;
  /** the shadow the borrowed photograph came with */
  brought: number;
  /** how many times out it is, always stated as a number above 1 */
  factor: number;
  /** true when the borrowed shadow is the shorter of the two */
  tooShort: boolean;
  /** degrees between the two suns */
  degrees: number;
  /** the lit side of the object faces the wrong way */
  opposite: boolean;
  fix: Fix;
  price: number;
}

export function compare(piece: Borrowed, light: Light): Mismatch {
  const wanted = piece.height / Math.tan(radians(light.elevation));
  const brought = piece.height / Math.tan(radians(piece.elevation));

  const ratio = wanted / brought;
  const factor = ratio >= 1 ? ratio : 1 / ratio;
  const opposite = piece.side !== light.side;

  // The angle between the two light directions, which is not the difference of
  // the two elevations once they come from opposite sides: a sun 24 degrees up
  // on the left and one 71 degrees up on the right are 85 degrees apart, not
  // 47. A compositor measures the first number.
  const degrees = opposite
    ? 180 - light.elevation - piece.elevation
    : Math.abs(light.elevation - piece.elevation);

  // A shadow that is only a little out can be stretched, and one that is well
  // out has to be drawn again. Neither helps once the lit side of the object
  // faces the wrong way: there is no shadow to stretch, the object itself is
  // wrong, and the honest answer is to shoot it again.
  let fix: Fix = "reshoot";
  if (!opposite) {
    if (factor <= 1.15) fix = "match";
    else if (factor <= 1.6) fix = "stretch";
    else if (factor <= 3) fix = "redraw";
  }

  const price =
    fix === "match"
      ? 0
      : fix === "stretch"
        ? RATES.stretch
        : fix === "redraw"
          ? RATES.redraw
          : RATES.reshoot;

  return {
    wanted,
    brought,
    factor,
    tooShort: ratio > 1,
    degrees,
    opposite,
    fix,
    price,
  };
}
