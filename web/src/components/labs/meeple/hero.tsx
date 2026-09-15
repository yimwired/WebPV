"use client";

import { motion } from "framer-motion";
import { Press, Sprite } from "./pixel";
import { ARROW, CUP, DIE, HOURGLASS, MEEPLE } from "./sprites";
import { reveal, revealTransition, stagger } from "./motion";
import { ACCENT, COLOR, UNIT, dither, pixelFrame, thaiStyle } from "./theme";

const FACTS = ["สอนฟรีทุกเกม", "เปิดถึงห้าทุ่ม", "ไม่ต้องจองโต๊ะ"];

/**
 * The table, from above. Built out of the same sprites the rest of the page
 * uses rather than one big illustration, so there is nothing here that a client
 * would have to commission separately: four meeples, a board, and the things
 * that end up on a table by the second hour.
 */
/** Four pieces mid-game. An empty board is a chessboard; an occupied one is a
 *  table somebody is sitting at, which is the thing being sold. */
const PIECES: Record<number, string> = {
  11: ACCENT.jade.value,
  30: ACCENT.tomato.value,
  41: ACCENT.gold.value,
  52: ACCENT.blue.value,
};

function TableScene() {
  const board = Array.from({ length: 64 }, (_, i) => i);

  return (
    <div
      className="w-full max-w-sm p-5 sm:p-6"
      style={{
        background: COLOR.paperDeep,
        boxShadow: pixelFrame(COLOR.ink),
        ...dither("rgba(36, 31, 49, 0.07)"),
      }}
      aria-hidden
    >
      <div className="flex items-end justify-between">
        <Sprite map={MEEPLE} scale={3} palette={{ "3": ACCENT.jade.value }} className="mpl-bob" />
        <Sprite map={MEEPLE} scale={3} palette={{ "3": ACCENT.blue.value }} className="mpl-bob-slow" />
      </div>

      <div
        className="mx-auto my-5 grid w-fit grid-cols-8"
        style={{ boxShadow: pixelFrame(COLOR.ink) }}
      >
        {board.map((cell) => {
          const dark = (Math.floor(cell / 8) + cell) % 2 === 0;
          const piece = PIECES[cell];
          return (
            <span
              key={cell}
              className="grid place-items-center"
              style={{
                width: UNIT * 8,
                height: UNIT * 8,
                background: dark ? ACCENT.gold.value : COLOR.panel,
              }}
            >
              {piece && <Sprite map={MEEPLE} scale={1} palette={{ "3": piece }} />}
            </span>
          );
        })}
      </div>

      <div className="flex items-end justify-between">
        <Sprite map={MEEPLE} scale={3} palette={{ "3": ACCENT.tomato.value }} className="mpl-bob-slow" />
        <Sprite map={DIE} scale={2} />
        <Sprite map={HOURGLASS} scale={2} />
        <Sprite map={CUP} scale={2} />
        <Sprite map={MEEPLE} scale={3} palette={{ "3": ACCENT.gold.value }} className="mpl-bob" />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" style={{ background: COLOR.paper }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
        <motion.div initial="hidden" animate="shown" variants={stagger(0.07)} style={thaiStyle}>
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="inline-block px-3 py-2 text-sm font-bold"
            style={{
              background: ACCENT.tomato.value,
              color: ACCENT.tomato.on,
              boxShadow: pixelFrame(COLOR.ink),
            }}
          >
            คาเฟ่บอร์ดเกม ซอยอารีย์ 2
          </motion.p>

          <motion.h1
            variants={reveal}
            transition={revealTransition}
            className="mt-6 text-[clamp(2.2rem,7vw,3.75rem)] font-bold leading-[1.15]"
            style={{ color: COLOR.ink }}
          >
            {/* Two complete lines. Left to wrap on its own the second one broke
                after ครึ่ง and left ชั่วโมง alone on a third line, which is a
                legal Thai break and still reads as a mistake at this size. */}
            มาถึงก็ได้เล่นเลย
            <br />
            ไม่ต้องยืนงงหน้าชั้น
          </motion.h1>

          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="mt-5 max-w-lg text-lg leading-relaxed"
            style={{ color: COLOR.inkMuted }}
          >
            บนชั้นมี 200 กล่อง แต่ที่เล่นได้จริงในเย็นนี้เหลือไม่กี่กล่อง
            ตอบสามข้อ แล้วเราตัดให้เหลือเท่าที่เล่นจบทัน
          </motion.p>

          <motion.div variants={reveal} transition={revealTransition} className="mt-8 flex flex-wrap gap-4">
            <Press
              href="#finder"
              background={ACCENT.blue.value}
              color={ACCENT.blue.on}
              className="h-14 px-6 text-base font-bold"
            >
              หาเกมให้หน่อย
              <Sprite map={ARROW} scale={1} palette={{ "0": ACCENT.blue.on }} />
            </Press>
            <Press
              href="#rates"
              background={COLOR.panel}
              color={COLOR.ink}
              className="h-14 px-6 text-base font-bold"
            >
              ดูค่าโต๊ะ
            </Press>
          </motion.div>

          <motion.ul
            variants={reveal}
            transition={revealTransition}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium"
            style={{ color: COLOR.inkMuted }}
          >
            {FACTS.map((fact) => (
              <li key={fact} className="flex items-center gap-2">
                <span style={{ width: UNIT * 2, height: UNIT * 2, background: ACCENT.jade.deep }} />
                {fact}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="shown"
          variants={stagger(0.05, 0.1)}
          className="flex justify-center lg:justify-end"
        >
          <motion.div variants={reveal} transition={revealTransition} className="w-full max-w-sm">
            <TableScene />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
