/**
 * ตู้เสื้อผ้า.exe: an invented second-hand clothing shop, the kind that lives
 * on Instagram and opens a stall at a weekend market twice a month.
 *
 * The premise is the message these shops answer all day. Every piece is the
 * only one of itself, the size on the label was printed in another country
 * twenty years ago and means nothing, and so every buyer asks the same thing:
 * "อกกี่นิ้วคะ" - and then has to guess whether that number will fit them.
 * The shop measures each piece flat and posts the numbers, and the buyer still
 * guesses, because a chest measurement is not an answer until you know your own.
 *
 * So this page asks for the buyer's measurement instead, and answers with the
 * rail itself: what fits, how it will sit, and for everything that does not
 * fit, by how many inches and in which direction.
 *
 * Nothing here is photographed. A second-hand shop shoots its own stock, and no
 * two stock photographs of a garment ever belong to the same shop, so the rail
 * is drawn from the measurements themselves: a 21 inch chest really is wider on
 * screen than a 19 inch one. The picture and the numbers are one thing.
 */

/** How a piece is cut, which decides the outline the rail draws for it. */
export type Shape = "tee" | "shirt" | "jacket" | "knit" | "tank" | "pants";

/** How the shop grades wear, in the words a Thai shop actually uses. */
export type Grade = "ใหม่มาก" | "สวย" | "ใช้งานได้";

export interface Piece {
  id: string;
  name: string;
  /** the decade it is from, which is what people shop by here */
  era: string;
  shape: Shape;
  /**
   * Measured flat, in inches, the way the shop measures and posts them.
   * `chest` is pit to pit doubled, which is the number that decides fit.
   */
  chest: number;
  length: number;
  shoulder: number;
  /** sleeve from the shoulder seam; 0 on a vest */
  sleeve: number;
  grade: Grade;
  /** the fault, said plainly. Everything here is second hand and has one. */
  flaw: string;
  baht: number;
  /** two colours, front and trim, that the rail draws it in */
  palette: [string, string];
}

/**
 * Twelve pieces, invented, with the stock of a real rail rather than a tidy
 * demo one: the chests run 17 to 26 inches and cluster where real stock does,
 * around 20 to 22. That matters, because a fit finder is only worth showing if
 * the rail under it can actually come up empty, and this one does for anybody
 * measuring over 44 inches who wants something fitted.
 */
export const PIECES: Piece[] = [
  {
    id: "moto",
    name: "แจ็คเก็ตหนังคอบาง",
    era: "ปลาย 90s",
    shape: "jacket",
    chest: 22,
    length: 24,
    shoulder: 18,
    sleeve: 24,
    grade: "สวย",
    flaw: "ซับในขาดตรงรักแร้ซ้าย 3 ซม. ไม่เห็นตอนใส่",
    baht: 1890,
    palette: ["#2b2b30", "#c9ccd4"],
  },
  {
    id: "babytee",
    name: "เบบี้ที ลายสกรีนหน้าวง",
    era: "2001",
    shape: "tee",
    chest: 17,
    length: 18,
    shoulder: 13,
    sleeve: 5,
    grade: "ใช้งานได้",
    flaw: "สกรีนแตกตามรอยพับ เป็นแบบที่คนตามหา",
    baht: 690,
    palette: ["#ff4fa3", "#ffe14d"],
  },
  {
    id: "bowling",
    name: "เชิ้ตโบว์ลิ่งปักหลัง",
    era: "ต้น 2000s",
    shape: "shirt",
    chest: 23,
    length: 28,
    shoulder: 19,
    sleeve: 9,
    grade: "ใหม่มาก",
    flaw: "กระดุมเม็ดล่างสุดไม่ใช่เม็ดเดิม สีต่างนิดเดียว",
    baht: 1290,
    palette: ["#1d5c52", "#f2ead7"],
  },
  {
    id: "tracktop",
    name: "เสื้อวอร์มแถบข้าง",
    era: "1999",
    shape: "jacket",
    chest: 24,
    length: 27,
    shoulder: 20,
    sleeve: 25,
    grade: "สวย",
    flaw: "ซิปฝืดช่วงต้น ใช้ได้ปกติ",
    baht: 1150,
    palette: ["#2f4bd8", "#f5f6f8"],
  },
  {
    id: "mesh",
    name: "เสื้อเมช แขนยาว",
    era: "2003",
    shape: "tee",
    chest: 19,
    length: 22,
    shoulder: 15,
    sleeve: 23,
    grade: "สวย",
    flaw: "เนื้อผ้ายืดกว่าตอนใหม่ รอบอกจริงเลยเผื่อได้อีกนิ้ว",
    baht: 780,
    palette: ["#7b3fe4", "#d9c8ff"],
  },
  {
    id: "denim",
    name: "แจ็คเก็ตยีนส์ฟอก",
    era: "กลาง 90s",
    shape: "jacket",
    chest: 25,
    length: 25,
    shoulder: 21,
    sleeve: 24,
    grade: "ใช้งานได้",
    flaw: "ขอบแขนขวาถลอก ชายเสื้อสีซีดกว่าตัว",
    baht: 1490,
    palette: ["#4a6f9c", "#e8d9a8"],
  },
  {
    id: "cardigan",
    name: "คาร์ดิแกนไหมพรมลายเพชร",
    era: "ปลาย 90s",
    shape: "knit",
    chest: 21,
    length: 24,
    shoulder: 17,
    sleeve: 23,
    grade: "สวย",
    flaw: "ขุยที่ใต้แขนทั้งสองข้าง หวีออกได้",
    baht: 950,
    palette: ["#8c3d2e", "#e3cf9f"],
  },
  {
    id: "polo",
    name: "โปโลปักอกซ้าย",
    era: "2002",
    shape: "shirt",
    chest: 20,
    length: 26,
    shoulder: 17,
    sleeve: 8,
    grade: "ใหม่มาก",
    flaw: "คอปกเป็นคลื่นเบาๆ รีดแล้วเข้าที่",
    baht: 620,
    palette: ["#c8102e", "#ffffff"],
  },
  {
    id: "tank",
    name: "แท็งก์ท็อปซี่โครง",
    era: "2004",
    shape: "tank",
    chest: 18,
    length: 21,
    shoulder: 11,
    sleeve: 0,
    grade: "ใช้งานได้",
    flaw: "สายบ่าข้างซ้ายยืดกว่าข้างขวาเล็กน้อย",
    baht: 420,
    palette: ["#39d3f2", "#0b2a35"],
  },
  {
    id: "hoodie",
    name: "ฮู้ดดี้ตัวหนาทับโลโก้",
    era: "2000",
    shape: "knit",
    chest: 26,
    length: 28,
    shoulder: 22,
    sleeve: 24,
    grade: "สวย",
    flaw: "เชือกฮู้ดไม่ใช่เส้นเดิม หูเชือกด้านขวาหลวม",
    baht: 1350,
    palette: ["#4b5a2f", "#d8dcc4"],
  },
  {
    id: "cargo",
    name: "กางเกงคาร์โก้กระเป๋าข้าง",
    era: "2003",
    shape: "pants",
    chest: 17,
    length: 40,
    shoulder: 0,
    sleeve: 0,
    grade: "ใช้งานได้",
    flaw: "เป้าซ่อมมาแล้วหนึ่งรอบ ด้ายคนละเฉด",
    baht: 890,
    palette: ["#6b6244", "#2a2a24"],
  },
  {
    id: "bandtee",
    name: "ทัวร์ที สกรีนสองหน้า",
    era: "1998",
    shape: "tee",
    chest: 21,
    length: 27,
    shoulder: 18,
    sleeve: 8,
    grade: "ใช้งานได้",
    flaw: "คอยืด รูเข็มเล็กที่ชายหลัง",
    baht: 1690,
    palette: ["#16161a", "#ff7a1a"],
  },
];
