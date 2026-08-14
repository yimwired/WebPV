// ─────────────────────────────────────────────────────────────
//  Lab data. Design experiments shown under /labs.
//  Each entry is a full standalone landing page in its own style.
//  แก้ไฟล์นี้เพื่อเพิ่ม/แก้ style demo (ชื่อ, คำอธิบาย, สี card)
// ─────────────────────────────────────────────────────────────

export interface Lab {
  slug: string;
  name: string;
  /** short vibe label shown on the card + switcher */
  vibe: string;
  /** 1-2 sentences for the gallery card */
  description: string;
  /** accent used inside the demo itself */
  accent: string;
  /** gradient for the gallery preview thumbnail */
  preview: { from: string; to: string };
  /** who this direction suits, shown on the gallery card */
  bestFor: string;
  /** honest build estimate for a site in this direction */
  buildTime: string;
}

export const labs: Lab[] = [
  {
    slug: "sable",
    name: "Sable",
    vibe: "Product, ink on paper",
    description:
      "A fictional e-ink writing slate, drawn entirely in CSS with one light source. The text field on the page drives the panel at the hardware's real 41 ms latency, full-refresh flicker included.",
    accent: "#a8432b",
    preview: { from: "#f6f5f2", to: "#e4e1da" },
    bestFor: "Physical products, tools, anything you want to feel touchable",
    buildTime: "About a week",
  },
  {
    slug: "meridian",
    name: "Meridian",
    vibe: "Machined hardware",
    description:
      "A milled aluminium control deck: keycaps on translateZ, a knurled encoder, a scroll-pinned walkthrough and a configurator that recolours every deck on the page at once.",
    accent: "#f7a445",
    preview: { from: "#101012", to: "#2a2723" },
    bestFor: "Hardware, devices, engineering-led products",
    buildTime: "About a week",
  },
  {
    slug: "dimension",
    name: "Dimension",
    vibe: "Real-time 3D",
    description:
      "An actual WebGL scene as the hero, with a chrome torus knot, iridescent lighting and drag to orbit. Not a video, not a render: live in your browser.",
    accent: "#f0abfc",
    preview: { from: "#0f172a", to: "#312e81" },
    bestFor: "Studios and agencies that need one striking hero",
    buildTime: "Two weeks, the 3D scene is the work",
  },
  {
    slug: "vision",
    name: "Vision",
    vibe: "Spatial cinematic",
    description:
      "Pure black, a glowing visor, statements that fade in as you scroll and apps floating as glass windows in space. The Apple keynote treatment.",
    accent: "#2997ff",
    preview: { from: "#000000", to: "#101828" },
    bestFor: "Launches and single-product storytelling",
    buildTime: "Around ten days",
  },
  {
    slug: "nebula",
    name: "Nebula",
    vibe: "Premium SaaS",
    description:
      "Deep violet gradients, oversized type and floating chrome shapes. The maximal AI-startup look, tuned to feel expensive instead of noisy.",
    accent: "#a78bfa",
    preview: { from: "#2e1065", to: "#6d28d9" },
    bestFor: "SaaS, apps and startups raising attention fast",
    buildTime: "About a week",
  },
  {
    slug: "space",
    name: "Deep Space",
    vibe: "Sci-fi HUD",
    description:
      "A live starfield on canvas, a glowing planet and mission-log typography. The portfolio as a spacecraft dashboard.",
    accent: "#22d3ee",
    preview: { from: "#020617", to: "#0e7490" },
    bestFor: "Games, communities and anything sci-fi adjacent",
    buildTime: "About a week",
  },
  {
    slug: "luxe",
    name: "Maison",
    vibe: "Luxury editorial",
    description:
      "Ivory paper, serif headlines and hairline gold rules. Quiet, printed-matter luxury. The opposite of a tech landing page.",
    accent: "#c8a24a",
    preview: { from: "#f5efe4", to: "#d9c8a3" },
    bestFor: "Restaurants, ateliers, weddings, quiet luxury",
    buildTime: "About a week",
  },
  {
    slug: "minimal",
    name: "Grid",
    vibe: "Swiss minimal",
    description:
      "White space, a strict grid, one red accent. International-typographic-style discipline applied to a personal index page.",
    accent: "#e11d48",
    preview: { from: "#fafafa", to: "#e5e5e5" },
    bestFor: "Consultants, writers and studios selling clarity",
    buildTime: "Under a week",
  },
];
