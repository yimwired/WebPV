"use client";

import { motion } from "framer-motion";
import { Check, Truck } from "lucide-react";
import { DELIVERY_NOTE, HOME_KITS } from "./data";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { COLOR, Z, thaiStyle } from "./theme";

/**
 * The takeaway line, on the loudest block on the page.
 *
 * The cards stay cream rather than tinting into the red: body copy on the
 * brand red only just clears 4.5:1, and a list of what is in a box is exactly
 * the kind of small text that should not be spending that margin.
 */
export function KitSection() {
  return (
    <section
      id="kit"
      className="relative scroll-mt-20 overflow-hidden px-5 py-24 sm:px-8 lg:px-12"
      style={{ background: COLOR.flame, zIndex: Z.content }}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          className="max-w-2xl"
          style={thaiStyle}
        >
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
            style={{ background: COLOR.char, color: COLOR.onChar }}
          >
            <Truck className="h-3.5 w-3.5" aria-hidden />
            สั่งกลับบ้าน
          </motion.p>

          <motion.h2
            variants={reveal}
            transition={revealTransition}
            className="mt-5 text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-tight"
            style={{ color: COLOR.onFlame }}
          >
            ยกเตาไปกินที่บ้าน
          </motion.h2>

          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="mt-4 text-base leading-relaxed sm:text-lg"
            style={{ color: COLOR.onFlame }}
          >
            {DELIVERY_NOTE} เตาถ่านให้ยืมไปพร้อมชุด คืนวันถัดไปที่สาขาไหนก็ได้
          </motion.p>
        </motion.div>

        <motion.ul
          variants={stagger(0.1, 0.1)}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          className="mt-12 grid gap-5 sm:grid-cols-3"
          style={thaiStyle}
        >
          {HOME_KITS.map((kit) => (
            <motion.li
              key={kit.id}
              variants={reveal}
              transition={revealTransition}
              className="rounded-[1.5rem] p-6"
              style={{ background: COLOR.cream }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-extrabold" style={{ color: COLOR.ink }}>
                  {kit.name}
                </h3>
                <p className="text-lg font-extrabold" style={{ color: COLOR.flameDeep }}>
                  {kit.price.toLocaleString("th-TH")}.-
                </p>
              </div>
              <p className="mt-1 text-sm font-semibold" style={{ color: COLOR.inkMuted }}>
                {kit.people}
              </p>
              <ul className="mt-4 space-y-2">
                {kit.includes.map((item) => (
                  <li key={item} className="flex gap-2 text-sm" style={{ color: COLOR.ink }}>
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: COLOR.flameDeep }}
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.li>
          ))}
        </motion.ul>

        <motion.p
          variants={reveal}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          transition={revealTransition}
          className="mt-8 text-sm"
          style={{ color: COLOR.onFlame, ...thaiStyle }}
        >
          มัดจำเตา 500 บาท คืนเต็มจำนวนตอนเอาเตามาคืน
        </motion.p>
      </div>
    </section>
  );
}
