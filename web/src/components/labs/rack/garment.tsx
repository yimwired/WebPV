"use client";

import { PIECES, type Piece, type Shape } from "./data";

/**
 * Every piece on the rail, drawn from its own measurements.
 *
 * The viewBox is in inches. Not scaled inches, not a ratio: an inch of chest is
 * a unit of the coordinate system, so the 26 inch hoodie is genuinely wider on
 * screen than the 17 inch baby tee by the same proportion it is on the rail.
 * That is the whole reason this page draws rather than photographs. A
 * photograph of a garment says nothing about its measurements, and twelve
 * photographs from twelve sources say nothing about each other either.
 *
 * Measurements are flat, as the shop posts them, so `chest` is the width of the
 * outline and not half of it.
 */

/** Padding around the garment, in inches, so sleeves are not clipped. */
const MARGIN = 2;

/** Where the underarm sits down the body, as a fraction of the length. */
const ARMHOLE = 0.34;

interface Outline {
  path: string;
  width: number;
  height: number;
  /** y of the shoulder line, for hanging it on the hook */
  shoulderY: number;
}

/**
 * A body with sleeves: tee, shirt, jacket and knit all share this and differ in
 * their trim. Drawn from the neck out to one shoulder, down the sleeve, back up
 * to the underarm, down the side seam to the hem, then mirrored.
 */
function bodyOutline(
  piece: Piece,
  sleeveDrop: number,
  hemFlare: number,
): Outline {
  const { chest, length, shoulder, sleeve } = piece;
  const neck = shoulder * 0.34;
  const armhole = length * ARMHOLE;
  const hem = chest * hemFlare;

  // The sleeve leaves the shoulder at an angle rather than straight out, which
  // is what stops a drawn garment reading as a letter T.
  const sleeveX = shoulder / 2 + sleeve * 0.52;
  const sleeveY = sleeveDrop + sleeve * 0.82;
  const cuff = Math.max(2.2, chest * 0.16);

  // The cuff closes across the sleeve, square to the direction the arm runs in.
  // Stepping down and inwards by a fixed amount instead made every long sleeve
  // taper to a spike, because the further the sleeve reached the shallower that
  // step became relative to it.
  const armX = sleeveX - shoulder / 2;
  const armY = sleeveY - sleeveDrop;
  const armLen = Math.hypot(armX, armY) || 1;
  const cuffX = (-armY / armLen) * (cuff / 2);
  const cuffY = (armX / armLen) * (cuff / 2);

  const half = Math.max(chest, hem, sleeveX * 2) / 2;
  const width = half * 2 + MARGIN * 2;
  const height = length + MARGIN * 2 + 1.4;
  const cx = width / 2;
  const top = MARGIN + 1.4;

  const px = (x: number) => cx + x;
  const py = (y: number) => top + y;

  const path = [
    `M ${px(-neck / 2)} ${py(0.5)}`,
    // neckline, scooped
    `Q ${px(0)} ${py(2.1)} ${px(neck / 2)} ${py(0.5)}`,
    `L ${px(shoulder / 2)} ${py(1.3)}`,
    sleeve > 1
      ? `L ${px(sleeveX - cuffX)} ${py(sleeveY - cuffY)} L ${px(sleeveX + cuffX)} ${py(sleeveY + cuffY)} L ${px(chest / 2)} ${py(armhole)}`
      : `L ${px(chest / 2)} ${py(armhole)}`,
    `L ${px(hem / 2)} ${py(length)}`,
    `L ${px(-hem / 2)} ${py(length)}`,
    `L ${px(-chest / 2)} ${py(armhole)}`,
    sleeve > 1
      ? `L ${px(-sleeveX - cuffX)} ${py(sleeveY + cuffY)} L ${px(-sleeveX + cuffX)} ${py(sleeveY - cuffY)}`
      : "",
    `L ${px(-shoulder / 2)} ${py(1.3)}`,
    "Z",
  ]
    .filter(Boolean)
    .join(" ");

  return { path, width, height, shoulderY: top + 1.3 };
}

/** A vest: no sleeve, and straps rather than a shoulder seam. */
function tankOutline(piece: Piece): Outline {
  const { chest, length, shoulder } = piece;
  const strap = Math.max(1.1, shoulder * 0.16);
  const width = chest + MARGIN * 2;
  const height = length + MARGIN * 2 + 1.4;
  const cx = width / 2;
  const top = MARGIN + 1.4;

  const px = (x: number) => cx + x;
  const py = (y: number) => top + y;

  const path = [
    `M ${px(-shoulder / 2)} ${py(0)}`,
    `L ${px(-shoulder / 2 + strap)} ${py(0)}`,
    `Q ${px(0)} ${py(4.2)} ${px(shoulder / 2 - strap)} ${py(0)}`,
    `L ${px(shoulder / 2)} ${py(0)}`,
    `L ${px(chest / 2)} ${py(length * 0.3)}`,
    `L ${px(chest / 2)} ${py(length)}`,
    `L ${px(-chest / 2)} ${py(length)}`,
    `L ${px(-chest / 2)} ${py(length * 0.3)}`,
    "Z",
  ].join(" ");

  return { path, width, height, shoulderY: top };
}

/** Trousers: waist at the top, two legs with a rise between them. */
function pantsOutline(piece: Piece): Outline {
  const waist = piece.chest;
  const { length } = piece;
  const rise = length * 0.3;
  const hemW = waist * 0.42;
  const width = waist + MARGIN * 2;
  const height = length + MARGIN * 2;
  const cx = width / 2;
  const top = MARGIN;

  const px = (x: number) => cx + x;
  const py = (y: number) => top + y;

  const path = [
    `M ${px(-waist / 2)} ${py(0)}`,
    `L ${px(waist / 2)} ${py(0)}`,
    `L ${px(waist / 2 - 0.6)} ${py(rise)}`,
    `L ${px(hemW + 0.4)} ${py(length)}`,
    `L ${px(0.7)} ${py(length)}`,
    `L ${px(0)} ${py(rise + 1.5)}`,
    `L ${px(-0.7)} ${py(length)}`,
    `L ${px(-hemW - 0.4)} ${py(length)}`,
    `L ${px(-waist / 2 + 0.6)} ${py(rise)}`,
    "Z",
  ].join(" ");

  return { path, width, height, shoulderY: top };
}

const OUTLINE: Record<Shape, (piece: Piece) => Outline> = {
  tee: (p) => bodyOutline(p, 1.6, 1.0),
  shirt: (p) => bodyOutline(p, 1.5, 0.97),
  jacket: (p) => bodyOutline(p, 1.8, 1.04),
  knit: (p) => bodyOutline(p, 1.9, 0.94),
  tank: tankOutline,
  pants: pantsOutline,
};

/**
 * One coordinate system for the whole rail.
 *
 * Sizing each drawing to its own bounds undoes the entire point: a long-sleeved
 * jacket is wider than a tee across the sleeves, so fitting each to its own box
 * shrank the jacket and left the tee full size, and the 24 inch piece came out
 * smaller on screen than the 23 inch one. Every piece is drawn into the same
 * box, centred, so a wider garment is wider on the page. Trousers set the
 * height, which is correct: they really are longer than the shirts.
 */
const STAGE = PIECES.reduce(
  (box, piece) => {
    const { width, height } = OUTLINE[piece.shape](piece);
    return {
      width: Math.max(box.width, width),
      height: Math.max(box.height, height),
    };
  },
  { width: 0, height: 0 },
);

interface Props {
  piece: Piece;
  /** dims the drawing for a piece the rail has left behind */
  muted?: boolean;
  className?: string;
}

export function Garment({ piece, muted = false, className }: Props) {
  const own = OUTLINE[piece.shape](piece);
  const { path, shoulderY } = own;
  const [body, trim] = piece.palette;
  const id = `g-${piece.id}`;
  const hangs = piece.shape !== "pants";
  const cx = own.width / 2;

  // Offsets that centre this garment's own box inside the shared one.
  const dx = (STAGE.width - own.width) / 2;
  const dy = (STAGE.height - own.height) / 2;

  return (
    <svg
      viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
      className={className}
      role="img"
      aria-label={`${piece.name} อก ${piece.chest} นิ้ว ยาว ${piece.length} นิ้ว`}
    >
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={body} stopOpacity={0.96} />
          <stop offset="55%" stopColor={body} />
          <stop offset="100%" stopColor={trim} stopOpacity={0.55} />
        </linearGradient>
      </defs>

      <g transform={`translate(${dx} ${dy})`}>
        {hangs && (
          <g
            stroke="#c8ccd6"
            strokeWidth={0.34}
            fill="none"
            strokeLinecap="round"
            opacity={muted ? 0.3 : 0.85}
          >
            <path d={`M ${cx} ${shoulderY - 2.6} v -1.5`} />
            <path
              d={`M ${cx - 0.9} ${shoulderY - 2.6} a 0.9 0.9 0 1 1 1.8 0`}
              transform={`rotate(180 ${cx} ${shoulderY - 2.6})`}
            />
            <path
              d={`M ${cx - piece.shoulder / 2 - 0.5} ${shoulderY + 0.4} L ${cx} ${shoulderY - 2.2} L ${cx + piece.shoulder / 2 + 0.5} ${shoulderY + 0.4}`}
            />
          </g>
        )}

        <path
          d={path}
          fill={`url(#${id}-face)`}
          stroke="#0d0d12"
          strokeWidth={0.42}
          strokeLinejoin="round"
          opacity={muted ? 0.32 : 1}
        />

        {/* trim: the detail that tells the shapes apart at a glance */}
        <g
          opacity={muted ? 0.28 : 0.9}
          stroke={trim}
          fill="none"
          strokeWidth={0.34}
        >
          {piece.shape === "shirt" && (
            <path d={`M ${cx} ${shoulderY + 1.2} v ${piece.length * 0.82}`} />
          )}
          {piece.shape === "jacket" && (
            <path
              d={`M ${cx} ${shoulderY + 1} v ${piece.length * 0.84}`}
              strokeDasharray="0.5 0.5"
            />
          )}
          {piece.shape === "knit" && (
            <path
              d={`M ${cx - piece.chest * 0.44} ${shoulderY + piece.length - 2.2} h ${piece.chest * 0.88}`}
              strokeWidth={0.8}
            />
          )}
          {piece.shape === "pants" && (
            <path
              d={`M ${cx - piece.chest * 0.5} ${shoulderY + 2.2} h ${piece.chest}`}
              strokeWidth={0.6}
            />
          )}
        </g>
      </g>
    </svg>
  );
}
