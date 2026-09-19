"use client";

import { useMemo, useState } from "react";
import { Ruler } from "lucide-react";

import { PIECES } from "./data";
import { search, missLine, inches, type Cut } from "./fit";
import { Garment } from "./garment";
import { ChromeText, Sparkle, Win98, raised, sunken } from "./chrome";

const CUTS: Cut[] = ["พอดีตัว", "ใส่สบาย", "โอเวอร์ไซส์"];

/** A pressed control sinks; that is the whole interaction language here. */
const control = (active: boolean) => (active ? sunken : raised);

const baht = (value: number) => value.toLocaleString("th-TH");

export function RackDemo() {
  const [chest, setChest] = useState(38);
  const [height, setHeight] = useState(168);
  const [cut, setCut] = useState<Cut>("ใส่สบาย");

  const outcome = useMemo(
    () => search(PIECES, { chest, height, cut }),
    [chest, height, cut],
  );

  return (
    <main
      className="min-h-dvh pb-28 text-neutral-900"
      style={{ background: "#7d8bb8" }}
    >
      {/* the desktop: a flat period wallpaper, not a modern gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 6px), radial-gradient(120% 90% at 50% 0%, #99a6cf 0%, #6d7bab 55%, #4a5480 100%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl space-y-4 px-3 pt-5 sm:px-5 sm:pt-8">
        <header className="text-center">
          <h1 className="text-[clamp(2.2rem,8vw,4.2rem)] leading-[1.3] font-black tracking-tight">
            <ChromeText>ตู้เสื้อผ้า.exe</ChromeText>
          </h1>
          <p className="mx-auto mt-3 flex max-w-xl items-center justify-center gap-2 text-sm font-medium text-white sm:text-base">
            <Sparkle className="h-3.5 w-3.5 shrink-0 text-[#ffe14d]" />
            มือสองคัดเอง ตัวเดียวในโลกต่อหนึ่งตัว
            <Sparkle className="h-3.5 w-3.5 shrink-0 text-[#ffe14d]" />
          </p>
        </header>

        <Win98 title="วัดตัวเอง แล้วราวจะตอบ" status="fit finder v2.1" accent>
          <p className="mb-4 text-[13px] leading-relaxed text-neutral-700">
            ป้ายไซซ์บนเสื้อมือสองบอกอะไรไม่ได้ ตัวเดียวกันปี 1999
            กับปีนี้คนละเรื่อง ที่ใช้ได้จริงคือรอบอกของคุณเทียบกับรอบอกของเสื้อ
            กรอกสองช่องล่างนี้ แล้วราวจะแยกเองว่าตัวไหนใส่ได้
            ตัวไหนไม่ได้เพราะขาดหรือเกินกี่นิ้ว
          </p>

          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold">
                รอบอกคุณ
                <span className="ml-1.5 font-mono font-normal text-neutral-600">
                  {chest} นิ้ว
                </span>
              </span>
              <input
                type="range"
                min={28}
                max={52}
                step={1}
                value={chest}
                onChange={(event) => setChest(Number(event.target.value))}
                className="h-6 w-full accent-[#ff2d94]"
                aria-label="รอบอกของคุณ เป็นนิ้ว"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold">
                ส่วนสูง
                <span className="ml-1.5 font-mono font-normal text-neutral-600">
                  {height} ซม.
                </span>
              </span>
              <input
                type="range"
                min={145}
                max={195}
                step={1}
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
                className="h-6 w-full accent-[#ff2d94]"
                aria-label="ส่วนสูงของคุณ เป็นเซนติเมตร"
              />
            </label>

            <fieldset>
              <legend className="mb-1.5 text-[13px] font-bold">
                อยากให้ใส่แล้ว
              </legend>
              <div className="flex gap-1">
                {CUTS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCut(option)}
                    aria-pressed={option === cut}
                    className={`px-2.5 py-1.5 text-xs font-bold whitespace-nowrap ${
                      option === cut ? "text-[#b3005c]" : "text-neutral-800"
                    }`}
                    style={control(option === cut)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <p
            className="mt-4 flex items-start gap-2 p-2 text-[12px] leading-relaxed"
            style={sunken}
          >
            <Ruler className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              วัดรอบอกตัวเอง: เอาสายวัดพันรอบส่วนที่กว้างที่สุดของหน้าอก
              ใต้รักแร้ หายใจออกปกติ อย่ารัด
              ส่วนตัวเลขของเสื้อบนราวเราวัดแบบวางราบแล้วคูณสอง
              เป็นวิธีเดียวกับที่ร้านมือสองทุกร้านโพสต์
            </span>
          </p>
        </Win98>

        <Win98
          title={`ราวนี้ใส่ได้ ${outcome.fits.length} ตัว`}
          status={`จาก ${PIECES.length} ตัวบนราว`}
        >
          {outcome.fits.length === 0 ? (
            <div className="space-y-3">
              <p
                className="p-3 text-[13px] leading-relaxed font-bold"
                style={sunken}
              >
                {outcome.nearest?.advice}
              </p>
              {outcome.nearest && (
                <div className="flex items-center gap-4">
                  <Garment
                    piece={outcome.nearest.verdict.piece}
                    className="h-40 w-auto"
                  />
                  <div className="text-[13px]">
                    <p className="font-bold">
                      {outcome.nearest.verdict.piece.name}
                    </p>
                    <p className="font-mono text-neutral-600">
                      อก {outcome.nearest.verdict.piece.chest} นิ้ว ยาว{" "}
                      {outcome.nearest.verdict.piece.length} นิ้ว
                    </p>
                    <p className="mt-1">
                      {missLine(outcome.nearest.verdict, cut)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {outcome.fits.map(({ piece, ease, note }) => (
                <li key={piece.id} className="flex flex-col p-3" style={sunken}>
                  <div className="grid h-44 place-items-center">
                    <Garment piece={piece} className="h-full w-auto" />
                  </div>

                  <h3 className="mt-2 text-[13px] leading-tight font-bold">
                    {piece.name}
                  </h3>
                  <p className="font-mono text-[11px] text-neutral-600">
                    {piece.era} · อก {piece.chest}&quot; · ยาว {piece.length}
                    &quot;
                  </p>

                  <p
                    className="mt-2 px-2 py-1 text-[12px] font-bold text-white"
                    style={{ background: "#1c7a3e" }}
                  >
                    เหลือพอดี {inches(ease)} นิ้ว
                  </p>
                  <p className="mt-1.5 text-[12px] leading-snug text-neutral-700">
                    {note}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-snug text-neutral-700">
                    <span className="font-bold">ตำหนิ:</span> {piece.flaw}
                  </p>

                  <p className="mt-auto pt-2 text-right font-mono text-sm font-black">
                    {baht(piece.baht)} บาท
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Win98>

        {outcome.misses.length > 0 && (
          <Win98
            title={`อีก ${outcome.misses.length} ตัวไม่ผ่าน`}
            status="พร้อมเหตุผลทีละตัว"
          >
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {outcome.misses.map((verdict) => (
                <li
                  key={verdict.piece.id}
                  className="flex items-center gap-2.5 p-2"
                  style={sunken}
                >
                  <div className="h-16 w-16 shrink-0">
                    <Garment
                      piece={verdict.piece}
                      muted
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-neutral-700">
                      {verdict.piece.name}
                    </p>
                    <p className="font-mono text-[11px] text-neutral-600">
                      อก {verdict.piece.chest}&quot;
                    </p>
                    <p
                      className="mt-1 inline-block px-1.5 py-0.5 text-[11px] font-bold text-white"
                      style={{
                        background:
                          verdict.reason === "tight" ? "#9b2226" : "#8a6d1f",
                      }}
                    >
                      {missLine(verdict, cut)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Win98>
        )}

        <Win98 title="ก่อนกดสั่ง">
          <dl className="grid gap-3 text-[13px] leading-relaxed sm:grid-cols-3">
            <div>
              <dt className="font-bold">ตัวเดียวจริงๆ</dt>
              <dd className="text-neutral-700">
                ทุกตัวบนราวมีชิ้นเดียว ขายแล้วคือหมด ไม่มีสั่งเพิ่ม
                ไม่มีไซซ์อื่น
              </dd>
            </div>
            <div>
              <dt className="font-bold">ตำหนิบอกก่อนเสมอ</dt>
              <dd className="text-neutral-700">
                ของมือสองไม่มีตัวไหนสมบูรณ์ ตำหนิเขียนไว้ใต้ทุกตัวแล้ว
                ถ้ามาถึงแล้วไม่ตรงกับที่เขียน คืนได้เต็มจำนวน
              </dd>
            </div>
            <div>
              <dt className="font-bold">วัดซ้ำได้</dt>
              <dd className="text-neutral-700">
                อยากให้วัดจุดไหนเพิ่มทักมาได้ วัดให้ใหม่พร้อมรูปสายวัด
                ก่อนโอนเงินทุกครั้ง
              </dd>
            </div>
          </dl>
        </Win98>

        {/*
          On a steel strip rather than straight onto the wallpaper. The
          wallpaper is a radial ramp from #99a6cf to #4a5480, so no flat ink
          clears 4.5:1 at both ends of it: white was 2.5:1 down here and a dark
          ink would have failed at the top. A strip is also what the period
          would have done with a line like this.
        */}
        <p
          className="mx-auto w-fit px-3 py-1 text-center text-[11px] text-neutral-900"
          style={raised}
        >
          ร้านสมมติสำหรับศึกษางานออกแบบ สินค้าและราคาไม่มีอยู่จริง
        </p>
      </div>
    </main>
  );
}
