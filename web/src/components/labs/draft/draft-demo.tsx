"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { LAYOUTS, RATE, SHEET, baht } from "./data";
import { planRoom, metres } from "./plan";
import { Sheet } from "./sheet";

// A studio that shows its working drawings rather than renders, so the page is
// drawn in the same register: ruled paper, one pencil blue, one red for the
// corrections, and a title block at the foot of the sheet like a real drawing
// carries. Nothing on it is photographed.

const PAPER = "#f3f1e9";
const INK = "#23262b";

// The narrow end is below the widest run of units on purpose: a kitchen
// counter is 240 and a store room can be 180, and a plan that cannot show you
// that is not checking anything.
const ROOM_LIMITS = { width: [180, 520], depth: [200, 620] } as const;

export function DraftDemo() {
  const [layoutId, setLayoutId] = useState(LAYOUTS[0].id);
  const [width, setWidth] = useState(360);
  const [depth, setDepth] = useState(420);

  const layout = useMemo(
    () => LAYOUTS.find((option) => option.id === layoutId) ?? LAYOUTS[0],
    [layoutId],
  );
  const plan = useMemo(
    () => planRoom(layout, width, depth),
    [layout, width, depth],
  );

  const budget = {
    low: Math.round((plan.areaSqm * RATE.low) / 1000) * 1000,
    high: Math.round((plan.areaSqm * RATE.high) / 1000) * 1000,
  };

  return (
    <main
      className="min-h-dvh pb-28 font-[family-name:var(--font-draft-body)] text-[#23262b]"
      style={{ background: PAPER }}
    >
      {/* ── the header, set as a drawing sheet's own heading ─────────── */}
      <header className="mx-auto max-w-6xl px-5 pt-12 pb-8 sm:px-8">
        <p className="font-[family-name:var(--font-draft-hand)] text-[15px] text-[#a8341f]">
          {SHEET.revision}
        </p>
        <h1 className="mt-2 max-w-3xl text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.1] font-semibold tracking-tight">
          เราส่งแบบก่อนเสมอ ไม่ใช่ภาพเรนเดอร์สวยๆ
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#4a4f57]">
          ภาพเรนเดอร์บอกว่าห้องจะสวยแค่ไหน แบบบอกว่าของจะลงได้จริงไหม
          ลองใส่ขนาดห้องของคุณดู ผังข้างล่างวาดตามสัดส่วนจริง
          แล้วบอกว่าเหลือทางเดินกี่เซนติเมตร
        </p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-12 sm:px-8 lg:grid-cols-[320px_1fr]">
        {/* ── the controls, which are the brief ───────────────────────── */}
        <section className="lg:sticky lg:top-6 lg:self-start">
          <fieldset className="border border-[#23262b]/25 bg-white/70 p-4">
            <legend className="px-2 text-[13px] tracking-[0.18em] uppercase">
              ห้องอะไร
            </legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {LAYOUTS.map((option) => {
                const active = option.id === layout.id;
                return (
                  <label
                    key={option.id}
                    className={`cursor-pointer border px-3 py-2 text-[14px] transition-colors ${
                      active
                        ? "border-[#23262b] bg-[#23262b] text-[#f3f1e9]"
                        : "border-[#23262b]/30 hover:border-[#23262b]/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name="draft-layout"
                      value={option.id}
                      checked={active}
                      onChange={() => setLayoutId(option.id)}
                      className="sr-only"
                    />
                    {option.name}
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[#4a4f57]">
              {layout.note}
            </p>
          </fieldset>

          <div className="mt-4 space-y-4 border border-[#23262b]/25 bg-white/70 p-4">
            {[
              {
                id: "draft-width",
                label: "กว้าง",
                value: width,
                set: setWidth,
                limits: ROOM_LIMITS.width,
              },
              {
                id: "draft-depth",
                label: "ลึก",
                value: depth,
                set: setDepth,
                limits: ROOM_LIMITS.depth,
              },
            ].map((field) => (
              <div key={field.id}>
                <div className="flex items-baseline justify-between">
                  <label htmlFor={field.id} className="text-[14px]">
                    {field.label}
                  </label>
                  <output
                    htmlFor={field.id}
                    className="font-[family-name:var(--font-draft-hand)] text-[15px] text-[#2f5fa8]"
                  >
                    {metres(field.value)} ม.
                  </output>
                </div>
                <input
                  id={field.id}
                  type="range"
                  min={field.limits[0]}
                  max={field.limits[1]}
                  step={10}
                  value={field.value}
                  onChange={(event) => field.set(Number(event.target.value))}
                  className="mt-2 h-6 w-full accent-[#2f5fa8]"
                />
              </div>
            ))}

            <dl className="border-t border-dashed border-[#23262b]/30 pt-3 text-[14px]">
              <div className="flex justify-between">
                <dt>พื้นที่</dt>
                <dd className="font-semibold">
                  {plan.areaSqm.toFixed(1)} ตร.ม.
                </dd>
              </div>
              <div className="mt-1 flex justify-between">
                <dt>งบประมาณครบห้อง</dt>
                <dd className="font-semibold">
                  {baht(budget.low)} - {baht(budget.high)}
                </dd>
              </div>
            </dl>
            <p className="text-[12px] leading-relaxed text-[#4a4f57]">
              คิดที่ {baht(RATE.low)} ถึง {baht(RATE.high)} บาทต่อตารางเมตร
              ราคาสมมติสำหรับศึกษางานออกแบบ
            </p>
          </div>
        </section>

        {/* ── the sheet ───────────────────────────────────────────────── */}
        <section>
          <div className="border border-[#23262b]/40 bg-white p-3 sm:p-5">
            <Sheet layout={layout} plan={plan} />

            {/* the title block, at the foot of the sheet where it belongs */}
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-[#23262b]/40 pt-3 text-[12px] sm:grid-cols-4">
              {[
                ["โครงการ", SHEET.project],
                ["แบบ", SHEET.drawing],
                ["เลขที่แบบ", SHEET.number],
                ["เขียนแบบ", SHEET.drawnBy],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="tracking-[0.14em] text-[#4a4f57] uppercase">
                    {term}
                  </dt>
                  <dd className="mt-0.5 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── the notes in the margin, which is the whole point ─────── */}
          <div
            aria-live="polite"
            className="mt-5 border-l-2 border-[#a8341f] pl-4"
          >
            <p className="font-[family-name:var(--font-draft-hand)] text-[15px] text-[#a8341f]">
              หมายเหตุจากผู้เขียนแบบ
            </p>

            <ul className="mt-2 space-y-2 text-[14px] leading-relaxed">
              {plan.problems.length === 0 && (
                <li>
                  ห้องนี้ลงได้ทั้งชุด เหลือทางเดินกลางห้อง{" "}
                  <strong>{Math.round(plan.walkway)} ซม.</strong> จากที่ต้องการ{" "}
                  {plan.wanted} ซม.
                </li>
              )}

              {plan.problems.map((problem) => (
                <li key={`${problem.piece}-${problem.reason}`}>
                  {problem.reason === "walkway" ? (
                    <>
                      ทางเดินกลางห้องเหลือ{" "}
                      <strong>{Math.round(plan.walkway)} ซม.</strong>{" "}
                      แคบกว่าที่ห้องแบบนี้ต้องการ {plan.wanted} ซม. อยู่{" "}
                      <strong>{Math.round(problem.short)} ซม.</strong>{" "}
                      ขยายห้องหรือลดความลึกของเฟอร์นิเจอร์ลง
                    </>
                  ) : (
                    <>
                      {problem.piece} กว้างเกินผนัง{" "}
                      <strong>{Math.round(problem.short)} ซม.</strong>{" "}
                      ต้องสั่งทำขนาดพิเศษหรือเปลี่ยนรุ่น
                    </>
                  )}
                </li>
              ))}

              {!plan.sideFits && (
                <li className="text-[#4a4f57]">
                  {layout.side.name} ยังไม่ได้เขียนลงในผัง เพราะผนังข้าง
                  {layout.anchor.name}เหลือไม่ถึง {layout.side.width} ซม.
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>

      {/* ── the ask ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-5 border-t border-[#23262b]/30 pt-8">
          <p className="max-w-xl text-[clamp(1.2rem,3vw,1.8rem)] leading-snug font-semibold">
            <span className="block">ส่งขนาดห้องมา</span>
            <span className="block">ได้แบบร่างกลับไปใน 5 วัน</span>
          </p>
          <Link
            href="/services"
            className="border border-[#23262b] bg-[#23262b] px-6 py-3 text-[15px] text-[#f3f1e9] transition-colors hover:bg-[#3a4049]"
            style={{ color: PAPER, background: INK }}
          >
            คุยเรื่องแบบ
          </Link>
        </div>

        <p className="mt-8 text-[12px] leading-relaxed text-[#4a4f57]">
          สตูดิโอสมมติสำหรับศึกษางานออกแบบ ขนาดเฟอร์นิเจอร์เป็นขนาดมาตรฐานจริง
          ระยะทางเดินอ้างจากระยะที่ใช้ตรวจแบบทั่วไป ราคาไม่มีอยู่จริง
        </p>
      </section>
    </main>
  );
}
