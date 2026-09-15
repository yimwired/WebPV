/**
 * The three primitives every other file on this page is built from.
 *
 * `Sprite` turns a character map into SVG. Rects rather than an image because
 * the page is server rendered and a canvas would leave holes until hydration,
 * and because `shape-rendering: crispEdges` at a whole-number scale is exact:
 * there is no resampling step to get wrong. Runs of the same colour in a row
 * are merged, which takes a 16x16 sprite from 256 rects to about 40.
 */

import type { CSSProperties, ReactNode } from "react";
import { PALETTE, type Sprite as SpriteMap } from "./sprites";
import { COLOR, UNIT, pixelBevel, pixelFrame } from "./theme";

interface SpriteProps {
  map: SpriteMap;
  /** whole number only; a fractional scale is what kills pixel art */
  scale?: number;
  /** swap individual palette entries, e.g. to recolour one meeple */
  palette?: Record<string, string>;
  /** omit for decoration, which leaves the sprite hidden from assistive tech */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

interface Run {
  x: number;
  y: number;
  w: number;
  fill: string;
}

function runsOf(map: SpriteMap, colours: Record<string, string>): Run[] {
  const runs: Run[] = [];
  map.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const char = row[x];
      let w = 1;
      while (x + w < row.length && row[x + w] === char) w += 1;
      const fill = colours[char];
      if (char !== "." && fill) runs.push({ x, y, w, fill });
      x += w;
    }
  });
  return runs;
}

export function Sprite({ map, scale = 2, palette, label, className, style }: SpriteProps) {
  const colours = palette ? { ...PALETTE, ...palette } : PALETTE;
  const size = map.length;
  const width = map[0]?.length ?? size;

  return (
    <svg
      viewBox={`0 0 ${width} ${size}`}
      width={width * scale}
      height={size * scale}
      shapeRendering="crispEdges"
      className={className}
      style={{ display: "block", ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {runsOf(map, colours).map((run) => (
        <rect
          key={`${run.y}-${run.x}`}
          x={run.x}
          y={run.y}
          width={run.w}
          height={1}
          fill={run.fill}
        />
      ))}
    </svg>
  );
}

interface PanelProps {
  children: ReactNode;
  /** the fill behind the content */
  background?: string;
  /** the frame colour */
  frame?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/**
 * A box with its four corner pixels missing. Nothing on this page has a radius:
 * a 6px rounded corner beside a 16x16 sprite is the tell that the pixel art is
 * decoration sitting on an ordinary web page.
 */
export function PixelPanel({
  children,
  background = COLOR.panel,
  frame = COLOR.ink,
  className,
  style,
  id,
}: PanelProps) {
  return (
    <div
      id={id}
      className={className}
      style={{ background, boxShadow: pixelFrame(frame), ...style }}
    >
      {children}
    </div>
  );
}

interface PressProps {
  children: ReactNode;
  /** the fill; pair it with the `on` colour the theme measured for it */
  background: string;
  color: string;
  onClick?: () => void;
  href?: string;
  /** a pressed control keeps its bevel swapped, for toggles that stay down */
  held?: boolean;
  ariaPressed?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * A control that travels. The bevel is two hard inset shadows, and pressing
 * swaps them and moves the whole thing down and right by one art pixel, which
 * is how every button in a sprite-era interface behaved. The travel is CSS on
 * `:active` rather than state, so it survives a pointer held down and dragged
 * off, and it costs no re-render.
 */
export function Press({
  children,
  background,
  color,
  onClick,
  href,
  held = false,
  ariaPressed,
  className = "",
  style,
}: PressProps) {
  const shared: CSSProperties = {
    background,
    color,
    boxShadow: `${pixelFrame(COLOR.ink)}, ${pixelBevel(held)}`,
    ...(held ? { transform: `translate(${UNIT / 2}px, ${UNIT / 2}px)` } : null),
    ...style,
  };
  const classes = `mpl-press inline-flex items-center justify-center gap-2 ${className}`;

  if (href) {
    return (
      <a href={href} className={classes} style={shared}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={ariaPressed} className={classes} style={shared}>
      {children}
    </button>
  );
}

/**
 * The page's only stylesheet. Three things that inline styles cannot express:
 * the pressed state of a control, the two-frame idle bob, and a focus ring that
 * is a square of hard pixels rather than the browser's rounded outline.
 *
 * Both animations run on `steps`. The bob is two frames because a sprite that
 * bobs on more than that stops looking drawn, and the global reduced-motion
 * block in `globals.css` already stops it for anyone who asked for that.
 */
export const PIXEL_CSS = `
.mpl-press { transition: none; cursor: pointer; }
.mpl-press:active {
  transform: translate(${UNIT / 2}px, ${UNIT / 2}px);
  box-shadow: ${pixelFrame(COLOR.ink)}, ${pixelBevel(true)};
}
.mpl-press:focus-visible, .mpl-focus:focus-visible {
  outline: ${UNIT}px solid ${COLOR.ink};
  outline-offset: ${UNIT}px;
}
.mpl-opt { display: inline-flex; }
.mpl-opt:has(input:focus-visible) > .mpl-press {
  outline: ${UNIT}px solid ${COLOR.ink};
  outline-offset: ${UNIT}px;
}
@keyframes mpl-bob { from { transform: translateY(0); } to { transform: translateY(-${UNIT}px); } }
.mpl-bob { animation: mpl-bob 0.9s steps(2, jump-none) infinite alternate; }
.mpl-bob-slow { animation: mpl-bob 1.4s steps(2, jump-none) infinite alternate; }
`;
