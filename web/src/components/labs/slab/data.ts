/**
 * ตัดจบ: an invented school that teaches video editing, and the three courses
 * it sells. Each course owns an accent, and picking one repaints the page.
 *
 * Prices are the real Thai range for an online course of this length in 2026.
 * A number nobody believes makes the layout around it look invented too.
 */

export interface Course {
  /** matches an `Accent.id` in theme.ts */
  id: string;
  name: string;
  tagline: string;
  price: number;
  /** what it costs after the launch window, for the strike-through */
  fullPrice: number;
  hours: number;
  lessons: number;
  /** the one line that says who should not buy it */
  notFor: string;
  outcomes: string[];
}

export const COURSES: Course[] = [
  {
    id: "cut",
    name: "ตัดจบ",
    tagline: "ตัดคลิปให้จบใน 1 วัน ไม่ใช่ 1 เดือน",
    price: 2490,
    fullPrice: 3900,
    hours: 9,
    lessons: 34,
    notFor: "ไม่เหมาะกับคนที่ตัดคลิปคล่องอยู่แล้ว บทแรกเริ่มจากศูนย์",
    outcomes: [
      "ตัดคลิปยาว 10 นาทีให้เหลือ 3 นาทีที่คนดูจนจบ",
      "วางจังหวะให้คนไม่กดข้าม ใช้หูตัดไม่ใช่ใช้ตา",
      "เซ็ต preset ของตัวเองแล้วทำงานเร็วขึ้นสองเท่า",
      "ส่งงานลูกค้าโดยไม่ต้องแก้ห้ารอบ",
    ],
  },
  {
    id: "color",
    name: "สีจบ",
    tagline: "สีที่ทำให้คลิปมือถือดูเหมือนถ่ายด้วยกล้อง",
    price: 2990,
    fullPrice: 4500,
    hours: 11,
    lessons: 28,
    notFor: "ต้องตัดคลิปเป็นมาก่อน คอร์สนี้ไม่สอนตัด",
    outcomes: [
      "แก้สีผิวคนไทยให้ถูกตั้งแต่ช็อตแรก",
      "ทำ LUT ของตัวเอง ไม่ใช่โหลดของคนอื่นมาทับ",
      "คุมสีให้ทั้งคลิปเป็นเรื่องเดียวกัน",
      "อ่าน scope เป็น เลิกเดาด้วยตา",
    ],
  },
  {
    id: "sound",
    name: "เสียงจบ",
    tagline: "เสียงคือครึ่งหนึ่งของงาน และเป็นครึ่งที่คนลืม",
    price: 1990,
    fullPrice: 2900,
    hours: 7,
    lessons: 22,
    notFor: "ไม่ได้สอนทำเพลง สอนจัดการเสียงในคลิป",
    outcomes: [
      "เก็บเสียงพูดให้สะอาดด้วยของที่มีอยู่แล้ว",
      "ลบเสียงแอร์กับเสียงรถโดยไม่ทำให้เสียงคนเพี้ยน",
      "มิกซ์เพลงกับเสียงพูดให้ฟังรู้เรื่องบนลำโพงมือถือ",
      "ตั้งความดังให้ผ่านมาตรฐานของแต่ละแพลตฟอร์ม",
    ],
  },
];

export interface Module {
  no: string;
  title: string;
  minutes: number;
  detail: string;
}

/** The curriculum, shared shape across courses. Shown as an accordion. */
export const MODULES: Record<string, Module[]> = {
  cut: [
    { no: "01", title: "ตั้งโปรเจกต์ให้ถูกตั้งแต่แรก", minutes: 42, detail: "เฟรมเรต ความละเอียด และโฟลเดอร์ที่ทำให้ไม่ต้องรื้องานตอนจบ" },
    { no: "02", title: "ตัดหยาบให้เหลือแต่เนื้อ", minutes: 58, detail: "ดูคลิปดิบรอบเดียวแล้วรู้ว่าจะตัดตรงไหน ไม่ใช่ดูสิบรอบ" },
    { no: "03", title: "จังหวะกับการหายใจ", minutes: 71, detail: "ทำไมคลิปที่ตัดถี่เกินคนดูเหนื่อย และเว้นตรงไหนถึงได้ผล" },
    { no: "04", title: "เสียงนำภาพ", minutes: 49, detail: "ตัดตามเสียงพูด แล้วภาพจะเข้าที่เอง" },
    { no: "05", title: "ส่งงานกับการแก้", minutes: 36, detail: "ตั้งรอบแก้ตั้งแต่ก่อนเริ่ม และวิธีอ่านโจทย์ลูกค้าให้ตรง" },
  ],
  color: [
    { no: "01", title: "สีคืออะไรในทางเทคนิค", minutes: 38, detail: "log กับ rec709 ต่างกันยังไง และทำไมมือถือถ่ายมาแล้วสีแบน" },
    { no: "02", title: "อ่าน scope ให้เป็น", minutes: 62, detail: "waveform กับ vectorscope บอกอะไร และเชื่อมันมากกว่าเชื่อจอ" },
    { no: "03", title: "ผิวคนไทย", minutes: 74, detail: "เส้น skin tone บน vectorscope และวิธีดึงกลับโดยไม่ทำให้ฉากเพี้ยน" },
    { no: "04", title: "ทำ LUT ของตัวเอง", minutes: 55, detail: "สร้างจากงานจริงของเรา ไม่ใช่ซื้อมาทับแล้วหวังว่าจะเข้า" },
    { no: "05", title: "คุมทั้งเรื่องให้เป็นชุดเดียว", minutes: 47, detail: "shot matching เมื่อถ่ายคนละวันคนละแสง" },
  ],
  sound: [
    { no: "01", title: "เก็บเสียงด้วยของที่มี", minutes: 33, detail: "ไมค์มือถือกับห้องธรรมดา ทำให้ดีขึ้นได้แค่ไหนก่อนต้องซื้อของ" },
    { no: "02", title: "ลบเสียงรบกวน", minutes: 51, detail: "จุดที่ noise reduction เริ่มทำให้เสียงคนเหมือนหุ่นยนต์ และวิธีหยุดก่อนถึงจุดนั้น" },
    { no: "03", title: "EQ กับเสียงพูด", minutes: 46, detail: "ตัดอะไรทิ้งบ้าง และทำไมการเพิ่มมักแย่กว่าการตัด" },
    { no: "04", title: "มิกซ์เพลงใต้เสียงพูด", minutes: 44, detail: "ducking ที่ไม่ได้ยินว่า duck และระดับที่ใช้จริง" },
    { no: "05", title: "ความดังตอนส่ง", minutes: 28, detail: "LUFS ของแต่ละแพลตฟอร์ม และทำไมคลิปเราเบากว่าคนอื่น" },
  ],
};

export interface Faq {
  q: string;
  a: string;
}

export const FAQ: Faq[] = [
  {
    q: "ต้องมีโปรแกรมอะไร",
    a: "ใช้ DaVinci Resolve ตัวฟรีทั้งคอร์ส ไม่ต้องจ่ายค่าโปรแกรม ถ้าใช้ Premiere อยู่แล้วตามได้ หลักการเหมือนกัน ปุ่มคนละที่",
  },
  {
    q: "คอมไม่แรงเรียนได้ไหม",
    a: "ได้ บทที่ 1 สอนตั้ง proxy ให้ตัดลื่นบนเครื่องเก่า เครื่องที่ใช้ถ่ายทำคอร์สนี้เป็นโน้ตบุ๊ก 8 GB",
  },
  {
    q: "เรียนจบแล้วรับงานได้เลยไหม",
    a: "ตอบตรงๆ ว่าไม่ คอร์สทำให้ตัดเป็นและเร็วขึ้น แต่การรับงานต้องมีผลงานกับลูกค้าคนแรก ซึ่งเป็นคนละเรื่องกับทักษะ",
  },
  {
    q: "ดูย้อนหลังได้นานแค่ไหน",
    a: "ไม่มีหมดอายุ ซื้อครั้งเดียวดูได้ตลอด รวมถึงบทที่อัปเดตทีหลัง",
  },
  {
    q: "ไม่พอใจขอเงินคืนได้ไหม",
    a: "ได้ภายใน 14 วัน ไม่ต้องให้เหตุผล กดปุ่มเดียวจบ",
  },
];

/** The numbers on the hero. Each one is checkable inside the page. */
export const PROOF = [
  { figure: "84", label: "บทเรียน", detail: "รวมทั้งสามคอร์ส" },
  { figure: "27", label: "ชั่วโมง", detail: "ดูจบได้ในสองสัปดาห์" },
  { figure: "14", label: "วันคืนเงิน", detail: "ไม่ต้องให้เหตุผล" },
];
