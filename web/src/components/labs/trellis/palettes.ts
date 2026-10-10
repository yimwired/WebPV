/**
 * Ten palettes, as in the reel this lab comes from. Each one is the whole
 * screen: the ground, the letters, the stems and leaves, the roses and the
 * petal lines drawn inside them. Colour is a layer of its own, separate from
 * the geometry, so switching repaints the garden without regrowing it.
 *
 * Contrast measured with ui-design's palette_check.py: the letters clear 5:1 on
 * the ground (they are display type, so 3:1 is the floor), the small labels on
 * the controls clear 4.5:1, and stems and roses clear 3:1, the floor for
 * graphics. Petal lines are decoration and are only kept visible. A rose drawn
 * over a letter can be close to it in colour; the ground-coloured edge every
 * rose is drawn with is what keeps the two apart, not the hue.
 */

export interface Palette {
  id: string;
  /** what it is called on the swatch */
  name: string;
  colors: {
    ground: string;
    ink: string;
    /** labels on the controls */
    muted: string;
    /** hairlines around the controls */
    line: string;
    vine: string;
    rose: string;
    roseLine: string;
  };
  /** shown while the palette is in use, when its colours come from somewhere */
  credit?: string;
}

export const PALETTES: Palette[] = [
  {
    id: "night",
    name: "ราตรี",
    colors: {
      ground: "#0b0b0c",
      ink: "#f4f1ea",
      muted: "#a9a49b",
      line: "#34343a",
      vine: "#3b55ff",
      rose: "#f2301f",
      roseLine: "#ffd3bf",
    },
  },
  {
    id: "paper",
    name: "กระดาษ",
    colors: {
      ground: "#f3f1ec",
      ink: "#121212",
      muted: "#55524c",
      line: "#cfcac0",
      vine: "#2343c9",
      rose: "#e5321d",
      roseLine: "#ffd6c7",
    },
  },
  {
    id: "benjarong",
    name: "เบญจรงค์",
    colors: {
      ground: "#172f3d",
      ink: "#fffcdf",
      muted: "#a0baca",
      line: "#35576a",
      vine: "#e7bb29",
      rose: "#e44543",
      roseLine: "#fff0d0",
    },
    // ขาบดำ, งาช้าง, รงทอง, แดงดอกชบา and สังข์, credited as its licence asks.
    credit: "สีจากระบบสีไทยโทน โดย อ.ไพโรจน์ พิทยเมธี",
  },
  {
    id: "champa",
    name: "จำปา",
    colors: {
      ground: "#0f1913",
      ink: "#f2ead8",
      muted: "#b2ae9e",
      line: "#2f3e34",
      vine: "#2f9460",
      rose: "#ec7f12",
      roseLine: "#fff4e0",
    },
  },
  {
    id: "anchan",
    name: "อัญชัน",
    colors: {
      ground: "#170c22",
      ink: "#ffffff",
      muted: "#bcb2c9",
      line: "#3d2e54",
      vine: "#28a79a",
      rose: "#d945f2",
      roseLine: "#f9d2ff",
    },
  },
  {
    id: "banana-leaf",
    name: "ใบตอง",
    colors: {
      ground: "#10231a",
      ink: "#f3ecdc",
      muted: "#aebba9",
      line: "#2d4a39",
      vine: "#4db377",
      rose: "#f08fb0",
      roseLine: "#fff2f6",
    },
  },
  {
    id: "lac",
    name: "ครั่ง",
    colors: {
      ground: "#c3141d",
      ink: "#fff6ea",
      muted: "#fff6ea",
      line: "#e0545a",
      vine: "#0f0a0a",
      rose: "#ffe6d6",
      roseLine: "#c3141d",
    },
  },
  {
    id: "raw-cotton",
    name: "ผ้าดิบ",
    colors: {
      ground: "#ece3d0",
      ink: "#231d19",
      muted: "#5e5248",
      line: "#c9baa0",
      vine: "#2f6b45",
      rose: "#c02c3a",
      roseLine: "#f7d9cc",
    },
  },
  {
    id: "lotus",
    name: "บัวชมพู",
    colors: {
      ground: "#f5d3da",
      ink: "#330b15",
      muted: "#6e3a46",
      line: "#dda5b2",
      vine: "#2d6a4d",
      rose: "#b0123a",
      roseLine: "#ffc4d1",
    },
  },
  {
    id: "sand",
    name: "ทราย",
    colors: {
      ground: "#e2cda5",
      ink: "#2a1a10",
      muted: "#5f4a35",
      line: "#c4a97c",
      vine: "#3c5a29",
      rose: "#8d1a2b",
      roseLine: "#f0c3ab",
    },
  },
];

/** CSS custom properties for one palette, set on the page's root element. */
export function paletteVars(palette: Palette): Record<string, string> {
  const c = palette.colors;
  return {
    "--tr-ground": c.ground,
    "--tr-ink": c.ink,
    "--tr-muted": c.muted,
    "--tr-line": c.line,
    "--tr-vine": c.vine,
    "--tr-rose": c.rose,
    "--tr-rose-line": c.roseLine,
  };
}

export const paletteById = (id: string | null | undefined) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];
