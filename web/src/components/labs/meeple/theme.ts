/**
 * Meeple's palette and the geometry that keeps it on a pixel grid.
 *
 * Pixel art fails on the web in one specific way: the art is authored on a
 * grid and then laid out on something else, so a 16px sprite lands at 17.3px,
 * the browser resamples it, and the whole point of the style is gone. Every
 * size on this page is a multiple of `UNIT`, every sprite is scaled by a whole
 * number, and nothing is allowed a border radius. A soft corner here would be
 * the same mistake as a blurred shadow in `slab`.
 *
 * The palette is eight colours and a paper. It is daylight rather than the
 * CRT green a pixel demo usually reaches for, because the client is a board
 * game cafe that opens at eleven in the morning, and because `terminal` and
 * `space` already own the dark end of this gallery.
 */

/** One art pixel, in screen pixels. Every length here is a multiple of it. */
export const UNIT = 4;

export const COLOR = {
  /** the page. 13.25:1 under the ink */
  paper: "#f2e9d8",
  /** one step down, for bands. 11:1 under the ink */
  paperDeep: "#e2d5bb",
  /** cards and panels sit above the page, not below it. 14.8:1 under the ink */
  panel: "#fbf6ea",
  ink: "#241f31",
  /** 6.19:1 on paper, 5.14:1 on paperDeep */
  inkMuted: "#5b5166",
  /** 7.39:1 on the ink */
  onInkMuted: "#b6adbf",
} as const;

/**
 * The four accents, each with the ink that is legible *on* it.
 *
 * Same discipline as `slab`, arrived at from the other direction: a fill this
 * saturated is a surface, and text on it uses whichever of the two page
 * colours clears 4.5:1 rather than whichever looks nicer. `deep` is the
 * darkened version of the same hue, for when the colour has to be the letter
 * instead of the ground.
 */
export interface Accent {
  /** the fill */
  value: string;
  /** the page colour that is legible on `value` */
  on: string;
  /** contrast of `on` over `value`, measured, not assumed */
  onRatio: number;
  /** same hue, dark enough to be text on paper and on paperDeep */
  deep: string;
}

export const ACCENT = {
  /** ink 5.24:1 on it */
  tomato: { value: "#e8705a", on: "#241f31", onRatio: 5.24, deep: "#a8351f" },
  /** ink 4.83:1 on it */
  jade: { value: "#3f9e74", on: "#241f31", onRatio: 4.83, deep: "#1d6447" },
  /** paper 4.76:1 on it, the one accent dark enough to carry light text */
  blue: { value: "#3a63b8", on: "#f2e9d8", onRatio: 4.76, deep: "#2a4a8c" },
  /** ink 7.78:1 on it */
  gold: { value: "#eaa93c", on: "#241f31", onRatio: 7.78, deep: "#7a5010" },
} as const satisfies Record<string, Accent>;

export type AccentName = keyof typeof ACCENT;

/**
 * A frame with the four corner pixels missing, which is how a sprite-era
 * interface drew a rounded box. Built from box-shadows rather than a border so
 * the corners can be absent: a real border has no way to leave them out.
 */
export const pixelFrame = (color: string, unit = UNIT) =>
  [
    `0 -${unit}px 0 0 ${color}`,
    `0 ${unit}px 0 0 ${color}`,
    `-${unit}px 0 0 0 ${color}`,
    `${unit}px 0 0 0 ${color}`,
  ].join(", ");

/**
 * The bevel that makes a control look pressable. Two inset shadows, one light
 * from the top left and one dark from the bottom right, both hard. Swapping
 * them is what a pressed button looks like, and it costs nothing to animate
 * because there is nothing to interpolate.
 */
export const pixelBevel = (pressed = false, unit = UNIT) =>
  pressed
    ? `inset ${unit}px ${unit}px 0 0 rgba(36, 31, 49, 0.28), inset -${unit}px -${unit}px 0 0 rgba(255, 255, 255, 0.5)`
    : `inset ${unit}px ${unit}px 0 0 rgba(255, 255, 255, 0.5), inset -${unit}px -${unit}px 0 0 rgba(36, 31, 49, 0.22)`;

/**
 * A two-by-two checkerboard, the way shading was done before there were enough
 * colours to shade with. Used for the bands behind sections, at a low enough
 * contrast that it reads as texture rather than as a pattern to look at.
 */
export const dither = (color: string, unit = UNIT) => ({
  backgroundImage: `repeating-conic-gradient(${color} 0% 25%, transparent 0% 50%)`,
  backgroundSize: `${unit * 2}px ${unit * 2}px`,
});

export const FONT = {
  /** K2D, loaded by the route. The squarest Thai face on Google Fonts, which
   *  is the closest a real typeface gets to sitting beside a pixel font. */
  thai: "var(--font-meeple-thai), system-ui, sans-serif",
  /** Silkscreen. Latin and numerals only — there is no Thai pixel font, so the
   *  page uses this where a pixel font can actually be used and does not fake
   *  it anywhere else. Sized in multiples of 8px or it stops being crisp. */
  pixel: "var(--font-meeple-pixel), var(--font-meeple-thai), monospace",
} as const;

export const thaiStyle = { fontFamily: FONT.thai } as const;
export const pixelStyle = { fontFamily: FONT.pixel } as const;

export const Z = { base: 0, raised: 10, sticky: 30, bar: 40 } as const;
