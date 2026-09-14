"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDown, Flame } from "lucide-react";
import { AnimatedTitle } from "./animated-title";
import { FloatingLayer } from "./floating-layer";
import { ctaDelay, DUR, EASE, HERO, subtitleDelay } from "./motion";
import { COLOR, Z, thaiStyle } from "./theme";

/** Two lines, broken where the sentence turns rather than where it wraps. */
const TITLE = ["ปิ้งบนถ่าน", "ไม่ใช่บนไฟฟ้า"];

export function HeroSection() {
  return (
    <section
      className="relative flex min-h-[92svh] flex-col justify-center overflow-hidden px-5 pb-20 pt-28 sm:px-8 lg:px-12"
      style={{ background: COLOR.cream }}
    >
      <FloatingLayer />

      <div
        className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]"
        style={{ zIndex: Z.content }}
      >
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.fast, ease: EASE.out, delay: HERO.eyebrow }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-wide"
            style={{ background: COLOR.flame, color: COLOR.onFlame, ...thaiStyle }}
          >
            <Flame className="h-3.5 w-3.5" aria-hidden />
            บุฟเฟต์หมูกระทะเตาถ่าน
          </motion.p>

          <AnimatedTitle
            lines={TITLE}
            className="mt-6 text-[clamp(2.75rem,10vw,5.5rem)] font-extrabold leading-[0.95] tracking-tight"
            style={{ color: COLOR.ink, ...thaiStyle }}
            lineStyle={(i) => (i === 1 ? { color: COLOR.flame } : undefined)}
          />

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DUR.base,
              ease: EASE.out,
              delay: subtitleDelay(TITLE.length),
            }}
            className="mt-6 max-w-lg text-base leading-relaxed sm:text-lg"
            style={{ color: COLOR.inkMuted, ...thaiStyle }}
          >
            เริ่ม 299 ต่อคน หมูสไลซ์วันต่อวัน เติมไม่อั้น 2 ชั่วโมง เปิดถึงตี 2 ทุกวัน
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DUR.base,
              ease: EASE.out,
              delay: ctaDelay(TITLE.length),
            }}
            className="mt-9 flex flex-wrap gap-3"
            style={thaiStyle}
          >
            <a
              href="#branches"
              className="flex h-13 items-center rounded-full px-8 text-base font-bold transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: COLOR.char, color: COLOR.onChar, outlineColor: COLOR.flame }}
            >
              จองโต๊ะ
            </a>
            <a
              href="#sets"
              className="flex h-13 items-center rounded-full border-2 px-8 text-base font-bold transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ borderColor: COLOR.char, color: COLOR.ink, outlineColor: COLOR.flame }}
            >
              ดูชุดบุฟเฟต์
            </a>
          </motion.div>
        </div>

        {/* The photograph sits on the page as a picture with corners, not as a
            shape cut out of it. Hiding the boundary is the trap; admitting it
            is cheaper and looks deliberate. */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: 4 }}
          animate={{ opacity: 1, y: 0, rotate: 2.2 }}
          transition={{ duration: DUR.slow, ease: EASE.out, delay: HERO.titleStart }}
          className="relative mx-auto w-full max-w-md"
          style={{ zIndex: Z.raised }}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_28px_60px_rgba(21,12,10,0.28)]">
            <Image
              src="/lab-demos/ember/hero-table.webp"
              alt="โต๊ะปิ้งย่างเตาถ่าน พร้อมเนื้อสไลซ์และเครื่องเคียง"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 440px"
              className="object-cover"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DUR.base, ease: EASE.back, delay: ctaDelay(TITLE.length) }}
            className="absolute -bottom-5 -left-4 rounded-2xl px-5 py-3 shadow-lg sm:-left-8"
            style={{ background: COLOR.cream, ...thaiStyle }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLOR.inkMuted }}>
              เริ่มต้น
            </p>
            <p className="text-2xl font-extrabold leading-none" style={{ color: COLOR.flameDeep }}>
              299.-
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: DUR.base,
              ease: EASE.back,
              delay: ctaDelay(TITLE.length) + 0.1,
            }}
            className="absolute -right-2 -top-5 -rotate-6 rounded-full px-4 py-2 text-xs font-bold shadow-lg sm:-right-6"
            style={{ background: COLOR.ember, color: COLOR.char, ...thaiStyle }}
          >
            ถ่านไม้ 100%
          </motion.div>
        </motion.div>
      </div>

      <motion.a
        href="#sets"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DUR.base, delay: ctaDelay(TITLE.length) + 0.3 }}
        className="relative mx-auto mt-16 flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-4 lg:mt-20"
        style={{ color: COLOR.inkMuted, zIndex: Z.content, outlineColor: COLOR.flame, ...thaiStyle }}
      >
        เลื่อนดูชุดบุฟเฟต์
        <ArrowDown className="h-4 w-4" aria-hidden />
      </motion.a>
    </section>
  );
}
