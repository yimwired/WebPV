/**
 * บ้านทอฝ้าย: an invented three-room guesthouse, an hour out of a northern town.
 *
 * The premise is the arithmetic every small guesthouse owner in Thailand knows
 * and no guest ever sees. A booking through an online travel agent costs the
 * owner fifteen to eighteen percent, so the rate posted there is the rate the
 * owner needs plus the agent's cut. A guest booking direct is paying for the
 * room only, and neither party is told the difference in baht.
 *
 * So this page shows it. Pick the nights, and the panel quotes the direct rate,
 * the agent's rate on the same nights, and what stays in the guest's pocket.
 * That is the one thing an owner's own site can say that a listing cannot, and
 * it is the reason the site pays for itself.
 */

export interface Room {
  id: string;
  name: string;
  /** one line, the thing a guest is actually choosing between */
  character: string;
  sleeps: number;
  /** square metres, because a guesthouse listing always gives them */
  area: number;
  bed: string;
  /** baht a night, direct, low season */
  low: number;
  /** baht a night, direct, high season */
  high: number;
  photo: string;
  /**
   * Nights already taken, as offsets in days from today. Held as offsets rather
   * than dates so the calendar is always plausibly busy whenever the page is
   * opened, and still identical on every run, which a random seed would not be.
   *
   * Nights 9, 10 and 31 are taken in all three rooms on purpose: a calendar
   * where every night has something free tells a guest nothing, and the legend
   * that explains a full night has to have a full night to point at.
   */
  taken: number[];
}

/**
 * The agent's cut, as the band the big two charge a small Thai property.
 * Shown as a range on the page and applied at the midpoint in the arithmetic,
 * because quoting the top of the band to flatter the comparison is the kind of
 * thing that makes a guest stop believing the rest of the numbers.
 */
export const COMMISSION = { low: 0.15, high: 0.18 };
export const COMMISSION_MID = (COMMISSION.low + COMMISSION.high) / 2;

/** High season here is the cool dry months, which is when the north fills up. */
export const HIGH_SEASON_MONTHS = [10, 11, 0, 1]; // Nov, Dec, Jan, Feb

export const ROOMS: Room[] = [
  {
    id: "loft",
    name: "ห้องใต้หลังคา",
    character: "เพดานสูงสุดในบ้าน เช้าแดดเข้าทางหน้าต่างบานใหญ่",
    sleeps: 2,
    area: 24,
    bed: "เตียงคิงไซซ์ 1 เตียง",
    low: 1450,
    high: 1950,
    photo: "/lab-demos/loom/room-loft.webp",
    taken: [2, 3, 4, 9, 10, 11, 12, 19, 20, 21, 31],
  },
  {
    id: "garden",
    name: "ห้องติดสวน",
    character: "เปิดประตูออกสวนได้เลย เงียบที่สุดในสามห้อง",
    sleeps: 2,
    area: 20,
    bed: "เตียงควีนไซซ์ 1 เตียง",
    low: 1250,
    high: 1650,
    photo: "/lab-demos/loom/room-garden.webp",
    taken: [1, 2, 7, 8, 9, 10, 15, 16, 27, 28, 31],
  },
  {
    id: "corner",
    name: "ห้องมุม",
    character: "ห้องเดียวที่นอนได้สามคน มีที่นั่งเล่นในตัว",
    sleeps: 3,
    area: 28,
    bed: "เตียงควีน 1 เตียง และเตียงเดี่ยว 1 เตียง",
    low: 1750,
    high: 2350,
    photo: "/lab-demos/loom/room-corner.webp",
    taken: [5, 6, 9, 10, 13, 14, 22, 23, 24, 25, 31],
  },
];

/** What the house includes, which is what a listing buries under a filter. */
export const INCLUDED = [
  "อาหารเช้าทำสด ทุกคน ทุกเช้า",
  "รับส่งตัวเมือง วันละหนึ่งเที่ยว",
  "ยืมจักรยาน ไม่คิดเงิน",
  "ชา กาแฟ น้ำดื่ม เติมได้ทั้งวัน",
];
