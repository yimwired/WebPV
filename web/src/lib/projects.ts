// ─────────────────────────────────────────────────────────────
//  Project data — EDIT THIS to change what shows on the site.
//  แก้ไฟล์นี้ไฟล์เดียวเพื่อเปลี่ยนผลงานบนเว็บ (ชื่อ/คำอธิบาย/ลิงก์/สถานะ/สี)
// ─────────────────────────────────────────────────────────────

export type ProjectStatus = "live" | "active" | "building" | "paused";

export interface Project {
  id: string;
  name: string;
  /** one short line shown under the title */
  tagline: string;
  /** 1–2 sentences for the card body */
  description: string;
  category: string;
  tags: string[];
  status: ProjectStatus;
  /** where the "open" button goes — set to a real URL when deployed */
  href: string;
  /** accent colour used for the card glow/badge (any CSS colour) */
  accent: string;
  /**
   * Optional preview image for the card. Drop a file in `public/projects/`
   * and set e.g. "/projects/aurum.png". If omitted, a styled placeholder shows.
   */
  image?: string;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  live: "Live",
  active: "Active",
  building: "Building",
  paused: "Paused",
};

export const projects: Project[] = [
  {
    id: "you-are-the-virus",
    name: "You Are the Virus",
    tagline: "Infect, mutate, survive",
    description:
      "A browser game where you play as a virus — infect a host's cells, spend evolution points to mutate new abilities, and spread while the host's vitals fight back.",
    category: "Game",
    tags: ["Game", "Strategy", "Bio-sim", "Web"],
    status: "active",
    href: "#",
    accent: "#34d399", // emerald
    image: "/projects/you-are-the-virus.png",
  },
  {
    id: "aurum",
    name: "AURUM",
    tagline: "Automated XAU/USD trading terminal",
    description:
      "A live gold-trading bot on MT5 with 12 strategy engines, session-aware scanning, real-time risk, a trade tape and a kill switch. Built and running end to end.",
    category: "Trading",
    tags: ["XAU/USD", "MT5", "12 engines", "Python"],
    status: "active",
    href: "#",
    accent: "#f59e0b", // amber/gold
    image: "/projects/aurum.png",
  },
  {
    id: "product-dashboard",
    name: "Product Dashboard",
    tagline: "Product & content ops for Shopee",
    description:
      "Manage a Giffarine catalog for Shopee — track listings and generate product copy, image/video prompts and background-removed images with AI, then export content as CSV.",
    category: "Tooling",
    tags: ["Shopee", "AI content", "Catalog", "Export"],
    status: "active",
    href: "#",
    accent: "#60a5fa", // blue
    image: "/projects/product-dashboard.png",
  },
  {
    id: "affiliate",
    name: "Affiliate",
    tagline: "One post → every platform",
    description:
      "Affiliate Publisher — queue a product, generate assets and video from a prompt, then publish one post to YouTube, TikTok, Shopee Shorts and Lemon8 at once, with Telegram alerts.",
    category: "Growth",
    tags: ["YouTube", "TikTok", "Shopee", "Lemon8"],
    status: "active",
    href: "#",
    accent: "#a78bfa", // violet
    image: "/projects/affiliate.png",
  },
  {
    id: "jarvis-moon",
    name: "Jarvis (Moon)",
    tagline: "Multi-agent AI fleet, one commander",
    description:
      "MOON FLEET — a commander orchestrating 11 specialized Claude agents (scout, researcher, builder, critic, scheduler…) across research / build / intake / auto pipelines, with a live mission queue.",
    category: "AI",
    tags: ["Multi-agent", "Claude", "Orchestration", "Voice"],
    status: "active",
    href: "#",
    accent: "#22d3ee", // cyan
    image: "/projects/jarvis-moon.png",
  },
];
