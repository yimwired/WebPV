"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  BORROWED,
  ELEVATION_LIMITS,
  HOURS,
  SCENE,
  STUDIO,
  baht,
  metres,
  type Side,
} from "./data";
import { castFor, compare, type Light } from "./light";
import { Scene } from "./scene";

// A studio that builds composites, so the page argues the way a compositor
// argues: not that the picture looks wrong, but that the shadow is 2.6 times
// the length it should be and the lit side faces the other way. Everything on
// screen is drawn, nothing is photographed, and the scene is deliberately one
// no camera could have taken.

const INK = "#e8e2d6";
const PAPER = "#101725";
const SUN = "#e8a765";

const FIX_LABEL = {
  match: "เข้าฉากอยู่แล้ว",
  stretch: "ยืดเงาในโปรแกรม",
  redraw: "วาดเงาใหม่ทั้งชิ้น",
  reshoot: "ต้องถ่ายใหม่",
} as const;

export function UmbraDemo() {
  const [elevation, setElevation] = useState(24);
  const [side, setSide] = useState<Side>("left");
  const [borrowedId, setBorrowedId] = useState(BORROWED[0].id);
  const [corrected, setCorrected] = useState(false);

  const light: Light = useMemo(() => ({ elevation, side }), [elevation, side]);
  const borrowed =
    BORROWED.find((option) => option.id === borrowedId) ?? BORROWED[0];

  const borrowedLight: Light = corrected
    ? light
    : { elevation: borrowed.elevation, side: borrowed.side };

  const mismatch = compare(borrowed, light);
  const rows = [...SCENE, borrowed].map((piece) => ({
    piece,
    cast: castFor(piece, piece.id === borrowed.id ? borrowedLight : light),
  }));

  return (
    <main
      className="min-h-dvh pb-28 font-[family-name:var(--font-umbra-body)]"
      style={{ background: PAPER, color: INK }}
    >
      {/* the studio's own name, set the way a gallery sets one */}
      <header className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-[#e8e2d6]/25 pb-3">
          <p className="font-[family-name:var(--font-umbra-head)] text-[15px] font-extralight tracking-[0.42em]">
            {STUDIO.latin}
          </p>
          <p className="text-[13px] text-[#9aa6bd]">{STUDIO.line}</p>
        </div>

        <div className="pt-10 pb-8">
          <h1 className="max-w-4xl font-[family-name:var(--font-umbra-head)] text-[clamp(2rem,5.4vw,3.6rem)] leading-[1.14] font-light">
            <span className="block">ภาพตัดต่อดูปลอมเพราะเงา</span>
            <span className="block">ไม่ใช่เพราะฝีมือ</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#9aa6bd]">
            เงาทุกเส้นในฉากนี้คำนวณจากมุมของดวงอาทิตย์ที่เห็นในภาพ
            เลื่อนดวงอาทิตย์แล้วเงายาวเท่าที่ตรีโกณมิติบอก ไม่ได้วาดไว้ล่วงหน้า
            แล้วมีของชิ้นเดียวที่ตัดมาจากรูปอื่น พร้อมแสงของมันเองที่ติดมาด้วย
          </p>
        </div>
      </header>

      {/* the picture */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="overflow-hidden border border-[#e8e2d6]/20">
          <Scene
            light={light}
            pieces={SCENE}
            borrowed={borrowed}
            borrowedLight={borrowedLight}
          />
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-8 pb-12 sm:px-8 lg:grid-cols-[1fr_360px]">
        {/* where the sun is */}
        <section>
          <div className="border border-[#e8e2d6]/20 p-5">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="umbra-elevation"
                className="text-[12px] tracking-[0.2em] text-[#9aa6bd] uppercase"
              >
                ดวงอาทิตย์เหนือขอบฟ้า
              </label>
              <output
                htmlFor="umbra-elevation"
                data-elevation-readout
                className="font-[family-name:var(--font-umbra-head)] text-[26px] leading-none font-light"
                style={{ color: SUN }}
              >
                {elevation}°
              </output>
            </div>
            <input
              id="umbra-elevation"
              type="range"
              min={ELEVATION_LIMITS.min}
              max={ELEVATION_LIMITS.max}
              step={1}
              value={elevation}
              onChange={(event) => setElevation(Number(event.target.value))}
              className="mt-3 h-6 w-full accent-[#e8a765]"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {HOURS.map((hour) => (
                <button
                  key={hour.id}
                  type="button"
                  onClick={() => setElevation(hour.elevation)}
                  className="border border-[#e8e2d6]/25 px-3 py-1.5 text-[13px] transition-colors hover:border-[#e8a765] hover:text-[#e8a765]"
                >
                  {hour.label} {hour.elevation}°
                </button>
              ))}
            </div>

            <fieldset className="mt-5 border-t border-[#e8e2d6]/15 pt-4">
              <legend className="sr-only">แสงมาจากด้านไหน</legend>
              <div className="flex gap-2">
                {(
                  [
                    ["left", "แสงจากซ้าย"],
                    ["right", "แสงจากขวา"],
                  ] as [Side, string][]
                ).map(([value, label]) => {
                  const active = side === value;
                  return (
                    <label
                      key={value}
                      className={`flex-1 cursor-pointer border px-3 py-2 text-center text-[14px] transition-colors ${
                        active
                          ? "border-[#e8a765] bg-[#e8a765] text-[#101725]"
                          : "border-[#e8e2d6]/25 hover:border-[#e8e2d6]/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="umbra-side"
                        value={value}
                        checked={active}
                        onChange={() => setSide(value)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* what that angle costs every object in the frame */}
          <table className="mt-6 w-full border-collapse text-[14px]">
            <caption className="pb-2 text-left text-[12px] tracking-[0.2em] text-[#9aa6bd] uppercase">
              เงาที่มุมนี้
            </caption>
            <thead>
              <tr className="border-b border-[#e8e2d6]/25 text-[12px] tracking-[0.12em] text-[#9aa6bd] uppercase">
                <th scope="col" className="py-2 text-left font-normal">
                  ชิ้นในภาพ
                </th>
                <th scope="col" className="py-2 text-right font-normal">
                  สูง
                </th>
                <th scope="col" className="py-2 text-right font-normal">
                  เงายาว
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ piece, cast }) => (
                <tr
                  key={piece.id}
                  data-row={piece.id}
                  className="border-b border-[#e8e2d6]/12"
                >
                  <td className="py-2">
                    {piece.name}
                    {piece.id === borrowed.id && (
                      <span className="ml-2 text-[12px]" style={{ color: SUN }}>
                        ตัดมาจากรูปอื่น
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {metres(piece.height)} ม.
                  </td>
                  <td
                    data-shadow-length={piece.id}
                    className="py-2 text-right tabular-nums"
                  >
                    {metres(cast.length)} ม.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[13px] leading-relaxed text-[#9aa6bd]">
            ของที่ตั้งบนพื้นใช้ความสูงหารด้วย tan ของมุมแสง
            ทรงกลมลอยไม่ได้ใช้สูตรเดียวกัน
            เงามันเป็นวงรีที่กว้างเท่ากับรัศมีหารด้วย sin
            และไปตกห่างจากตัวมันเองตามระยะที่ลอยอยู่
          </p>
        </section>

        {/* the borrowed object, which is where the money is */}
        <section className="lg:sticky lg:top-6 lg:self-start">
          <div className="border border-[#e8e2d6]/20 p-5">
            <p className="text-[12px] tracking-[0.2em] text-[#9aa6bd] uppercase">
              ชิ้นที่ตัดมาจากรูปอื่น
            </p>
            <div className="mt-3 space-y-1">
              {BORROWED.map((option) => {
                const active = option.id === borrowedId;
                return (
                  <label
                    key={option.id}
                    className={`block cursor-pointer border px-3 py-2 text-[14px] transition-colors ${
                      active
                        ? "border-[#e8a765] text-[#e8a765]"
                        : "border-transparent hover:border-[#e8e2d6]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="umbra-borrowed"
                      value={option.id}
                      checked={active}
                      onChange={() => setBorrowedId(option.id)}
                      className="sr-only"
                    />
                    {option.name}
                    <span className="mt-0.5 block text-[12px] text-[#9aa6bd]">
                      {option.source}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 border-t border-[#e8e2d6]/15 pt-4">
              <label
                className={`flex cursor-pointer items-center justify-between gap-3 border px-3 py-2.5 text-[14px] transition-colors ${
                  corrected
                    ? "border-[#e8a765] bg-[#e8a765] text-[#101725]"
                    : "border-[#e8e2d6]/25 hover:border-[#e8e2d6]/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={corrected}
                  onChange={(event) => setCorrected(event.target.checked)}
                  className="sr-only"
                />
                ดูภาพหลังแก้แสงให้เข้าฉาก
                <span aria-hidden="true" className="text-[12px]">
                  {corrected ? "เปิดอยู่" : "ปิดอยู่"}
                </span>
              </label>
            </div>
          </div>

          {/* the reading, which is the only reason this page exists */}
          <div
            aria-live="polite"
            className="mt-6 border-l-2 pl-4"
            style={{ borderColor: SUN }}
          >
            <p
              className="font-[family-name:var(--font-umbra-head)] text-[15px] font-light"
              style={{ color: SUN }}
            >
              ที่ตาจับได้ก่อนสมองจะรู้
            </p>

            <div
              data-reading
              className="mt-2 space-y-3 text-[14px] leading-relaxed"
            >
              {corrected ? (
                <>
                  <p>
                    ตอนนี้{borrowed.name}ใช้แสงชุดเดียวกับทั้งฉาก เงายาว{" "}
                    <strong>{metres(mismatch.wanted)} ม.</strong>{" "}
                    เท่ากับที่ของสูงเท่านี้ควรจะทอดที่ {elevation} องศา
                    และด้านสว่างหันไปทางเดียวกับที่เหลือ
                  </p>
                  {mismatch.fix === "reshoot" && (
                    <p data-only-reshoot>
                      ภาพที่เห็นอยู่นี้คือผลที่ได้ถ้าถ่ายของชิ้นนี้ใหม่ในแสงเดียวกับฉาก
                      ยืดเงาในโปรแกรมให้ออกมาแบบนี้ไม่ได้
                      เพราะด้านสว่างของตัวมันเองต้องย้ายข้างไปด้วย
                    </p>
                  )}
                </>
              ) : mismatch.fix === "match" ? (
                <p>
                  {borrowed.name}ถ่ายมาตอนแสงทำมุม{" "}
                  <strong>{borrowed.elevation} องศา</strong> ฉากนี้ {elevation}{" "}
                  องศา ต่างกันไม่พอให้ตาจับได้ เงายาว {metres(mismatch.brought)}{" "}
                  ม. ทั้งที่ควรเป็น {metres(mismatch.wanted)} ม.
                  วางลงไปได้เลยไม่ต้องแก้
                </p>
              ) : (
                <>
                  <p>
                    {borrowed.name}ถ่ายมาตอนแสงทำมุม{" "}
                    <strong>{borrowed.elevation} องศา</strong> ฉากนี้ตั้งไว้{" "}
                    <strong>{elevation} องศา</strong> ต่างกัน {mismatch.degrees}{" "}
                    องศา เงาที่ติดมากับมันยาว {metres(mismatch.brought)} ม.
                    ทั้งที่ควรจะเป็น {metres(mismatch.wanted)} ม. คือ
                    {mismatch.tooShort ? "สั้น" : "ยาว"}กว่าที่ควรเป็น{" "}
                    <strong>{mismatch.factor.toFixed(1)} เท่า</strong>
                  </p>
                  {mismatch.opposite && (
                    <p data-opposite>
                      และแสงในรูปต้นทางมาจากคนละข้างกับฉากนี้
                      ด้านสว่างของมันเลยหันผิดทาง ตรงนี้ยืดเงาไม่ช่วย
                      เพราะตัวของมันเองสว่างผิดด้านอยู่แล้ว
                    </p>
                  )}
                </>
              )}
            </div>

            <dl className="mt-5 flex items-end justify-between gap-4 border-t border-[#e8e2d6]/15 pt-4">
              <div>
                <dt className="text-[12px] tracking-[0.16em] text-[#9aa6bd] uppercase">
                  วิธีแก้
                </dt>
                <dd data-fix className="mt-1 text-[15px]">
                  {FIX_LABEL[mismatch.fix]}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-[12px] tracking-[0.16em] text-[#9aa6bd] uppercase">
                  ค่าแก้
                </dt>
                <dd
                  data-price
                  className="mt-1 font-[family-name:var(--font-umbra-head)] text-[24px] leading-none font-light"
                  style={{ color: SUN }}
                >
                  {mismatch.price === 0
                    ? "ไม่มี"
                    : `${baht(mismatch.price)} บาท`}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      {/* the ask */}
      <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-5 border-t border-[#e8e2d6]/25 pt-8">
          <p className="max-w-xl font-[family-name:var(--font-umbra-head)] text-[clamp(1.2rem,3vw,1.8rem)] leading-snug font-light">
            <span className="block">ส่งภาพที่ลูกค้าบอกว่าดูแปลกมา</span>
            <span className="block">เราตอบให้ได้ว่าแปลกตรงไหน</span>
          </p>
          <Link
            href="/services"
            className="border px-6 py-3 text-[15px] transition-colors"
            style={{ borderColor: SUN, color: PAPER, background: SUN }}
          >
            คุยเรื่องภาพ
          </Link>
        </div>

        <p className="mt-8 text-[12px] leading-relaxed text-[#9aa6bd]">
          สตูดิโอสมมติสำหรับศึกษางานออกแบบ ความยาวเงาคำนวณจากมุมแสงจริงทุกค่า
          ราคาไม่มีอยู่จริง · {STUDIO.name} โดย {STUDIO.keeper}
        </p>
      </section>
    </main>
  );
}
