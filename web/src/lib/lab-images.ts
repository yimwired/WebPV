// ─────────────────────────────────────────────────────────────
//  Where each lab's pictures live. Two kinds:
//  - the 16:10 gallery card every listed lab has (public/labs/cards,
//    shot by shoot-lab-cards.mjs, versioned by content hash)
//  - an upright still for the home page, which only some labs have
//    (public/home/cards, cut by make-hero-cards.mjs)
// ─────────────────────────────────────────────────────────────

import { labCardVersions } from "./lab-cards";

export type StillShape = "portrait" | "square";

// Must match the `cards` list in web/scripts/make-hero-cards.mjs.
const stills: Record<string, StillShape> = {
  thock: "portrait",
  trellis: "square",
  clash: "portrait",
  gaze: "square",
  counter: "portrait",
  longtail: "portrait",
  meeple: "square",
  ember: "portrait",
  trine: "portrait",
};

/** The 16:10 gallery card, with its hash so a reshoot shows up at once. */
export function labCardSrc(slug: string): string {
  return `/labs/cards/${slug}.webp?v=${labCardVersions[slug] ?? ""}`;
}

/** The upright still if the lab has one, else the gallery card to crop from. */
export function labStillSrc(slug: string): string {
  return slug in stills ? `/home/cards/${slug}.webp` : labCardSrc(slug);
}

export function labStillShape(slug: string): StillShape | undefined {
  return stills[slug];
}
