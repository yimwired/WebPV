"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { GUESTS, type Guest } from "./data";
import { DUR, EASE } from "./motion";
import { bodyStyle, COLOR, handStyle, LINE_HEIGHT, ruled, TAPE } from "./theme";

/** Loose match: people type a nickname, a full name, or half of either. */
function findGuest(query: string): Guest | null {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return null;
  return (
    GUESTS.find((g) =>
      [g.name, ...g.aliases].some((alias) => alias.toLowerCase().includes(q))
    ) ?? null
  );
}

/**
 * The one thing a paper invitation cannot do.
 *
 * Guests do not know which table they are on, so they ask, and the couple
 * answers the same question forty times in the week before the wedding. This
 * is the whole reason the invitation is a website.
 *
 * Three states, and the empty one matters as much as the hit: typing a name
 * that is not on the list is the case that actually happens, so it gets a real
 * answer and a way to reach a human rather than a shrug.
 */
export function SeatFinder() {
  const [query, setQuery] = useState("");
  const guest = useMemo(() => findGuest(query), [query]);
  const searched = query.trim().length >= 2;

  return (
    <section
      id="seat"
      className="scroll-mt-20 border-y px-5 py-20 sm:px-8 lg:px-12"
      style={{ background: COLOR.kraft, borderColor: COLOR.edge }}
    >
      <div className="mx-auto max-w-2xl">
        <h2
          className="text-center text-[clamp(1.7rem,5vw,2.6rem)]"
          style={{ color: COLOR.ink, ...handStyle }}
        >
          นั่งโต๊ะไหน
        </h2>
        <p
          className="mt-3 text-center text-sm"
          style={{ color: COLOR.inkMuted, lineHeight: `${LINE_HEIGHT}px`, ...bodyStyle }}
        >
          พิมพ์ชื่อเล่นหรือชื่อจริงก็ได้ ไม่ต้องพิมพ์ครบ
        </p>

        <div
          className="mx-auto mt-7 flex max-w-md items-center gap-3 rounded-[2px] border px-4 py-3"
          style={{ background: COLOR.card, borderColor: COLOR.edge, ...bodyStyle }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: COLOR.inkMuted }} aria-hidden />
          <input
            aria-label="ค้นชื่อเพื่อดูโต๊ะที่นั่ง"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="เช่น แนน หรือ ก้อง"
            className="w-full bg-transparent text-base outline-none"
            style={{ color: COLOR.ink }}
          />
        </div>

        <div className="mt-7 min-h-[14rem]">
          <AnimatePresence mode="wait" initial={false}>
            {!searched && (
              <motion.ul
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.fast }}
                className="flex flex-wrap justify-center gap-2"
                style={bodyStyle}
              >
                {GUESTS.slice(0, 4).map((g, i) => (
                  <li key={g.name}>
                    <button
                      type="button"
                      onClick={() => setQuery(g.name)}
                      className="px-3 py-1.5 text-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:hover:translate-y-0"
                      style={{
                        background: TAPE[i % TAPE.length],
                        color: COLOR.ink,
                        outlineColor: COLOR.ink,
                        // a chip of tape has no outline, it has a torn edge
                        transform: `rotate(${i % 2 === 0 ? -1.2 : 1.2}deg)`,
                      }}
                    >
                      {g.name}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}

            {searched && guest && (
              <motion.div
                key={guest.name}
                initial={{ opacity: 0, y: 10, rotate: -1.5 }}
                animate={{ opacity: 1, y: 0, rotate: -0.8 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: DUR.base, ease: EASE.soft }}
                className="relative mx-auto max-w-md border p-7"
                style={{
                  background: COLOR.paper,
                  borderColor: COLOR.edge,
                  boxShadow: "0 2px 12px rgba(28, 43, 63, 0.07)",
                }}
              >
                <span
                  aria-hidden
                  className="absolute -top-3 left-8 h-6 w-24"
                  style={{ background: TAPE[1], opacity: 0.9, transform: "rotate(-2deg)" }}
                />

                <p
                  className="text-xs uppercase tracking-[0.18em]"
                  style={{ color: COLOR.stamp, ...bodyStyle }}
                >
                  ฝั่ง{guest.side}
                </p>

                <p className="mt-3 text-2xl" style={{ color: COLOR.ink, ...handStyle }}>
                  {guest.name}
                </p>

                <p className="mt-6 text-[2.6rem]" style={{ color: COLOR.ink, ...handStyle }}>
                  {guest.table}
                </p>

                <p
                  className="mt-2 text-sm"
                  style={{ color: COLOR.inkMuted, lineHeight: `${LINE_HEIGHT}px`, ...bodyStyle }}
                >
                  จองไว้ {guest.seats} ที่
                </p>

                {/* The only ruled surface in this section. The note is the one
                    piece of real handwriting-shaped copy here, so it is the one
                    that gets paper under it, set on the same 28px the rules
                    repeat at so the words sit on the lines. */}
                <p
                  className="mt-6 border-t pt-4 text-sm"
                  style={{
                    color: COLOR.ink,
                    borderColor: COLOR.rule,
                    lineHeight: `${LINE_HEIGHT}px`,
                    ...ruled(-5),
                    ...bodyStyle,
                  }}
                >
                  {guest.note}
                </p>
              </motion.div>
            )}

            {searched && !guest && (
              <motion.div
                key="miss"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.fast }}
                className="mx-auto max-w-md border border-dashed p-7 text-center"
                style={{ borderColor: COLOR.edge, background: COLOR.paper, ...bodyStyle }}
              >
                <p className="text-base" style={{ color: COLOR.ink }}>
                  ยังไม่เจอชื่อนี้ในลิสต์
                </p>
                <p
                  className="mt-2 text-sm"
                  style={{ color: COLOR.inkMuted, lineHeight: `${LINE_HEIGHT}px` }}
                >
                  ลองพิมพ์ชื่อเล่นแทนชื่อจริง หรือชื่อคนที่ชวนมาด้วยกัน
                  ถ้ายังไม่เจอทักฟ้าใน LINE ได้เลย เดี๋ยวจัดที่ให้
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
