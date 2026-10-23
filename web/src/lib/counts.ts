// ─────────────────────────────────────────────────────────────
//  Counts that appear inside copy. The dictionary writes {projects},
//  {labs} and {fromPrice}; this fills them in from the data, so a
//  number in a sentence can never drift from the list it describes.
//  (เขียน {projects} / {labs} / {fromPrice} ใน dictionary.ts แล้วมันเติมเลขให้เอง)
// ─────────────────────────────────────────────────────────────

import { labs } from "./labs";
import { currentPriceValue, isPriced, pricingTiers } from "./pricing";
import { projects } from "./projects";

/**
 * The cheapest package at today's price, the same figure /pricing leads
 * with. It used to be the list price, so the home page's "4,900 to start"
 * met a ฿3,400 Quick page on /pricing. When the launch offer is switched
 * off in pricing.ts, this goes back to the list price in the same build.
 */
const fromPrice = Math.min(...pricingTiers.filter(isPriced).map(currentPriceValue)).toLocaleString("en-US");

export function withCounts(copy: string): string {
  return copy
    .replace("{projects}", String(projects.length))
    .replace("{labs}", String(labs.length))
    .replace("{fromPrice}", fromPrice);
}
