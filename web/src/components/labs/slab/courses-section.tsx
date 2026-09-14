"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Block, Press } from "./block";
import { COURSES } from "./data";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { ACCENTS, COLOR, sansStyle, type Accent } from "./theme";

interface CoursesSectionProps {
  accent: Accent;
  onPick: (id: string) => void;
}

const baht = (n: number) => n.toLocaleString("th-TH");

/**
 * The three courses, and the control that repaints the page.
 *
 * Picking a course is the page's one real interaction: the accent belongs to
 * the course, so choosing one changes the band behind the hero, the filled
 * blocks, the curriculum being listed and the price in the footer. It is the
 * cheapest way to show a client that a loud palette is a system and not a
 * one-off, which is the thing they are actually worried about.
 */
export function CoursesSection({ accent, onPick }: CoursesSectionProps) {
  return (
    <section
      id="courses"
      className="scroll-mt-16 border-y-[3px] px-5 py-20 sm:px-8 lg:px-12"
      style={{ background: COLOR.paperDeep, borderColor: COLOR.ink }}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          variants={stagger(0.07)}
          className="max-w-2xl"
          style={sansStyle}
        >
          <motion.h2
            variants={reveal}
            transition={revealTransition}
            className="text-[clamp(1.9rem,5.5vw,3.2rem)] font-extrabold uppercase leading-tight"
            style={{ color: COLOR.ink }}
          >
            สามคอร์ส เลือกที่ติดอยู่
          </motion.h2>
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="mt-4 text-base font-medium leading-relaxed"
            style={{ color: COLOR.ink }}
          >
            กดที่คอร์สไหนก็ได้ สีทั้งหน้าจะเปลี่ยนตามคอร์สนั้น
            และหลักสูตรข้างล่างจะสลับไปเป็นของคอร์สที่เลือก
          </motion.p>
        </motion.div>

        <motion.ul
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          variants={stagger(0.09, 0.08)}
          className="mt-10 grid gap-6 lg:grid-cols-3"
        >
          {COURSES.map((course) => {
            const own = ACCENTS.find((a) => a.id === course.id)!;
            const active = course.id === accent.id;

            return (
              <motion.li key={course.id} variants={reveal} transition={revealTransition}>
                <Block
                  background={active ? own.value : COLOR.paper}
                  offset={active ? 10 : 6}
                  className="flex h-full flex-col p-6"
                  style={sansStyle}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-2xl font-extrabold uppercase" style={{ color: COLOR.ink }}>
                      {course.name}
                    </h3>
                    <span
                      className="border-[3px] px-2 py-1 text-xs font-extrabold"
                      style={{ borderColor: COLOR.ink, color: COLOR.ink }}
                    >
                      {course.lessons} บท
                    </span>
                  </div>

                  <p className="mt-2 text-base font-bold leading-snug" style={{ color: COLOR.ink }}>
                    {course.tagline}
                  </p>

                  <ul className="mt-5 space-y-2">
                    {course.outcomes.map((line) => (
                      <li key={line} className="flex gap-2 text-sm font-medium" style={{ color: COLOR.ink }}>
                        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>

                  <p
                    className="mt-4 flex gap-2 text-sm font-medium"
                    style={{ color: active ? COLOR.ink : COLOR.inkMuted }}
                  >
                    <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{course.notFor}</span>
                  </p>

                  <div className="mt-auto pt-6">
                    <p className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold" style={{ color: COLOR.ink }}>
                        {baht(course.price)}.-
                      </span>
                      <span
                        className="text-base font-bold line-through"
                        style={{ color: active ? COLOR.ink : COLOR.inkMuted }}
                      >
                        {baht(course.fullPrice)}.-
                      </span>
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase" style={{ color: COLOR.ink }}>
                      {course.hours} ชั่วโมง ดูได้ตลอด
                    </p>

                    <Press
                      onClick={() => onPick(course.id)}
                      held={active}
                      pressedState={active}
                      background={active ? COLOR.ink : own.value}
                      style={{ color: active ? COLOR.paper : COLOR.ink }}
                      className="mt-4 h-12 w-full text-sm uppercase"
                    >
                      {active ? "กำลังดูคอร์สนี้" : `ดู${course.name}`}
                    </Press>
                  </div>
                </Block>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
