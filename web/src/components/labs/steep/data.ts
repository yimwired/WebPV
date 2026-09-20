// A fictional apothecary tea room that blends to order. Everything a blend is
// judged on is a number the shop measures: grams into a 500 ml pot, the water
// it is poured at, the minutes it sits, and the caffeine the leaf carries.
//
// The temperatures and steeping times are the ordinary ones each material is
// brewed at. They matter here because they disagree: roots and bark give what
// they have to boiling water over ten minutes, and the leaf that goes in the
// same pot is bitter long before that.

export type Kind = "leaf" | "flower" | "root" | "bark" | "seed" | "peel";

export interface Material {
  id: string;
  name: string;
  kind: Kind;
  /** what the water has to be for this to give what it has, in °C */
  water: { min: number; max: number };
  /** how long it needs in that water, in minutes */
  steep: { min: number; max: number };
  /** what goes in a 500 ml pot, in grams */
  grams: number;
  /** caffeine in the dry material, mg per gram */
  caffeine: number;
  /** what the shop charges for it, baht per gram */
  baht: number;
  note: string;
}

/** One of these is the blend's base, and it is the leaf that sets the price. */
export const BASES: Material[] = [
  {
    id: "assam",
    name: "ชาดำอัสสัม",
    kind: "leaf",
    water: { min: 95, max: 100 },
    steep: { min: 3, max: 5 },
    grams: 5,
    caffeine: 25,
    baht: 4,
    note: "ใบหักเล็ก น้ำสีทองแดง ทนนมและน้ำตาล",
  },
  {
    id: "oolong",
    name: "อู่หลงก้านอ่อน",
    kind: "leaf",
    water: { min: 85, max: 95 },
    steep: { min: 4, max: 6 },
    grams: 5,
    caffeine: 18,
    baht: 9,
    note: "คั่วอ่อน กลิ่นดอกไม้ ชงซ้ำได้สามน้ำ",
  },
  {
    id: "sencha",
    name: "ชาเขียวเซนฉะ",
    kind: "leaf",
    water: { min: 70, max: 80 },
    steep: { min: 1, max: 2 },
    grams: 5,
    caffeine: 14,
    baht: 8,
    note: "ใบนึ่ง รสสาหร่ายอ่อน น้ำร้อนเกิน 80 ขมทันที",
  },
  {
    id: "silver",
    name: "ชาขาวเข็มเงิน",
    kind: "leaf",
    water: { min: 75, max: 85 },
    steep: { min: 4, max: 6 },
    grams: 5,
    caffeine: 12,
    baht: 16,
    note: "ตูมอ่อนมีขนขาว รสบาง หวานปลาย",
  },
];

/** Added by the spoonful, and each one brings its own brewing terms with it. */
export const ADDITIONS: Material[] = [
  {
    id: "ginger",
    name: "ขิงแห้งฝาน",
    kind: "root",
    water: { min: 95, max: 100 },
    steep: { min: 6, max: 10 },
    grams: 2,
    caffeine: 0,
    baht: 1.2,
    note: "รากแข็ง ต้องน้ำเดือดถึงจะออกรสเผ็ด",
  },
  {
    id: "cinnamon",
    name: "อบเชยแท่ง",
    kind: "bark",
    water: { min: 95, max: 100 },
    steep: { min: 8, max: 12 },
    grams: 1.5,
    caffeine: 0,
    baht: 2,
    note: "เปลือกไม้ม้วน ยิ่งนานยิ่งหวานติดลิ้น",
  },
  {
    id: "cardamom",
    name: "กระวานบุบ",
    kind: "seed",
    water: { min: 90, max: 100 },
    steep: { min: 5, max: 8 },
    grams: 0.6,
    caffeine: 0,
    baht: 12,
    note: "บุบให้แตกก่อน ไม่งั้นน้ำเข้าไม่ถึงเมล็ด",
  },
  {
    id: "orange",
    name: "เปลือกส้มตากแห้ง",
    kind: "peel",
    water: { min: 85, max: 95 },
    steep: { min: 4, max: 6 },
    grams: 1.5,
    caffeine: 0,
    baht: 1.5,
    note: "ผิวนอกอย่างเดียว ขาวข้างในติดมาแล้วขม",
  },
  {
    id: "lemongrass",
    name: "ตะไคร้หั่นแห้ง",
    kind: "leaf",
    water: { min: 90, max: 100 },
    steep: { min: 4, max: 6 },
    grams: 2,
    caffeine: 0,
    baht: 0.8,
    note: "กลิ่นขึ้นจมูกก่อนถึงปาก เข้ากับขิง",
  },
  {
    id: "chamomile",
    name: "ดอกคาโมมายล์",
    kind: "flower",
    water: { min: 90, max: 100 },
    steep: { min: 4, max: 6 },
    grams: 1.5,
    caffeine: 0,
    baht: 6,
    note: "ดอกเล็กสีเหลือง รสแอปเปิลอ่อน",
  },
  {
    id: "rose",
    name: "กลีบกุหลาบแห้ง",
    kind: "flower",
    water: { min: 80, max: 90 },
    steep: { min: 3, max: 5 },
    grams: 1,
    caffeine: 0,
    baht: 8,
    note: "กลีบบาง น้ำร้อนจัดแล้วกลิ่นหายไปกับไอ",
  },
  {
    id: "jasmine",
    name: "ดอกมะลิแห้ง",
    kind: "flower",
    water: { min: 75, max: 85 },
    steep: { min: 2, max: 3 },
    grams: 1,
    caffeine: 0,
    baht: 7,
    note: "หอมที่สุดตอนน้ำยังไม่เดือด เดือดเมื่อไรเหลือแต่ขม",
  },
  {
    id: "mint",
    name: "สะระแหน่แห้ง",
    kind: "leaf",
    water: { min: 85, max: 95 },
    steep: { min: 3, max: 5 },
    grams: 1.2,
    caffeine: 0,
    baht: 3,
    note: "ใบแห้งคืนกลิ่นได้ ถ้าน้ำไม่ลวกจนช้ำ",
  },
];

export const MATERIALS: Material[] = [...BASES, ...ADDITIONS];

/** Blends the shop already sells, used as a starting point on the page. */
export interface Recipe {
  id: string;
  name: string;
  latin: string;
  baseId: string;
  additionIds: string[];
  line: string;
}

export const RECIPES: Recipe[] = [
  {
    id: "morning",
    name: "สูตรเช้าวันจันทร์",
    latin: "No. I",
    baseId: "assam",
    additionIds: ["ginger", "cardamom"],
    line: "ชาดำเต็มแรง เผ็ดปลายลิ้นนิดเดียวพอให้ตื่น",
  },
  {
    id: "afternoon",
    name: "สูตรบ่ายสามโมง",
    latin: "No. II",
    baseId: "oolong",
    additionIds: ["orange", "rose"],
    line: "อู่หลงคั่วอ่อน กลิ่นส้มกับกุหลาบลอยมาทีหลัง",
  },
  {
    id: "evening",
    name: "สูตรก่อนนอน",
    latin: "No. III",
    baseId: "silver",
    additionIds: ["jasmine", "chamomile"],
    line: "ชาขาวรสบาง ดอกไม้สองอย่าง คาเฟอีนน้อยที่สุดในร้าน",
  },
];

/** The pot the shop quotes everything against. */
export const POT = { millilitres: 500, cups: 2 };

/** The bag it sells the blend in, weighed out in the same proportions. */
export const BAG_GRAMS = 50;

/** A single shot of espresso, which is what a caffeine figure is read against. */
export const ESPRESSO_MG = 63;

/** The shop's own imprint, in the place an apothecary label carries it. */
export const SHOP = {
  name: "ห้องปรุงชา เลขที่ ๗",
  latin: "THE STEEPING ROOM",
  street: "ถนนเจริญกรุง พระนคร",
  since: "ตั้งร้าน พ.ศ. ๒๔๗๑",
  keeper: "ฟิล์ม ผู้ปรุง",
};

/** Grams read better without a trailing zero: 1.5 g, but 2 g. */
export const grams = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);
