"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Block } from "./block";
import { COURSES, MODULES } from "./data";
import { DUR, EASE, ONCE, reveal, revealTransition, stagger } from "./motion";
import { COLOR, LINE, sansStyle, type Accent } from "./theme";

interface CurriculumSectionProps {
  accent: Accent;
}

const mins = (n: number) => `${Math.floor(n / 60)} ชม. ${n % 60} นาที`;

/**
 * The curriculum for whichever course is selected, as an accordion.
 *
 * One row open at a time: the list is the argument for the price, and five
 * open rows is a wall nobody reads. The open row is filled with the accent
 * rather than outlined, because on a page with this many borders an outline
 * does not read as "this one".
 */
export function CurriculumSection({ accent }: CurriculumSectionProps) {
  const [open, setOpen] = useState<string | null>("01");
  const course = COURSES.find((c) => c.id === accent.id)!;
  const modules = MODULES[accent.id];
  const total = modules.reduce((sum, m) => sum + m.minutes, 0);

  return (
    <section
      id="curriculum"
      className="scroll-mt-16 px-5 py-20 sm:px-8 lg:px-12"
      style={{ background: COLOR.paper }}
    >
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          variants={stagger(0.07)}
          style={sansStyle}
        >
          <motion.h2
            variants={reveal}
            transition={revealTransition}
            className="text-[clamp(1.9rem,5.5vw,3.2rem)] font-extrabold uppercase leading-tight"
            style={{ color: COLOR.ink }}
          >
            หลักสูตร {course.name}
          </motion.h2>
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="mt-3 text-base font-bold"
            style={{ color: COLOR.ink }}
          >
            {modules.length} บทหลัก รวม {mins(total)}
          </motion.p>
        </motion.div>

        <ul className="mt-8 space-y-4" style={sansStyle}>
          {modules.map((module) => {
            const isOpen = open === module.no;
            return (
              <li key={`${accent.id}-${module.no}`}>
                <Block
                  background={isOpen ? accent.value : COLOR.paper}
                  offset={isOpen ? 8 : 5}
                  className="overflow-hidden"
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : module.no)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-4"
                      style={{ color: COLOR.ink, outlineColor: COLOR.ink }}
                    >
                      <span className="text-lg font-extrabold tabular-nums">{module.no}</span>
                      <span className="flex-1 text-base font-extrabold sm:text-lg">
                        {module.title}
                      </span>
                      <span className="hidden text-sm font-bold tabular-nums sm:block">
                        {module.minutes} นาที
                      </span>
                      <span
                        aria-hidden
                        className="grid h-8 w-8 shrink-0 place-items-center border-[3px]"
                        style={{ borderColor: COLOR.ink }}
                      >
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: DUR.accordion, ease: EASE.flat }}
                        style={{ overflow: "hidden" }}
                      >
                        <p
                          className="px-5 pb-4 text-sm font-medium leading-relaxed sm:text-base"
                          style={{ color: COLOR.ink, borderTop: `${LINE.thick}px solid ${COLOR.ink}`, paddingTop: 16 }}
                        >
                          {module.detail}
                          <span className="mt-1 block text-xs font-bold uppercase sm:hidden">
                            {module.minutes} นาที
                          </span>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Block>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
