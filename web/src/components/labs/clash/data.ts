// The festival: two days, three stages, twenty-four sets and the walk between
// every pair of stages. A fictional event - the acts, the site and the times
// are invented for this study.
//
// Times are minutes since midnight so that overlaps are arithmetic rather than
// date handling: a static export has no server clock, and nothing here depends
// on what day it actually is.

export type StageId = "main" | "forest" | "garage";
export type DayId = "sat" | "sun";

export interface Stage {
  id: StageId;
  name: string;
  /** what the stage is known for, printed on the map */
  note: string;
  colour: string;
}

export interface Day {
  id: DayId;
  name: string;
  date: string;
}

export interface Act {
  id: string;
  name: string;
  stage: StageId;
  day: DayId;
  /** minutes since midnight */
  start: number;
  end: number;
  tag: string;
}

export const STAGES: Stage[] = [
  { id: "main", name: "เวทีใหญ่", note: "กลางทุ่ง ระบบเสียงหลัก", colour: "#f5e04b" },
  { id: "forest", name: "เวทีป่า", note: "ดงไผ่หลังบ่อน้ำ", colour: "#25d07a" },
  { id: "garage", name: "เวทีโรงรถ", note: "โกดังเก่า ยืนดูได้ 400 คน", colour: "#ff2e88" },
];

export const DAYS: Day[] = [
  { id: "sat", name: "เสาร์", date: "14 ก.พ." },
  { id: "sun", name: "อาทิตย์", date: "15 ก.พ." },
];

/**
 * Minutes on foot between two stages, measured for the site rather than
 * guessed: the forest stage is across a pond from everything else, which is
 * the whole reason a timetable that ignores walking is useless here.
 */
const WALK: Record<string, number> = {
  "main|forest": 7,
  "main|garage": 4,
  "forest|garage": 9,
};

export function walkBetween(from: StageId, to: StageId): number {
  if (from === to) return 0;
  return WALK[`${from}|${to}`] ?? WALK[`${to}|${from}`] ?? 0;
}

/** "19:30" as minutes since midnight. */
const at = (clock: string): number => {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
};

export const clock = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** "1 ชม. 25 นาที", and just the minutes below an hour. */
export const duration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} นาที`;
  if (!rest) return `${hours} ชม.`;
  return `${hours} ชม. ${rest} นาที`;
};

const act = (
  id: string,
  name: string,
  stage: StageId,
  day: DayId,
  from: string,
  to: string,
  tag: string,
): Act => ({ id, name, stage, day, start: at(from), end: at(to), tag });

export const ACTS: Act[] = [
  // ── Saturday ──────────────────────────────────────────────────────────
  act("a1", "ไฟแดงสี่แยก", "main", "sat", "17:00", "17:45", "อินดี้ร็อก"),
  act("a2", "ซุปเปอร์ป้า", "main", "sat", "18:15", "19:00", "ซินธ์ป๊อป"),
  act("a3", "ควายเหล็ก", "main", "sat", "19:30", "20:30", "เฮฟวีร็อก"),
  act("a4", "ต้มยำไทเทเนียม", "main", "sat", "21:00", "22:15", "เฮดไลเนอร์"),

  act("b1", "ยามเฝ้าดาว", "forest", "sat", "17:20", "18:05", "โฟล์ก"),
  act("b2", "นกกระจอกไฟฟ้า", "forest", "sat", "18:30", "19:15", "ดรีมป๊อป"),
  act("b3", "พัดลมสามใบพัด", "forest", "sat", "19:45", "20:40", "ไซเคเดลิก"),
  act("b4", "หมาเห่าเครื่องบิน", "forest", "sat", "21:10", "22:00", "โพสต์พังก์"),

  act("c1", "เด็กปั๊มดิสโก้", "garage", "sat", "17:40", "18:20", "ดิสโก้"),
  act("c2", "วงกลมสีส้ม", "garage", "sat", "18:50", "19:35", "แจ๊สฟิวชัน"),
  act("c3", "กระเบื้องแตก", "garage", "sat", "20:00", "20:50", "ฮาร์ดคอร์"),
  act("c4", "ลูกชิ้นเรืองแสง", "garage", "sat", "21:20", "22:10", "อิเล็กทรอนิก"),

  // ── Sunday ────────────────────────────────────────────────────────────
  act("d1", "แตงโมอวกาศ", "main", "sun", "16:30", "17:15", "เซิร์ฟร็อก"),
  act("d2", "สองพี่น้องตระกูลหมอน", "main", "sun", "17:45", "18:40", "ลูกทุ่งอินดี้"),
  act("d3", "ไมค์หลุด", "main", "sun", "19:10", "20:10", "ฮิปฮอป"),
  act("d4", "เรือหางยาว", "main", "sun", "20:40", "22:00", "เฮดไลเนอร์"),

  act("e1", "ป้าแดงกับเครื่องซักผ้า", "forest", "sun", "16:50", "17:35", "โนอิส"),
  act("e2", "ดาวเทียมบ้านนอก", "forest", "sun", "18:00", "18:50", "ชูเกซ"),
  act("e3", "ขนมจีนซาวด์ซิสเต็ม", "forest", "sun", "19:20", "20:05", "ดับ"),
  act("e4", "หิ่งห้อยดีเซล", "forest", "sun", "20:30", "21:20", "โพสต์ร็อก"),

  act("f1", "มอเตอร์ไซค์รับจ้างวงออเคสตรา", "garage", "sun", "17:10", "17:55", "บรรเลง"),
  act("f2", "เสาไฟฟ้า", "garage", "sun", "18:20", "19:05", "การาจพังก์"),
  act("f3", "น้ำแข็งใส", "garage", "sun", "19:35", "20:25", "ซิตีป๊อป"),
  act("f4", "ตู้เย็นเปล่า", "garage", "sun", "21:00", "21:45", "แอมเบียนต์"),
];

export const stageOf = (id: StageId): Stage =>
  STAGES.find((stage) => stage.id === id) ?? STAGES[0];
