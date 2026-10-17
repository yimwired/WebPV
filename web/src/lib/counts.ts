// ─────────────────────────────────────────────────────────────
//  Counts that appear inside copy. The dictionary writes {projects},
//  {labs} and {fromPrice}; this fills them in from the data, so a
//  number in a sentence can never drift from the list it describes.
//  (เขียน {projects} / {labs} / {fromPrice} ใน dictionary.ts แล้วมันเติมเลขให้เอง)
// ─────────────────────────────────────────────────────────────

import { labs } from "./labs";
import { pricingTiers } from "./pricing";
import { projects } from "./projects";

/**
 * The cheapest package at its list price. The launch discount is left out on
 * purpose: it covers three projects and then ends, and a figure quoted on the
 * home page should still be true the day after it does.
 */
const fromPrice = Math.min(
  ...pricingTiers
    .filter((tier) => tier.price !== null)
    .map((tier) => Number(tier.price?.replaceAll(",", ""))),
).toLocaleString("en-US");

export function withCounts(copy: string): string {
  return copy
    .replace("{projects}", String(projects.length))
    .replace("{labs}", String(labs.length))
    .replace("{fromPrice}", fromPrice);
}
