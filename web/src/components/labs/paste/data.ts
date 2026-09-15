/**
 * ฟ้า และ ต้น: an invented wedding, and the guest list behind the seat finder.
 *
 * The premise is the one job a paper invitation cannot do. Guests do not know
 * which table they are on, so they ask, and the couple answers the same
 * question forty times in the week before the wedding. A name box that returns
 * a table solves that, and it is the only reason this page needs to be a
 * website rather than a picture of a card.
 */

export interface Guest {
  /** what they are called on the day, which is what people type */
  name: string;
  /** everything else that should match a search: full name, nickname, partner */
  aliases: string[];
  table: string;
  /** whose side, because that is the other thing guests want to know */
  side: "เจ้าสาว" | "เจ้าบ่าว";
  /** the line the couple wrote for this person */
  note: string;
  seats: number;
}

export const GUESTS: Guest[] = [
  {
    name: "พี่แนน",
    aliases: ["นันทิชา", "แนน", "พี่แนน", "นันทิชา สุวรรณ"],
    table: "โต๊ะ 3",
    side: "เจ้าสาว",
    note: "รุ่นพี่ที่ทำให้ฟ้ากล้าลาออกมาทำร้านเมื่อสี่ปีก่อน",
    seats: 2,
  },
  {
    name: "ครอบครัวสมชาย",
    aliases: ["สมชาย", "ครอบครัวสมชาย", "ลุงสมชาย", "สมชาย ใจดี"],
    table: "โต๊ะ 1",
    side: "เจ้าบ่าว",
    note: "โต๊ะติดเวที ใกล้ทางเข้าที่สุด ลุงเดินไม่ไกล",
    seats: 4,
  },
  {
    name: "ก้อง",
    aliases: ["ก้อง", "กิตติพงษ์", "ก้อง กิตติพงษ์"],
    table: "โต๊ะ 7",
    side: "เจ้าบ่าว",
    note: "เพื่อนร่วมห้องปีหนึ่ง คนที่ต้นยืมเงินค่าหอไปสองเดือน",
    seats: 1,
  },
  {
    name: "พลอย กับ เอิร์ธ",
    aliases: ["พลอย", "เอิร์ธ", "พลอย กับ เอิร์ธ", "ณัฐพล"],
    table: "โต๊ะ 5",
    side: "เจ้าสาว",
    note: "คู่ที่แนะนำให้ฟ้ากับต้นรู้จักกัน เลยต้องนั่งใกล้เวที",
    seats: 2,
  },
  {
    name: "ทีมร้าน",
    aliases: ["ทีมร้าน", "ร้าน", "น้องๆ ร้าน", "ทีม"],
    table: "โต๊ะ 8",
    side: "เจ้าสาว",
    note: "ปิดร้านหนึ่งวันเพื่อมางานนี้ ขอบคุณจริงๆ",
    seats: 6,
  },
  {
    name: "อาจารย์วิชัย",
    aliases: ["วิชัย", "อาจารย์วิชัย", "อ.วิชัย"],
    table: "โต๊ะ 2",
    side: "เจ้าบ่าว",
    note: "อาจารย์ที่ปรึกษาที่ต้นโทรหาทุกครั้งที่ตัดสินใจอะไรไม่ได้",
    seats: 2,
  },
];

export interface Moment {
  time: string;
  title: string;
  detail: string;
}

/** The day, as the couple would write it on the back of an envelope. */
export const SCHEDULE: Moment[] = [
  { time: "09:09", title: "พิธีสงฆ์", detail: "เฉพาะญาติผู้ใหญ่ ที่บ้านฟ้า ซอยอารีย์ 4" },
  { time: "11:30", title: "รดน้ำสังข์", detail: "แขกทุกคน ห้องแกรนด์ ชั้น 3" },
  { time: "12:00", title: "กินข้าวเที่ยง", detail: "โต๊ะจีน 8 โต๊ะ เปิดให้นั่งได้เลยไม่ต้องรอ" },
  { time: "18:00", title: "งานเลี้ยงเย็น", detail: "สวนชั้นล่าง แต่งตัวสบายๆ ไม่ต้องใส่สูท" },
];

export interface Snapshot {
  src: string;
  /** the caption, in the couple's hand */
  caption: string;
  /** degrees. Nothing here is straight */
  tilt: number;
  tape: 0 | 1 | 2;
}

export const SNAPSHOTS: Snapshot[] = [
  { src: "/lab-demos/paste/laugh.webp", caption: "วันที่ต้นขอ ฟ้าหัวเราะก่อนตอบ", tilt: -3.5, tape: 0 },
  { src: "/lab-demos/paste/pinky.webp", caption: "สัญญาว่าจะไม่ทะเลาะกันเรื่องแอร์", tilt: 2.5, tape: 1 },
  { src: "/lab-demos/paste/hands.webp", caption: "แหวนคู่ ทำเองที่เวิร์กชอป", tilt: -1.8, tape: 2 },
  { src: "/lab-demos/paste/sofa.webp", caption: "คืนก่อนวันงาน ยังเถียงกันเรื่องเพลง", tilt: 3, tape: 0 },
];

/** Things the couple would rather say once here than forty times on LINE. */
export const NOTES = [
  "ไม่ต้องเตรียมของขวัญ มากินข้าวด้วยกันก็พอแล้ว",
  "ที่จอดรถในตัวอาคาร บอกชื่องานที่ป้อมยาม",
  "พาเด็กมาได้ มีโซนให้วิ่งข้างสวน",
  "ถ่ายรูปได้ทุกช่วง ยกเว้นตอนพิธีสงฆ์",
];

export const COUPLE = {
  bride: "ฟ้า",
  groom: "ต้น",
  date: "เสาร์ที่ 14 กุมภาพันธ์ 2570",
  place: "บ้านสวนอารีย์ กรุงเทพ",
} as const;
