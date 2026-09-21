"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { LOAN, PROJECT, UNITS, baht, millions } from "./data";
import { assess } from "./loan";
import { Chart } from "./chart";

// A project site that sells the way a good agent sells: by answering the two
// questions a listing never does, which are what has to be in the account on
// transfer day and whether a bank will lend at all. The numbers are worked at
// the floating rate rather than the three-year teaser, so nothing here flatters
// itself.

const PAPER = "#f6f4f0";
const INK = "#1a1c20";
const MUTED = "#5d6470";
const LINE = "#d8d3ca";
const BRAND = "#1b5e9c";
const COST = "#a3492a";

const DOWN_LIMITS = { min: 10, max: 50 };

export function DeedDemo() {
  const [unitId, setUnitId] = useState(UNITS[1].id);
  const [income, setIncome] = useState(45_000);
  const [downShare, setDownShare] = useState(10);
  const [years, setYears] = useState(30);

  const unit = UNITS.find((option) => option.id === unitId) ?? UNITS[1];
  const downPayment = Math.round((unit.price * downShare) / 100);

  const deal = useMemo(
    () => assess(unit, downPayment, income, years),
    [unit, downPayment, income, years],
  );

  return (
    <main
      className="min-h-dvh pb-28 font-[family-name:var(--font-deed-body)]"
      style={{ background: PAPER, color: INK }}
    >
      {/* the project's own plate */}
      <header className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
        <div
          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b pb-3"
          style={{ borderColor: LINE }}
        >
          <p className="font-[family-name:var(--font-deed-head)] text-[16px] tracking-[0.3em]">
            {PROJECT.latin}
          </p>
          <p className="text-[13px]" style={{ color: MUTED }}>
            {PROJECT.line} · {PROJECT.handover}
          </p>
        </div>

        <div className="pt-10 pb-8">
          <h1 className="max-w-3xl font-[family-name:var(--font-deed-head)] text-[clamp(2rem,5.4vw,3.5rem)] leading-[1.16] font-semibold">
            <span className="block">ราคาที่ติดป้ายไว้</span>
            <span className="block">ไม่ใช่เงินที่คุณต้องมี</span>
          </h1>
          <p
            className="mt-5 max-w-xl text-[15px] leading-relaxed"
            style={{ color: MUTED }}
          >
            กรอกรายได้กับเงินที่มี แล้วหน้านี้ตอบสามอย่างที่ประกาศขายไม่เคยตอบ
            ผ่อนเดือนละเท่าไหร่จริง ธนาคารจะอนุมัติไหม
            และวันโอนต้องมีเงินสดในบัญชีเท่าไหร่นอกจากเงินดาวน์
          </p>
        </div>
      </header>

      {/* the units */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {UNITS.map((option) => {
            const active = option.id === unitId;
            return (
              <label
                key={option.id}
                data-unit={option.id}
                data-price={option.price}
                data-sqm={option.sqm}
                className={`cursor-pointer border p-4 transition-colors ${
                  active ? "bg-white" : "hover:bg-white/60"
                }`}
                style={{ borderColor: active ? INK : LINE }}
              >
                <input
                  type="radio"
                  name="deed-unit"
                  value={option.id}
                  checked={active}
                  onChange={() => setUnitId(option.id)}
                  className="sr-only"
                />
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] tracking-[0.16em] uppercase">
                    {option.name}
                  </span>
                  <span className="text-[13px]" style={{ color: MUTED }}>
                    ชั้น {option.floor}
                  </span>
                </div>
                <p className="mt-2 font-[family-name:var(--font-deed-head)] text-[22px] font-semibold">
                  {option.layout} {option.sqm} ตร.ม.
                </p>
                <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
                  {option.facing} · {option.note}
                </p>
                <p
                  className="mt-3 font-[family-name:var(--font-deed-head)] text-[20px]"
                  style={{ color: active ? BRAND : INK }}
                >
                  {millions(option.price)} ล้านบาท
                </p>
              </label>
            );
          })}
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-10 pb-12 sm:px-8 lg:grid-cols-[340px_1fr]">
        {/* what the buyer brings */}
        <section className="lg:sticky lg:top-6 lg:self-start">
          <div className="border bg-white p-5" style={{ borderColor: LINE }}>
            <div className="flex items-baseline justify-between">
              <label htmlFor="deed-income" className="text-[14px]">
                รายได้ต่อเดือน
              </label>
              <output
                htmlFor="deed-income"
                data-income
                className="font-[family-name:var(--font-deed-head)] text-[20px] tabular-nums"
              >
                {baht(income)}
              </output>
            </div>
            <input
              id="deed-income"
              type="range"
              min={20_000}
              max={200_000}
              step={1_000}
              value={income}
              onChange={(event) => setIncome(Number(event.target.value))}
              className="mt-2 h-6 w-full"
              style={{ accentColor: BRAND }}
            />

            <div className="mt-5 flex items-baseline justify-between">
              <label htmlFor="deed-down" className="text-[14px]">
                เงินดาวน์ {downShare}%
              </label>
              <output
                htmlFor="deed-down"
                data-down
                className="font-[family-name:var(--font-deed-head)] text-[20px] tabular-nums"
              >
                {baht(downPayment)}
              </output>
            </div>
            <input
              id="deed-down"
              type="range"
              min={DOWN_LIMITS.min}
              max={DOWN_LIMITS.max}
              step={1}
              value={downShare}
              onChange={(event) => setDownShare(Number(event.target.value))}
              className="mt-2 h-6 w-full"
              style={{ accentColor: BRAND }}
            />
            <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
              ธนาคารให้กู้ไม่เกิน {LOAN.maxLoanShare * 100}% ของราคาบ้านหลังแรก
              ดาวน์ขั้นต่ำจึงเป็น {baht(deal.minimumDown)} บาท
            </p>

            <fieldset className="mt-5 border-t pt-4" style={{ borderColor: LINE }}>
              <legend className="px-1 text-[12px] tracking-[0.18em] uppercase">
                ผ่อนกี่ปี
              </legend>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {LOAN.years.map((option) => {
                  const active = option === years;
                  return (
                    <label
                      key={option}
                      className="cursor-pointer border py-2 text-center text-[14px] transition-colors"
                      style={{
                        borderColor: active ? INK : LINE,
                        background: active ? INK : "transparent",
                        color: active ? PAPER : INK,
                      }}
                    >
                      <input
                        type="radio"
                        name="deed-years"
                        value={option}
                        checked={active}
                        onChange={() => setYears(option)}
                        className="sr-only"
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <p className="mt-4 text-[12px] leading-relaxed" style={{ color: MUTED }}>
              ค่างวดคิดที่อัตราลอยตัว {LOAN.floatRate}% ต่อปี (MRR {LOAN.mrr}% ลบ 2)
              ไม่ได้คิดที่อัตราโปรโมชัน {LOAN.promoRate}% สามปีแรก
              เพราะธนาคารใช้อัตราลอยตัวตัดสินว่าจะให้กู้เท่าไหร่
            </p>
          </div>
        </section>

        {/* what it costs */}
        <section>
          {/* the four figures the whole page turns on */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-b pb-6 sm:grid-cols-4" style={{ borderColor: LINE }}>
            {[
              ["ผ่อนต่อเดือน", `${baht(deal.payment)}`, "payment"],
              ["รายได้ขั้นต่ำ", `${baht(deal.incomeNeeded)}`, "needed"],
              ["เงินสดวันโอน", `${baht(deal.cashOnDay)}`, "cash"],
              ["ดอกเบี้ยตลอดสัญญา", `${baht(deal.totalInterest)}`, "interest"],
            ].map(([term, value, id]) => (
              <div key={id} data-figure={id}>
                <dt className="text-[12px] tracking-[0.14em] uppercase" style={{ color: MUTED }}>
                  {term}
                </dt>
                <dd
                  className="mt-1 font-[family-name:var(--font-deed-head)] text-[clamp(1.3rem,2.6vw,1.75rem)] leading-none font-semibold tabular-nums"
                  style={{ color: id === "interest" ? COST : INK }}
                >
                  {value}
                </dd>
                <dd className="mt-1 text-[12px]" style={{ color: MUTED }}>
                  บาท
                </dd>
              </div>
            ))}
          </dl>

          {/* whether a bank says yes */}
          <div
            aria-live="polite"
            data-verdict
            className="mt-6 border-l-2 pl-4"
            style={{ borderColor: deal.passes ? BRAND : COST }}
          >
            <p
              className="font-[family-name:var(--font-deed-head)] text-[17px] font-semibold"
              style={{ color: deal.passes ? BRAND : COST }}
            >
              {deal.passes ? "ยื่นกู้ผ่านเกณฑ์" : "ยังไม่ผ่านเกณฑ์"}
            </p>
            <div className="mt-2 space-y-2 text-[14px] leading-relaxed">
              {deal.passes ? (
                <p>
                  ธนาคารให้ภาระผ่อนรวมไม่เกิน {LOAN.dsr * 100}%
                  ของรายได้ ค่างวด {baht(deal.payment)} บาท
                  ต้องการรายได้ {baht(deal.incomeNeeded)} บาท
                  และที่กรอกมาคือ {baht(income)} บาท
                </p>
              ) : (
                <>
                  <p>
                    ค่างวด {baht(deal.payment)} บาท ต้องการรายได้{" "}
                    <strong>{baht(deal.incomeNeeded)} บาท</strong> ตามเกณฑ์{" "}
                    {LOAN.dsr * 100}% ที่ธนาคารใช้ ยังขาดอีก{" "}
                    <strong>{baht(deal.gap)} บาทต่อเดือน</strong>
                  </p>
                  {deal.remedy && (
                    <p data-remedy>
                      ทางออกมีสองทาง ดาวน์เพิ่มอีก{" "}
                      <strong>{baht(deal.remedy.moreDown)} บาท</strong>
                      {deal.remedy.longerYears
                        ? ` หรือยืดเป็น ${deal.remedy.longerYears} ปี แล้วค่างวดจะลงมาพอดีกับรายได้ที่มี`
                        : " ทางเดียว เพราะยืดไปถึงงวดยาวสุดที่ธนาคารให้ก็ยังไม่พอ"}
                    </p>
                  )}
                </>
              )}
              {deal.monthsSaved > 0 && (
                <p data-early style={{ color: MUTED }}>
                  สัญญา {years} ปี แต่สามปีแรกดอกเบี้ย {LOAN.promoRate}%
                  ทำให้เงินไปตัดต้นได้มากกว่า หนี้หมดจริงเร็วกว่ากำหนด{" "}
                  {Math.round(deal.monthsSaved)} งวด
                </p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Chart rows={deal.schedule} crossoverYear={deal.crossoverYear} />
          </div>

          <details className="mt-4 text-[14px]">
            <summary className="cursor-pointer py-1" style={{ color: MUTED }}>
              ดูเป็นตารางรายปี
            </summary>
            <table className="mt-2 w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b text-[12px] uppercase" style={{ borderColor: LINE, color: MUTED }}>
                  <th scope="col" className="py-1.5 text-left font-normal">ปีที่</th>
                  <th scope="col" className="py-1.5 text-right font-normal">ตัดเงินต้น</th>
                  <th scope="col" className="py-1.5 text-right font-normal">ดอกเบี้ย</th>
                  <th scope="col" className="py-1.5 text-right font-normal">เหลือหนี้</th>
                </tr>
              </thead>
              <tbody>
                {deal.schedule.map((row) => (
                  <tr key={row.year} data-year={row.year} className="border-b" style={{ borderColor: `${LINE}80` }}>
                    <td className="py-1 tabular-nums">{row.year}</td>
                    <td className="py-1 text-right tabular-nums">{baht(row.principal)}</td>
                    <td className="py-1 text-right tabular-nums">{baht(row.interest)}</td>
                    <td className="py-1 text-right tabular-nums">{baht(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          {/* transfer day */}
          <div className="mt-8 border bg-white p-5" style={{ borderColor: LINE }}>
            <p className="text-[12px] tracking-[0.18em] uppercase" style={{ color: MUTED }}>
              เงินสดที่ต้องมีวันโอน
            </p>
            <table className="mt-3 w-full border-collapse text-[14px]">
              <tbody>
                <tr className="border-b border-dotted" style={{ borderColor: LINE }}>
                  <td className="py-1.5">
                    เงินดาวน์ที่ค้างอยู่
                    <span className="block text-[12px]" style={{ color: MUTED }}>
                      {downShare}% ของราคาห้อง
                    </span>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {baht(deal.downPayment)}
                  </td>
                </tr>
                {deal.charges.map((charge) => (
                  <tr
                    key={charge.id}
                    data-charge={charge.id}
                    className="border-b border-dotted"
                    style={{ borderColor: LINE }}
                  >
                    <td className="py-1.5">
                      {charge.label}
                      <span className="block text-[12px]" style={{ color: MUTED }}>
                        {charge.basis}
                      </span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {baht(charge.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="border-b-2" style={{ borderColor: INK }}>
                  <td className="py-2 font-semibold">รวมที่ต้องมีวันโอน</td>
                  <td
                    data-cash-total
                    className="py-2 text-right font-[family-name:var(--font-deed-head)] text-[19px] font-semibold tabular-nums"
                  >
                    {baht(deal.cashOnDay)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-[12px] leading-relaxed" style={{ color: MUTED }}>
              ค่าธรรมเนียมโอนบางช่วงรัฐมีมาตรการลดให้ ซึ่งมีวันหมดอายุเสมอ
              หน้านี้คิดที่อัตราปกติ ถ้าตอนโอนมีมาตรการอยู่ก็ถือว่าได้เปรียบไป
            </p>
          </div>
        </section>
      </div>

      {/* the ask */}
      <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <div
          className="flex flex-wrap items-center justify-between gap-5 border-t pt-8"
          style={{ borderColor: LINE }}
        >
          <p className="max-w-xl font-[family-name:var(--font-deed-head)] text-[clamp(1.2rem,3vw,1.8rem)] leading-snug font-semibold">
            <span className="block">นัดดูห้องจริงได้ทุกวัน</span>
            <span className="block">ตัวเลขชุดนี้พิมพ์ให้ถือไปคุยกับธนาคารได้</span>
          </p>
          <Link
            href="/services"
            className="border-2 px-6 py-3 text-[15px] transition-colors"
            style={{ borderColor: BRAND, background: BRAND, color: PAPER }}
          >
            นัดเข้าชม
          </Link>
        </div>

        <p className="mt-8 text-[12px] leading-relaxed" style={{ color: MUTED }}>
          โครงการสมมติสำหรับศึกษางานออกแบบ อัตราดอกเบี้ย ค่าธรรมเนียม
          และเกณฑ์ที่ใช้คำนวณเป็นของจริงปี 2569 ราคาห้องไม่มีอยู่จริง ·{" "}
          {PROJECT.name} โดย {PROJECT.seller}
        </p>
      </section>
    </main>
  );
}
