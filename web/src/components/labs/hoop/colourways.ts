/**
 * A colourway is a bag colour plus the four threads sewn onto it. It drives the
 * whole page, not just the design: the shop's site is the same canvas as its
 * product, so picking a colourway repaints both.
 *
 * Contrast measured with ui-design's palette_check.py: ink is at least 11:1 on
 * fabric and on panel, muted at least 5.3:1 on both, and every thread clears
 * 3:1 on the fabric it is sewn onto. The flora is decoration, but a thread you
 * cannot see is a thread nobody should pay for.
 */

export interface Colourway {
  id: string;
  /** the thread set's name */
  name: string;
  /** the bag it is sewn onto */
  fabric: string;
  colors: {
    fabric: string;
    /** a raised surface on the page, one step off the fabric */
    panel: string;
    /** letters, and the page's body text */
    ink: string;
    /** secondary text */
    muted: string;
    /** hairlines and the field boundary */
    line: string;
    /** stems and leaves */
    vine: string;
    rose: string;
    /** petal lines inside the roses */
    roseLine: string;
  };
  /** where the colours come from, when they come from somewhere */
  source?: string;
}

export const COLOURWAYS: Colourway[] = [
  {
    id: "night",
    name: "ราตรี",
    fabric: "ถุงผ้าสีดำ",
    colors: {
      fabric: "#0b0b0c",
      panel: "#17171a",
      ink: "#f4f1ea",
      muted: "#a9a49b",
      line: "#2c2c30",
      vine: "#3b55ff",
      rose: "#f2301f",
      roseLine: "#ffd3bf",
    },
  },
  {
    id: "banana-leaf",
    name: "ใบตอง",
    fabric: "ถุงผ้าสีเขียวขวด",
    colors: {
      fabric: "#10231a",
      panel: "#183126",
      ink: "#f3ecdc",
      muted: "#aebba9",
      line: "#27402f",
      vine: "#4db377",
      rose: "#f6a5be",
      roseLine: "#ffe6ee",
    },
  },
  {
    id: "benjarong",
    name: "เบญจรงค์",
    fabric: "ถุงผ้าสีขาบ",
    colors: {
      fabric: "#172f3d",
      panel: "#1f3b4c",
      ink: "#fffcdf",
      muted: "#a0baca",
      line: "#2d4a5c",
      vine: "#e7bb29",
      rose: "#e44543",
      roseLine: "#fff0d0",
    },
    source: "ขาบดำ งาช้าง รงทอง แดงดอกชบา และสังข์ จากระบบสีไทยโทน",
  },
  {
    id: "champa",
    name: "จำปา",
    fabric: "ถุงผ้าสีเขียวหม่น",
    colors: {
      fabric: "#0f1913",
      panel: "#18241d",
      ink: "#f2ead8",
      muted: "#b2ae9e",
      line: "#26332b",
      vine: "#2f9460",
      rose: "#f28c1e",
      roseLine: "#ffe0b5",
    },
  },
  {
    id: "anchan",
    name: "อัญชัน",
    fabric: "ถุงผ้าสีม่วงเข้ม",
    colors: {
      fabric: "#170c22",
      panel: "#221532",
      ink: "#ffffff",
      muted: "#bcb2c9",
      line: "#33254a",
      vine: "#28a79a",
      rose: "#d945f2",
      roseLine: "#f9d2ff",
    },
  },
  {
    id: "raw",
    name: "ผ้าดิบ",
    fabric: "ถุงผ้าดิบ",
    colors: {
      fabric: "#ece3d0",
      panel: "#e2d7c0",
      ink: "#231d19",
      muted: "#5e5248",
      line: "#cdbfa6",
      vine: "#2f6b45",
      rose: "#c02c3a",
      roseLine: "#f7d9cc",
    },
  },
];

/** CSS custom properties for one colourway, set on the page's root element. */
export function colourwayVars(colourway: Colourway): Record<string, string> {
  const c = colourway.colors;
  return {
    "--hoop-fabric": c.fabric,
    "--hoop-panel": c.panel,
    "--hoop-ink": c.ink,
    "--hoop-muted": c.muted,
    "--hoop-line": c.line,
    "--hoop-vine": c.vine,
    "--hoop-rose": c.rose,
    "--hoop-rose-line": c.roseLine,
  };
}
