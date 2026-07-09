// ─────────────────────────────────────────────────────────────
//  Lab data — design experiments shown under /labs.
//  Each entry is a full standalone landing page in its own style.
//  แก้ไฟล์นี้เพื่อเพิ่ม/แก้ style demo (ชื่อ, คำอธิบาย, สี card)
// ─────────────────────────────────────────────────────────────

export interface Lab {
  slug: string;
  name: string;
  /** short vibe label shown on the card + switcher */
  vibe: string;
  /** 1–2 sentences for the gallery card */
  description: string;
  /** accent used for glows/badges */
  accent: string;
  /** gradient for the gallery preview thumbnail */
  preview: { from: string; to: string };
}

export const labs: Lab[] = [
  {
    slug: "dimension",
    name: "Dimension",
    vibe: "Real-time 3D",
    description:
      "An actual WebGL scene as the hero — chrome torus knot, iridescent lighting, drag to orbit. Not a video, not a render: live in your browser.",
    accent: "#f0abfc",
    preview: { from: "#0f172a", to: "#312e81" },
  },
  {
    slug: "vision",
    name: "Vision",
    vibe: "Spatial cinematic",
    description:
      "Pure black, a glowing visor, statements that fade in as you scroll and apps floating as glass windows in space — the Apple keynote treatment.",
    accent: "#2997ff",
    preview: { from: "#000000", to: "#101828" },
  },
  {
    slug: "nebula",
    name: "Nebula",
    vibe: "Premium SaaS",
    description:
      "Deep violet gradients, oversized type and floating chrome shapes — the maximal AI-startup look, tuned to feel expensive instead of noisy.",
    accent: "#a78bfa",
    preview: { from: "#2e1065", to: "#6d28d9" },
  },
  {
    slug: "space",
    name: "Deep Space",
    vibe: "Sci-fi HUD",
    description:
      "A live starfield on canvas, a glowing planet and mission-log typography. The portfolio as a spacecraft dashboard.",
    accent: "#22d3ee",
    preview: { from: "#020617", to: "#0e7490" },
  },
  {
    slug: "luxe",
    name: "Maison",
    vibe: "Luxury editorial",
    description:
      "Ivory paper, serif headlines and hairline gold rules. Quiet, printed-matter luxury — the opposite of a tech landing page.",
    accent: "#c8a24a",
    preview: { from: "#f5efe4", to: "#d9c8a3" },
  },
  {
    slug: "minimal",
    name: "Grid",
    vibe: "Swiss minimal",
    description:
      "White space, a strict grid, one red accent. International-typographic-style discipline applied to a personal index page.",
    accent: "#e11d48",
    preview: { from: "#fafafa", to: "#e5e5e5" },
  },
];
