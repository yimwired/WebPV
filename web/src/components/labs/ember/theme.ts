/**
 * Ember's palette, stacking order and font stacks.
 *
 * A charcoal grill buffet shouts, so this lab breaks the site's rules on
 * purpose: one loud chilli red, a warm cream ground, blur where the portfolio
 * would never allow it. Nothing here is exported outside /labs/ember.
 *
 * Every ratio in the comments was measured against the colour it actually sits
 * on, not eyeballed. Small text never uses `flame` - it lands at 4.54:1 on
 * cream, which passes but leaves no room, so `flameDeep` carries anything set
 * below 24px.
 */

export const COLOR = {
  /** page ground: warm cream rather than white, so the red never glares */
  cream: "#fbf1de",
  /** one step down, for bands that need to separate without a rule */
  creamDeep: "#f3e2c6",

  /** the brand red. Fills, borders and display type only */
  flame: "#d81f14",
  /** the same red for small text: 6.76:1 on cream */
  flameDeep: "#a8140c",

  /** near black, biased red so it stays in the same family as the flame */
  char: "#150c0a",
  charSoft: "#241511",

  /** secondary accent. Prices and stars, never a surface */
  ember: "#ff9d2e",

  /**
   * Text on the flame block. Not `cream`: that pairing lands at 4.54:1, which
   * passes with nothing to spare, and a red block full of body copy is the
   * wrong place to spend the last 0.04. This one measures 4.82:1.
   */
  onFlame: "#fff8ec",

  /** 12.81:1 on cream */
  ink: "#3a251e",
  /** 5.83:1 on cream */
  inkMuted: "#7a5546",

  /** 17.95:1 on char */
  onChar: "#fdf6ea",
  /** 7.42:1 on char, 6.79:1 on charSoft */
  onCharMuted: "#b79b8c",
} as const;

/**
 * One place that decides what covers what. The site's lab switcher is fixed at
 * z-50, so the dialog has to clear it or it opens underneath the pill.
 */
export const Z = {
  /** tinted washes painted straight onto the page ground */
  wash: 0,
  /** the ember photograph and the blurred colour blobs behind everything */
  ember: 1,
  /** stickers, the outline wordmark, anything that drifts on scroll */
  floating: 2,
  /** normal page content */
  content: 10,
  /** cards that lift off the page and catch a shadow */
  raised: 20,
  /** the sticky bar */
  bar: 40,
  /** the dialog, above the lab switcher at 50 */
  modal: 70,
} as const;

export const FONT = {
  /** Anton, loaded by the route. Latin only, so Thai must not use it */
  display: "var(--font-ember-display), 'Arial Narrow', system-ui, sans-serif",
  /** Kanit, loaded by the route. Covers Thai and Latin */
  thai: "var(--font-ember-thai), system-ui, sans-serif",
} as const;

/** Applied to the giant Latin wordmarks. */
export const displayStyle = {
  fontFamily: FONT.display,
  letterSpacing: "-0.01em",
  lineHeight: 0.84,
} as const;

/** Applied to every Thai heading and to body copy. */
export const thaiStyle = { fontFamily: FONT.thai } as const;
