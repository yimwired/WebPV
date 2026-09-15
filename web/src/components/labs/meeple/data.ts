/**
 * ตาถัดไป: an invented board game cafe, two minutes from the BTS at Ari.
 *
 * The premise is the question the staff of a real one answer forty times a
 * shift. A shelf of two hundred boxes is not a menu, it is a wall, and a group
 * standing in front of it does not know which box is a twenty minute game for
 * five people who have never played anything. They ask, and somebody walks over
 * and picks one. That conversation is the product, and it is the one thing a
 * printed poster of the shelf cannot do.
 *
 * So the page asks the three things the staff ask, in the same order, and
 * answers with the shelf itself rather than with a list somewhere else.
 */

export type Weight = "เบา" | "กลาง" | "หนัก";

export interface Game {
  id: string;
  name: string;
  /** what it plays like, in two or three words */
  genre: string;
  /** the smallest and largest group the box actually supports */
  minPlayers: number;
  maxPlayers: number;
  /** minutes a normal game runs, not the optimistic number on the box */
  minutes: number;
  /** minutes for a member of staff to teach it from cold */
  teach: number;
  weight: Weight;
  /** one line, said the way somebody standing at the shelf would say it */
  pitch: string;
}

/**
 * Twelve boxes, invented. A shelf of real titles on a portfolio is somebody
 * else's artwork and somebody else's trademark doing the selling, and this page
 * is a style study, not a shop that exists.
 *
 * The numbers are the part that has to be honest: the finder is only worth
 * showing if the shelf under it has real gaps in it. There is deliberately no
 * heavy game for seven people in half an hour, because there is no such game.
 */
export const GAMES: Game[] = [
  {
    id: "lomwon",
    name: "ลมวน",
    genre: "ไว ใครคว้าทัน",
    minPlayers: 2,
    maxPlayers: 6,
    minutes: 15,
    teach: 2,
    weight: "เบา",
    pitch: "กติกาข้อเดียว ใครเห็นก่อนคว้าก่อน จบเกมใน 15 นาที เล่นซ้ำได้ทั้งคืน",
  },
  {
    id: "khamun",
    name: "คำมั่น",
    genre: "ปาร์ตี้ โกหกกันเอง",
    minPlayers: 4,
    maxPlayers: 8,
    minutes: 20,
    teach: 3,
    weight: "เบา",
    pitch: "ทุกคนสัญญาไว้หนึ่งข้อ แล้วมีคนหนึ่งโกหก งานเลี้ยงรุ่นชอบเกมนี้ที่สุด",
  },
  {
    id: "namkhang",
    name: "น้ำค้าง",
    genre: "สองคน วางแผน",
    minPlayers: 2,
    maxPlayers: 2,
    minutes: 25,
    teach: 5,
    weight: "เบา",
    pitch: "ออกแบบมาเพื่อสองคนจริงๆ ไม่ใช่เกมสี่คนที่เล่นสองคนก็พอไหว",
  },
  {
    id: "kwan",
    name: "ควันหลง",
    genre: "บลัฟ อ่านหน้า",
    minPlayers: 3,
    maxPlayers: 6,
    minutes: 30,
    teach: 5,
    weight: "เบา",
    pitch: "ไพ่ในมือไม่สำคัญเท่าหน้าที่ทำตอนลง คนที่นิ่งที่สุดบนโต๊ะมักชนะ",
  },
  {
    id: "chaokhao",
    name: "เจ้าของข่าว",
    genre: "แบ่งทีม ใบ้คำ",
    minPlayers: 5,
    maxPlayers: 8,
    minutes: 35,
    teach: 5,
    weight: "เบา",
    pitch: "สองทีมแย่งกันพาดหัวข่าว ใบ้ได้คำเดียวต่อตา เถียงกันดังแน่นอน",
  },
  {
    id: "suan",
    name: "สวนกลางเมือง",
    genre: "วางไทล์ ต่อภาพ",
    minPlayers: 1,
    maxPlayers: 4,
    minutes: 40,
    teach: 8,
    weight: "กลาง",
    pitch: "ค่อยๆ ต่อสวนของตัวเองให้ชนกันพอดี เล่นคนเดียวก็ได้ถ้ามารอเพื่อน",
  },
  {
    id: "talat",
    name: "ตลาดนัดวันอาทิตย์",
    genre: "ซื้อมาขายไป",
    minPlayers: 2,
    maxPlayers: 4,
    minutes: 45,
    teach: 10,
    weight: "กลาง",
    pitch: "ของถูกตอนเช้าแพงตอนบ่าย ใครกล้าถือของไว้นานกว่าคนนั้นได้กำไร",
  },
  {
    id: "chaoban",
    name: "เจ้าบ้าน",
    genre: "เดินเก็บของ",
    minPlayers: 3,
    maxPlayers: 4,
    minutes: 50,
    teach: 12,
    weight: "กลาง",
    pitch: "เดินรอบบ้านเก็บของให้ครบก่อนแขกมาถึง ทางเดินชนกันตลอดเวลา",
  },
  {
    id: "rotfai",
    name: "รถไฟสายเหนือ",
    genre: "ต่อเส้นทาง",
    minPlayers: 2,
    maxPlayers: 5,
    minutes: 60,
    teach: 10,
    weight: "กลาง",
    pitch: "วางรางไปเชียงใหม่ก่อนคนอื่น ถ้ามาทางเดียวกันก็แบ่งรางกันไป",
  },
  {
    id: "khaosan",
    name: "ข้าวสาร",
    genre: "ต่อรอง แลกของ",
    minPlayers: 4,
    maxPlayers: 6,
    minutes: 75,
    teach: 15,
    weight: "หนัก",
    pitch: "ไม่มีลูกเต๋าเลย ทุกอย่างมาจากการคุยกันข้ามโต๊ะ กลุ่มที่สนิทกันเล่นสนุกที่สุด",
  },
  {
    id: "dindaeng",
    name: "ดินแดง",
    genre: "ยึดพื้นที่",
    minPlayers: 3,
    maxPlayers: 5,
    minutes: 90,
    teach: 20,
    weight: "หนัก",
    pitch: "แผนที่เดียว ทุกคนอยากได้ที่เดียวกัน ตาแรกที่วางผิดจะตามหลอกหลอนถึงตาสุดท้าย",
  },
  {
    id: "bannok",
    name: "บ้านนอก",
    genre: "สร้างเมือง",
    minPlayers: 2,
    maxPlayers: 4,
    minutes: 120,
    teach: 25,
    weight: "หนัก",
    pitch: "เริ่มจากที่ดินเปล่าสองแปลง จบเกมเป็นเมือง ตัวหนักที่สุดบนชั้นและคุ้มเวลาที่สุด",
  },
];

/** Groups the page is willing to answer for. Eight means eight or more. */
export const PARTY_SIZES = [2, 3, 4, 5, 6, 7, 8] as const;

export interface TimeBudget {
  id: string;
  label: string;
  /** minutes; Infinity means the group said they are not in a hurry */
  minutes: number;
}

export const TIME_BUDGETS: TimeBudget[] = [
  { id: "30", label: "ครึ่งชั่วโมง", minutes: 30 },
  { id: "60", label: "หนึ่งชั่วโมง", minutes: 60 },
  { id: "90", label: "ชั่วโมงครึ่ง", minutes: 90 },
  { id: "open", label: "ไม่รีบ", minutes: Number.POSITIVE_INFINITY },
];

export interface ExperienceLevel {
  id: string;
  label: string;
  /** the shelf this group should be pointed at */
  weights: Weight[];
  /** why those, said to the visitor rather than kept in the code */
  note: string;
}

/**
 * The third question, and the one a filter usually gets wrong. A group that
 * plays every week does not want the light shelf narrowed down for them, they
 * want the heavy one, so this moves the window rather than widening it.
 */
export const EXPERIENCE: ExperienceLevel[] = [
  {
    id: "new",
    label: "ยังไม่เคยเล่น",
    weights: ["เบา"],
    note: "เอาที่กติกาอธิบายจบในห้านาที",
  },
  {
    id: "some",
    label: "เคยเล่นมาบ้าง",
    weights: ["เบา", "กลาง"],
    note: "เล่นเกมที่มีอะไรให้คิดได้ แต่ยังไม่ต้องอ่านคู่มือ",
  },
  {
    id: "deep",
    label: "เล่นประจำ",
    weights: ["กลาง", "หนัก"],
    note: "ข้ามชั้นเกมปาร์ตี้ไปเลย ชั้นที่อยากได้อยู่ล่างสุด",
  },
];

/** What the cafe charges. Flat, because an hourly rate nobody can predict is
 *  the thing every group asks about before they sit down. */
export const RATES = [
  { id: "hour", label: "ชั่วโมงแรก", price: "89", note: "ต่อคน รวมน้ำเปล่า" },
  { id: "next", label: "ชั่วโมงถัดไป", price: "59", note: "ต่อคน คิดเป็นชั่วโมง" },
  { id: "day", label: "เหมาทั้งวัน", price: "199", note: "ต่อคน เข้ากี่โมงก็ได้ จนร้านปิด" },
] as const;

export const HOURS = [
  { day: "จันทร์ - พฤหัสบดี", open: "11:00 - 23:00" },
  { day: "ศุกร์ - เสาร์", open: "11:00 - 01:00" },
  { day: "อาทิตย์", open: "11:00 - 22:00" },
] as const;
