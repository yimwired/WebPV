"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import {
  ACTS,
  DAYS,
  STAGES,
  clock,
  duration,
  stageOf,
  type Act,
  type DayId,
} from "./data";
import { planFor, type Entry } from "./schedule";

// Maximalism with one rule kept: every bright fill carries black type, never
// off-white. Yellow, green and pink all sit above 5.6:1 against the page and
// against black, while off-white on any of them lands between 1.3 and 3.3,
// which is the trap this look walks into every time.

const DAY_IDS = DAYS.map((day) => day.id);

/** A dot screen, the size a cheap poster press would have used. */
const DOTS = {
  backgroundImage:
    "radial-gradient(#0d0b0a 1.2px, transparent 1.2px), radial-gradient(#0d0b0a 1.2px, transparent 1.2px)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0, 7px 7px",
  opacity: 0.16,
};

/**
 * The same screen over the dark half. The dots carry their own alpha rather
 * than sitting on a layer with `opacity`, so the pattern can be the page's own
 * background and everything on the page stays above it without a z-index.
 */
const DOTS_DARK = {
  backgroundImage:
    "radial-gradient(rgba(251,247,239,0.07) 1px, transparent 1px), radial-gradient(rgba(251,247,239,0.07) 1px, transparent 1px)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 8px 8px",
};

const STICKER_LINES = [
  "สามเวที",
  "สองวัน",
  "ยี่สิบสี่วง",
  "ไม่มีวงไหนรอคุณ",
];

function Marquee({ reduced }: { reduced: boolean }) {
  return (
    <div className="overflow-hidden border-y-4 border-[#0d0b0a] bg-[#f5e04b] py-2">
      <motion.div
        className="flex w-max gap-10 pr-10 text-[15px] font-bold tracking-[0.18em] whitespace-nowrap text-[#0d0b0a] uppercase"
        animate={reduced ? undefined : { x: ["0%", "-50%"] }}
        transition={
          reduced ? undefined : { duration: 22, ease: "linear", repeat: Infinity }
        }
      >
        {/* two copies so the loop has something to run into at the seam */}
        {[0, 1].map((copy) => (
          <span key={copy} className="flex gap-10 pr-10">
            {STICKER_LINES.map((text, i) => (
              <span key={`${copy}-${i}`}>{text} ✱</span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

interface ActCardProps {
  act: Act;
  picked: boolean;
  onToggle: () => void;
}

function ActCard({ act, picked, onToggle }: ActCardProps) {
  const stage = stageOf(act.stage);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={picked}
      className={`group relative block w-full border-4 border-[#0d0b0a] px-3 py-2.5 text-left transition-transform hover:-translate-y-0.5 ${
        picked ? "text-[#0d0b0a]" : "bg-[#17140f] text-[#fbf7ef]"
      }`}
      style={picked ? { background: stage.colour } : undefined}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[13px] font-bold">
          {clock(act.start)}
        </span>
        <span
          className={`font-mono text-[11px] ${picked ? "text-[#0d0b0a]" : "text-[#b9b2a4]"}`}
        >
          {duration(act.end - act.start)}
        </span>
      </span>

      <span className="mt-1 block text-[17px] leading-tight font-bold">
        {act.name}
      </span>

      <span
        className={`mt-1 block text-[12px] ${picked ? "text-[#0d0b0a]" : "text-[#b9b2a4]"}`}
      >
        {act.tag}
      </span>

      <span
        aria-hidden
        className={`absolute -top-3 -right-2 rotate-6 border-2 border-[#0d0b0a] bg-[#fbf7ef] px-1.5 py-0.5 text-[10px] font-bold text-[#0d0b0a] ${
          picked ? "block" : "hidden"
        }`}
      >
        เลือกแล้ว
      </span>
    </button>
  );
}

function PlanRow({ entry }: { entry: Entry }) {
  if (entry.kind === "act") {
    const stage = stageOf(entry.act.stage);
    return (
      <li className="flex items-start gap-3 border-4 border-[#0d0b0a] bg-[#fbf7ef] px-3 py-2 text-[#0d0b0a]">
        <span className="font-mono text-[13px] font-bold whitespace-nowrap">
          {clock(entry.act.start)}
          <span className="block text-[11px] font-normal">
            {clock(entry.act.end)}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-[16px] leading-tight font-bold">
            {entry.act.name}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[12px]">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 border-2 border-[#0d0b0a]"
              style={{ background: stage.colour }}
            />
            {stage.name}
          </span>
        </span>
      </li>
    );
  }

  if (entry.kind === "clash") {
    return (
      <li className="border-4 border-[#0d0b0a] bg-[#ff2e88] px-3 py-2.5 text-[#0d0b0a]">
        <p className="text-[14px] font-bold">
          ชนกัน {entry.overlap} นาที บวกเดินอีก {entry.walk} นาที
        </p>
        <p className="mt-1 text-[13px] leading-relaxed">
          ยังไงก็เสีย <strong>{entry.cost} นาที</strong> อยู่จนจบ{" "}
          {entry.from.name} แล้วถึง {stageOf(entry.to.stage).name} ตอน{" "}
          {clock(entry.arrive)} หรือออกตอน {clock(entry.leaveBy)} เพื่อดู{" "}
          {entry.to.name} ตั้งแต่ต้น
        </p>
      </li>
    );
  }

  if (entry.kind === "tight") {
    return (
      <li className="border-4 border-[#0d0b0a] bg-[#f5e04b] px-3 py-2.5 text-[14px] font-bold text-[#0d0b0a]">
        ห่างกัน {entry.gap} นาที แต่เดิน {entry.walk} นาที ไปถึงช้า{" "}
        {entry.late} นาที
      </li>
    );
  }

  if (entry.kind === "walk") {
    return (
      <li className="border-l-4 border-[#25d07a] px-3 py-1.5 text-[13px] text-[#fbf7ef]">
        เดิน {entry.walk} นาที มีเวลา {entry.gap} นาที พอดี
      </li>
    );
  }

  return (
    <li className="border-l-4 border-[#3a342a] px-3 py-1.5 text-[13px] text-[#b9b2a4]">
      ว่าง {duration(entry.gap)} กินข้าวได้
    </li>
  );
}

export function ClashDemo() {
  const reduced = useReducedMotion() ?? false;
  const [day, setDay] = useState<DayId>("sat");
  const [picked, setPicked] = useState<string[]>([]);

  const pickedActs = useMemo(
    () => ACTS.filter((act) => picked.includes(act.id)),
    [picked],
  );
  const plans = useMemo(() => planFor(pickedActs, DAY_IDS), [pickedActs]);

  const booked = plans.reduce((total, plan) => total + plan.booked, 0);
  const clashes = plans.reduce((total, plan) => total + plan.clashes, 0);

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  return (
    <main
      className="relative min-h-dvh bg-[#0d0b0a] pb-28 font-[family-name:var(--font-clash-body)] text-[#fbf7ef]"
      style={DOTS_DARK}
    >
      <Marquee reduced={reduced} />

      {/* ── the poster ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b-4 border-[#0d0b0a] bg-[#25d07a] px-5 pt-10 pb-12 sm:px-8">
        {/* Halftone, not a wash. A flat fill this big is where the look goes
            limp, and a dot screen is what a printed poster would have left. */}
        <div aria-hidden className="absolute inset-0" style={DOTS} />

        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <div>
            <p className="inline-block -rotate-2 border-4 border-[#0d0b0a] bg-[#fbf7ef] px-2.5 py-1 text-[13px] font-bold text-[#0d0b0a]">
              14 - 15 ก.พ. · ทุ่งหลังวัด
            </p>

            <h1 className="mt-4 font-[family-name:var(--font-clash-display)] text-[clamp(3rem,13vw,8.5rem)] leading-[0.82] font-bold tracking-tight text-[#0d0b0a]">
              เสียงชน
              <span className="mt-1 block text-[clamp(1rem,3.4vw,2.2rem)] tracking-[0.3em]">
                CLASH FEST
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-[15px] leading-relaxed font-medium text-[#0d0b0a]">
              สามเวที ยี่สิบสี่วง สองวัน เลือกวงที่อยากดู
              แล้วหน้านี้จะบอกเองว่าอันไหนชนกัน เสียเวลาไปกี่นาที
              และเดินจากเวทีหนึ่งไปอีกเวทีทันไหม
            </p>
          </div>

          {/* the stub: the thing a festival page is actually selling, stacked
              at an angle so the block does not end in a tidy rectangle */}
          <div className="relative">
            <div className="rotate-2 border-4 border-[#0d0b0a] bg-[#0d0b0a] p-4 text-[#fbf7ef]">
              <p className="font-[family-name:var(--font-clash-display)] text-[13px] tracking-[0.3em] text-[#f5e04b] uppercase">
                ตั๋ว
              </p>
              <dl className="mt-2 space-y-1.5 text-[15px]">
                {[
                  ["สองวัน", "1,290"],
                  ["วันเดียว", "790"],
                  ["นักเรียน นักศึกษา", "590"],
                ].map(([label, price]) => (
                  <div key={label} className="flex items-baseline gap-3">
                    <dt className="flex-1 border-b-2 border-dashed border-[#3a342a]">
                      {label}
                    </dt>
                    <dd className="font-bold">{price}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[12px] text-[#b9b2a4]">
                ราคาสมมติ หน้านี้ไม่ได้ขายอะไรจริง
              </p>
            </div>

            <p
              aria-hidden
              className="absolute -top-5 -right-3 rotate-12 border-4 border-[#0d0b0a] bg-[#ff2e88] px-2 py-1 text-[13px] font-bold text-[#0d0b0a]"
            >
              ขายแล้ว 70%
            </p>
          </div>
        </div>
      </header>

      {/* ── the site map, which is why walking matters ─────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
        <ul className="grid gap-3 sm:grid-cols-3">
          {STAGES.map((stage) => (
            <li
              key={stage.id}
              className="border-4 border-[#0d0b0a] bg-[#17140f] px-3 py-2.5"
            >
              <p className="flex items-center gap-2 text-[15px] font-bold">
                <span
                  aria-hidden
                  className="inline-block h-3.5 w-3.5 border-2 border-[#fbf7ef]"
                  style={{ background: stage.colour }}
                />
                {stage.name}
              </p>
              <p className="mt-1 text-[12px] text-[#b9b2a4]">{stage.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-[#b9b2a4]">
          เดินระหว่างเวที เวทีใหญ่ถึงโรงรถ 4 นาที · เวทีใหญ่ถึงเวทีป่า 7 นาที ·
          เวทีป่าถึงโรงรถ 9 นาที
        </p>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-10 sm:px-8 lg:grid-cols-[1fr_360px]">
        {/* ── lineup ───────────────────────────────────────────────── */}
        <section>
          <fieldset className="border-4 border-[#0d0b0a] bg-[#17140f] p-3">
            <legend className="ml-2 border-4 border-[#0d0b0a] bg-[#f5e04b] px-2 py-0.5 text-[13px] font-bold text-[#0d0b0a]">
              เลือกวัน
            </legend>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((option) => (
                <label
                  key={option.id}
                  className={`cursor-pointer border-4 border-[#0d0b0a] px-3 py-1.5 text-[14px] font-bold ${
                    day === option.id
                      ? "bg-[#fbf7ef] text-[#0d0b0a]"
                      : "bg-[#0d0b0a] text-[#fbf7ef]"
                  }`}
                >
                  <input
                    type="radio"
                    name="clash-day"
                    value={option.id}
                    checked={day === option.id}
                    onChange={() => setDay(option.id)}
                    className="sr-only"
                  />
                  {option.name} {option.date}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {STAGES.map((stage) => (
              <div key={stage.id}>
                <h2
                  className="border-4 border-[#0d0b0a] px-2 py-1 text-[14px] font-bold text-[#0d0b0a]"
                  style={{ background: stage.colour }}
                >
                  {stage.name}
                </h2>
                <ul className="mt-3 space-y-3">
                  {ACTS.filter(
                    (act) => act.stage === stage.id && act.day === day,
                  ).map((act) => (
                    <li key={act.id}>
                      <ActCard
                        act={act}
                        picked={picked.includes(act.id)}
                        onToggle={() => toggle(act.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── the answer ───────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="border-4 border-[#0d0b0a] bg-[#17140f] p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[17px] font-bold">ตารางของคุณ</h2>
              {picked.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPicked([])}
                  className="border-2 border-[#fbf7ef] px-2 py-1 text-[12px] font-bold text-[#fbf7ef] transition-colors hover:bg-[#fbf7ef] hover:text-[#0d0b0a]"
                >
                  ล้างทั้งหมด
                </button>
              )}
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { term: "วง", value: String(picked.length) },
                { term: "รวม", value: duration(booked) },
                { term: "จุดชน", value: String(clashes) },
              ].map((item) => (
                <div
                  key={item.term}
                  className="border-4 border-[#0d0b0a] bg-[#0d0b0a] px-1 py-2"
                >
                  <dt className="text-[11px] text-[#b9b2a4]">{item.term}</dt>
                  <dd className="mt-0.5 text-[15px] font-bold">{item.value}</dd>
                </div>
              ))}
            </dl>

            {/* Announced, because the whole point of the panel is what changes
                in it when a set is picked, and that is off screen on a phone. */}
            <div aria-live="polite" className="mt-4 space-y-5">
              {plans.length === 0 && (
                <p className="text-[14px] leading-relaxed text-[#b9b2a4]">
                  ยังไม่ได้เลือกสักวง กดชื่อวงในผังเพื่อใส่ลงตาราง
                </p>
              )}

              {plans.map((plan) => {
                const info = DAYS.find((d) => d.id === plan.day);
                return (
                  <section key={plan.day}>
                    <h3 className="mb-2 inline-block border-4 border-[#0d0b0a] bg-[#fbf7ef] px-2 py-0.5 text-[13px] font-bold text-[#0d0b0a]">
                      {info?.name} {info?.date}
                    </h3>
                    <ul className="space-y-2">
                      {plan.entries.map((entry, i) => (
                        <PlanRow
                          key={
                            entry.kind === "act"
                              ? entry.act.id
                              : `${entry.kind}-${entry.from.id}-${i}`
                          }
                          entry={entry}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* ── the band, because a poster ends in a shout ──────────────── */}
      <section className="relative overflow-hidden border-y-4 border-[#0d0b0a] bg-[#f5e04b] px-5 py-10 sm:px-8">
        <div aria-hidden className="absolute inset-0" style={DOTS} />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
          {/* The break is set by hand: Thai has no spaces between words, so
              the line box breaks wherever it fits and this one landed between
              คำถาม and คนดู, which reads as two unrelated sentences. */}
          <p className="max-w-xl font-[family-name:var(--font-clash-display)] text-[clamp(1.6rem,4.6vw,2.8rem)] leading-[1.05] font-bold text-[#0d0b0a]">
            <span className="block">หน้าอีเวนต์ที่ตอบคำถามคนดู</span>
            <span className="block">ไม่ใช่แค่แปะผังเวที</span>
          </p>
          <Link
            href="/services"
            className="border-4 border-[#0d0b0a] bg-[#0d0b0a] px-6 py-3 text-[15px] font-bold text-[#f5e04b] transition-transform hover:-translate-y-0.5"
          >
            อยากได้เว็บแบบนี้
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 pt-10 pb-10 sm:px-8">
        <p className="border-4 border-[#0d0b0a] bg-[#17140f] px-3 py-2 text-[12px] leading-relaxed text-[#b9b2a4]">
          เทศกาลสมมติสำหรับศึกษางานออกแบบ ชื่อวง เวลา และสถานที่ไม่มีอยู่จริง
          ตัวเลขเดินระหว่างเวทีเป็นของงานนี้เอง
        </p>
      </footer>
    </main>
  );
}
