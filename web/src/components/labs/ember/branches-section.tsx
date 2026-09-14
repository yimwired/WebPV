"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import { BRANCHES, type Branch } from "./data";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { originFrom, type ModalPayload } from "./popup-modal";
import { COLOR, Z, thaiStyle } from "./theme";

/** 021234571 reads as 02 123 4571 on the page and dials as tel: from the card. */
function formatPhone(phone: string) {
  return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`;
}

function payloadFor(branch: Branch, el: HTMLElement): ModalPayload {
  return {
    key: branch.id,
    eyebrow: `สาขา${branch.area}`,
    title: branch.name,
    lead: branch.note,
    facts: [
      { label: "เวลาเปิด", value: branch.hours },
      { label: "จำนวนโต๊ะ", value: `${branch.tables} โต๊ะ` },
      { label: "โทร", value: formatPhone(branch.phone) },
    ],
    list: { heading: "ที่อยู่", items: [branch.address] },
    note: "ที่อยู่และเบอร์โทรในหน้านี้สมมติขึ้นมาเพื่อสาธิตงานออกแบบ ไม่มีร้านจริงตามที่อยู่นี้",
    action: { label: "โทรจองโต๊ะ", href: `tel:${branch.phone}` },
    from: originFrom(el),
  };
}

interface BranchesSectionProps {
  onOpen: (payload: ModalPayload) => void;
}

export function BranchesSection({ onOpen }: BranchesSectionProps) {
  return (
    <section
      id="branches"
      className="relative scroll-mt-20 px-5 py-24 sm:px-8 lg:px-12"
      style={{ background: COLOR.cream, zIndex: Z.content }}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center"
        >
          <div>
            <motion.p
              variants={reveal}
              transition={revealTransition}
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: COLOR.flameDeep, ...thaiStyle }}
            >
              6 สาขา
            </motion.p>
            <motion.h2
              variants={reveal}
              transition={revealTransition}
              className="mt-3 text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-tight"
              style={{ color: COLOR.ink, ...thaiStyle }}
            >
              หาสาขาที่ใกล้ที่สุด
            </motion.h2>
            <motion.p
              variants={reveal}
              transition={revealTransition}
              className="mt-4 max-w-md text-base leading-relaxed"
              style={{ color: COLOR.inkMuted, ...thaiStyle }}
            >
              กดที่สาขาเพื่อดูที่อยู่เต็ม เวลาเปิด และเบอร์จอง วันศุกร์กับเสาร์คนเยอะ จองไว้ก่อนดีกว่า
            </motion.p>
          </div>

          <motion.div
            variants={reveal}
            transition={revealTransition}
            className="relative aspect-[3/2] overflow-hidden rounded-[1.75rem] shadow-[0_20px_44px_rgba(21,12,10,0.2)]"
          >
            <Image
              src="/lab-demos/ember/shop-night.webp"
              alt="บรรยากาศร้านตอนกลางคืน โต๊ะเต็มและเก้าอี้สีแดง"
              fill
              sizes="(max-width: 1024px) 90vw, 480px"
              className="object-cover"
            />
          </motion.div>
        </motion.div>

        <motion.ul
          variants={stagger(0.07, 0.1)}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {BRANCHES.map((branch) => (
            <motion.li key={branch.id} variants={reveal} transition={revealTransition}>
              <button
                type="button"
                onClick={(event) => onOpen(payloadFor(branch, event.currentTarget))}
                className="flex h-full w-full flex-col gap-3 rounded-2xl border-2 p-5 text-left transition-colors duration-200 hover:border-current focus-visible:outline-2 focus-visible:outline-offset-4"
                style={{ borderColor: "rgba(58,37,30,0.16)", outlineColor: COLOR.flame, ...thaiStyle }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-extrabold" style={{ color: COLOR.ink }}>
                    {branch.name}
                  </h3>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{ background: COLOR.creamDeep, color: COLOR.inkMuted }}
                  >
                    {branch.tables} โต๊ะ
                  </span>
                </div>

                <p
                  className="flex items-start gap-2 text-sm leading-relaxed"
                  style={{ color: COLOR.inkMuted }}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {branch.area}
                </p>

                <p
                  className="mt-auto flex items-center gap-2 text-sm font-semibold"
                  style={{ color: COLOR.flameDeep }}
                >
                  <Clock className="h-4 w-4" aria-hidden />
                  {branch.hours}
                </p>
              </button>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
