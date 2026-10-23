// ─────────────────────────────────────────────────────────────
//  The home page showcase: the listed labs grouped by the kind of
//  business a client would say they run, and the packages that fit
//  each one. Labels live in dictionary.ts under `showcase.categories`.
//  แก้หมวดธุรกิจบนหน้าแรกที่นี่ (ชื่อหมวดอยู่ใน dictionary)
// ─────────────────────────────────────────────────────────────

import { labBySlug, labs, type Lab } from "./labs";
import { currentPriceValue, pricedTier, type PricedTier, type PricingTierId } from "./pricing";

export interface ShowcaseCategory {
  id: "food" | "tours" | "shops" | "events" | "premium" | "studios";
  /** labs dressed as this kind of business; the first one leads the card */
  labs: string[];
  /** the packages that suit it, each with the lab it would look like; only priced tiers */
  packages: { tier: PricingTierId; lab: string }[];
}

// Each package is matched to the `buildTime` the labs in the group state
// against the timelines on /pricing. Quick page is any Lab style used as it
// looks, so it fits the one-page cases, Counter and Trellis's wedding card.
// Ember, Clash, Unfold and Gaze, a week or ten days each, are Business; Cart
// and Slab fit Starter's five days; Stall's accounts take Standard's two
// weeks; Longtail is Standard as a front end, and its three to five weeks
// with a booking back end is Signature's timeline; Trine's 3D object is the
// Signature build the pricing copy names outright.
export const showcaseCategories: ShowcaseCategory[] = [
  {
    id: "food",
    labs: ["counter", "ember", "meeple"],
    packages: [
      { tier: "quick", lab: "counter" },
      { tier: "business", lab: "ember" },
    ],
  },
  {
    id: "tours",
    labs: ["longtail"],
    packages: [
      { tier: "standard", lab: "longtail" },
      { tier: "signature", lab: "longtail" },
    ],
  },
  {
    id: "shops",
    labs: ["cart", "stall"],
    packages: [
      { tier: "starter", lab: "cart" },
      { tier: "standard", lab: "stall" },
    ],
  },
  {
    id: "events",
    labs: ["clash", "trellis"],
    packages: [
      { tier: "quick", lab: "trellis" },
      { tier: "business", lab: "clash" },
    ],
  },
  {
    id: "premium",
    labs: ["thock", "trine", "unfold"],
    packages: [
      { tier: "business", lab: "unfold" },
      { tier: "signature", lab: "trine" },
    ],
  },
  {
    id: "studios",
    labs: ["gaze", "slab", "minimal"],
    packages: [
      { tier: "starter", lab: "slab" },
      { tier: "business", lab: "gaze" },
    ],
  },
];

export type ShowcaseCategoryId = ShowcaseCategory["id"];

/** A category with its labs and packages looked up, ready to render. */
export interface ResolvedCategory {
  id: ShowcaseCategoryId;
  labs: Lab[];
  /** cheapest first, so the first one is the card's starting price */
  packages: { tier: PricedTier; lab: Lab }[];
}

// A tier quoted per project (Custom) fails the build here: the card states a
// starting price in baht and would otherwise print "฿null".
export const resolvedCategories: ResolvedCategory[] = showcaseCategories.map(
  (category) => ({
    id: category.id,
    labs: category.labs.map(labBySlug),
    packages: category.packages
      .map((item) => ({ tier: pricedTier(item.tier), lab: labBySlug(item.lab) }))
      .sort((a, b) => currentPriceValue(a.tier) - currentPriceValue(b.tier)),
  }),
);

// Every listed lab appears exactly once, so the six cards add up to the
// gallery. A lab listed or archived without updating this file fails the
// build here instead of quietly vanishing from the home page.
{
  const shown = showcaseCategories.flatMap((category) => category.labs);
  const missing = labs.filter((lab) => !shown.includes(lab.slug));
  const doubled = shown.filter((slug, i) => shown.indexOf(slug) !== i);
  if (missing.length > 0 || doubled.length > 0) {
    throw new Error(
      `showcase.ts is out of step with labs.ts: missing [${missing
        .map((lab) => lab.slug)
        .join(", ")}], listed twice [${doubled.join(", ")}]`,
    );
  }
}
