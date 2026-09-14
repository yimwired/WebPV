"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CRAFT_FACTS } from "./data";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { COLOR, Z, displayStyle, thaiStyle } from "./theme";

/**
 * The claim the brand rests on, next to the photograph that proves it.
 *
 * An earlier pass ran the photo full bleed with the copy on top. Making the
 * muted tone clear 4.5:1 against the brightest coals needed a scrim at 86%,
 * which left almost nothing of the picture to look at. Setting the photograph
 * beside the text instead costs nothing: the copy gets the flat charcoal it
 * was measured on, and the fire is at full strength a column away.
 */
export function CraftSection() {
  return (
    <section
      className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12"
      style={{ background: COLOR.char, zIndex: Z.content }}
    >
      {/* A single warm glow bleeding out of the photograph's side of the
          section, so the two columns feel lit by the same fire. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[10%] top-1/4 h-[60vh] w-[60vh] rounded-full blur-[110px]"
        style={{ background: COLOR.flame, opacity: 0.2 }}
      />

      <div className="relative mx-auto max-w-6xl" style={{ zIndex: Z.content }}>
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]"
        >
          <div>
            <motion.p
              variants={reveal}
              transition={revealTransition}
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: COLOR.ember, ...thaiStyle }}
            >
              ทำไมต้องถ่าน
            </motion.p>

            <motion.h2
              variants={reveal}
              transition={revealTransition}
              className="mt-4 text-[clamp(2rem,5.5vw,3.5rem)] font-extrabold leading-[1.12]"
              style={{ color: COLOR.onChar, ...thaiStyle }}
            >
              ไขมันหยดลงถ่าน แล้วกลับขึ้นมาเป็นควัน
            </motion.h2>

            <motion.p
              variants={reveal}
              transition={revealTransition}
              className="mt-6 max-w-lg text-base leading-relaxed sm:text-lg"
              style={{ color: COLOR.onCharMuted, ...thaiStyle }}
            >
              เตาไฟฟ้าให้ความร้อนเท่ากันทั้งแผ่น แต่ไม่มีควัน กลิ่นที่ติดหมูสามชั้นมาจากไขมันที่หยดลงถ่านแล้วลุกขึ้นมาใหม่
              เราเลยไม่มีเตาไฟฟ้าสักเตาในร้าน จุดถ่านใหม่ทุกโต๊ะ และเปลี่ยนตะแกรงให้ระหว่างมื้อ
            </motion.p>
          </div>

          <motion.div
            variants={reveal}
            transition={revealTransition}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_rgba(0,0,0,0.5)] lg:rotate-[1.5deg]"
          >
            <Image
              src="/lab-demos/ember/grill-close.webp"
              alt="หมูสามชั้นวางบนตะแกรงเหนือถ่านที่กำลังลุก"
              fill
              sizes="(max-width: 1024px) 90vw, 480px"
              className="object-cover"
            />
          </motion.div>
        </motion.div>

        <motion.dl
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          className="mt-16 grid gap-8 border-t pt-12 sm:grid-cols-3"
          style={{ borderColor: "rgba(253,246,234,0.16)", ...thaiStyle }}
        >
          {CRAFT_FACTS.map((fact) => (
            <motion.div key={fact.label} variants={reveal} transition={revealTransition}>
              <dd
                className="text-5xl leading-none sm:text-6xl"
                style={{ ...displayStyle, color: COLOR.ember }}
              >
                {fact.figure}
              </dd>
              <dt className="mt-3 text-lg font-bold" style={{ color: COLOR.onChar }}>
                {fact.label}
              </dt>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: COLOR.onCharMuted }}>
                {fact.detail}
              </p>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
