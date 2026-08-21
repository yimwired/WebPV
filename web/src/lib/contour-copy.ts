// ─────────────────────────────────────────────────────────────
//  Every word on /labs/contour, in both languages.
//  แก้ข้อความของ lab Contour ที่ไฟล์นี้ไฟล์เดียว
//
//  The pack artwork itself stays English on purpose: it is printed
//  packaging, and a real Thai can carries the same Latin wordmark.
//
//  ​ marks where Thai display lines may break. Thai has no
//  spaces, so without them the browser splits words mid-character.
//  See thaiWrap() in lib/thai-text.tsx.
// ─────────────────────────────────────────────────────────────

import type { Locale } from "./dictionary";
import type { Pack } from "@/components/labs/contour-scene";

interface PackCopy {
  name: string;
  /** the paragraph under the pack name */
  line: string;
  /** who and how many, in one short phrase */
  serves: string;
  callouts: { title: string; body: string }[];
}

export interface ContourCopy {
  eyebrow: string;
  headline: string;
  intro: string;
  stats: { energy: string; sugar: string; height: string };
  lineup: { title: string; body: string };
  disclaimer: string;
  packs: Record<Pack["id"], PackCopy>;
}

export const contourCopy: Record<Locale, ContourCopy> = {
  en: {
    eyebrow: "Original Taste",
    headline: "One drink, three ways to hold it",
    intro:
      "The same 10.6 grams of sugar per 100 ml, tooled three ways for three different moments. Scroll to take each one apart.",
    stats: { energy: "Energy", sugar: "Sugar", height: "Height" },
    lineup: {
      title: "The range, to scale",
      body: "Every other view reframes each pack to fill the screen. This is the only one where they are measured against each other.",
    },
    disclaimer:
      "Unofficial concept, made as a portfolio study. Not affiliated with, or endorsed by, The Coca-Cola Company. Coca-Cola is their trademark. Every model and label here was generated in the browser for this demo.",
    packs: {
      can: {
        name: "Standard can",
        line: "The format that has to survive a cooler, a vending slot and a bare hand. Aluminium takes the chill fastest and gives the shelf its wall of red.",
        serves: "One person, cold, gone in ten minutes",
        callouts: [
          {
            title: "Two minutes to cold",
            body: "Aluminium moves heat about a thousand times faster than PET, which is why the can is the format vending machines were built around.",
          },
          {
            title: "Printed, not stuck on",
            body: "The artwork is cured straight onto the barrel, so there is no label edge to lift when the can sweats in a cooler.",
          },
        ],
      },
      bottle: {
        name: "Contour bottle",
        line: "The contour carried into PET. The waist is the reason you can name the brand from a silhouette across the street, so the label sits below it and leaves the shape alone.",
        serves: "One person, resealable",
        callouts: [
          {
            title: "The waist does the work",
            body: "Take the colour away and the silhouette still reads. That is the whole argument for keeping the label clear of the contour.",
          },
          {
            title: "Opens twice",
            body: "The screw finish is what separates this from the can: the same drink, sold to someone who is not going to finish it standing up.",
          },
        ],
      },
      magnum: {
        name: "Sharing bottle",
        line: "The sharing size keeps the same 28 mm neck as the 510, so one cap tools both lines. The body grows, the finish does not.",
        serves: "Four glasses at a table",
        callouts: [
          {
            title: "One cap, two bottles",
            body: "The neck stays at 28 mm whatever the body does, so the sharing size runs down the same capping line as the 510.",
          },
          {
            title: "Priced by the table",
            body: "At 132 g of sugar this is never a single serve. The pack has to look like something you put in the middle, not something you hold.",
          },
        ],
      },
    },
  },

  th: {
    eyebrow: "รสดั้งเดิม",
    headline: "หนึ่งรสชาติ​สามขนาดบรรจุ",
    intro:
      "น้ำตาล 10.6 กรัมต่อ 100 มล. เท่ากันทุกขนาด แต่ขึ้นรูปคนละแบบเพื่อคนละโอกาส เลื่อนลงเพื่อดูทีละใบ",
    stats: { energy: "พลังงาน", sugar: "น้ำตาล", height: "ความสูง" },
    lineup: {
      title: "ทั้งกลุ่ม​ตามขนาดจริง",
      body: "ทุกฉากก่อนหน้านี้ขยับกล้องให้แต่ละแพ็กเต็มจอ ฉากนี้ฉากเดียวที่วัดขนาดจริงเทียบกัน",
    },
    disclaimer:
      "งาน concept ที่ทำเป็นตัวอย่างผลงาน ไม่มีส่วนเกี่ยวข้องและไม่ได้รับการรับรองจาก The Coca-Cola Company และ Coca-Cola เป็นเครื่องหมายการค้าของบริษัทดังกล่าว โมเดลและฉลากทุกชิ้นในหน้านี้สร้างขึ้นในเบราว์เซอร์สำหรับเดโมนี้",
    packs: {
      can: {
        name: "กระป๋องมาตรฐาน",
        line: "รูปแบบที่ต้องทนทั้งตู้แช่ ช่องตู้กด และมือเปล่า อะลูมิเนียมเย็นเร็วที่สุด และเป็นตัวที่ทำให้ชั้นวางกลายเป็นกำแพงสีแดง",
        serves: "คนเดียว แช่เย็น หมดใน 10 นาที",
        callouts: [
          {
            title: "เย็นใน 2 นาที",
            body: "อะลูมิเนียมนำความร้อนเร็วกว่า PET ราวพันเท่า นี่คือเหตุผลที่ตู้กดเครื่องดื่มออกแบบมาสำหรับกระป๋อง",
          },
          {
            title: "พิมพ์ลงตัวกระป๋อง ไม่ใช่ฉลากแปะ",
            body: "ลายพิมพ์อบติดกับตัวกระป๋องโดยตรง ไม่มีขอบฉลากให้หลุดตอนกระป๋องเป็นหยดน้ำในตู้แช่",
          },
        ],
      },
      bottle: {
        name: "ขวดคอนทัวร์",
        line: "ทรงคอนทัวร์ที่ย้ายมาอยู่บน PET ส่วนเว้ากลางขวดคือเหตุผลที่คนทายแบรนด์ได้จากเงาขวดข้ามถนน ฉลากเลยวางต่ำกว่านั้นเพื่อไม่บังทรง",
        serves: "คนเดียว ปิดฝาเก็บต่อได้",
        callouts: [
          {
            title: "ส่วนเว้าคือตัวทำงาน",
            body: "เอาสีออกให้หมด เงาขวดก็ยังบอกได้ว่าเป็นแบรนด์ไหน นั่นคือเหตุผลทั้งหมดที่ฉลากต้องหลบส่วนเว้า",
          },
          {
            title: "เปิดได้สองครั้ง",
            body: "ฝาเกลียวคือสิ่งที่แยกขวดออกจากกระป๋อง เครื่องดื่มเดียวกัน แต่ขายให้คนที่ไม่ได้ตั้งใจดื่มหมดในทีเดียว",
          },
        ],
      },
      magnum: {
        name: "ขวดแบ่งดื่ม",
        line: "ขนาดแบ่งดื่มใช้คอขวด 28 มม. เท่ากับขวด 510 ฝาเดียวจึงใช้ได้ทั้งสองไลน์ ตัวขวดใหญ่ขึ้น แต่ปากขวดเท่าเดิม",
        serves: "สี่แก้วบนโต๊ะ",
        callouts: [
          {
            title: "ฝาเดียว สองขวด",
            body: "คอขวดอยู่ที่ 28 มม. ไม่ว่าตัวขวดจะใหญ่แค่ไหน ขนาดแบ่งดื่มจึงวิ่งบนไลน์ปิดฝาเดียวกับขวด 510",
          },
          {
            title: "ขายเป็นโต๊ะ ไม่ใช่เป็นคน",
            body: "น้ำตาล 132 กรัม ไม่ใช่ปริมาณสำหรับคนเดียว แพ็กนี้ต้องดูเหมือนของที่วางกลางโต๊ะ ไม่ใช่ของที่ถือ",
          },
        ],
      },
    },
  },
};
