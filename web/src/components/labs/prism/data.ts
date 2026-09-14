/**
 * Lumen: an invented music app, and the four backdrops its glass sits on.
 *
 * The four were not picked for looks. They were picked to stretch the panel:
 * `bandLuma` runs from 19 to 174, which forces the adaptive layer to flip in
 * both directions, and two of them carry hard straight lines because a
 * displacement map over a smooth wash is invisible.
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  /** mm:ss, and `seconds` has to agree with it */
  length: string;
  seconds: number;
  image: string;
  /**
   * Mean luminance, 0 to 255, of the band the player panel covers, measured
   * off the file with ffmpeg rather than guessed. It is the starting value:
   * the panel re-reads the real pixels once the image has decoded, since the
   * crop on screen is not the crop measured here.
   */
  bandLuma: number;
  /** what this one is in the set to prove */
  note: string;
}

export const TRACKS: Track[] = [
  {
    id: "soi",
    title: "Midnight Soi",
    artist: "Nara Vong",
    length: "4:12",
    seconds: 252,
    image: "/lab-demos/prism/soi.webp",
    bandLuma: 27,
    note: "นีออนบนพื้นมืด เส้นคมเยอะที่สุดในชุด ดูการหักเหที่ขอบแผ่นได้ชัดที่สุดที่นี่",
  },
  {
    id: "monsoon",
    title: "Monsoon Room",
    artist: "Pim & the Slow Hours",
    length: "3:38",
    seconds: 218,
    image: "/lab-demos/prism/monsoon.webp",
    bandLuma: 19,
    note: "เส้นใบถี่และตรง ชั้น chromatic แยกสีตรงเส้นพวกนี้ให้เห็น",
  },
  {
    id: "dune",
    title: "Long Dune",
    artist: "Kiro",
    length: "5:04",
    seconds: 304,
    image: "/lab-demos/prism/dune.webp",
    bandLuma: 64,
    note: "โค้งนุ่มไม่มีเส้นคม ชั้นหักเหแทบไม่มีอะไรให้บิด เป็นตัวเทียบ",
  },
  {
    id: "salt",
    title: "Salt Flat",
    artist: "Aya Lens",
    length: "6:20",
    seconds: 380,
    image: "/lab-demos/prism/salt.webp",
    bandLuma: 174,
    note: "สว่างที่สุด บีบให้แผ่นพลิกเป็นโหมดเข้มเพื่อให้ตัวหนังสือยังอ่านออก",
  },
];

/** The four layers, and what turning each one off is meant to show. */
export interface Layer {
  id: "refraction" | "chromatic" | "specular" | "adaptive";
  name: string;
  claim: string;
  /** what you lose when it is off */
  without: string;
}

export const LAYERS: Layer[] = [
  {
    id: "refraction",
    name: "หักเหที่ขอบ",
    claim: "แสงหลังแผ่นถูกบิด แรงสุดที่ริม จางลงเข้ากลาง เหมือนขอบเลนส์",
    without: "เหลือฝ้าเรียบ ไม่มีอะไรบอกว่าแผ่นมีความหนา",
  },
  {
    id: "chromatic",
    name: "เหลือบสีที่ขอบ",
    claim: "แดง เขียว น้ำเงิน หักเหคนละองศา ขอบเลยมีเหลือบสีบางๆ",
    without: "ขอบยังบิดแต่สีสะอาดเกินไป อ่านว่าเป็นภาพบิด ไม่ใช่แก้ว",
  },
  {
    id: "specular",
    name: "เส้นแสงที่ขอบ",
    claim: "เส้นไฮไลต์วิ่งรอบขอบตามทิศแสง ตัวนี้แหละที่ทำให้มันดูมีน้ำหนัก",
    without: "แผ่นแบนติดพื้นหลัง ไม่ลอย",
  },
  {
    id: "adaptive",
    name: "ปรับตามพื้นหลัง",
    claim: "พื้นหลังสว่างแผ่นเข้มลง พื้นหลังมืดแผ่นสว่างขึ้น ตัวหนังสืออ่านออกเสมอ",
    without: "ลองสลับไปเพลง Salt Flat ตอนปิดชั้นนี้ แล้วดูว่าตัวหนังสือหายไปไหน",
  },
];
