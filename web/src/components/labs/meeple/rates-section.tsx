"use client";

import { motion } from "framer-motion";
import { PixelPanel, Sprite } from "./pixel";
import { CUP, DIE, HOURGLASS, MEEPLE } from "./sprites";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { RATES } from "./data";
import { ACCENT, COLOR, UNIT, pixelFrame, pixelStyle, thaiStyle } from "./theme";
import type { Sprite as SpriteMap } from "./sprites";

interface Step {
  sprite: SpriteMap;
  colour: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    sprite: MEEPLE,
    colour: ACCENT.tomato.value,
    title: "เดินเข้ามาเลย",
    body: "ไม่ต้องจอง บอกแค่ว่ามากี่คน เดี๋ยวจัดโต๊ะให้",
  },
  {
    sprite: DIE,
    colour: ACCENT.blue.value,
    title: "เลือกเกม",
    body: "ใช้ตัวช่วยบนหน้านี้ หรือบอกพนักงานว่าอยากได้แนวไหน",
  },
  {
    sprite: HOURGLASS,
    colour: ACCENT.jade.value,
    title: "มีคนสอนให้",
    body: "สอนฟรีทุกกล่อง กล่องหนักที่สุดใช้เวลาสอน 25 นาที",
  },
  {
    sprite: CUP,
    colour: ACCENT.gold.value,
    title: "จ่ายตอนกลับ",
    body: "คิดตามชั่วโมงที่นั่งจริง เศษไม่ถึงครึ่งชั่วโมงไม่คิดเพิ่ม",
  },
];

export function RatesSection() {
  return (
    <section id="rates" className="scroll-mt-24" style={{ background: COLOR.ink }}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20" style={thaiStyle}>
        <motion.div initial="hidden" whileInView="shown" viewport={ONCE} variants={stagger(0.07)}>
          <motion.h2
            variants={reveal}
            transition={revealTransition}
            className="text-[clamp(1.9rem,5vw,2.75rem)] font-bold"
            style={{ color: COLOR.paper }}
          >
            ค่าโต๊ะ
          </motion.h2>
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="mt-4 max-w-xl text-base leading-relaxed"
            style={{ color: COLOR.onInkMuted }}
          >
            คิดต่อคน ไม่คิดค่าเกม เล่นกี่กล่องก็ราคาเดียว
          </motion.p>

          <motion.ul
            variants={stagger(0.06, 0.1)}
            className="mt-10 grid gap-5 sm:grid-cols-3"
          >
            {RATES.map((rate) => (
              <motion.li key={rate.id} variants={reveal} transition={revealTransition}>
                <PixelPanel className="flex h-full flex-col gap-2 p-6">
                  <p className="text-base font-bold" style={{ color: COLOR.ink }}>
                    {rate.label}
                  </p>
                  <p className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold" style={{ ...pixelStyle, color: COLOR.ink }}>
                      {rate.price}
                    </span>
                    <span className="text-lg font-bold" style={{ color: COLOR.ink }}>
                      บาท
                    </span>
                  </p>
                  <p className="text-sm" style={{ color: COLOR.inkMuted }}>
                    {rate.note}
                  </p>
                </PixelPanel>
              </motion.li>
            ))}
          </motion.ul>

          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="mt-6 text-sm"
            style={{ color: COLOR.onInkMuted }}
          >
            นักเรียนนักศึกษาโชว์บัตร ลด 20 บาทต่อคน วันจันทร์ถึงพฤหัสบดี
          </motion.p>
        </motion.div>

        <motion.ol
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          variants={stagger(0.06)}
          className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {STEPS.map((step, index) => (
            <motion.li
              key={step.title}
              variants={reveal}
              transition={revealTransition}
              className="flex gap-4 p-5"
              style={{ boxShadow: pixelFrame(COLOR.paper) }}
            >
              <span
                className="shrink-0 self-start p-2"
                style={{ background: step.colour, lineHeight: 0 }}
              >
                <Sprite map={step.sprite} scale={2} />
              </span>
              <div>
                <p className="text-base font-bold" style={{ color: COLOR.paper }}>
                  <span style={{ ...pixelStyle, marginRight: UNIT * 2 }}>{index + 1}</span>
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: COLOR.onInkMuted }}>
                  {step.body}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
