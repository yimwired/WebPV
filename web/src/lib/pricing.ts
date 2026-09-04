// ─────────────────────────────────────────────────────────────
//  Package prices. Single source of truth for every number shown
//  on /pricing. Wording for each tier lives in `dictionary.ts`,
//  keyed by the same id.
//  แก้ราคาที่ไฟล์นี้ไฟล์เดียว (ข้อความอยู่ใน dictionary.ts)
// ─────────────────────────────────────────────────────────────

export interface PricingTier {
  id: "quick" | "starter" | "standard" | "signature" | "custom";
  /** formatted baht amount, or null when the tier is quoted per project */
  price: string | null;
  /** what it costs while `introOffer` is running */
  introPrice?: string;
  /** the demo built in this tier, once its prototype exists */
  demoHref?: string;
  /** the middle tier most clients land on */
  featured?: boolean;
}

/**
 * The first three projects go out at 30% off in exchange for showing the
 * work here as an example. Set `active` to false once they are taken: the
 * cards fall back to list prices and the banner disappears on its own.
 * ครบ 3 รายเมื่อไหร่ ปิด active แล้วราคากลับเป็นราคาเต็มเอง
 */
export const introOffer = { active: true, projects: 3, percentOff: 30 };

// Each demo is picked to match what the tier actually buys, using the
// `buildTime` on the lab itself: Minimal is "Under a week" (Starter is 5 days),
// Meridian is "About a week", Trine is "Two weeks, the 3D object is the work".
// Signature's blurb names Trine outright, so that pairing is fixed by the copy.
// Custom is quoted per project and has no representative demo. Neither does
// Quick page: what it buys is any style in The Lab used as it already looks,
// so pinning it to one demo would misrepresent the offer.
export const pricingTiers: PricingTier[] = [
  { id: "quick", price: "4,900", introPrice: "3,400" },
  { id: "starter", price: "9,900", introPrice: "6,900", demoHref: "/labs/minimal" },
  {
    id: "standard",
    price: "24,900",
    introPrice: "17,900",
    demoHref: "/labs/meridian",
    featured: true,
  },
  { id: "signature", price: "49,900", introPrice: "34,900", demoHref: "/labs/trine" },
  { id: "custom", price: null },
];

export type PricingTierId = PricingTier["id"];

// ─────────────────────────────────────────────────────────────
//  Monthly upkeep, sold after handover and always optional: the
//  repository and the hosting are the client's either way, so a
//  plan buys my time, never access to their own site.
//  แพ็กเกจดูแลรายเดือน ไม่ผูกมัด ยกเลิกได้ทุกเดือน
// ─────────────────────────────────────────────────────────────

export interface CarePlan {
  id: "care" | "carePlus";
  /** formatted baht amount, charged every month */
  price: string;
  /** the plan most clients land on */
  featured?: boolean;
}

// Deliberately outside `introOffer`: a launch discount on a recurring
// price would have to be taken back later, and raising a monthly fee on
// an existing client costs more goodwill than the discount ever bought.
export const carePlans: CarePlan[] = [
  { id: "care", price: "590" },
  { id: "carePlus", price: "1,490", featured: true },
];

export type CarePlanId = CarePlan["id"];
