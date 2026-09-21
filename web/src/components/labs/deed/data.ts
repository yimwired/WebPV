// A fictional condominium, priced and costed the way one actually is in
// Bangkok. The listing price is the only number a real listing gives you, and
// it is the one number nobody pays: this page carries the rest.
//
// Rates and fees are the ordinary ones as of 2026. They are deliberately the
// plain published figures rather than a promotion, because a promotion expires
// and a page that quietly assumes one is lying to whoever reads it later.

export interface Unit {
  id: string;
  name: string;
  layout: string;
  /** usable area in square metres */
  sqm: number;
  floor: number;
  facing: string;
  /** the listed price, in baht */
  price: number;
  note: string;
}

export const UNITS: Unit[] = [
  {
    id: "studio",
    name: "ยูนิต A",
    layout: "สตูดิโอ",
    sqm: 28,
    floor: 8,
    facing: "ทิศเหนือ",
    price: 2_390_000,
    note: "ผนังครัวเต็มด้าน ไม่มีเสากลางห้อง เตียง 5 ฟุตวางได้ทั้งสองแนว",
  },
  {
    id: "one-bed",
    name: "ยูนิต B",
    layout: "1 ห้องนอน",
    sqm: 34.5,
    floor: 14,
    facing: "ทิศตะวันออก",
    price: 3_450_000,
    note: "ห้องนอนแยกผนังทึบ ระเบียงกว้าง 1.4 ม. เครื่องซักผ้าอยู่นอกห้องน้ำ",
  },
  {
    id: "two-bed",
    name: "ยูนิต C",
    layout: "2 ห้องนอน",
    sqm: 52,
    floor: 21,
    facing: "ทิศตะวันออก",
    price: 5_690_000,
    note: "ห้องนอนสองห้องได้แสงทั้งคู่ ครัวปิดแยกจากส่วนนั่งเล่น",
  },
];

/**
 * What a bank quotes on a first home in 2026. The instalment is worked out at
 * the floating rate rather than the three-year teaser, because that is what the
 * bank itself sizes the loan against, and a page that quotes the teaser flatters
 * itself by about four thousand baht a month.
 */
export const LOAN = {
  /** the first three years, in percent per year */
  promoRate: 3.5,
  promoYears: 3,
  /** MRR minus two, which is where a first home lands afterwards */
  floatRate: 5.3,
  mrr: 7.3,
  /** how much of the price a bank will lend on a first home */
  maxLoanShare: 0.9,
  /** the share of monthly income a bank lets total debt take */
  dsr: 0.4,
  years: [20, 25, 30, 35],
};

/**
 * The money that has to be in the account on transfer day, on top of whatever
 * is left of the deposit. Not one of these appears on a listing.
 */
export const FEES = {
  /** of the assessed price, and the buyer conventionally pays half */
  transferRate: 0.02,
  transferShare: 0.5,
  /** of the amount borrowed, and the buyer pays all of it */
  mortgageRate: 0.01,
  /** three years of cover, required while the mortgage runs */
  fireInsurance: 2_500,
  /** electricity and water meters, paid to the developer */
  meters: 12_000,
  /** common area, per square metre per month, collected a year ahead */
  maintenancePerSqm: 50,
  /** the sinking fund, per square metre, paid once */
  sinkingPerSqm: 500,
};

export const PROJECT = {
  latin: "THE DEED",
  name: "เดอะ ดีด ลาดพร้าว 71",
  line: "คอนโดมิเนียม 8 ชั้น 2 อาคาร 214 ยูนิต",
  handover: "โอนได้ไตรมาส 3 ปี 2569",
  seller: "ฟิล์ม",
};

export const baht = (value: number) =>
  Math.round(value).toLocaleString("th-TH");

/** Millions, for the headline figures where six digits stop being readable. */
export const millions = (value: number) =>
  (value / 1_000_000).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
