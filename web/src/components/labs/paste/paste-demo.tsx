"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { COUPLE, NOTES, SCHEDULE, SNAPSHOTS } from "./data";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { Polaroid } from "./polaroid";
import { SeatFinder } from "./seat-finder";
import { COLOR, handStyle, RULED, sansStyle, TAPE, Z } from "./theme";

/**
 * Paste: scrapbook, for an invented wedding.
 *
 * The Lab already sells weddings once, as Maison: ivory, serif, hairline gold.
 * That is one kind of couple. This is the other kind, and running the same
 * vertical in two registers is the point rather than a duplication: a client
 * can look at both and say which one is them, which is a faster conversation
 * than any amount of description.
 */
export function PasteDemo() {
  return (
    <div id="top" style={{ background: COLOR.paper, ...RULED }}>
      <header
        className="sticky top-0 border-b"
        style={{ background: COLOR.paper, borderColor: COLOR.ink, zIndex: Z.bar }}
      >
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <a
            href="#top"
            className="flex items-center py-2 text-xl focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ color: COLOR.ink, outlineColor: COLOR.stamp, ...handStyle }}
          >
            {COUPLE.bride} & {COUPLE.groom}
          </a>
          <a
            href="#seat"
            className="flex items-center border px-4 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: TAPE[0],
              borderColor: COLOR.ink,
              color: COLOR.ink,
              outlineColor: COLOR.ink,
              ...sansStyle,
            }}
          >
            หาโต๊ะของฉัน
          </a>
        </div>
      </header>

      <main>
        <section className="px-5 pb-16 pt-16 sm:px-8">
          <motion.div
            initial="hidden"
            animate="shown"
            variants={stagger(0.1)}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.p
              variants={reveal}
              transition={revealTransition}
              className="text-sm uppercase tracking-[0.2em]"
              style={{ color: COLOR.stamp, ...sansStyle }}
            >
              เราจะแต่งงานกันแล้ว
            </motion.p>

            <motion.h1
              variants={reveal}
              transition={revealTransition}
              // 1.05 is a Latin display leading. Thai stacks tone marks above
              // the letters, so at this size the marks on "ฟ้า" climbed into
              // the eyebrow line above it.
              className="mt-7 text-[clamp(2.6rem,11vw,5.5rem)] leading-[1.22]"
              style={{ color: COLOR.ink, ...handStyle }}
            >
              {COUPLE.bride} & {COUPLE.groom}
            </motion.h1>

            <motion.p
              variants={reveal}
              transition={revealTransition}
              className="mt-5 text-base sm:text-lg"
              style={{ color: COLOR.ink, ...sansStyle }}
            >
              {COUPLE.date}
              <span className="mx-2" aria-hidden>
                ·
              </span>
              {COUPLE.place}
            </motion.p>
          </motion.div>

          {/* The photographs. Laid out in a row that overlaps rather than a
              grid that does not: a scrapbook page is things competing for the
              same space, and a tidy grid of four is a different style. */}
          <motion.div
            initial="hidden"
            whileInView="shown"
            viewport={ONCE}
            variants={stagger(0.09, 0.05)}
            className="mx-auto mt-14 flex max-w-4xl flex-wrap justify-center gap-x-2 gap-y-8 sm:gap-x-0"
          >
            {SNAPSHOTS.map((snap, i) => (
              <motion.div
                key={snap.src}
                variants={reveal}
                transition={revealTransition}
                className="sm:-mx-3"
                style={{ marginTop: i % 2 === 1 ? 26 : 0 }}
              >
                <Polaroid snap={snap} size={i === 0 ? 250 : 220} priority={i === 0} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        <SeatFinder />

        {/* The day. A list on ruled paper, which is what the couple would
            actually have written on the back of something. */}
        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl">
            <motion.h2
              initial="hidden"
              whileInView="shown"
              viewport={ONCE}
              variants={reveal}
              transition={revealTransition}
              className="text-[clamp(1.7rem,5vw,2.4rem)]"
              style={{ color: COLOR.ink, ...handStyle }}
            >
              วันนั้นเป็นแบบนี้
            </motion.h2>

            <motion.ol
              initial="hidden"
              whileInView="shown"
              viewport={ONCE}
              variants={stagger(0.07, 0.05)}
              className="mt-8 space-y-6"
              style={sansStyle}
            >
              {SCHEDULE.map((item) => (
                <motion.li
                  key={item.time}
                  variants={reveal}
                  transition={revealTransition}
                  className="flex gap-5"
                >
                  <span
                    className="w-16 shrink-0 text-lg"
                    style={{ color: COLOR.stamp, ...handStyle }}
                  >
                    {item.time}
                  </span>
                  <span>
                    <span className="block text-base font-semibold" style={{ color: COLOR.ink }}>
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-sm" style={{ color: COLOR.inkMuted }}>
                      {item.detail}
                    </span>
                  </span>
                </motion.li>
              ))}
            </motion.ol>

            <motion.div
              initial="hidden"
              whileInView="shown"
              viewport={ONCE}
              variants={reveal}
              transition={revealTransition}
              className="relative mt-14 border p-6"
              style={{ background: COLOR.card, borderColor: COLOR.ink }}
            >
              <span
                aria-hidden
                className="absolute -top-3 right-10 h-6 w-28"
                style={{ background: TAPE[2], opacity: 0.85, transform: "rotate(2.5deg)" }}
              />
              <h3 className="text-xl" style={{ color: COLOR.ink, ...handStyle }}>
                อยากบอกไว้ตรงนี้เลย
              </h3>
              <ul className="mt-4 space-y-2.5" style={sansStyle}>
                {NOTES.map((note) => (
                  <li key={note} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: COLOR.ink }}>
                    <span aria-hidden style={{ color: COLOR.stamp }}>
                      ✦
                    </span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t px-5 pb-28 pt-10 sm:px-8" style={{ borderColor: COLOR.ink }}>
        <div className="mx-auto max-w-4xl">
          <p className="max-w-2xl text-sm leading-relaxed" style={{ color: COLOR.inkMuted, ...sansStyle }}>
            ฟ้าและต้นเป็นคู่สมมติ หน้านี้เป็นตัวอย่างงานออกแบบในพอร์ตของ Film
            ชื่อแขก โต๊ะ และกำหนดการแต่งขึ้นมาทั้งหมด รูปเป็นภาพสต็อกของคนที่ไม่เกี่ยวกับงานนี้
            และช่องค้นชื่อไม่ได้ต่อกับฐานข้อมูลจริง
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2" style={sansStyle}>
            <Link
              href="/labs"
              className="inline-flex items-center py-1.5 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: COLOR.ink, outlineColor: COLOR.stamp }}
            >
              กลับไปที่ The Lab
            </Link>
            <Link
              href="/"
              className="inline-flex items-center py-1.5 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: COLOR.ink, outlineColor: COLOR.stamp }}
            >
              ดูพอร์ตของ Film
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
