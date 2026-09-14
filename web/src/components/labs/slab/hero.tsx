"use client";

import { motion } from "framer-motion";
import { ArrowRight, Scissors } from "lucide-react";
import { Block, Press } from "./block";
import { PROOF } from "./data";
import { DUR, EASE, ONCE, reveal, revealTransition, stagger } from "./motion";
import { COLOR, sansStyle, type Accent } from "./theme";

interface HeroProps {
  accent: Accent;
}

export function Hero({ accent }: HeroProps) {
  return (
    <section className="relative overflow-hidden" style={{ background: COLOR.paper }}>
      {/* The accent is a band with a real edge, and it contains the headline
          rather than being positioned behind it. An absolutely placed block at
          a guessed percentage height cut through the paragraph below at some
          viewport widths and read as a rendering fault; a block that wraps its
          own content cannot land in the wrong place. */}
      <motion.div
        initial="hidden"
        animate="shown"
        variants={stagger(0.07)}
        className="px-5 pb-10 pt-14 sm:px-8 lg:px-12"
        style={{ background: accent.value, borderBottom: `3px solid ${COLOR.ink}`, ...sansStyle }}
      >
        <div className="mx-auto max-w-6xl">
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="inline-flex items-center gap-2 border-[3px] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide"
            style={{ borderColor: COLOR.ink, background: COLOR.paper, color: COLOR.ink }}
          >
            <Scissors className="h-3.5 w-3.5" aria-hidden />
            คอร์สออนไลน์ ดูย้อนหลังได้ตลอด
          </motion.p>

          <motion.h1
            variants={reveal}
            transition={revealTransition}
            className="mt-5 max-w-3xl text-[clamp(2.4rem,8vw,5rem)] font-extrabold uppercase leading-[0.95]"
            style={{ color: COLOR.ink }}
          >
            ตัดคลิปให้จบ
            <br />
            ไม่ใช่ตัดไปเรื่อยๆ
          </motion.h1>
        </div>
      </motion.div>

      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-12">
        <motion.div initial="hidden" animate="shown" variants={stagger(0.07, 0.12)} style={sansStyle}>
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="max-w-xl text-base font-medium leading-relaxed sm:text-lg"
            style={{ color: COLOR.ink }}
          >
            สามคอร์สที่สอนสิ่งที่คนตัดคลิปติดจริง จังหวะ สี และเสียง
            เรียนจบแล้วทำงานเร็วขึ้น ไม่ใช่รู้ปุ่มเยอะขึ้น
          </motion.p>

          <motion.div variants={reveal} transition={revealTransition} className="mt-8 flex flex-wrap gap-4">
            <Press href="#courses" background={COLOR.ink} style={{ color: COLOR.paper }} className="h-14 px-7 text-base">
              เลือกคอร์ส
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Press>
            <Press href="#curriculum" background={COLOR.paper} className="h-14 px-7 text-base">
              ดูหลักสูตรก่อน
            </Press>
          </motion.div>
        </motion.div>

        <motion.ul
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          variants={stagger(0.08, 0.1)}
          className="mt-12 grid gap-5 sm:grid-cols-3"
          style={sansStyle}
        >
          {PROOF.map((item, i) => (
            <motion.li key={item.label} variants={reveal} transition={revealTransition}>
              <Block
                background={i === 1 ? accent.value : COLOR.paper}
                offset={6}
                className="h-full p-5"
                tilt={i === 1 ? -1.2 : 0}
              >
                <p className="text-5xl font-extrabold leading-none" style={{ color: COLOR.ink }}>
                  {item.figure}
                </p>
                <p className="mt-2 text-base font-extrabold uppercase" style={{ color: COLOR.ink }}>
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-medium" style={{ color: COLOR.ink }}>
                  {item.detail}
                </p>
              </Block>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* The sticker. Rotated, overlapping, and outside the grid, which is the
          one decorative move this style actually needs. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: 18 }}
        animate={{ opacity: 1, scale: 1, rotate: 12 }}
        transition={{ duration: DUR.base, ease: EASE.snap, delay: 0.35 }}
        className="absolute right-4 top-20 hidden lg:block"
        style={sansStyle}
      >
        <Block background={COLOR.paper} offset={5} className="px-4 py-3" radius={999}>
          <p className="text-sm font-extrabold uppercase" style={{ color: COLOR.ink }}>
            คืนเงินใน 14 วัน
          </p>
        </Block>
      </motion.div>
    </section>
  );
}
