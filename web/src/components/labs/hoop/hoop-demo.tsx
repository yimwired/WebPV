"use client";

import { useId, useState, type CSSProperties } from "react";

import { COLOURWAYS, colourwayVars, type Colourway } from "./colourways";
import { ColourwayPicker } from "./colourway-picker";
import { HOOP_CSS } from "./hoop-css";
import { QuotePanel } from "./quote-panel";
import { Stage } from "./stage";
import { MACHINE, PRICE, STITCH } from "./stitches";
import { SizePicker } from "./size-picker";
import { useGarden } from "./use-garden";

const SAMPLES = ["ใบเตย", "Mali", "ขวัญข้าว", "Rosie"];

const number = (n: number) => n.toLocaleString("th-TH");

/**
 * Hoop: a name-embroidery shop, for สวนด้าย, an invented one.
 *
 * Borrowed from a reel of a web toy where typing grows roses out of the letters.
 * What it keeps is the mechanism: the type is the trellis, every keystroke is
 * answered by something growing in three timed acts, deleting plays it
 * backwards, and colour is a separate layer from geometry, so a new colourway
 * repaints without regrowing. What it adds is the reason a shop would want it:
 * the garden on screen is the design the machine will sew, so it can be counted
 * in stitches, and stitches are what embroidery is priced by.
 *
 * Changes from the reel, each for a reason: roses stay out of the letters'
 * body so a name is still a name; vines pass behind the type and roses in front
 * of it, so the letters sit inside the garden instead of under a sticker of it;
 * Thai is typed as readily as Latin; and the field is a real input, so a phone
 * can type into it.
 */
export function HoopDemo() {
  const [colourway, setColourway] = useState<Colourway>(COLOURWAYS[0]);
  const garden = useGarden(SAMPLES[0]);
  const hintsId = useId();

  return (
    <div className="hoop-root min-h-dvh pb-28" style={colourwayVars(colourway) as CSSProperties}>
      <style>{HOOP_CSS}</style>

      <header
        className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b px-5 py-5"
        style={{ borderColor: "var(--hoop-line)" }}
      >
        <p className="text-2xl" style={{ fontFamily: "var(--font-hoop-thai), serif" }}>
          สวนด้าย
        </p>
        <p className="text-[14px]" style={{ color: "var(--hoop-muted)" }}>
          ปักชื่อลายดอกไม้ บนถุงผ้าแคนวาส
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        <section className="pt-10 sm:pt-14">
          <h1 className="text-[clamp(1.9rem,5vw,3rem)] leading-tight font-semibold">พิมพ์ชื่อ แล้วดูดอกไม้งอก</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed sm:text-base" style={{ color: "var(--hoop-muted)" }}>
            ลายบนผ้าข้างล่างคือลายที่จักรจะปักจริง ร้านคิดราคาจากจำนวนฝีเข็มของลายนี้
            ไม่ได้เหมาราคาต่อตัวอักษร
          </p>

          <div className="hoop-weave mt-8 rounded-2xl p-3 sm:p-5" style={{ background: "var(--hoop-panel)" }}>
            <Stage garden={garden} hintsId={hintsId} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[13px]">
            <p id={hintsId} style={{ color: "var(--hoop-muted)" }}>
              พิมพ์แล้วงอก · ลบแล้วเหี่ยว · เว้นวรรคได้ · Enter ล้างทั้งหมด
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span style={{ color: "var(--hoop-muted)" }}>ลองชื่อ</span>
              {SAMPLES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => garden.replace(sample)}
                  className="min-h-11 rounded-full border px-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    borderColor: garden.text === sample ? "var(--hoop-ink)" : "var(--hoop-line)",
                    outlineColor: "var(--hoop-ink)",
                  }}
                  aria-pressed={garden.text === sample}
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {garden.tooLong ? (
            <p role="status" className="mt-3 text-[14px]" style={{ color: "var(--hoop-ink)" }}>
              ชื่อยาวเกินพื้นที่ปักในขนาดนี้แล้ว ลองขนาดเล็กลง หรือใช้ชื่อเล่นดู
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <ColourwayPicker value={colourway} onChange={setColourway} />
            <SizePicker
              value={garden.size}
              box={garden.box}
              inkEm={garden.emMm > 0 ? garden.inkMm / garden.emMm : 0}
              onChange={garden.resize}
            />
          </div>
        </section>

        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
          <QuotePanel estimate={garden.estimate} box={garden.box} emMm={garden.emMm} colourway={colourway} />

          <section aria-labelledby="hoop-how" className="lg:pt-7">
            <h2 id="hoop-how" className="text-xl font-semibold sm:text-2xl">
              ร้านคิดราคาจากอะไร
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--hoop-muted)" }}>
              งานปักจักรคิดราคาตามจำนวนฝีเข็ม เพราะฝีคือเวลาที่จักรใช้ หน้านี้นับให้ดูจากลายบนจอตรงๆ
              ด้วยค่าที่ร้านปักทั่วไปตั้งกัน
            </p>
            <dl className="mt-6 space-y-5 text-[15px] leading-relaxed">
              <div>
                <dt className="font-semibold">ตัวอักษร ปักแบบ satin</dt>
                <dd className="mt-1" style={{ color: "var(--hoop-muted)" }}>
                  เข็มวิ่งข้ามเส้นตัวอักษรไปกลับ ทุก {STITCH.satinSpacingMm} มม. ตัวที่เส้นยาว หัวกลม หรือหางเยอะ
                  เลยกินฝีมากกว่า
                </dd>
              </div>
              <div>
                <dt className="font-semibold">ใบไม้กับกุหลาบ ปักถม</dt>
                <dd className="mt-1" style={{ color: "var(--hoop-muted)" }}>
                  เข็มเดินเป็นแถวห่างกัน {STITCH.fillSpacingMm} มม. ฝีละ {STITCH.fillLengthMm} มม.
                  ทุก {(STITCH.fillSpacingMm * STITCH.fillLengthMm).toFixed(1)} ตร.มม. ใช้หนึ่งฝี ดอกกว้างขึ้นเท่าตัว
                  ฝีเพิ่มเป็นสี่เท่า
                </dd>
              </div>
              <div>
                <dt className="font-semibold">เถา ฝีเย็บสามทบ</dt>
                <dd className="mt-1" style={{ color: "var(--hoop-muted)" }}>
                  ฝีละ {STITCH.tripleLengthMm} มม. เดินซ้ำ {STITCH.triplePasses} รอบ เส้นเถาจะหนาพอให้เห็นบนผ้า
                </dd>
              </div>
              <div>
                <dt className="font-semibold">เส้นกลีบในดอก</dt>
                <dd className="mt-1" style={{ color: "var(--hoop-muted)" }}>
                  เดินเส้นเดียว ฝีละ {STITCH.runLengthMm} มม.
                </dd>
              </div>
            </dl>
            <p
              className="mt-7 border-t pt-5 text-[15px] leading-relaxed"
              style={{ borderColor: "var(--hoop-line)" }}
            >
              ค่าปัก 1,000 ฝีละ {PRICE.perThousandStitches} บาท สีด้ายที่เพิ่มจากสีแรกสีละ {PRICE.perExtraColour} บาท
              ขั้นต่ำ {PRICE.minimumEmbroidery} บาท ถุงผ้าใบละ {PRICE.bag} บาท จักรของร้านเดิน{" "}
              {number(MACHINE.stitchesPerMinute)} ฝีต่อนาที
            </p>
          </section>
        </div>
      </main>

      <footer
        className="mx-auto mt-16 max-w-6xl border-t px-5 pt-6 text-[13px] leading-relaxed"
        style={{ borderColor: "var(--hoop-line)", color: "var(--hoop-muted)" }}
      >
        <p>สวนด้ายเป็นร้านสมมติ ทำขึ้นเป็นตัวอย่างหน้าเว็บ ราคาเป็นของร้านสมมติ ส่วนค่าฝีเข็มใช้ค่ามาตรฐานของงานปักจักร</p>
        <p className="mt-1">ชุดเบญจรงค์ใช้สีจากระบบสีไทยโทน โดย อ.ไพโรจน์ พิทยเมธี</p>
      </footer>
    </div>
  );
}
