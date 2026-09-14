/**
 * Prism's two panel modes, and why the glass is as opaque as it is.
 *
 * The plate a caption sits on is `fill` composited over whatever the backdrop
 * happens to be, so the tones here were solved against the worst plate each
 * mode can produce rather than picked. The blur is part of that maths: at 28px
 * a bright speck is averaged into its neighbourhood, so the number that matters
 * is the local mean behind the panel, not the brightest pixel in the file.
 *
 * At `alpha` 0.64 over a local mean of 225 the dark panel still holds 6.38:1 on
 * its text and 4.92:1 on its muted tone; the light panel over a local mean of
 * 10 holds 7.30:1 and 5.24:1. Going more transparent than this is where glass
 * starts lying about being readable, which is the actual thing people mean when
 * they call it slop.
 */

export type PanelMode = "light" | "dark";

export interface PanelTone {
  /** solid colour of the sheet, composited at `alpha` over the backdrop */
  fill: string;
  alpha: number;
  text: string;
  muted: string;
  /** the specular rim, brightest where the light comes from */
  rim: string;
  /** hairline between rows inside the panel */
  hairline: string;
  /** fill of a control sitting on the panel */
  control: string;
  controlText: string;
}

export const PANEL: Record<PanelMode, PanelTone> = {
  // worn over a bright backdrop: the sheet goes dark so pale text survives
  dark: {
    fill: "14, 16, 20",
    alpha: 0.64,
    text: "#f7f8fa",
    muted: "#d8dce3",
    rim: "rgba(255, 255, 255, 0.55)",
    hairline: "rgba(255, 255, 255, 0.14)",
    control: "rgba(255, 255, 255, 0.16)",
    controlText: "#f7f8fa",
  },
  // worn over a dark backdrop: the sheet goes pale so dark text survives
  light: {
    fill: "248, 249, 252",
    alpha: 0.64,
    text: "#12141a",
    // one step darker than the first pass. The queue's selected row lays a 10%
    // scrim over the sheet, and on the darkest backdrop in the set that plate
    // left the artist line at 4.38:1. No reason to spend the margin there.
    muted: "#242933",
    rim: "rgba(255, 255, 255, 0.92)",
    hairline: "rgba(0, 0, 0, 0.12)",
    control: "rgba(18, 20, 26, 0.10)",
    controlText: "#12141a",
  },
};

/**
 * Mean luminance, 0 to 255, above which the panel flips to its dark mode.
 * 118 rather than 128: mid grey already needs the darker sheet, because pale
 * text loses contrast faster going up than dark text does going down.
 */
export const LUMA_SWITCH = 118;

/** What the panel falls back to when the adaptive layer is switched off. */
export const FIXED_MODE: PanelMode = "light";

export const modeFor = (luma: number, adaptive: boolean): PanelMode =>
  adaptive ? (luma > LUMA_SWITCH ? "dark" : "light") : FIXED_MODE;

/** The page around the glass. Near black so the panels are the only light. */
export const PAGE = {
  bg: "#08090c",
  text: "#f4f5f7",
  muted: "#a6acb8",
  line: "rgba(255, 255, 255, 0.14)",
  accent: "#7fd4ff",
} as const;

export const FONT = {
  /** IBM Plex Sans Thai, loaded by the route. Covers Thai and Latin */
  sans: "var(--font-prism-sans), system-ui, sans-serif",
  /** Geist Mono, already loaded by the app shell. Used for the readouts */
  mono: "var(--font-geist-mono), ui-monospace, monospace",
} as const;

export const sansStyle = { fontFamily: FONT.sans } as const;
export const monoStyle = { fontFamily: FONT.mono } as const;
