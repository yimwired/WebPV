// A fictional interior studio that publishes working drawings instead of
// renders. Everything on this page is measured in centimetres, including what
// is drawn: the plan's viewBox is the room, so a 180 cm sofa really is drawn
// twice the width of a 90 cm one.
//
// Furniture sizes are the ordinary ones a Thai flat is fitted with, and the
// clearances are the ones a plan is checked against before it is built.

export interface Piece {
  name: string;
  /** across the wall it stands against, in centimetres */
  width: number;
  /** out from that wall */
  depth: number;
}

export interface Layout {
  id: string;
  name: string;
  note: string;
  /** stands against the top wall */
  anchor: Piece;
  /** stands against the bottom wall, facing it */
  facing: Piece;
  /** goes along one side wall, if there is room for it */
  side: Piece;
  /**
   * The gap this room has to keep between the two facing pieces. A bedroom can
   * live with less than a kitchen, where two people pass each other with their
   * hands full.
   */
  walkway: number;
}

export const LAYOUTS: Layout[] = [
  {
    id: "bedroom",
    name: "ห้องนอน",
    note: "เตียง 5 ฟุต ตู้เสื้อผ้าบานเลื่อน โต๊ะหัวเตียงสองข้าง",
    anchor: { name: "เตียง 5 ฟุต", width: 160, depth: 200 },
    facing: { name: "ตู้เสื้อผ้าบานเลื่อน", width: 180, depth: 60 },
    side: { name: "โต๊ะหัวเตียง", width: 45, depth: 40 },
    walkway: 70,
  },
  {
    id: "living",
    name: "ห้องนั่งเล่น",
    note: "โซฟาสามที่นั่ง ตู้ทีวี โต๊ะกลาง",
    anchor: { name: "โซฟาสามที่นั่ง", width: 210, depth: 90 },
    facing: { name: "ตู้ทีวี", width: 180, depth: 45 },
    side: { name: "โต๊ะข้าง", width: 50, depth: 50 },
    walkway: 90,
  },
  {
    id: "kitchen",
    name: "ห้องครัว",
    note: "เคาน์เตอร์ครัว ตู้สูง เกาะกลาง",
    anchor: { name: "เคาน์เตอร์ครัว", width: 240, depth: 60 },
    facing: { name: "ตู้สูงและตู้เย็น", width: 190, depth: 65 },
    side: { name: "ชั้นของแห้ง", width: 60, depth: 35 },
    walkway: 110,
  },
  {
    id: "study",
    name: "ห้องทำงาน",
    note: "โต๊ะทำงานหน้าลึก ชั้นหนังสือเต็มผนัง",
    anchor: { name: "โต๊ะทำงาน", width: 160, depth: 70 },
    facing: { name: "ชั้นหนังสือ", width: 200, depth: 35 },
    side: { name: "ตู้ลิ้นชัก", width: 45, depth: 45 },
    walkway: 80,
  },
];

/**
 * What the studio charges to fit a room out, per square metre. A range rather
 * than a number, because the drawing is what fixes the price and the drawing
 * does not exist yet. Fictional, like the studio.
 */
export const RATE = { low: 9000, high: 15000 };

/** The sheet's own title block, which is where a drawing says what it is. */
export const SHEET = {
  project: "บ้านพักอาศัย สองชั้น",
  client: "คุณลูกค้าสมมติ",
  drawing: "ผังจัดวางเฟอร์นิเจอร์",
  number: "A-203",
  revision: "ร่างครั้งที่ 3",
  drawnBy: "ฟิล์ม",
};

export const baht = (value: number) => value.toLocaleString("th-TH");
