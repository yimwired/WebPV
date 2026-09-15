/**
 * Paste's materials.
 *
 * This style is made of things that were physically stuck down, so the palette
 * is a list of papers rather than a list of colours: notebook cream, kraft
 * envelope, the white border of an instant photo. One blue ink runs across all
 * three at 9.65:1 or better, which is what lets the page layer them freely
 * without re-checking every time something moves.
 *
 * The tapes are the one place a saturated colour appears, and they are always
 * ground, never ink. Blue ink on each of them measures 8:1 or better, so a
 * label can sit on a strip of tape and still be read, which is the whole reason
 * to draw tape rather than a coloured box.
 */

export const COLOR = {
  /** notebook paper. 12.83:1 under the ink */
  paper: "#f7f2e8",
  /** kraft envelope, for bands. 9.65:1 under the ink */
  kraft: "#e3d2b6",
  /** the white border of an instant photo. 13.95:1 under the ink */
  card: "#fdfcf8",
  /** ballpoint blue-black */
  ink: "#1c2b3f",
  /** 6.82:1 on paper, 5.13:1 on kraft */
  inkMuted: "#4e5460",
  /** rubber stamp red. 5.34:1 on paper, and paper is 5.34:1 on it */
  stamp: "#b23a26",
  /** the ruled line on notebook paper, and the shadow under a taped corner */
  rule: "rgba(28, 43, 63, 0.14)",
} as const;

/** Washi tape. Always a surface, and blue ink reads on all three. */
export const TAPE = ["#f2dc9a", "#e9c9d8", "#cfe0d8"] as const;

export const FONT = {
  /** Charm, loaded by the route. A Thai hand that is still legible */
  hand: "var(--font-paste-hand), cursive",
  /** Sarabun. Everything that has to be read rather than glanced at */
  sans: "var(--font-paste-sans), system-ui, sans-serif",
} as const;

export const handStyle = { fontFamily: FONT.hand } as const;
export const sansStyle = { fontFamily: FONT.sans } as const;

/**
 * Ruled paper, as a background image rather than a stack of divs.
 *
 * 28px to match the body line-height, so text set on it sits on the lines
 * instead of drifting across them, which is the detail that separates this
 * from a beige page with stripes.
 */
export const RULED = {
  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 27px, ${COLOR.rule} 27px, ${COLOR.rule} 28px)`,
} as const;

export const Z = { paper: 0, photo: 10, tape: 20, bar: 40 } as const;
