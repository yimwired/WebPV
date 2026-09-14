"use client";

import { motion } from "framer-motion";
import { Block, Press } from "./block";
import { COURSES, FAQ } from "./data";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { COLOR, sansStyle, type Accent } from "./theme";

interface FaqSectionProps {
  accent: Accent;
}

export function FaqSection({ accent }: FaqSectionProps) {
  const course = COURSES.find((c) => c.id === accent.id)!;

  return (
    <section
      className="border-t-[3px] px-5 py-20 sm:px-8 lg:px-12"
      style={{ background: COLOR.ink, borderColor: COLOR.ink }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          <motion.div
            initial="hidden"
            whileInView="shown"
            viewport={ONCE}
            variants={stagger(0.06)}
            style={sansStyle}
          >
            <motion.h2
              variants={reveal}
              transition={revealTransition}
              className="text-[clamp(1.9rem,5.5vw,3rem)] font-extrabold uppercase leading-tight"
              // the accent is the brightest thing available on the near-black,
              // which is the one place it is allowed to be a letter
              style={{ color: accent.value }}
            >
              คำถามที่ถามมาบ่อย
            </motion.h2>

            <dl className="mt-8 space-y-6">
              {FAQ.map((item) => (
                <motion.div key={item.q} variants={reveal} transition={revealTransition}>
                  <dt className="text-lg font-extrabold" style={{ color: COLOR.paper }}>
                    {item.q}
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium leading-relaxed sm:text-base" style={{ color: COLOR.onInkMuted }}>
                    {item.a}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="shown"
            viewport={ONCE}
            variants={stagger(0.08)}
            className="lg:sticky lg:top-24"
          >
            <motion.div variants={reveal} transition={revealTransition}>
              <Block background={accent.value} offset={10} className="p-7" style={sansStyle}>
                <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: COLOR.ink }}>
                  คอร์สที่กำลังดู
                </p>
                <h3 className="mt-2 text-3xl font-extrabold uppercase" style={{ color: COLOR.ink }}>
                  {course.name}
                </h3>
                <p className="mt-2 text-sm font-bold leading-snug" style={{ color: COLOR.ink }}>
                  {course.tagline}
                </p>

                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold" style={{ color: COLOR.ink }}>
                    {course.price.toLocaleString("th-TH")}.-
                  </span>
                  <span className="text-base font-bold line-through" style={{ color: COLOR.ink }}>
                    {course.fullPrice.toLocaleString("th-TH")}.-
                  </span>
                </p>

                <Press
                  href="#courses"
                  background={COLOR.ink}
                  style={{ color: COLOR.paper }}
                  className="mt-5 h-14 w-full text-base uppercase"
                >
                  สมัครเรียน
                </Press>

                <p className="mt-4 text-xs font-bold leading-relaxed" style={{ color: COLOR.ink }}>
                  ราคานี้เป็นราคาเปิดตัว คืนเงินได้ภายใน 14 วันโดยไม่ต้องให้เหตุผล
                </p>
              </Block>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
