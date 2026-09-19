"use client";

import { motion } from "framer-motion";
import { PixelPanel, Press, Sprite } from "./pixel";
import { ARROW, MEEPLE } from "./sprites";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { HOURS } from "./data";
import { ACCENT, COLOR, UNIT, dither, thaiStyle } from "./theme";

export function VisitSection() {
  return (
    <section
      id="visit"
      className="scroll-mt-24"
      style={{ background: COLOR.paperDeep, ...dither("rgba(36, 31, 49, 0.06)") }}
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20" style={thaiStyle}>
        <motion.div
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          variants={stagger(0.07)}
          className="grid gap-8 lg:grid-cols-2"
        >
          <motion.div variants={reveal} transition={revealTransition}>
            <h2 className="text-[clamp(1.9rem,5vw,2.75rem)] font-bold" style={{ color: COLOR.ink }}>
              มาหาเรา
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: COLOR.inkMuted }}>
              ซอยอารีย์ 2 ตึกสองชั้นข้างร้านซักผ้า เดินจาก BTS อารีย์ ทางออก 3
              ประมาณ 6 นาที มีที่จอดรถ 4 คัน
            </p>

            <PixelPanel className="mt-6 p-6">
              <ul className="flex flex-col gap-3">
                {HOURS.map((row) => (
                  <li key={row.day} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-base font-bold" style={{ color: COLOR.ink }}>
                      {row.day}
                    </span>
                    <span className="text-base" style={{ color: COLOR.inkMuted }}>
                      {row.open}
                    </span>
                  </li>
                ))}
              </ul>
            </PixelPanel>

            <div className="mt-6 flex flex-wrap gap-4">
              <Press
                href="#finder"
                background={ACCENT.blue.value}
                color={ACCENT.blue.on}
                className="h-14 px-6 text-base font-bold"
              >
                กลับไปเลือกเกม
                <Sprite map={ARROW} scale={1} palette={{ "0": ACCENT.blue.on }} />
              </Press>
              <Press
                href="#shelf"
                background={COLOR.panel}
                color={COLOR.ink}
                className="h-14 px-6 text-base font-bold"
              >
                ดูชั้นเกมอีกรอบ
              </Press>
            </div>
          </motion.div>

          <motion.div variants={reveal} transition={revealTransition}>
            <PixelPanel background={ACCENT.gold.value} className="flex h-full flex-col p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Sprite map={MEEPLE} scale={3} palette={{ "3": COLOR.panel }} />
                <p className="text-xl font-bold" style={{ color: ACCENT.gold.on }}>
                  มากันเกิน 8 คน
                </p>
              </div>
              <p className="mt-4 text-base leading-relaxed" style={{ color: ACCENT.gold.on }}>
                ทักไลน์ไว้ก่อนสักวัน โต๊ะยาวมีตัวเดียว ถ้าไม่บอกล่วงหน้าอาจต้องแยกสองโต๊ะ
                แล้วเกมส่วนใหญ่บนชั้นเล่นแยกโต๊ะไม่ได้
              </p>
              <div className="mt-auto pt-8">
                <p
                  className="inline-block px-4 py-3 text-base font-bold"
                  style={{ background: COLOR.ink, color: COLOR.paper, letterSpacing: UNIT / 4 }}
                >
                  LINE @tatatpai
                </p>
                <p className="mt-4 text-sm" style={{ color: ACCENT.gold.on }}>
                  ร้านสมมติ ไอดีนี้ไม่มีจริง
                </p>
              </div>
            </PixelPanel>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
