"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  ADDITIONS,
  BAG_GRAMS,
  BASES,
  ESPRESSO_MG,
  POT,
  RECIPES,
  SHOP,
  grams,
} from "./data";
import { additionsByIds, baseById, brew } from "./brew";
import { Gauge, type Band } from "./gauge";

// An apothecary that blends tea to order, so the page is the shop's own paper:
// cream stock, a double rule around everything, one burgundy and one bottle
// green, and figures set in the label's own type. Nothing is photographed.
//
// Thai numerals stay in the imprint, where a shop of this age would have set
// them. Everything the customer has to act on, the grams and the degrees and
// the minutes, is in arabic figures, because a working instruction is read at
// a glance.

const PAPER = "#f2ece0";
const INK = "#221c17";

// Narrow enough that five degrees is a bar you can see, wide enough to hold
// every material the shop stocks with a little air at each end.
const TEMPERATURE = {
  domain: [68, 102] as [number, number],
  ticks: [70, 80, 90, 100],
};
const TIME = { domain: [0, 13] as [number, number], ticks: [0, 3, 6, 9, 12] };

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

export function SteepDemo() {
  const [baseId, setBaseId] = useState(RECIPES[0].baseId);
  const [additionIds, setAdditionIds] = useState<string[]>(
    RECIPES[0].additionIds,
  );

  const pot = useMemo(
    () => brew(baseById(baseId), additionsByIds(additionIds)),
    [baseId, additionIds],
  );

  const recipe = RECIPES.find(
    (option) =>
      option.baseId === baseId && sameSet(option.additionIds, additionIds),
  );

  const inPot = [pot.base, ...pot.additions];

  // A bar is drawn as failing when brew.ts filed a fault against it, rather
  // than by testing the bounds a second time here. Two implementations of one
  // rule agree only until one of them is edited.
  const faulted = (id: string, faults: string[]) =>
    pot.troubles.some(
      (trouble) => trouble.id === id && faults.includes(trouble.fault),
    );

  const temperatureRows: Band[] = inPot.map((material) => ({
    id: material.id,
    name: material.name,
    from: material.water.min,
    to: material.water.max,
    ok: !faulted(material.id, ["cold", "hot"]),
  }));
  const timeRows: Band[] = inPot.map((material) => ({
    id: material.id,
    name: material.name,
    from: material.steep.min,
    to: material.steep.max,
    ok: !faulted(material.id, ["short", "long"]),
  }));

  const toggle = (id: string) =>
    setAdditionIds((current) =>
      current.includes(id)
        ? current.filter((other) => other !== id)
        : [...current, id],
    );

  const shots = (pot.caffeinePerCup / ESPRESSO_MG).toFixed(1);

  return (
    <main
      className="min-h-dvh pb-28 font-[family-name:var(--font-steep-body)] text-[#221c17]"
      style={{ background: PAPER }}
    >
      {/* the shop's imprint, set the way a label carries it */}
      <header className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-y-2 border-[#221c17] py-2">
          <p className="font-[family-name:var(--font-steep-display)] text-[15px] tracking-[0.34em] uppercase">
            {SHOP.latin}
          </p>
          <p className="text-[13px] tracking-[0.1em] text-[#4a4037]">
            {SHOP.street} · {SHOP.since}
          </p>
        </div>

        <div className="pt-10 pb-8">
          <p className="font-[family-name:var(--font-steep-head)] text-[15px] text-[#6d1f2a]">
            {SHOP.name}
          </p>
          {/* Broken by hand: left to itself the line lands between ไม่ and
              ออกรส, which are one idea and read as two. */}
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-steep-head)] text-[clamp(2rem,5.6vw,3.7rem)] leading-[1.15] font-semibold">
            <span className="block">ชาผสมกาเดียว</span>
            <span className="block">มีของที่ไม่ออกรสเสมอ</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#4a4037]">
            รากกับเปลือกไม้ต้องน้ำเดือด ใบชาขมตั้งแต่ก่อนถึงตรงนั้น
            เลือกของที่อยากได้ลงกา แล้วใบสั่งข้างล่างบอกเองว่าน้ำกี่องศา
            แช่กี่นาที ตัวไหนไม่ออกรส และตัวไหนต้องแยกไปต้มอีกหม้อ
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-12 sm:px-8 lg:grid-cols-[330px_1fr]">
        {/* what goes in the pot */}
        <section className="lg:sticky lg:top-6 lg:self-start">
          <fieldset className="border border-[#221c17]/30 bg-white/60 p-4">
            <legend className="px-2 text-[12px] tracking-[0.2em] uppercase">
              ใบชาที่เป็นฐาน
            </legend>
            <div className="mt-1 space-y-1">
              {BASES.map((option) => {
                const active = option.id === baseId;
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-baseline justify-between gap-3 border px-3 py-2 text-[14px] transition-colors ${
                      active
                        ? "border-[#221c17] bg-[#221c17] text-[#f2ece0]"
                        : "border-transparent hover:border-[#221c17]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="steep-base"
                      value={option.id}
                      checked={active}
                      onChange={() => setBaseId(option.id)}
                      className="sr-only"
                    />
                    <span>{option.name}</span>
                    <span className="text-[12px] tabular-nums opacity-80">
                      {option.baht} บ./ก.
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[#4a4037]">
              {pot.base.note}
            </p>
          </fieldset>

          <fieldset className="mt-4 border border-[#221c17]/30 bg-white/60 p-4">
            <legend className="px-2 text-[12px] tracking-[0.2em] uppercase">
              ของที่ผสมลงไป
            </legend>
            <div className="mt-1 grid gap-1">
              {ADDITIONS.map((option) => {
                const active = additionIds.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-baseline justify-between gap-3 border px-3 py-1.5 text-[14px] transition-colors ${
                      active
                        ? "border-[#23412f] bg-[#23412f] text-[#f2ece0]"
                        : "border-transparent hover:border-[#221c17]/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggle(option.id)}
                      className="sr-only"
                    />
                    <span>{option.name}</span>
                    <span className="text-[12px] tabular-nums opacity-80">
                      {grams(option.grams)} ก.
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-4 border border-[#221c17]/30 bg-white/60 p-4">
            <p className="text-[12px] tracking-[0.2em] uppercase">
              สูตรของร้าน
            </p>
            <div className="mt-2 space-y-2">
              {RECIPES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setBaseId(option.baseId);
                    setAdditionIds(option.additionIds);
                  }}
                  className="block w-full border border-[#221c17]/25 px-3 py-2 text-left transition-colors hover:border-[#6d1f2a] hover:bg-[#6d1f2a]/10"
                >
                  <span className="font-[family-name:var(--font-steep-display)] text-[13px] tracking-[0.18em] text-[#6d1f2a]">
                    {option.latin}
                  </span>
                  <span className="mt-0.5 block text-[14px]">
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* the label the shop ties to the bag */}
        <section>
          <article className="border-2 border-[#221c17] bg-white p-1">
            <div className="border border-[#221c17]/50 px-5 py-6 sm:px-8">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <p className="font-[family-name:var(--font-steep-display)] text-[13px] tracking-[0.3em] uppercase">
                  ใบสั่งปรุง
                </p>
                <p className="font-[family-name:var(--font-steep-display)] text-[13px] tracking-[0.2em] text-[#6d1f2a]">
                  {recipe ? recipe.latin : "TO ORDER"}
                </p>
              </div>

              <h2
                data-blend
                className="mt-2 font-[family-name:var(--font-steep-head)] text-[clamp(1.5rem,3.4vw,2.2rem)] leading-tight font-semibold"
              >
                {recipe ? recipe.name : "สูตรผสมเอง"}
              </h2>
              <p className="mt-1 text-[14px] text-[#4a4037]">
                {recipe
                  ? recipe.line
                  : pot.additions.length === 0
                    ? `${pot.base.name}ล้วน ไม่ผสมอะไรเลย`
                    : `ผสมจาก${pot.base.name} กับของอีก ${pot.additions.length} อย่าง`}
              </p>

              {/* the weights, which is what the shop actually sells */}
              <table className="mt-6 w-full border-collapse text-[15px]">
                <caption className="sr-only">
                  ส่วนผสมต่อกา {POT.millilitres} มิลลิลิตร
                </caption>
                <tbody>
                  {inPot.map((material) => (
                    <tr
                      key={material.id}
                      data-weight={material.id}
                      className="border-b border-dotted border-[#221c17]/30"
                    >
                      <td className="py-1.5">{material.name}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {grams(material.grams)} ก.
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b-2 border-[#221c17]">
                    <td className="py-1.5 font-semibold">
                      รวมต่อกา {POT.millilitres} มล.
                    </td>
                    <td
                      data-total-grams
                      className="py-1.5 text-right font-semibold tabular-nums"
                    >
                      {grams(pot.totalGrams)} ก.
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* the instruction, in the four figures the pot is set by */}
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {[
                  ["น้ำ", `${pot.water}°C`, "water"],
                  ["แช่", `${pot.minutes} นาที`, "minutes"],
                  ["คาเฟอีน", `${pot.caffeinePerCup} มก.`, "caffeine"],
                  ["ค่าใบชา", `${pot.potBaht} บาท`, "baht"],
                ].map(([term, value, id]) => (
                  <div key={id} data-figure={id}>
                    <dt className="text-[12px] tracking-[0.16em] text-[#4a4037] uppercase">
                      {term}
                    </dt>
                    <dd className="mt-1 font-[family-name:var(--font-steep-display)] text-[26px] leading-none">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[13px] leading-relaxed text-[#4a4037]">
                คาเฟอีนคิดต่อถ้วย กาหนึ่งได้ {POT.cups} ถ้วย เท่ากับเอสเปรสโซ{" "}
                {shots} ช็อต
                {pot.caffeinePerCup >= 50
                  ? " กานี้แรงพอจะค้างถึงกลางคืน ชงก่อนบ่ายสาม"
                  : " ดื่มตอนเย็นได้"}
              </p>

              <p className="mt-5 border-t border-[#221c17]/30 pt-3 text-[12px] tracking-[0.14em] text-[#4a4037] uppercase">
                {SHOP.name} · ถุงชั่ง {BAG_GRAMS} กรัม {pot.bagBaht} บาท ·{" "}
                {SHOP.keeper}
              </p>
            </div>
          </article>

          {/* where the blend agrees with itself and where it does not */}
          <div className="mt-8 grid gap-8">
            <Gauge
              scaleId="temperature"
              caption="อุณหภูมิน้ำ °C"
              rows={temperatureRows}
              value={pot.water}
              domain={TEMPERATURE.domain}
              ticks={TEMPERATURE.ticks}
              format={(value) => `${value}°`}
              unit="C"
            />
            <Gauge
              scaleId="time"
              caption="เวลาแช่ นาที"
              rows={timeRows}
              value={pot.minutes}
              domain={TIME.domain}
              ticks={TIME.ticks}
              format={(value) => String(value)}
              unit=" นาที"
            />
          </div>

          {/* the note the label cannot hold */}
          <div
            aria-live="polite"
            className="mt-8 border-l-2 border-[#6d1f2a] pl-4"
          >
            <p className="font-[family-name:var(--font-steep-head)] text-[15px] text-[#6d1f2a]">
              บันทึกผู้ปรุง
            </p>

            <ul
              data-notes
              className="mt-2 space-y-2 text-[14px] leading-relaxed"
            >
              {pot.troubles.length === 0 && (
                <li>
                  ทุกอย่างในกานี้อยู่ในช่วงของตัวเอง ที่ {pot.water} องศา{" "}
                  {pot.minutes} นาที ชงหม้อเดียวจบ
                </li>
              )}

              {pot.troubles.map((trouble) => (
                <li key={`${trouble.id}-${trouble.fault}`}>
                  {trouble.fault === "cold" && (
                    <>
                      {trouble.name} ต้องการน้ำร้อนกว่ากานี้อีก{" "}
                      <strong>{trouble.by} องศา</strong> น้ำ {pot.water}{" "}
                      องศาดึงรสออกมาไม่หมด
                    </>
                  )}
                  {trouble.fault === "hot" && (
                    <>
                      {trouble.name} ทนน้ำได้ถึง{" "}
                      <strong>{pot.water - trouble.by} องศา</strong>{" "}
                      กานี้ร้อนเกินไป {trouble.by} องศา
                      กลิ่นลอยไปกับไอตั้งแต่เทน้ำ
                    </>
                  )}
                  {trouble.fault === "short" && (
                    <>
                      {trouble.name} ต้องแช่อีก{" "}
                      <strong>{trouble.by} นาที</strong> ถึงจะออกรส
                      แต่ใบชาขมก่อนถึงตรงนั้น
                    </>
                  )}
                  {trouble.fault === "long" && (
                    <>
                      {trouble.name} อยู่ในกาได้{" "}
                      <strong>{pot.minutes - trouble.by} นาที</strong>{" "}
                      กานี้แช่นานเกินไป {trouble.by} นาที
                    </>
                  )}
                </li>
              ))}
            </ul>

            {(pot.aside || pot.late) && (
              <div className="mt-4 space-y-3 border-t border-dashed border-[#221c17]/30 pt-3 text-[14px] leading-relaxed">
                {pot.aside && (
                  <p data-aside>
                    <span className="font-semibold">ต้มแยกอีกหม้อ</span>{" "}
                    {pot.aside.names.join(" กับ ")} ใส่น้ำครึ่งหนึ่งของกา
                    ตั้งไฟที่ {pot.aside.water} องศา {pot.aside.minutes} นาที
                    กรองแล้วเทลงกาชา
                  </p>
                )}
                {pot.late && (
                  <p data-late>
                    <span className="font-semibold">ใส่ทีหลัง</span>{" "}
                    {pot.late.names.join(" กับ ")}{" "}
                    {pot.late.afterMinutes !== null ? (
                      <>
                        รอให้กาแช่ไปแล้ว {pot.late.afterMinutes} นาทีค่อยใส่
                        พักให้น้ำลดลงมาราว {pot.late.water} องศาก่อนยิ่งดี
                      </>
                    ) : (
                      <>
                        ยกกาลงพักให้น้ำลดเหลือราว {pot.late.water} องศาก่อน
                        แล้วค่อยใส่ลงไป
                        กลิ่นจะอยู่ครบกว่าเทน้ำเดือดใส่ตั้งแต่แรก
                      </>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* the ask */}
      <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-5 border-t-2 border-[#221c17] pt-8">
          <p className="max-w-xl font-[family-name:var(--font-steep-head)] text-[clamp(1.2rem,3vw,1.8rem)] leading-snug font-semibold">
            <span className="block">ผสมเสร็จแล้วสั่งได้เลย</span>
            <span className="block">ร้านชั่งตามใบสั่งใบนี้</span>
          </p>
          <Link
            href="/services"
            className="border-2 px-6 py-3 text-[15px] transition-colors hover:bg-[#3a2a22]"
            style={{ color: PAPER, background: INK, borderColor: INK }}
          >
            คุยเรื่องสูตร
          </Link>
        </div>

        <p className="mt-8 text-[12px] leading-relaxed text-[#4a4037]">
          ร้านสมมติสำหรับศึกษางานออกแบบ อุณหภูมิและเวลาแช่เป็นค่าที่ใช้ชงกันจริง
          คาเฟอีนคิดจากปริมาณในใบแห้ง ราคาไม่มีอยู่จริง
        </p>
      </section>
    </main>
  );
}
