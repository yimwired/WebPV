/**
 * Everything Taodang sells, in one file.
 *
 * Taodang is invented. The photographs are Unsplash stand-ins and the branches,
 * phone numbers and prices are made up, which the footer says out loud so a
 * visitor never mistakes the demo for a shop that will take their booking.
 * Prices are the real Bangkok range for charcoal buffet in 2026, because a
 * price nobody would believe makes the rest of the page look invented too.
 */

export interface BuffetSet {
  id: string;
  /** Thai name, the one that carries the card */
  name: string;
  /** Latin shout, set in the display face */
  latin: string;
  price: number;
  photo: string;
  /** one line on the card */
  blurb: string;
  /** the full list, shown in the dialog */
  includes: string[];
  /** corner sticker, when the set has earned one */
  tag?: string;
}

export const SETS: BuffetSet[] = [
  {
    id: "classic",
    name: "คลาสสิก",
    latin: "CLASSIC",
    price: 299,
    photo: "/lab-demos/ember/set-classic.webp",
    blurb: "หมูสามชั้นสไลซ์ หมูหมักนมสด ไส้กรอก ผักสด ชุดที่คนสั่งมากที่สุด",
    includes: [
      "หมูสามชั้นสไลซ์ หั่นวันต่อวัน",
      "หมูหมักนมสด และหมูหมักพริกไทยดำ",
      "ไส้กรอกอีสาน ไส้กรอกชีส",
      "ตับหมู เอ็นข้อไก่",
      "ผักสด เห็ด วุ้นเส้น ไข่ไก่",
      "น้ำจิ้ม 3 สูตร เติมได้ไม่อั้น",
    ],
  },
  {
    id: "sea",
    name: "ทะเลเดือด",
    latin: "SEA",
    price: 399,
    photo: "/lab-demos/ember/set-sea.webp",
    blurb: "ได้ทุกอย่างในชุดคลาสสิก บวกกุ้ง หมึก หอย ที่ลงเรือเช้าวันเดียวกัน",
    tag: "ขายดี",
    includes: [
      "ทุกอย่างในชุดคลาสสิก",
      "กุ้งขาวตัวใหญ่ ไม่อั้น",
      "หมึกกล้วยสด หั่นพร้อมย่าง",
      "หอยแมลงภู่นิวซีแลนด์ฝาเดียว",
      "ปลาหมึกไข่ ย่างทั้งตัว",
      "น้ำจิ้มซีฟู้ดตำสด ไม่ใช่ขวด",
    ],
  },
  {
    id: "premium",
    name: "เนื้อลายหินอ่อน",
    latin: "PREMIUM",
    price: 499,
    photo: "/lab-demos/ember/set-premium.webp",
    blurb: "เนื้อโคขุนเกรด 4 ขึ้นไป สไลซ์บาง วางบนถ่านสิบวินาทีก็พอ",
    includes: [
      "ทุกอย่างในชุดทะเลเดือด",
      "เนื้อโคขุนสันคอ เกรด 4 ขึ้นไป",
      "เนื้อริบอายสไลซ์ ลายไขมันทั่วชิ้น",
      "หมูคูโรบูตะสามชั้น",
      "เนื้อเสียบไม้ย่างเกลือ",
      "ซอสวาซาบิโชยุ และเกลือทรัฟเฟิล",
    ],
  },
];

/** What every set includes no matter which one you pick. */
export const SET_TERMS = [
  { label: "เวลา", value: "2 ชั่วโมงต่อโต๊ะ" },
  { label: "เด็ก", value: "สูงไม่เกิน 120 ซม. ลดครึ่งราคา" },
  { label: "เหลือทิ้ง", value: "คิดเพิ่มขีดละ 20 บาท" },
];

export interface Branch {
  id: string;
  name: string;
  area: string;
  address: string;
  /** invented, and dialled as tel: so the button is honest about what it does */
  phone: string;
  hours: string;
  tables: number;
  /** the one thing that makes this branch different from the other five */
  note: string;
}

export const BRANCHES: Branch[] = [
  {
    id: "ladprao",
    name: "ลาดพร้าว 71",
    area: "ลาดพร้าว",
    address: "1199 ซอยลาดพร้าว 71 แขวงคลองเจ้าคุณสิงห์ เขตวังทองหลาง กรุงเทพฯ 10310",
    phone: "021234571",
    hours: "16:00 - 02:00 ทุกวัน",
    tables: 42,
    note: "สาขาแรก เปิดปี 2562 ที่จอดรถหลังร้าน 30 คัน",
  },
  {
    id: "ari",
    name: "อารีย์",
    area: "พหลโยธิน",
    address: "18/4 ซอยอารีย์ 4 แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400",
    phone: "021234572",
    hours: "17:00 - 01:00 ทุกวัน",
    tables: 24,
    note: "เดินจาก BTS อารีย์ 6 นาที ร้านเล็ก แนะนำให้จองล่วงหน้า",
  },
  {
    id: "rama9",
    name: "พระราม 9",
    area: "ห้วยขวาง",
    address: "555 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
    phone: "021234573",
    hours: "16:00 - 02:00 ทุกวัน",
    tables: 56,
    note: "สาขาใหญ่สุด มีห้องส่วนตัว 4 ห้อง รับจัดเลี้ยงถึง 80 คน",
  },
  {
    id: "srinakarin",
    name: "ศรีนครินทร์",
    area: "สวนหลวง",
    address: "909 ถนนศรีนครินทร์ แขวงหนองบอน เขตประเวศ กรุงเทพฯ 10250",
    phone: "021234574",
    hours: "16:00 - 02:00 ทุกวัน",
    tables: 48,
    note: "ติดตลาดนัดรถไฟ ที่จอดรถในตัวอาคาร",
  },
  {
    id: "bangkae",
    name: "บางแค",
    area: "เพชรเกษม",
    address: "77 ถนนเพชรเกษม แขวงบางแคเหนือ เขตบางแค กรุงเทพฯ 10160",
    phone: "021234575",
    hours: "16:00 - 24:00 ทุกวัน",
    tables: 36,
    note: "ปิดเที่ยงคืน ครัวรับออเดอร์สุดท้าย 23:15",
  },
  {
    id: "ngamwongwan",
    name: "งามวงศ์วาน",
    area: "นนทบุรี",
    address: "245 ถนนงามวงศ์วาน ตำบลบางเขน อำเภอเมืองนนทบุรี นนทบุรี 11000",
    phone: "021234576",
    hours: "16:00 - 01:00 ทุกวัน",
    tables: 40,
    note: "สาขาเดียวที่มีโซนกลางแจ้ง ริมน้ำ 12 โต๊ะ",
  },
];

export interface HomeKit {
  id: string;
  name: string;
  people: string;
  price: number;
  includes: string[];
}

/** The takeaway line. A grill goes out with the food and comes back next day. */
export const HOME_KITS: HomeKit[] = [
  {
    id: "small",
    name: "ชุดเล็ก",
    people: "2 - 3 คน",
    price: 690,
    includes: ["เนื้อและผัก 1.2 กิโล", "เตาถ่านให้ยืม 1 เตา", "ถ่านไม้ 2 กิโล"],
  },
  {
    id: "medium",
    name: "ชุดกลาง",
    people: "4 - 5 คน",
    price: 1090,
    includes: ["เนื้อและผัก 2.4 กิโล", "เตาถ่านให้ยืม 2 เตา", "ถ่านไม้ 4 กิโล"],
  },
  {
    id: "large",
    name: "ชุดใหญ่",
    people: "6 - 8 คน",
    price: 1590,
    includes: ["เนื้อและผัก 4 กิโล", "เตาถ่านให้ยืม 3 เตา", "ถ่านไม้ 6 กิโล"],
  },
];

/** The three claims the brand actually makes, and the numbers behind them. */
export const CRAFT_FACTS = [
  { figure: "100%", label: "ถ่านไม้", detail: "ไม่มีเตาไฟฟ้าสักเตาในร้าน" },
  { figure: "3", label: "สูตรน้ำจิ้ม", detail: "แจ่ว ซีฟู้ด งาญี่ปุ่น ตำสดทุกเช้า" },
  { figure: "05:30", label: "หมูเข้าครัว", detail: "สไลซ์วันต่อวัน ไม่มีของค้างคืน" },
];

/** The strip that runs across the top of the hero. */
export const TICKER = [
  "ถ่านไม้แท้ ไม่ใช่เตาไฟฟ้า",
  "เริ่ม 299 ต่อคน",
  "เติมไม่อั้น 2 ชั่วโมง",
  "6 สาขาทั่วกรุงเทพและนนทบุรี",
  "เปิดถึงตี 2",
  "ยืมเตาไปกินที่บ้านได้",
];

/** Where the delivery kit can reach, said plainly instead of a claim. */
export const DELIVERY_NOTE = "ส่งในรัศมี 12 กิโลเมตรจากสาขา สั่งล่วงหน้า 3 ชั่วโมง";
