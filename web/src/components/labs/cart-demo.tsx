"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Star, Truck } from "lucide-react";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

// Off-black rather than #000: pure black is an OLED-luxury choice and this is
// a shop. Acid lime carries every action, and nothing else on the page uses it,
// so the eye learns in one screen where the buttons are.
const BG = "#0b0b0c";
const PANEL = "#141416";
const LINE = "#232326";
const TEXT = "#f4f4f5";
const MUTED = "#a1a1a6";
// measured, not picked: 4.8:1 on the page, 4.6:1 on the tinted bundle tile,
// which is the darkest ground any faint text here actually sits on
const FAINT = "#828289";
const ACID = "#c8f04a";
// two tones that stay readable on the acid block, measured rather than an
// opacity: text at 80% over lime lands near 2:1 and the scanner was right
// to call it
const ON_ACID = "#161b05";
const ON_ACID_SOFT = "#3b4711";

// Kanit, loaded by the route and handed down as a variable. The headings here
// are Thai, and Thai display faces are where this page can sound like itself:
// the body face falls back to the system Thai on every other lab.
const DISPLAY = {
  fontFamily: "var(--font-cart-display), system-ui, sans-serif",
} as const;

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
  { units: 1, unitPrice: 890, label: "ลองก่อน" },
  { units: 2, unitPrice: 790, label: "คู่กับที่บ้าน", best: true },
  { units: 3, unitPrice: 690, label: "ยกชุด", perk: "แถมซองหนัง PU" },
];

/** The three settings the product actually has, and what each one leaves you. */
const ANC_LEVELS = [
  {
    id: "off",
    label: "ปิด",
    amplitude: 1,
    caption: "ได้ยินทุกอย่างตามจริง",
    audible: ["เสียงเครื่องยนต์", "ประกาศสถานี", "คนคุยข้างๆ", "เพลง"],
  },
  {
    id: "mid",
    label: "กลาง",
    amplitude: 0.42,
    caption: "เหลือเสียงคนพอให้คุยรู้เรื่อง",
    audible: ["คนคุยข้างๆ", "เพลง"],
  },
  {
    id: "max",
    label: "สูงสุด",
    amplitude: 0.11,
    caption: "เหลือแต่สิ่งที่คุณเปิดเอง",
    audible: ["เพลง"],
  },
];

// A deterministic stand-in for a street recording: four sines at unrelated
// frequencies. Computed the same on the server and in the browser, so the
// waveform never changes shape under hydration - only its height moves.
const WAVE = Array.from({ length: 180 }, (_, i) => {
  const x = i / 7;
  return (
    Math.sin(x) * 0.5 +
    Math.sin(x * 2.3 + 1.1) * 0.28 +
    Math.sin(x * 5.7 + 0.4) * 0.14 +
    Math.sin(x * 11.3 + 2.2) * 0.07
  );
});

const PROBLEMS = [
  { h: "ใส่นานแล้วเจ็บหู", p: "ทรงแข็งดันรูหูจนต้องถอดทุกชั่วโมง" },
  { h: "แบตหมดกลางทาง", p: "ชาร์จเต็มตอนเช้า บ่ายก็เตือนแบตต่ำแล้ว" },
  { h: "รอของสามสัปดาห์", p: "สั่งของถูกจากนอก เสียแล้วเคลมไม่ได้ด้วย" },
];

const BENEFITS = [
  {
    src: "/lab-demos/cart/commute.webp",
    alt: "ใส่หูฟังบนรถไฟฟ้า",
    stat: "4 ไมค์",
    h: "เงียบตั้งแต่ก้าวขึ้นรถ",
    p: "ไมค์สี่ตัวอ่านเสียงรอบตัวแล้วหักล้างแบบเรียลไทม์ เสียงเครื่องยนต์กับเสียงประกาศเบาลงจนได้ยินแต่สิ่งที่อยากฟัง กดสองครั้งเปิดโหมดฟังรอบข้างตอนต้องคุยกับใคร",
  },
  {
    src: "/lab-demos/cart/case.webp",
    alt: "หูฟังกับกล่องชาร์จ",
    stat: "10 นาที",
    h: "ชาร์จสิบนาที ใช้ได้สองชั่วโมง",
    p: "แบตในตัว 8 ชั่วโมง กล่องเก็บไว้ให้อีก 32 ชั่วโมง ลืมชาร์จตอนกลางคืนก็ยังทัน เสียบไว้ตอนอาบน้ำก็พอใช้ได้ทั้งเช้า",
  },
  {
    src: "/lab-demos/cart/outdoors.webp",
    alt: "ใส่หูฟังกลางแจ้ง",
    stat: "4.2 กรัม",
    h: "เหงื่อกับฝนไม่ใช่ปัญหา",
    p: "มาตรฐาน IPX5 วิ่งกลางแดดหรือโดนฝนสาดระหว่างเดินก็ยังทำงานปกติ ตัวหูฟังหนักข้างละ 4.2 กรัม ใส่วิ่งแล้วไม่หลุด",
  },
];

const COMPARISON = [
  { k: "ตัดเสียงรบกวน", ours: "ปรับได้ 3 ระดับ", theirs: "ไม่มี" },
  { k: "แบตต่อการชาร์จ", ours: "8 ชั่วโมง", theirs: "3 ถึง 4 ชั่วโมง" },
  { k: "รวมกล่องชาร์จ", ours: "32 ชั่วโมง", theirs: "12 ชั่วโมง" },
  { k: "กันเหงื่อกันฝน", ours: "IPX5", theirs: "ไม่ระบุ" },
  { k: "รับประกัน", ours: "1 ปี เคลมในไทย", theirs: "7 วัน" },
  { k: "ส่งจาก", ours: "คลังในไทย 1 ถึง 2 วัน", theirs: "ต่างประเทศ 2 ถึง 4 สัปดาห์" },
];

const REVIEWS = [
  {
    name: "พิมพ์ชนก ว.",
    stars: 5,
    text: "ใส่นั่งรถไฟฟ้าไปทำงานทุกวัน เสียงประกาศกับเสียงคนคุยหายไปเกือบหมด ที่ชอบสุดคือใส่แล้วไม่เจ็บหูตอนใส่นานๆ ก่อนหน้านี้ใช้ของถูกกว่านี้สามอัน ถอดทุกชั่วโมงทุกอัน",
    feature: true,
  },
  {
    name: "ธนกฤต ส.",
    stars: 5,
    text: "สั่งบ่ายสอง ได้ของวันรุ่งขึ้นตอนสิบโมง เร็วกว่าที่คิด แบตอยู่ได้ทั้งวันจริง",
  },
  {
    name: "อารีย์ ม.",
    stars: 4,
    text: "เสียงดีเกินราคา หักหนึ่งดาวเพราะแอปตั้งค่ายังแปลไทยไม่ครบ",
  },
  {
    name: "ณัฐวุฒิ ค.",
    stars: 5,
    text: "ซื้อ 3 ชิ้นแบ่งให้ที่บ้าน ใช้มาสองเดือนยังไม่มีปัญหาสักตัว",
  },
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
    a: "1 ปีเต็มสำหรับความเสียหายจากการผลิต เคลมกับเราในไทยโดยตรง ปกติเปลี่ยนตัวใหม่ให้ภายใน 5 วันทำการ",
  },
];

const baht = (value: number) => value.toLocaleString("th-TH");

// Minutes until today's dispatch cut-off, negative once it has gone. Client
// only, so it arrives through an external store the way the Counter demo's
// open sign does: no setState in an effect, and a snapshot that only moves
// when the minute does.
//
// This is the honest version of the urgency the genre runs on. A real cut-off
// read off the visitor's own clock expires once and tells the truth after. The
// countdown that resets to 09:59 on every load is the same pixels and a lie,
// and it is not going in a demo a client might copy.
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
 * "Cart": the single product page, in the register the genre actually works in.
 * Off-black, the product lit against it, one acid accent that only ever means
 * "buy". Every section is a different shape on purpose - the first version of
 * this page was a stack of equal card grids, which reads as competent and
 * forgettable, and forgettable is the one thing a shop cannot be.
 *
 * Three things here do work rather than decorate: the bundle tiles price
 * themselves, the dispatch line reads the visitor's clock, and the noise
 * control is a real demonstration of the feature being sold rather than a
 * sentence claiming it.
 *
 * The genre's scarcity theatre is absent on purpose. No timer that resets on
 * reload, no stock counter frozen at two. Both convert, and both teach the
 * client to lie to their own customers.
 */
export function CartDemo() {
  const [bundle, setBundle] = useState<Bundle>(BUNDLES[1]);
  // starts switched off, so the first thing anyone sees is the noise the
  // product is sold against. Discovering the collapse is the demonstration.
  const [anc, setAnc] = useState(ANC_LEVELS[0]);
  const [barVisible, setBarVisible] = useState(false);

  const heroCta = useRef<HTMLDivElement>(null);
  const left = useSyncExternalStore(subscribeClock, getClock, getServerClock);

  const total = bundle.units * bundle.unitPrice;
  const saved = bundle.units * LIST_PRICE - total;

  // the sticky bar is a shortcut back to the buy box, so it only exists once
  // the buy box has gone. Two identical buttons on one screen is noise.
  useEffect(() => {
    const node = heroCta.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        // scrolled past it, not merely below it: on a short viewport the buy
        // box starts off screen, and a bar that appears at the top of the page
        // sits on top of the headline
        setBarVisible(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        ),
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-dvh pb-24" style={{ background: BG, color: TEXT }}>
      <div
        className="grid grid-cols-3 divide-x text-center text-xs sm:text-sm"
        style={{ background: PANEL, borderColor: LINE, color: MUTED }}
      >
        {["ส่งฟรีทั่วไทย", "เก็บเงินปลายทาง", "คืนได้ใน 7 วัน"].map((item) => (
          <span key={item} className="px-2 py-2.5" style={{ borderColor: LINE }}>
            {item}
          </span>
        ))}
      </div>

      <header
        className="sticky top-0 z-20 border-b"
        style={{ borderColor: LINE, background: "rgba(11,11,12,0.9)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3.5 sm:px-8">
          <span className="text-lg font-semibold tracking-tight">HUSH</span>
          <span className="hidden text-sm sm:inline" style={{ color: FAINT }}>
            หูฟังไร้สายตัดเสียงรบกวน
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-sm">
            <Stars value={5} />
            <span style={{ color: MUTED }}>4.8</span>
          </span>
        </div>
      </header>

      {/* ── the product, as big as the page can make it ── */}
      <section
        id="top"
        className="relative scroll-mt-20 overflow-hidden px-5 pt-14 pb-12 sm:px-8 sm:pt-20"
      >
        <div className="relative mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease }}
            className="relative mx-auto aspect-square w-full max-w-lg overflow-hidden rounded-3xl"
          >
            <Image
              src="/lab-demos/cart/hero.webp"
              alt="หูฟังไร้สาย HUSH A1 พร้อมกล่องชาร์จ"
              fill
              sizes="(min-width: 640px) 32rem, 92vw"
              unoptimized
              priority
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease }}
            className="mt-10 text-center"
          >
            <h1
              className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl"
              style={DISPLAY}
            >
              เงียบลงทันที
              <br />
              ที่ใส่
            </h1>
            <p
              className="mx-auto mt-5 max-w-md leading-relaxed"
              style={{ color: MUTED }}
            >
              HUSH A1 ตัดเสียงรบกวนปรับได้ 3 ระดับ แบต 8 ชั่วโมงต่อการชาร์จ
              รวมกล่องอีก 32 ชั่วโมง กันเหงื่อกันฝนระดับ IPX5
            </p>
          </motion.div>

          {/* bundles as tiles in a row, so the middle one can be the obvious one */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {BUNDLES.map((option) => {
              const active = option.units === bundle.units;
              return (
                <button
                  key={option.units}
                  onClick={() => setBundle(option)}
                  aria-pressed={active}
                  className="relative rounded-2xl border p-5 text-left transition-colors"
                  style={{
                    borderColor: active ? ACID : LINE,
                    background: active ? "rgba(200,240,74,0.06)" : PANEL,
                  }}
                >
                  {option.best && (
                    <span
                      className="absolute -top-2.5 left-5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: ACID, color: ON_ACID }}
                    >
                      คนซื้อเยอะสุด
                    </span>
                  )}

                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-lg font-medium">
                      {option.units} ชิ้น
                    </span>
                    <span className="text-sm" style={{ color: FAINT }}>
                      {option.label}
                    </span>
                  </span>

                  <span className="mt-3 block text-2xl font-semibold tabular-nums">
                    ฿{baht(option.units * option.unitPrice)}
                  </span>
                  <span className="text-sm tabular-nums" style={{ color: MUTED }}>
                    ฿{baht(option.unitPrice)} ต่อชิ้น
                  </span>

                  {option.perk && (
                    <span
                      className="mt-2 block text-sm"
                      style={{ color: active ? ACID : MUTED }}
                    >
                      {option.perk}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div ref={heroCta} className="mx-auto mt-8 max-w-lg">
            <div className="flex items-baseline justify-center gap-3">
              <span className="text-4xl font-semibold tabular-nums" style={DISPLAY}>
                ฿{baht(total)}
              </span>
              {saved > 0 && (
                <span className="text-sm font-medium" style={{ color: ACID }}>
                  ประหยัด ฿{baht(saved)}
                </span>
              )}
            </div>

            <button
              className="mt-5 w-full rounded-full py-4 text-base font-semibold transition-opacity hover:opacity-90"
              style={{ background: ACID, color: ON_ACID }}
            >
              สั่งซื้อ เก็บเงินปลายทางได้
            </button>

            <p
              className="mt-3 flex items-center justify-center gap-2 text-sm"
              style={{ color: left !== null && left > 0 ? ACID : MUTED }}
            >
              <Truck className="h-4 w-4 shrink-0" />
              <Dispatch minutes={left} />
            </p>
          </div>
        </div>
      </section>

      {/* ── the feature, demonstrated instead of claimed ── */}
      <section className="border-y px-5 py-16 sm:px-8" style={{ borderColor: LINE }}>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <h2
            className="text-2xl font-semibold tracking-tight sm:text-4xl"
            style={DISPLAY}
          >
                ลองปรับดู
              </h2>
              <p className="mt-2 max-w-sm leading-relaxed" style={{ color: MUTED }}>
                นี่คือเสียงถนนหนึ่งเส้น กดเปลี่ยนระดับแล้วดูว่าเหลืออะไรถึงหูคุณบ้าง
              </p>
            </div>

            <div
              className="flex rounded-full border p-1"
              style={{ borderColor: LINE, background: PANEL }}
            >
              {ANC_LEVELS.map((level) => {
                const active = level.id === anc.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => setAnc(level)}
                    aria-pressed={active}
                    className="rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      background: active ? ACID : "transparent",
                      color: active ? "#161b05" : MUTED,
                    }}
                  >
                    {level.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="mt-8 overflow-hidden rounded-2xl border"
            style={{ borderColor: LINE, background: PANEL }}
          >
            <Waveform amplitude={anc.amplitude} />

            <div
              className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t px-5 py-4 sm:px-7"
              style={{ borderColor: LINE }}
            >
              <p className="text-sm font-medium" style={{ color: ACID }}>
                {anc.caption}
              </p>
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {ANC_LEVELS[0].audible.map((sound) => {
                  const heard = anc.audible.includes(sound);
                  return (
                    <li
                      key={sound}
                      className="flex items-center gap-1.5 transition-colors"
                      style={{ color: heard ? MUTED : FAINT }}
                    >
                      {heard ? (
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: MUTED }}
                        />
                      ) : (
                        <Minus className="h-3.5 w-3.5" aria-hidden />
                      )}
                      <span className={heard ? undefined : "line-through"}>
                        {sound}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── what people put up with, as one statement and three lines ── */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <h2
            className="text-2xl leading-tight font-semibold tracking-tight sm:text-4xl"
            style={DISPLAY}
          >
            ซื้อหูฟังถูกๆ มาแล้ว
            <br />
            เจอแบบนี้กันทุกที
          </h2>

          <dl>
            {PROBLEMS.map((item, i) => (
              <motion.div
                key={item.h}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="border-t py-5 first:border-t-0 first:pt-0"
                style={{ borderColor: LINE }}
              >
                <dt className="font-medium">{item.h}</dt>
                <dd
                  className="mt-1.5 max-w-[48ch] leading-relaxed"
                  style={{ color: MUTED }}
                >
                  {item.p}
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── benefits, alternating, so no row is left with a hole in it ── */}
      <section className="px-5 pb-4 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-16 sm:space-y-24">
          {BENEFITS.map((item, i) => (
            <motion.article
              key={item.h}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease }}
              className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
            >
              <div
                className={`relative aspect-[4/3] overflow-hidden rounded-2xl ${
                  i % 2 ? "md:order-2" : ""
                }`}
                style={{ background: PANEL }}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 768px) 45vw, 92vw"
                  unoptimized
                  className="object-cover"
                />
              </div>

              <div>
                <p
                  className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
                  style={{ ...DISPLAY, color: ACID }}
                >
                  {item.stat}
                </p>
                <h3 className="mt-3 text-xl font-medium sm:text-2xl">{item.h}</h3>
                <p
                  className="mt-3 max-w-[46ch] leading-relaxed"
                  style={{ color: MUTED }}
                >
                  {item.p}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── the comparison, as two panels rather than a ruled table ── */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-2xl font-semibold tracking-tight sm:text-4xl"
            style={DISPLAY}
          >
            เทียบกับหูฟังราคาใกล้กัน
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div
              className="rounded-2xl border p-6 sm:p-8"
              style={{ borderColor: ACID, background: "rgba(200,240,74,0.05)" }}
            >
              <p className="text-lg font-semibold">HUSH A1</p>
              <dl className="mt-5 space-y-4">
                {COMPARISON.map((row) => (
                  <div key={row.k}>
                    <dt className="text-sm" style={{ color: MUTED }}>
                      {row.k}
                    </dt>
                    <dd className="mt-0.5 flex items-start gap-2 font-medium">
                      <Check
                        className="mt-1 h-4 w-4 shrink-0"
                        style={{ color: ACID }}
                      />
                      {row.ours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div
              className="rounded-2xl border p-6 sm:p-8"
              style={{ borderColor: LINE, background: PANEL }}
            >
              <p className="text-lg font-medium" style={{ color: MUTED }}>
                หูฟังทั่วไปในราคาเดียวกัน
              </p>
              <dl className="mt-5 space-y-4">
                {COMPARISON.map((row) => (
                  <div key={row.k}>
                    <dt className="text-sm" style={{ color: FAINT }}>
                      {row.k}
                    </dt>
                    <dd className="mt-0.5" style={{ color: MUTED }}>
                      {row.theirs}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ── reviews: one that earns the space, three that back it up ── */}
      <section
        className="border-y px-5 py-16 sm:px-8"
        style={{ borderColor: LINE }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2
            className="text-2xl font-semibold tracking-tight sm:text-4xl"
            style={DISPLAY}
          >
              คนที่ซื้อไปแล้วพูดว่า
            </h2>
            <span
              className="flex items-center gap-2 text-sm"
              style={{ color: MUTED }}
            >
              <Stars value={5} />
              4.8 จาก 1,204 รีวิว
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {REVIEWS.map((review) => (
              <figure
                key={review.name}
                className={`rounded-2xl border p-6 ${
                  review.feature ? "md:col-span-3" : ""
                }`}
                style={{
                  borderColor: review.feature ? ACID : LINE,
                  background: review.feature ? "rgba(200,240,74,0.05)" : PANEL,
                }}
              >
                <Stars value={review.stars} />
                <blockquote
                  className={`mt-3 leading-relaxed ${
                    review.feature ? "text-lg sm:text-xl" : "text-sm"
                  }`}
                  style={{ color: review.feature ? TEXT : MUTED }}
                >
                  {review.text}
                </blockquote>
                <figcaption className="mt-4 text-sm font-medium">
                  {review.name}
                  <span className="ml-2 font-normal" style={{ color: ACID }}>
                    ซื้อจริง
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-2xl font-semibold tracking-tight sm:text-4xl"
            style={DISPLAY}
          >
            ถามกันมาบ่อย
          </h2>
          <dl className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="font-medium">{item.q}</dt>
                <dd
                  className="mt-2 max-w-[52ch] leading-relaxed"
                  style={{ color: MUTED }}
                >
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── the last word, as a colour block ── */}
      <section className="px-5 pb-16 sm:px-8">
        <div
          className="mx-auto max-w-5xl rounded-3xl px-8 py-14 text-center sm:py-20"
          style={{ background: ACID, color: ON_ACID }}
        >
          <h2
            className="text-3xl leading-tight font-semibold tracking-tight sm:text-5xl"
            style={DISPLAY}
          >
            ลองใส่ 7 วัน
            <br />
            ไม่ชอบส่งคืน
          </h2>
          <p
            className="mx-auto mt-4 max-w-md leading-relaxed"
            style={{ color: ON_ACID_SOFT }}
          >
            เราออกค่าส่งกลับให้เอง ไม่ต้องอธิบายเหตุผล คืนเงินเต็มจำนวนภายใน 3 วันทำการ
          </p>
          <button
            className="mt-8 rounded-full px-10 py-4 text-base font-semibold transition-opacity hover:opacity-90"
            style={{ background: ON_ACID, color: ACID }}
          >
            สั่งซื้อ ฿{baht(total)}
          </button>
          <p className="mt-4 text-sm" style={{ color: ON_ACID_SOFT }}>
            <Dispatch minutes={left} />
          </p>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8">
        <div
          className="mx-auto grid max-w-5xl gap-6 border-t pt-12 sm:grid-cols-[1fr_auto] sm:items-end"
          style={{ borderColor: LINE }}
        >
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
              className="rounded-full px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: ACID, color: ON_ACID }}
            >
              ดูราคา
            </Link>
            <Link
              href="/#contact"
              className="rounded-full border px-6 py-3 text-sm font-medium"
              style={{ borderColor: LINE }}
            >
              ทักมาคุย
            </Link>
          </div>
        </div>

        <p
          className="mx-auto mt-10 max-w-[72ch] text-xs leading-relaxed"
          style={{ color: FAINT }}
        >
          HUSH เป็นแบรนด์สมมติ สเปก รีวิว และยอดขายทั้งหมดแต่งขึ้นเพื่อสาธิตงานออกแบบ
          เวลาส่งของนับจากนาฬิกาเครื่องคุณจริง ไม่ใช่ตัวนับถอยหลังที่รีเซ็ตใหม่ทุกครั้งที่เปิดหน้า
        </p>
      </section>

      {/* the shortcut back to the buy box, once the buy box has scrolled away */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t transition-transform duration-300"
        style={{
          borderColor: LINE,
          background: "rgba(11,11,12,0.94)",
          transform: barVisible ? "translateY(0)" : "translateY(110%)",
        }}
        aria-hidden={!barVisible}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3 sm:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm" style={{ color: MUTED }}>
              HUSH A1 · {bundle.units} ชิ้น
            </p>
            <p className="text-lg font-semibold tabular-nums">฿{baht(total)}</p>
          </div>
          <a
            href="#top"
            className="ml-auto shrink-0 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: ACID, color: ON_ACID }}
            tabIndex={barVisible ? undefined : -1}
          >
            สั่งซื้อ
          </a>
        </div>
      </div>
    </main>
  );
}

/**
 * The street, drawn once and squashed. Only the height animates, so the shape
 * of the noise stays recognisable while the level changes - which is the point
 * being made.
 */
function Waveform({ amplitude }: { amplitude: number }) {
  const points = WAVE.map((value, i) => {
    const x = (i / (WAVE.length - 1)) * 1000;
    const y = 100 - value * 78;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg
      viewBox="0 0 1000 200"
      preserveAspectRatio="none"
      role="img"
      aria-label={`ระดับเสียงรอบข้างที่เหลือ ${Math.round(amplitude * 100)} เปอร์เซ็นต์`}
      className="block h-40 w-full sm:h-52"
    >
      <line
        x1="0"
        y1="100"
        x2="1000"
        y2="100"
        stroke={LINE}
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <g
        style={{
          transform: `scaleY(${amplitude})`,
          transformOrigin: "center",
          transition: "transform 700ms cubic-bezier(0.21,0.47,0.32,0.98)",
        }}
      >
        <polyline
          points={points}
          fill="none"
          stroke={ACID}
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
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
            color: n <= value ? ACID : "#3f3f45",
            fill: n <= value ? ACID : "#3f3f45",
          }}
        />
      ))}
    </span>
  );
}
