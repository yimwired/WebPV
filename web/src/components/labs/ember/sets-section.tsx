"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { SETS, SET_TERMS, type BuffetSet } from "./data";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { originFrom, type ModalPayload } from "./popup-modal";
import { COLOR, Z, displayStyle, thaiStyle } from "./theme";

function payloadFor(set: BuffetSet, el: HTMLElement): ModalPayload {
  return {
    key: set.id,
    eyebrow: "ชุดบุฟเฟต์",
    title: set.name,
    latin: set.latin,
    price: `${set.price} บาทต่อคน`,
    photo: set.photo,
    lead: set.blurb,
    facts: SET_TERMS,
    list: { heading: "ในชุดนี้มีอะไร", items: set.includes },
    note: "ราคายังไม่รวมเครื่องดื่ม จองโต๊ะล่วงหน้าได้ทุกสาขา วันศุกร์และเสาร์แนะนำให้จองก่อน 17:00",
    action: { label: "โทรจองโต๊ะ", href: "tel:021234571" },
    from: originFrom(el),
  };
}

interface SetsSectionProps {
  onOpen: (payload: ModalPayload) => void;
}

export function SetsSection({ onOpen }: SetsSectionProps) {
  return (
    <section
      id="sets"
      className="relative scroll-mt-20 px-5 py-24 sm:px-8 lg:px-12"
      style={{ background: COLOR.creamDeep, zIndex: Z.content }}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          className="max-w-2xl"
        >
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: COLOR.flameDeep, ...thaiStyle }}
          >
            สามชุด ราคาเดียวต่อคน
          </motion.p>
          <motion.h2
            variants={reveal}
            transition={revealTransition}
            className="mt-3 text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-tight"
            style={{ color: COLOR.ink, ...thaiStyle }}
          >
            เลือกชุด แล้วนั่งได้ยาว 2 ชั่วโมง
          </motion.h2>
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="mt-4 text-base leading-relaxed"
            style={{ color: COLOR.inkMuted, ...thaiStyle }}
          >
            ทุกชุดเติมได้ไม่อั้น น้ำจิ้มตำสดทุกเช้า กดที่ชุดไหนก็ได้เพื่อดูรายการเต็ม
          </motion.p>
        </motion.div>

        <motion.ul
          variants={stagger(0.12, 0.1)}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SETS.map((set) => (
            <motion.li key={set.id} variants={reveal} transition={revealTransition}>
              <button
                type="button"
                onClick={(event) => onOpen(payloadFor(set, event.currentTarget))}
                className="group block w-full overflow-hidden rounded-[1.75rem] text-left shadow-[0_18px_40px_rgba(21,12,10,0.12)] transition-transform duration-300 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:hover:translate-y-0"
                style={{ background: COLOR.cream, outlineColor: COLOR.flame }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={set.photo}
                    alt={`ชุด${set.name}`}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 360px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                  />
                  {set.tag && (
                    <span
                      className="absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-bold"
                      style={{ background: COLOR.ember, color: COLOR.char, ...thaiStyle }}
                    >
                      {set.tag}
                    </span>
                  )}
                </div>

                <div className="space-y-3 p-6" style={thaiStyle}>
                  <div className="flex items-baseline justify-between gap-3">
                    {/* The Latin name sits here rather than over the photograph:
                        on top of an image its contrast depends on whichever
                        pixels the crop happens to land on, and no amount of
                        scrim makes that a number anyone can check. */}
                    <h3 className="flex items-baseline gap-2 text-2xl font-extrabold" style={{ color: COLOR.ink }}>
                      {set.name}
                      <span
                        aria-hidden
                        className="text-sm"
                        style={{ ...displayStyle, color: COLOR.inkMuted }}
                      >
                        {set.latin}
                      </span>
                    </h3>
                    <p className="text-xl font-extrabold" style={{ color: COLOR.flameDeep }}>
                      {set.price}.-
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: COLOR.inkMuted }}>
                    {set.blurb}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-bold"
                    style={{ color: COLOR.flameDeep }}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    ดูรายการเต็ม
                  </span>
                </div>
              </button>
            </motion.li>
          ))}
        </motion.ul>

        <motion.dl
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          className="mt-10 grid gap-3 sm:grid-cols-3"
          style={thaiStyle}
        >
          {SET_TERMS.map((term) => (
            <motion.div
              key={term.label}
              variants={reveal}
              transition={revealTransition}
              className="rounded-2xl border px-5 py-4"
              style={{ borderColor: "rgba(58,37,30,0.16)" }}
            >
              <dt
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: COLOR.inkMuted }}
              >
                {term.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold" style={{ color: COLOR.ink }}>
                {term.value}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
