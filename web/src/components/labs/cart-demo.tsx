"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Star, Truck } from "lucide-react";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const PAPER = "#ffffff";
const ALT = "#f5f5f4";
const INK = "#111111";
const MUTED = "#57534e";
const LINE = "#e4e2df";
const GOOD = "#15803d";

/** Orders in before this hour go out the same day. */
const CUTOFF_HOUR = 16;

interface Bundle {
  units: number;
  unitPrice: number;
  label: string;
  perk?: string;
  best?: boolean;
}

const LIST_PRICE = 890;

const BUNDLES: Bundle[] = [
  { units: 1, unitPrice: 890, label: "ลองก่อน 1 ชิ้น" },
  { units: 2, unitPrice: 790, label: "คู่กับคนที่บ้าน", best: true },
  { units: 3, unitPrice: 690, label: "ซื้อยกชุด", perk: "แถมซองใส่หนัง PU" },
];

const REVIEWS = [
  {
    name: "พิมพ์ชนก ว.",
    stars: 5,
    text: "ใส่นั่งรถไฟฟ้าไปทำงานทุกวัน เสียงประกาศกับเสียงคนคุยหายไปเกือบหมด ที่ชอบสุดคือใส่แล้วไม่เจ็บหูตอนใส่นานๆ",
  },
  {
    name: "ธนกฤต ส.",
    stars: 5,
    text: "สั่งบ่ายสอง ได้ของวันรุ่งขึ้นตอนสิบโมง เร็วกว่าที่คิด แบตอยู่ได้ทั้งวันจริงตามที่บอก",
  },
  {
    name: "อารีย์ ม.",
    stars: 4,
    text: "เสียงดีเกินราคา หักหนึ่งดาวเพราะแอปตั้งค่ายังแปลภาษาไทยไม่ครบ แต่ใช้งานไม่มีปัญหา",
  },
  {
    name: "ณัฐวุฒิ ค.",
    stars: 5,
    text: "ซื้อ 3 ชิ้นแบ่งให้ที่บ้าน ถูกกว่าซื้อทีละอันเยอะ ใช้มาสองเดือนยังไม่มีปัญหาสักตัว",
  },
];

const COMPARISON = [
  { k: "ตัดเสียงรบกวน", ours: "มี ปรับได้ 3 ระดับ", theirs: "ไม่มี" },
  { k: "แบตต่อการชาร์จ", ours: "8 ชั่วโมง", theirs: "3 ถึง 4 ชั่วโมง" },
  { k: "รวมกล่องชาร์จ", ours: "32 ชั่วโมง", theirs: "12 ชั่วโมง" },
  { k: "กันเหงื่อกันฝน", ours: "IPX5", theirs: "ไม่ระบุ" },
  { k: "รับประกัน", ours: "1 ปี เคลมในไทย", theirs: "7 วัน" },
  { k: "ส่งจาก", ours: "คลังในไทย 1 ถึง 2 วัน", theirs: "ต่างประเทศ 2 ถึง 4 สัปดาห์" },
];

const FAQ = [
  {
    q: "ใช้กับ iPhone และ Android ได้ไหม",
    a: "ได้ทั้งคู่ ต่อผ่าน Bluetooth 5.3 เปิดกล่องแล้วขึ้นให้จับคู่เอง ไม่ต้องลงแอปก็ใช้ได้ครบทุกฟังก์ชันหลัก",
  },
  {
    q: "เก็บเงินปลายทางได้จริงไหม",
    a: "ได้ทั่วประเทศ จ่ายกับคนส่งตอนของถึงมือ ไม่ต้องโอนก่อน และไม่มีค่าธรรมเนียมเพิ่ม",
  },
  {
    q: "ถ้าใส่แล้วไม่ถูกใจ",
    a: "ส่งกลับได้ภายใน 7 วันนับจากวันที่ได้รับ คืนเงินเต็มจำนวน เราออกค่าส่งกลับให้",
  },
  {
    q: "ประกันครอบคลุมอะไรบ้าง",
    a: "1 ปีเต็มสำหรับความเสียหายจากการผลิต เคลมกับเราในไทยโดยตรง ไม่ต้องส่งออกนอก ปกติเปลี่ยนตัวใหม่ให้ภายใน 5 วันทำการ",
  },
];

const baht = (value: number) => value.toLocaleString("th-TH");

// Minutes left until today's dispatch cut-off, or a negative number once it has
// passed. Client-only, so it comes through an external store the same way the
// open sign in the Counter demo does: no setState in an effect, and a stable
// snapshot that only moves when the minute does.
//
// This is the honest version of the urgency these pages are built on. A real
// cut-off, read off the visitor's own clock, expires once and tells the truth
// afterwards. The countdown that resets to 09:59 on every page load is the same
// pixel and a lie, and it is not going in a demo a client might copy.
let minutesLeft: number | null = null;
const clockListeners = new Set<() => void>();

function readClock() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(CUTOFF_HOUR, 0, 0, 0);
  const next = Math.round((cutoff.getTime() - now.getTime()) / 60000);
  if (next === minutesLeft) return;
  minutesLeft = next;
  for (const onChange of clockListeners) onChange();
}

function subscribeClock(onChange: () => void) {
  clockListeners.add(onChange);
  readClock();
  const id = window.setInterval(readClock, 20_000);
  return () => {
    clockListeners.delete(onChange);
    window.clearInterval(id);
  };
}

const getClock = () => minutesLeft;
const getServerClock = () => null;

/**
 * "Cart": the single product page, the shape every dropshipper asks for.
 * Everything above the fold answers one question, and the page repeats the
 * same offer at four heights so it can be bought from wherever the scroll
 * stopped.
 *
 * Two things here are real rather than decorative: the bundle picker does the
 * arithmetic, and the dispatch countdown reads the visitor's clock. The genre's
 * usual scarcity theatre - a timer that resets on reload, a stock counter that
 * counts down to two and stops - is left out on purpose. It converts, and it
 * teaches the client to lie to their own customers.
 */
export function CartDemo() {
  const [bundle, setBundle] = useState<Bundle>(BUNDLES[1]);

  const left = useSyncExternalStore(subscribeClock, getClock, getServerClock);
  const total = bundle.units * bundle.unitPrice;
  const saved = bundle.units * LIST_PRICE - total;

  return (
    <main className="min-h-dvh" style={{ background: PAPER, color: INK }}>
      <p
        className="px-5 py-2 text-center text-sm"
        style={{ background: INK, color: "#f5f5f4" }}
      >
        ส่งฟรีทั่วไทย · เก็บเงินปลายทางได้ · เปลี่ยนคืนใน 7 วัน
      </p>

      <header
        className="sticky top-0 z-20 border-b"
        style={{ borderColor: LINE, background: "rgba(255,255,255,0.94)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3 sm:px-8">
          <span className="text-lg font-semibold tracking-tight">HUSH</span>
          <span className="hidden text-sm sm:inline" style={{ color: MUTED }}>
            หูฟังไร้สายตัดเสียงรบกวน
          </span>
          <a
            href="#buy"
            className="ml-auto rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: INK }}
          >
            สั่งซื้อ ฿{baht(total)}
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* ── the offer, whole, above the fold ── */}
        <section id="buy" className="scroll-mt-20 py-10 sm:py-14">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease }}
              className="relative aspect-square overflow-hidden rounded-2xl"
              style={{ background: ALT }}
            >
              <Image
                src="/lab-demos/cart/hero.webp"
                alt="หูฟังไร้สาย HUSH A1 พร้อมกล่องชาร์จ"
                fill
                sizes="(min-width: 768px) 45vw, 92vw"
                unoptimized
                priority
                className="object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
            >
              <div className="flex items-center gap-2 text-sm">
                <Stars value={5} />
                <span style={{ color: MUTED }}>4.8 จาก 1,204 รีวิว</span>
              </div>

              <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                HUSH A1
                <br />
                เงียบลงทันทีที่ใส่
              </h1>

              <p className="mt-4 leading-relaxed" style={{ color: MUTED }}>
                ตัดเสียงรบกวนปรับได้ 3 ระดับ แบต 8 ชั่วโมงต่อการชาร์จ
                รวมกล่องอีก 32 ชั่วโมง ใส่ทั้งวันไม่เจ็บหู กันเหงื่อกันฝนระดับ IPX5
              </p>

              <fieldset className="mt-7">
                <legend className="text-sm font-medium">เลือกจำนวน</legend>
                <div className="mt-3 space-y-2.5">
                  {BUNDLES.map((option) => {
                    const active = option.units === bundle.units;
                    return (
                      <button
                        key={option.units}
                        onClick={() => setBundle(option)}
                        aria-pressed={active}
                        className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors"
                        style={{
                          borderColor: active ? INK : LINE,
                          background: active ? ALT : "transparent",
                        }}
                      >
                        <span
                          aria-hidden
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                          style={{
                            borderColor: active ? INK : "#c9c6c1",
                            background: active ? INK : "transparent",
                          }}
                        >
                          {active && (
                            <Check className="h-3 w-3" style={{ color: PAPER }} />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-medium">
                              {option.units} ชิ้น
                            </span>
                            <span className="text-sm" style={{ color: MUTED }}>
                              {option.label}
                            </span>
                            {option.best && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                style={{ background: "#dcfce7", color: GOOD }}
                              >
                                คนซื้อเยอะสุด
                              </span>
                            )}
                          </span>
                          {option.perk && (
                            <span
                              className="mt-0.5 block text-sm"
                              style={{ color: GOOD }}
                            >
                              {option.perk}
                            </span>
                          )}
                        </span>

                        <span className="shrink-0 text-right">
                          <span className="block font-semibold tabular-nums">
                            ฿{baht(option.units * option.unitPrice)}
                          </span>
                          <span
                            className="block text-sm tabular-nums"
                            style={{ color: MUTED }}
                          >
                            ฿{baht(option.unitPrice)} ต่อชิ้น
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-3xl font-semibold tabular-nums">
                  ฿{baht(total)}
                </span>
                {saved > 0 && (
                  <span className="text-sm font-medium" style={{ color: GOOD }}>
                    ประหยัด ฿{baht(saved)}
                  </span>
                )}
              </div>

              <button
                className="mt-4 w-full rounded-full py-4 text-base font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: INK }}
              >
                สั่งซื้อ เก็บเงินปลายทางได้
              </button>

              <p
                className="mt-3 flex items-center justify-center gap-2 text-sm"
                style={{ color: left !== null && left > 0 ? GOOD : MUTED }}
              >
                <Truck className="h-4 w-4 shrink-0" />
                <Dispatch minutes={left} />
              </p>

              <ul
                className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-5 text-sm"
                style={{ borderColor: LINE, color: MUTED }}
              >
                {[
                  "ส่งฟรีทั่วไทย",
                  "เก็บเงินปลายทาง",
                  "เปลี่ยนคืนใน 7 วัน",
                  "รับประกัน 1 ปี",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: GOOD }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>
      </div>

      {/* ── what it fixes ── */}
      <section className="py-16" style={{ background: ALT }}>
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            ซื้อมาแล้วเจอแบบนี้กันทุกที
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              {
                h: "ใส่นานแล้วเจ็บหู",
                p: "ทรงแข็งดันรูหูจนต้องถอดทุกชั่วโมง จ่ายไปแล้วก็ไม่ได้ใส่",
              },
              {
                h: "แบตหมดกลางทาง",
                p: "ชาร์จเต็มตอนเช้า พอบ่ายก็เตือนแบตต่ำ ต้องพกสายไปด้วยทุกวัน",
              },
              {
                h: "รอของสามสัปดาห์",
                p: "สั่งของถูกจากต่างประเทศ กว่าจะถึงก็ลืมไปแล้วว่าสั่งอะไร เสียก็เคลมไม่ได้",
              },
            ].map((item, i) => (
              <motion.div
                key={item.h}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-xl border p-5"
                style={{ borderColor: LINE, background: PAPER }}
              >
                <h3 className="font-medium">{item.h}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
                  {item.p}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* ── benefits, each with a picture ── */}
        <section className="py-16">
          <div className="grid gap-10 sm:grid-cols-2">
            {[
              {
                src: "/lab-demos/cart/commute.webp",
                alt: "ใส่หูฟังบนรถไฟฟ้า",
                h: "เงียบตั้งแต่ก้าวขึ้นรถ",
                p: "ไมค์สี่ตัวอ่านเสียงรอบตัวแล้วหักล้างแบบเรียลไทม์ เสียงเครื่องยนต์กับเสียงประกาศเบาลงจนได้ยินแต่สิ่งที่อยากฟัง กดสองครั้งเปิดโหมดฟังรอบข้างตอนต้องคุยกับใคร",
              },
              {
                src: "/lab-demos/cart/case.webp",
                alt: "หูฟังกับกล่องชาร์จ",
                h: "ชาร์จสิบนาที ใช้ได้สองชั่วโมง",
                p: "แบตในตัว 8 ชั่วโมง กล่องเก็บไว้ให้อีก 32 ชั่วโมง ลืมชาร์จตอนกลางคืนก็ยังทัน เสียบไว้ตอนอาบน้ำก็พอใช้ได้ทั้งเช้า",
              },
              {
                src: "/lab-demos/cart/outdoors.webp",
                alt: "ใส่หูฟังกลางแจ้ง",
                h: "เหงื่อกับฝนไม่ใช่ปัญหา",
                p: "มาตรฐาน IPX5 วิ่งกลางแดดหรือโดนฝนสาดระหว่างเดินก็ยังทำงานปกติ ตัวหูฟังหนักข้างละ 4.2 กรัม ใส่วิ่งแล้วไม่หลุด",
              },
            ].map((item, i) => (
              <motion.article
                key={item.h}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (i % 2) * 0.06 }}
              >
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-xl"
                  style={{ background: ALT }}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 640px) 45vw, 92vw"
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-4 text-lg font-medium">{item.h}</h3>
                <p className="mt-2 leading-relaxed" style={{ color: MUTED }}>
                  {item.p}
                </p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── the comparison the buyer is already making ── */}
        <section className="pb-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            เทียบกับหูฟังราคาใกล้กัน
          </h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-1/3 py-3 text-left font-medium" />
                  <th
                    className="border-b-2 py-3 text-left font-semibold"
                    style={{ borderColor: INK }}
                  >
                    HUSH A1
                  </th>
                  <th
                    className="border-b py-3 text-left font-medium"
                    style={{ borderColor: LINE, color: MUTED }}
                  >
                    หูฟังทั่วไปในราคาเดียวกัน
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.k}>
                    <th
                      scope="row"
                      className="border-b py-3 pr-4 text-left font-normal"
                      style={{ borderColor: LINE, color: MUTED }}
                    >
                      {row.k}
                    </th>
                    <td
                      className="border-b py-3 pr-4 font-medium"
                      style={{ borderColor: LINE }}
                    >
                      {row.ours}
                    </td>
                    <td
                      className="border-b py-3"
                      style={{ borderColor: LINE, color: MUTED }}
                    >
                      {row.theirs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── reviews ── */}
      <section className="py-16" style={{ background: ALT }}>
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              คนที่ซื้อไปแล้วพูดว่า
            </h2>
            <span className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
              <Stars value={5} />
              4.8 จาก 1,204 รีวิว
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {REVIEWS.map((review, i) => (
              <motion.figure
                key={review.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: (i % 2) * 0.06 }}
                className="rounded-xl border p-5"
                style={{ borderColor: LINE, background: PAPER }}
              >
                <Stars value={review.stars} />
                <blockquote
                  className="mt-3 leading-relaxed"
                  style={{ color: MUTED }}
                >
                  {review.text}
                </blockquote>
                <figcaption className="mt-3 text-sm font-medium">
                  {review.name}
                  <span className="ml-2 font-normal" style={{ color: GOOD }}>
                    ซื้อจริง
                  </span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <section className="py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            ถามกันมาบ่อย
          </h2>
          <dl className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="font-medium">{item.q}</dt>
                <dd
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: MUTED }}
                >
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── the same offer, one last time ── */}
        <section
          className="mb-16 rounded-2xl p-8 text-center sm:p-12"
          style={{ background: INK, color: "#fafaf9" }}
        >
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            ลองใส่ 7 วัน ไม่ชอบส่งคืน
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed" style={{ color: "#a8a29e" }}>
            เราออกค่าส่งกลับให้เอง ไม่ต้องอธิบายเหตุผล คืนเงินเต็มจำนวนภายใน 3 วันทำการ
          </p>
          <a
            href="#buy"
            className="mt-7 inline-flex rounded-full px-8 py-4 text-base font-medium transition-opacity hover:opacity-90"
            style={{ background: "#fafaf9", color: INK }}
          >
            สั่งซื้อ ฿{baht(total)}
          </a>
          <p className="mt-4 text-sm" style={{ color: "#a8a29e" }}>
            <Dispatch minutes={left} />
          </p>
        </section>

        <section className="border-t pb-16" style={{ borderColor: LINE }}>
          <div className="grid gap-6 pt-12 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <h2 className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
                ขายของออนไลน์อยู่ อยากได้หน้าแบบนี้
              </h2>
              <p className="mt-3 max-w-md leading-relaxed" style={{ color: MUTED }}>
                หน้าเดียวจบ เปลี่ยนสินค้า ราคา และรีวิวเองได้ ต่อกับระบบเก็บเงินปลายทาง
                หรือ payment gateway ก็ได้
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/pricing"
                className="rounded-full px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: INK }}
              >
                ดูราคา
              </Link>
              <Link
                href="/#contact"
                className="rounded-full border px-6 py-3 text-sm font-medium"
                style={{ borderColor: "#c9c6c1" }}
              >
                ทักมาคุย
              </Link>
            </div>
          </div>

          <p className="mt-10 text-xs leading-relaxed" style={{ color: MUTED }}>
            HUSH เป็นแบรนด์สมมติ สเปก รีวิว และยอดขายทั้งหมดแต่งขึ้นเพื่อสาธิตงานออกแบบ
            เวลาส่งของนับจากนาฬิกาเครื่องคุณจริง ไม่ใช่ตัวนับถอยหลังที่รีเซ็ตใหม่ทุกครั้งที่เปิดหน้า
          </p>
        </section>
      </div>
    </main>
  );
}

/** The dispatch line, in both of its honest states. */
function Dispatch({ minutes }: { minutes: number | null }) {
  if (minutes === null) return <>กำลังเช็ครอบส่งของวันนี้</>;
  if (minutes <= 0) {
    return <>รอบส่งวันนี้ปิดแล้ว สั่งตอนนี้ออกของพรุ่งนี้เช้า</>;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return (
    <>
      สั่งภายใน {hours > 0 ? `${hours} ชั่วโมง ` : ""}
      {rest} นาที ออกของวันนี้
    </>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} จาก 5 ดาว`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className="h-4 w-4"
          style={{
            color: n <= value ? "#c2870a" : "#d6d3d1",
            fill: n <= value ? "#c2870a" : "#d6d3d1",
          }}
        />
      ))}
    </span>
  );
}
