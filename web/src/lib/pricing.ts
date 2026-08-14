// ─────────────────────────────────────────────────────────────
//  Package prices. Single source of truth for every number shown
//  on /pricing. Wording for each tier lives in `dictionary.ts`,
//  keyed by the same id.
//  แก้ราคาที่ไฟล์นี้ไฟล์เดียว (ข้อความอยู่ใน dictionary.ts)
// ─────────────────────────────────────────────────────────────

export interface PricingTier {
  id: "starter" | "standard" | "signature" | "custom";
  /** formatted baht amount, or null when the tier is quoted per project */
  price: string | null;
  /** the demo built in this tier, once its prototype exists */
  demoHref?: string;
  /** the middle tier most clients land on */
  featured?: boolean;
}

export const pricingTiers: PricingTier[] = [
  { id: "starter", price: "9,900" },
  { id: "standard", price: "24,900", featured: true },
  { id: "signature", price: "49,900" },
  { id: "custom", price: null },
];

export type PricingTierId = PricingTier["id"];
