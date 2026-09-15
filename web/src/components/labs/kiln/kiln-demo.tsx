"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PIECES, PROCESS, TERMS } from "./data";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { PiecesSection } from "./pieces-section";
import { COLOR, sansStyle, serifStyle, Z } from "./theme";

/**
 * Kiln: wabi-sabi, for ดินเผา, an invented studio selling one-off ceramics.
 *
 * The quietest page in The Lab, and deliberately so: it follows three loud
 * ones, and a gallery of twenty needs somewhere for the eye to rest. Almost
 * nothing here moves. The hierarchy is space and scale, not weight and colour,
 * which is the part of this style that is actually hard.
 */
export function KilnDemo() {
  const [pieceId, setPieceId] = useState(PIECES[0].id);
  const piece = PIECES.find((p) => p.id === pieceId) ?? PIECES[0];
  const pick = useCallback((id: string) => setPieceId(id), []);

  return (
    <div id="top" style={{ background: COLOR.paper }}>
      <header
        className="sticky top-0 border-b"
        style={{ background: COLOR.paper, borderColor: COLOR.hair, zIndex: Z.bar }}
      >
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* The wordmark was text-lg and disappeared into the whitespace. On a
              page with this little on it, the one fixed name has to hold the
              corner or the header reads as empty. Bigger, heavier, and sitting
              on a clay rule, which "ดินเผา" can carry because none of its
              letters drop below the baseline. */}
          <a
            href="#top"
            className="flex items-center py-2 focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ outlineColor: COLOR.clay }}
          >
            <span
              className="text-2xl leading-none sm:text-[1.7rem]"
              style={{
                color: COLOR.ink,
                fontWeight: 600,
                borderBottom: `1px solid ${COLOR.clay}`,
                paddingBottom: 3,
                ...serifStyle,
              }}
            >
              ดินเผา
            </span>
          </a>
          <nav className="flex items-center gap-6" style={sansStyle}>
            <a
              href="#pieces"
              className="flex items-center py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: COLOR.inkMuted, outlineColor: COLOR.clay }}
            >
              ชิ้นงาน
            </a>
            <a
              href="#process"
              className="flex items-center py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: COLOR.inkMuted, outlineColor: COLOR.clay }}
            >
              วิธีทำ
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero. One line, a lot of air, and the photograph placed below rather
            than behind it: text over a picture is where this style usually
            starts looking like every other minimal template. */}
        <section className="px-5 pb-20 pt-24 sm:px-8 lg:px-12">
          <motion.div
            initial="hidden"
            animate="shown"
            variants={stagger(0.12)}
            className="mx-auto max-w-5xl"
          >
            <motion.p
              variants={reveal}
              transition={revealTransition}
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: COLOR.clay, ...sansStyle }}
            >
              เครื่องปั้นดินเผาทำมือ เชียงใหม่
            </motion.p>

            <motion.h1
              variants={reveal}
              transition={revealTransition}
              className="mt-6 max-w-3xl text-[clamp(2rem,6vw,3.8rem)] leading-[1.25]"
              style={{ color: COLOR.ink, ...serifStyle }}
            >
              ไม่มีใบไหนเหมือนกัน
              <br />
              เราเลยบอกไปเลยว่าแต่ละใบต่างยังไง
            </motion.h1>

            <motion.p
              variants={reveal}
              transition={revealTransition}
              className="mt-7 max-w-lg text-base leading-relaxed"
              style={{ color: COLOR.inkMuted, ...sansStyle }}
            >
              ของทำมือมีตำหนิเสมอ ร้านส่วนใหญ่เลือกมุมถ่ายที่ไม่เห็น
              เราชี้ให้ดูทีละจุดแทน แล้วให้คุณตัดสินใจเอง
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.3 }}
            className="mx-auto mt-16 max-w-5xl"
          >
            <div className="relative aspect-[10/7] w-full overflow-hidden">
              <Image
                src="/lab-demos/kiln/studio.webp"
                alt="มือกำลังขึ้นรูปถ้วยบนแป้นหมุน"
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 960px"
                className="object-cover"
              />
            </div>
          </motion.div>
        </section>

        <PiecesSection piece={piece} onPick={pick} />

        {/* Process. Numbered in words rather than figures, which is the small
            thing that keeps a three-step section from reading as a pitch. */}
        <section
          id="process"
          className="scroll-mt-20 px-5 py-24 sm:px-8 lg:px-12"
          style={{ background: COLOR.paperDeep }}
        >
          <motion.div
            initial="hidden"
            whileInView="shown"
            viewport={ONCE}
            variants={stagger(0.1)}
            className="mx-auto max-w-5xl"
          >
            <motion.h2
              variants={reveal}
              transition={revealTransition}
              className="max-w-xl text-[clamp(1.7rem,4.5vw,2.6rem)] leading-snug"
              style={{ color: COLOR.ink, ...serifStyle }}
            >
              จากดินก้อนหนึ่งถึงใบที่ขายได้ ใช้เวลาสิบวัน
            </motion.h2>

            <ol className="mt-12 grid gap-10 sm:grid-cols-3">
              {PROCESS.map((step) => (
                <motion.li key={step.no} variants={reveal} transition={revealTransition}>
                  <p className="text-sm" style={{ color: COLOR.clay, ...serifStyle }}>
                    {step.no}
                  </p>
                  <h3 className="mt-2 text-xl" style={{ color: COLOR.ink, ...serifStyle }}>
                    {step.title}
                  </h3>
                  <p
                    className="mt-3 text-sm leading-relaxed"
                    style={{ color: COLOR.inkMuted, ...sansStyle }}
                  >
                    {step.body}
                  </p>
                </motion.li>
              ))}
            </ol>

            <motion.div
              variants={reveal}
              transition={revealTransition}
              className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1fr] lg:items-center"
            >
              <div className="relative aspect-[10/7] w-full overflow-hidden">
                <Image
                  src="/lab-demos/kiln/shelf.webp"
                  alt="ชามหลายใบวางซ้อนกันบนชั้นไม้"
                  fill
                  sizes="(max-width: 1024px) 92vw, 440px"
                  className="object-cover"
                />
              </div>

              <ul className="space-y-4" style={sansStyle}>
                {TERMS.map((line) => (
                  <li
                    key={line}
                    className="border-b pb-4 text-sm leading-relaxed"
                    style={{ color: COLOR.ink, borderColor: COLOR.hair }}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer
        className="px-5 pb-28 pt-16 sm:px-8 lg:px-12"
        style={{ background: COLOR.ink, ...sansStyle }}
      >
        <div className="mx-auto max-w-5xl">
          <p
            className="text-4xl sm:text-5xl"
            style={{ color: COLOR.paper, fontWeight: 300, ...serifStyle }}
          >
            ดินเผา
          </p>
          <p className="mt-6 max-w-xl text-sm leading-relaxed" style={{ color: COLOR.onInkMuted }}>
            ดินเผาเป็นแบรนด์สมมติ หน้านี้เป็นตัวอย่างงานออกแบบในพอร์ตของ Film ชื่อชิ้นงาน
            ราคา และตำหนิที่ชี้ไว้แต่งขึ้นมาทั้งหมด รูปเป็นภาพสต็อกที่ใช้แทนภาพจริงของสตูดิโอ
          </p>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/labs"
              className="inline-flex items-center py-1.5 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: COLOR.paper, outlineColor: COLOR.onInkMuted }}
            >
              กลับไปที่ The Lab
            </Link>
            <Link
              href="/"
              className="inline-flex items-center py-1.5 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: COLOR.paper, outlineColor: COLOR.onInkMuted }}
            >
              ดูพอร์ตของ Film
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
