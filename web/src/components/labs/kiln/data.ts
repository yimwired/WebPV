/**
 * ดินเผา: an invented studio that sells one-off ceramics.
 *
 * The premise is the honest version of what a handmade shop actually sells.
 * Every piece is different, so every piece has something a factory would
 * reject, and the page points at those marks instead of cropping them out.
 * The flaw coordinates are percentages of the photograph, checked against the
 * real images rather than guessed, because a marker floating in empty space is
 * worse than no marker at all.
 */

export interface Flaw {
  /** percentage across and down the photograph */
  x: number;
  y: number;
  name: string;
  /** what caused it, said plainly */
  why: string;
}

export interface Piece {
  id: string;
  name: string;
  /** the studio numbers every piece it fires */
  no: string;
  price: number;
  clay: string;
  glaze: string;
  size: string;
  photo: string;
  /** what it is for, in one line */
  use: string;
  flaws: Flaw[];
}

export const PIECES: Piece[] = [
  {
    id: "bowl",
    name: "ชามดอกไม้",
    no: "24-118",
    price: 780,
    clay: "ดินขาวลำปาง",
    glaze: "เคลือบใส เขียนลายใต้เคลือบ",
    size: "กว้าง 11 ซม. สูง 5 ซม.",
    photo: "/lab-demos/kiln/piece-bowl.webp",
    use: "ใส่น้ำจิ้ม ของหวานชิ้นเล็ก หรือวางแหวนข้างอ่างล้างมือ",
    flaws: [
      {
        x: 62,
        y: 40,
        name: "ลายดอกไม่เท่ากันทั้งวง",
        why: "เขียนด้วยมือทีละดอกก่อนเคลือบ ช่วงที่มือล้าดอกจะห่างขึ้น เห็นชัดที่ขอบด้านนี้",
      },
      {
        x: 45,
        y: 66,
        name: "ก้นชามไม่เรียบสนิท",
        why: "ตัดออกจากแป้นด้วยเอ็น แล้วขัดด้วยมือ ไม่ได้เจียรด้วยเครื่อง วางบนกระจกจะโยกนิดหนึ่ง",
      },
    ],
  },
  {
    id: "cup",
    name: "ถ้วยเคลือบขี้เถ้า",
    no: "24-076",
    price: 620,
    clay: "ดินสโตนแวร์",
    glaze: "เคลือบขี้เถ้าฟางข้าว เผา 1250 องศา",
    size: "สูง 9.5 ซม. จุ 220 มล.",
    photo: "/lab-demos/kiln/piece-cup.webp",
    use: "กาแฟดำ ชาร้อน หรือวางแปรงสีฟัน",
    flaws: [
      {
        x: 16,
        y: 32,
        name: "ขอบปากบิ่นเล็กน้อย",
        why: "ชนกันในเตาตอนเผาดิบ ลบคมออกแล้วด้วยกระดาษทราย ดื่มไม่บาดปาก",
      },
      {
        x: 36,
        y: 62,
        name: "เคลือบไหลลงมาไม่เท่ากัน",
        why: "ขี้เถ้าฟางละลายไม่เท่ากันทั่วใบ ด้านที่อยู่ใกล้ไฟจะไหลมากกว่า ใบนี้หันด้านนี้เข้าหาไฟ",
      },
    ],
  },
  {
    id: "jar",
    name: "โถสามขา",
    no: "24-203",
    price: 1450,
    clay: "ดินสโตนแวร์ผสมทราย",
    glaze: "ไม่เคลือบด้านนอก เคลือบใสด้านใน",
    size: "สูง 13 ซม. พร้อมฝา",
    photo: "/lab-demos/kiln/piece-jar.webp",
    use: "เก็บเกลือ ชาใบ หรือของเล็กบนโต๊ะทำงาน",
    flaws: [
      {
        // on the lid itself, not the body below it. 47 put the marker on the
        // wall of the jar, which is not what this note is about.
        x: 72,
        y: 35,
        name: "ฝาปิดสนิทแค่ทางเดียว",
        why: "ฝากับตัวโถหดไม่เท่ากันตอนเผา เลยเข้าได้ล็อกเดียว มีรอยขีดเล็กๆ ไว้ให้ดูว่าหันทางไหน",
      },
      {
        x: 70,
        y: 76,
        name: "ขาสามขาไม่ยาวเท่ากัน",
        why: "ปั้นขาทีละขาแล้วติดด้วยมือ ต่างกันไม่เกินหนึ่งมิลลิเมตร วางนิ่งแต่ไม่ได้ฉาก",
      },
    ],
  },
  {
    id: "plate",
    name: "จานหินดำ",
    no: "24-044",
    price: 890,
    clay: "ดินดำผสมแมงกานีส",
    glaze: "เคลือบด้าน เผารีดักชัน",
    size: "กว้าง 18 ซม.",
    photo: "/lab-demos/kiln/piece-plate.webp",
    use: "จานรองแก้ว จานขนม หรือวางของเล็กที่อยากให้มีที่อยู่",
    flaws: [
      {
        x: 52,
        y: 45,
        name: "ขอบจานเป็นคลื่น",
        why: "ตีขึ้นรูปด้วยมือบนแป้นนิ่ง ไม่ได้กดพิมพ์ ขอบเลยขึ้นลงตามแรงมือ",
      },
      {
        x: 60,
        y: 72,
        name: "ผิวด่างเป็นจุด",
        why: "เผาแบบลดออกซิเจน เหล็กในดินขึ้นมาเป็นจุดดำ ตำแหน่งจุดคุมไม่ได้ ทุกใบจึงไม่เหมือนกัน",
      },
    ],
  },
];

/** The three steps the studio actually charges for. */
export const PROCESS = [
  {
    no: "หนึ่ง",
    title: "ปั้น",
    body: "ขึ้นรูปบนแป้นหมุนทีละใบ ไม่มีแม่พิมพ์ ใบหนึ่งใช้เวลาราวยี่สิบนาที แล้วทิ้งให้แห้งช้าๆ สามวัน",
  },
  {
    no: "สอง",
    title: "เผาดิบ",
    body: "เผารอบแรกที่ 900 องศา สิบสองชั่วโมง ใบที่ร้าวตรงนี้จะไม่ไปต่อ ปกติหายไปประมาณหนึ่งในหกของเตา",
  },
  {
    no: "สาม",
    title: "เคลือบแล้วเผาจริง",
    body: "จุ่มเคลือบด้วยมือ แล้วเผาที่ 1250 องศา สิบหกชั่วโมง ตำแหน่งในเตาเป็นตัวตัดสินว่าสีจะออกมาแบบไหน",
  },
];

/** What the studio will not pretend. */
export const TERMS = [
  "ทุกใบเป็นชิ้นเดียว รูปที่เห็นคือใบที่จะได้ ไม่ใช่รูปตัวอย่าง",
  "ตำหนิที่ชี้ไว้ในหน้านี้คือของใบนั้นจริง ไม่ได้เขียนรวมๆ ไว้",
  "เข้าไมโครเวฟได้ทุกใบ ยกเว้นจานหินดำที่มีเหล็กในเนื้อดิน",
  "ล้างเครื่องได้ แต่ล้างมือแล้วอยู่ได้นานกว่า",
];
