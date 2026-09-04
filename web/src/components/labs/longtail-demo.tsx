"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Plus, Star } from "lucide-react";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const BG = "#07191c";
const PANEL = "#0e262a";
const LINE = "#1c3a3e";
const TEXT = "#e8f1ef";
const MUTED = "#9db5b2";
const ACCENT = "#ff7a59";

/** Children ride at 60% of the adult fare, the usual split on a day boat. */
const CHILD_RATE = 0.6;
const PICKUP_FEE = 200;

interface Tour {
  id: string;
  name: string;
  area: string;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  blurb: string;
  includes: string[];
  swatch: [string, string];
}

const TOURS: Tour[] = [
  {
    id: "phi-phi",
    name: "พีพี - อ่าวมาหยา เต็มวัน",
    area: "กระบี่",
    duration: "เต็มวัน 8 ชม.",
    price: 2890,
    rating: 4.8,
    reviews: 214,
    blurb:
      "ออกเรือเร็วตอนเจ็ดโมง ถึงอ่าวมาหยาก่อนเรือทัวร์กลุ่มใหญ่ ได้ถ่ายรูปตอนหาดยังโล่ง",
    includes: ["อาหารกลางวันบุฟเฟต์", "อุปกรณ์ดำน้ำตื้น", "ประกันเดินทาง"],
    swatch: ["#0f6f75", "#062a2e"],
  },
  {
    id: "four-islands",
    name: "4 เกาะ ทะเลแหวก",
    area: "กระบี่",
    duration: "เต็มวัน 7 ชม.",
    price: 1790,
    rating: 4.6,
    reviews: 388,
    blurb:
      "ไปให้ตรงจังหวะน้ำลงถึงจะเห็นสันทรายเชื่อมสามเกาะ เราเช็คตารางน้ำให้ทุกวัน",
    includes: ["อาหารกลางวัน", "อุปกรณ์ดำน้ำตื้น", "ไกด์พูดไทยและอังกฤษ"],
    swatch: ["#1a7f6b", "#07302a"],
  },
  {
    id: "james-bond",
    name: "อ่าวพังงา เขาตะปู เรือหางยาว",
    area: "พังงา",
    duration: "เต็มวัน 8 ชม.",
    price: 2190,
    rating: 4.7,
    reviews: 156,
    blurb: "พายเรือแคนูลอดถ้ำลอด แวะหมู่บ้านปันหยี กินข้าวบนน้ำ",
    includes: ["เรือแคนูพร้อมคนพาย", "อาหารกลางวัน", "รับส่งที่พัก"],
    swatch: ["#2b6f9e", "#0a2b3e"],
  },
  {
    id: "sunset-krabi",
    name: "4 เกาะ รอบพระอาทิตย์ตก",
    area: "กระบี่",
    duration: "ครึ่งวันบ่าย 5 ชม.",
    price: 1490,
    rating: 4.9,
    reviews: 97,
    blurb: "ออกบ่ายสอง คนน้อยกว่ารอบเช้ามาก แล้วปิดท้ายที่เกาะปอดูพระอาทิตย์ตก",
    includes: ["ของว่างและผลไม้", "อุปกรณ์ดำน้ำตื้น", "ประกันเดินทาง"],
    swatch: ["#b4552f", "#3a1608"],
  },
  {
    id: "bamboo",
    name: "เกาะไผ่ ไม่แวะร้านค้า",
    area: "กระบี่",
    duration: "ครึ่งวันเช้า 5 ชม.",
    price: 1590,
    rating: 4.5,
    reviews: 63,
    blurb: "ทัวร์ที่ไม่มีคิวแวะร้านของฝาก เวลาที่เหลือเอาไปอยู่บนหาดแทน",
    includes: ["ของว่าง", "อุปกรณ์ดำน้ำตื้น", "ค่าธรรมเนียมอุทยาน"],
    swatch: ["#0f6f75", "#052227"],
  },
  {
    id: "private-boat",
    name: "เหมาเรือส่วนตัว ไปได้ทุกเกาะ",
    area: "กระบี่และพังงา",
    duration: "เต็มวัน จัดเวลาเอง",
    price: 12900,
    rating: 5,
    reviews: 28,
    blurb: "ราคาต่อลำไม่เกิน 8 คน เลือกเกาะเอง ออกกี่โมงก็ได้ ไม่มีรอบรวม",
    includes: ["กัปตันและลูกเรือ", "อาหารกลางวัน", "รับส่งที่พัก"],
    swatch: ["#7a5a2e", "#2a1c08"],
  },
];

const TRUST = [
  { h: "ยกเลิกฟรีก่อน 24 ชม.", p: "คืนเต็มจำนวน ไม่ต้องให้เหตุผล" },
  { h: "จ่ายมัดจำ 30% ก็จองได้", p: "ที่เหลือจ่ายวันขึ้นเรือ" },
  { h: "เรืออกจริงทุกรอบ", p: "ถ้าเราเลื่อนเพราะอากาศ คืนเงินเต็ม" },
];

const baht = (value: number) => value.toLocaleString("th-TH");

/**
 * "Longtail": a day tour operator that takes bookings. It exists because the
 * shape keeps coming up and PET Travel proved it is buildable, so the demo has
 * to answer the question a tour operator actually asks, which is not how the
 * hero looks. It is whether the page can quote a real total.
 *
 * So the booking panel does the arithmetic live: adults at the fare, children
 * at 60% of it, a flat hotel pickup fee on the booking rather than per head,
 * and a deposit line, because nobody in this trade collects the whole amount
 * up front.
 */
export function LongtailDemo() {
  const [selected, setSelected] = useState<Tour>(TOURS[0]);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [pickup, setPickup] = useState(true);

  const childFare = Math.round(selected.price * CHILD_RATE);
  const total =
    adults * selected.price + children * childFare + (pickup ? PICKUP_FEE : 0);
  const deposit = Math.round((total * 0.3) / 10) * 10;

  return (
    <main className="min-h-dvh" style={{ background: BG, color: TEXT }}>
      <header
        className="sticky top-0 z-20 border-b"
        style={{ borderColor: LINE, background: "rgba(7,25,28,0.92)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5 sm:px-8">
          <span className="text-lg font-semibold tracking-tight">
            หางยาว
            <span className="ml-1.5 text-sm font-normal" style={{ color: MUTED }}>
              day tours
            </span>
          </span>
          <a
            href="#book"
            className="ml-auto rounded-full px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: ACCENT, color: "#2a0c02" }}
          >
            จองทัวร์
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="py-14 sm:py-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium tracking-[0.2em] uppercase"
            style={{ color: ACCENT }}
          >
            กระบี่ · พังงา · ภูเก็ต
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease }}
            className="mt-4 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl"
          >
            ออกเรือเช้ากว่าคนอื่น
            <br />
            กลับก่อนหาดจะแน่น
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.16, ease }}
            className="mt-5 max-w-xl leading-relaxed"
            style={{ color: MUTED }}
          >
            เรือของเราเอง 6 ลำ ออกทุกวันตั้งแต่ปี 2558 เลือกทัวร์ ใส่จำนวนคน
            แล้วเห็นราคารวมทันที ไม่มีค่าอะไรงอกตอนขึ้นเรือ
          </motion.p>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mt-10 grid gap-4 sm:grid-cols-3"
          >
            {TRUST.map((item) => (
              <div
                key={item.h}
                className="rounded-lg border p-4"
                style={{ borderColor: LINE, background: PANEL }}
              >
                <dt className="flex items-center gap-2 text-sm font-medium">
                  <Check className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                  {item.h}
                </dt>
                <dd className="mt-1.5 text-sm" style={{ color: MUTED }}>
                  {item.p}
                </dd>
              </div>
            ))}
          </motion.dl>
        </section>

        <section id="book" className="scroll-mt-20 pb-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            เลือกทัวร์
          </h2>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="grid gap-4 sm:grid-cols-2">
              {TOURS.map((tour, i) => {
                const active = tour.id === selected.id;
                return (
                  <motion.button
                    key={tour.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: Math.min(i, 5) * 0.04 }}
                    onClick={() => setSelected(tour)}
                    aria-pressed={active}
                    className="flex flex-col overflow-hidden rounded-lg border text-left transition-colors"
                    style={{
                      borderColor: active ? ACCENT : LINE,
                      background: PANEL,
                    }}
                  >
                    {/* the operator's own photography goes here; a demo has none,
                        so the card commits to colour instead of a grey box */}
                    <div
                      className="flex aspect-[16/9] items-end justify-between p-4"
                      style={{
                        background: `linear-gradient(140deg, ${tour.swatch[0]}, ${tour.swatch[1]})`,
                      }}
                    >
                      <span className="rounded-md bg-black/45 px-2 py-1 text-xs font-medium">
                        {tour.area}
                      </span>
                      <span className="flex items-center gap-1 rounded-md bg-black/45 px-2 py-1 text-xs">
                        <Star className="h-3 w-3" style={{ color: ACCENT }} />
                        {tour.rating} ({tour.reviews})
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="leading-snug font-medium">{tour.name}</h3>
                      <p className="mt-1 text-sm" style={{ color: MUTED }}>
                        {tour.duration}
                      </p>
                      <p
                        className="mt-2 flex-1 text-sm leading-relaxed"
                        style={{ color: MUTED }}
                      >
                        {tour.blurb}
                      </p>

                      <ul className="mt-3 space-y-1.5">
                        {tour.includes.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm"
                            style={{ color: MUTED }}
                          >
                            <Check
                              className="mt-0.5 h-3.5 w-3.5 shrink-0"
                              style={{ color: ACCENT }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <p
                        className="mt-4 border-t pt-3 text-lg font-semibold tabular-nums"
                        style={{ borderColor: LINE }}
                      >
                        ฿{baht(tour.price)}
                        <span
                          className="ml-1.5 text-sm font-normal"
                          style={{ color: MUTED }}
                        >
                          {tour.id === "private-boat" ? "ต่อลำ" : "ต่อคน"}
                        </span>
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* the panel that answers the only question an operator has */}
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div
                className="rounded-lg border p-5"
                style={{ borderColor: LINE, background: PANEL }}
              >
                <p className="text-sm" style={{ color: MUTED }}>
                  กำลังจอง
                </p>
                <h3 className="mt-1 leading-snug font-medium">
                  {selected.name}
                </h3>

                <label className="mt-5 block">
                  <span className="text-sm" style={{ color: MUTED }}>
                    วันที่เดินทาง
                  </span>
                  <input
                    type="date"
                    className="mt-1.5 w-full rounded-md border px-3 py-2.5 text-sm outline-none focus:border-[#2c565b]"
                    style={{ borderColor: LINE, background: BG, color: TEXT }}
                  />
                </label>

                <div className="mt-4 space-y-3">
                  <Stepper
                    label="ผู้ใหญ่"
                    hint={`฿${baht(selected.price)} ต่อคน`}
                    value={adults}
                    min={1}
                    onChange={setAdults}
                  />
                  <Stepper
                    label="เด็ก 4-11 ปี"
                    hint={`฿${baht(childFare)} ต่อคน`}
                    value={children}
                    min={0}
                    onChange={setChildren}
                  />
                </div>

                {/* a toggle rather than a checkbox: a native box is 13px, which
                    is under half a comfortable thumb, and this is the control
                    people reach for last on a phone */}
                <button
                  onClick={() => setPickup((on) => !on)}
                  aria-pressed={pickup}
                  className="mt-4 flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left text-sm transition-colors"
                  style={{ borderColor: pickup ? ACCENT : LINE }}
                >
                  <span
                    aria-hidden
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
                    style={{
                      borderColor: pickup ? ACCENT : LINE,
                      background: pickup ? ACCENT : "transparent",
                    }}
                  >
                    {pickup && (
                      <Check className="h-3.5 w-3.5" style={{ color: "#2a0c02" }} />
                    )}
                  </span>
                  <span>
                    รับส่งที่พัก
                    <span className="ml-1" style={{ color: MUTED }}>
                      (+฿{baht(PICKUP_FEE)} ต่อการจอง)
                    </span>
                  </span>
                </button>

                <dl
                  className="mt-5 space-y-2 border-t pt-4 text-sm"
                  style={{ borderColor: LINE }}
                >
                  <Row
                    k={`ผู้ใหญ่ ${adults} คน`}
                    v={`฿${baht(adults * selected.price)}`}
                  />
                  {children > 0 && (
                    <Row
                      k={`เด็ก ${children} คน`}
                      v={`฿${baht(children * childFare)}`}
                    />
                  )}
                  {pickup && (
                    <Row k="รับส่งที่พัก" v={`฿${baht(PICKUP_FEE)}`} />
                  )}
                </dl>

                <div
                  className="mt-4 flex items-baseline justify-between border-t pt-4"
                  style={{ borderColor: LINE }}
                >
                  <span className="text-sm" style={{ color: MUTED }}>
                    รวมทั้งหมด
                  </span>
                  <span className="text-2xl font-semibold tabular-nums">
                    ฿{baht(total)}
                  </span>
                </div>

                <button
                  className="mt-4 w-full rounded-md py-3 text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: ACCENT, color: "#2a0c02" }}
                >
                  จองด้วยมัดจำ ฿{baht(deposit)}
                </button>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: MUTED }}>
                  จ่ายมัดจำ 30% วันนี้ ที่เหลือ ฿{baht(total - deposit)}
                  จ่ายวันขึ้นเรือ ยกเลิกฟรีก่อนเดินทาง 24 ชั่วโมง
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-t py-16" style={{ borderColor: LINE }}>
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <h2 className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
                ทำทัวร์อยู่แล้วอยากได้หน้าจองแบบนี้
              </h2>
              <p className="mt-3 max-w-md leading-relaxed" style={{ color: MUTED }}>
                แก้ทัวร์กับราคาเองได้หลังบ้าน คิดราคาให้ลูกค้าเห็นสด รับมัดจำ
                แนบสลิป และมีหน้าอนุมัติการจอง
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/pricing"
                className="rounded-md px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: ACCENT, color: "#2a0c02" }}
              >
                ดูราคา
              </Link>
              <Link
                href="/work/pet-travel"
                className="rounded-md border px-6 py-3 text-sm font-medium transition-colors hover:border-[#2c565b]"
                style={{ borderColor: LINE }}
              >
                ดูของจริงที่เคยทำ
              </Link>
            </div>
          </div>

          <p className="mt-10 text-xs" style={{ color: MUTED }}>
            หางยาว day tours เป็นผู้ประกอบการสมมติ ทัวร์และราคาแต่งขึ้นเพื่อสาธิตงานออกแบบ
          </p>
        </section>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: MUTED }}>{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-sm" style={{ color: MUTED }}>
          {hint}
        </p>
      </div>
      <div
        className="flex items-center gap-1 rounded-md border"
        style={{ borderColor: LINE }}
      >
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`ลด${label}`}
          className="flex h-9 w-9 items-center justify-center transition-opacity enabled:hover:opacity-70 disabled:opacity-30"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          aria-label={`เพิ่ม${label}`}
          className="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-70"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
