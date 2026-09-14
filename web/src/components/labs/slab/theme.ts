/**
 * Slab's palette, and the one rule that keeps neo-brutalism readable.
 *
 * The style runs on saturated colour at full strength, which is exactly where
 * it usually goes wrong: those colours are all bright, so they work as ground
 * and fail as ink. Measured against the paper here, the accents land between
 * 1.28:1 and 2.07:1, which is invisible. Against the ink they run 9.20:1 to
 * 14.93:1.
 *
 * So: **an accent is a surface, never a letter** - unless the letter sits on
 * the near-black, where it is the brightest thing available. Nothing on this
 * page breaks that, and it is the whole reason the page can be this loud and
 * still pass.
 */

export interface Accent {
  id: string;
  /** what the course is called, used as the swatch label */
  label: string;
  /** the block fill */
  value: string;
  /** a second tone from the same family, for the flat drop shadow */
  shade: string;
}

/** Three courses, three palettes. Picking one recolours the whole page. */
export const ACCENTS: Accent[] = [
  { id: "cut", label: "ตัดจบ", value: "#ffe14d", shade: "#d9b400" },
  { id: "color", label: "สีจบ", value: "#ff8fc7", shade: "#d1548f" },
  { id: "sound", label: "เสียงจบ", value: "#7ad7f0", shade: "#3fa2bd" },
];

export const COLOR = {
  /** 19.08:1 against the paper, both ways */
  ink: "#0d0d0d",
  paper: "#fffdf5",
  /** one step off the paper, for bands that need to separate without a rule */
  paperDeep: "#f4f0e2",
  /** 8.76:1 on paper */
  inkMuted: "#4a4a44",
  /** 9.82:1 on the ink */
  onInkMuted: "#b9b9ae",
} as const;

/** Border weights. Neo-brutalism has two: thick, and thicker. */
export const LINE = { hair: 2, thick: 3, heavy: 4 } as const;

/**
 * The flat offset shadow. No blur at all - a blurred shadow is the thing this
 * style is a reaction against, and softening it by even 2px reads as a mistake
 * rather than a choice.
 */
export const shadow = (x: number, y: number, color = COLOR.ink) =>
  `${x}px ${y}px 0 0 ${color}`;

export const FONT = {
  /** Kanit, loaded by the route. Covers Thai and Latin, and goes to 800 */
  sans: "var(--font-slab-sans), system-ui, sans-serif",
} as const;

export const sansStyle = { fontFamily: FONT.sans } as const;

export const Z = { base: 0, raised: 10, sticker: 20, bar: 40 } as const;
