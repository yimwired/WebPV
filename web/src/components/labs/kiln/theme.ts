/**
 * Kiln's palette: paper, ash, and one clay.
 *
 * Wabi-sabi has no accent in the usual sense. Nothing here is trying to catch
 * the eye, so the one colour that is not paper or ink is a fired clay brown
 * that measures 6.31:1 against the paper *and* 6.31:1 the other way round.
 * That symmetry is the reason it was chosen over the mossy green that was
 * tried first: a tone that works as both ink and ground means the page never
 * has to reach for a second one, and a second accent is exactly what would
 * make this look like a different style wearing beige.
 *
 * There are no hard shadows and no borders thicker than a hairline. The
 * hierarchy is carried by space and by scale, which is the only version of
 * this that does not read as a minimal template with a grain filter on it.
 */

export const COLOR = {
  /** 13.24:1 under the ink */
  paper: "#f4efe5",
  /** one step down, for bands. 11.58:1 under the ink */
  paperDeep: "#e8e0d2",
  ink: "#2a2520",
  /** 6.19:1 on paper, 5.41:1 on paperDeep */
  inkMuted: "#5f574e",
  /** fired clay. 6.31:1 on paper, and paper is 6.31:1 on it */
  clay: "#7a4c30",
  /** 6.76:1 on the ink */
  onInkMuted: "#b5ac9e",
  /** the only rule this page draws, one pixel of it */
  hair: "rgba(42, 37, 32, 0.18)",
} as const;

/**
 * The marker that points at a flaw.
 *
 * It sits on photographs that run from a near-black stone slab to a pale
 * linen, so neither a light dot nor a dark one survives on its own. A dark
 * core inside a paper ring does: one of the two always separates from
 * whatever is behind it, and the pair reads as a marker rather than as dust.
 */
export const MARKER = {
  core: "#2a2520",
  ring: "#f4efe5",
  size: 26,
} as const;

export const FONT = {
  /** IBM Plex Sans Thai, loaded by the route */
  sans: "var(--font-kiln-sans), system-ui, sans-serif",
  /**
   * Cormorant Garamond for the Latin. It has no Thai glyphs, so Plex Sans Thai
   * sits next in the stack rather than leaving Thai headings to whatever serif
   * the device happens to have, which on Windows is a fallback nobody chose.
   */
  serif: "var(--font-kiln-serif), var(--font-kiln-sans), Georgia, serif",
} as const;

export const sansStyle = { fontFamily: FONT.sans } as const;
export const serifStyle = { fontFamily: FONT.serif } as const;

export const Z = { base: 0, marker: 10, bar: 40 } as const;
