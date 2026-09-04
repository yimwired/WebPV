"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const PAPER = "#fbf7f0";
const INK = "#231f1c";
const ACCENT = "#c1440e";

// Text tones, each measured against the surface it actually sits on: body and
// muted on the paper, the chip pair on the chip fills. A menu is the page
// people read in bad light on a phone, so nothing here drops under 4.5:1.
const BODY = "#6b6259";
const MUTED = "#7a6a58";
const CHIP_INK = "#6b5c4b";
const CHIP_HOT = "#a83a0c";

/** Opening hours in 24h, keyed by JS `getDay()`. Tuesday is the day off. */
const HOURS: Record<number, [number, number] | null> = {
  0: [10, 20],
  1: [10, 21],
  2: null,
  3: [10, 21],
  4: [10, 21],
  5: [10, 22],
  6: [10, 22],
};

const CATEGORIES = ["ทั้งหมด", "ของทานเล่น", "จานหลัก", "ของหวาน", "เครื่องดื่ม"];

interface Dish {
  name: string;
  en: string;
  price: number;
  category: string;
  note?: string;
  tags?: string[];
  /** file under `public/lab-demos/counter/`. Falls back to a drawn plate. */
  photo?: string;
}

const MENU: Dish[] = [
  {
    name: "ปอเปี๊ยะกุ้งสด",
    en: "Prawn spring rolls",
    price: 120,
    category: "ของทานเล่น",
    note: "ห่อสดทุกจาน ทอดหลังสั่ง",
    tags: ["ขายดี"],
  },
  {
    name: "ยำมะม่วงปลาแห้ง",
    en: "Green mango salad",
    price: 140,
    category: "ของทานเล่น",
    tags: ["เผ็ด"],
  },
  {
    name: "เมี่ยงคำใบชะพลู",
    en: "Betel leaf wraps",
    price: 110,
    category: "ของทานเล่น",
    tags: ["มังสวิรัติ"],
  },
  {
    name: "แกงส้มชะอมกุ้ง",
    en: "Sour curry, prawn and acacia",
    price: 260,
    category: "จานหลัก",
    note: "น้ำแกงเคี่ยวทุกเช้า สั่งเผ็ดน้อยได้",
    tags: ["ขายดี", "เผ็ด"],
  },
  {
    name: "ปลากะพงทอดน้ำปลา",
    en: "Fried sea bass, fish sauce",
    price: 420,
    category: "จานหลัก",
    note: "ตัวละ 700-800 กรัม",
  },
  {
    name: "หมูฮ้องริมคลอง",
    en: "Braised pork belly",
    price: 240,
    category: "จานหลัก",
    note: "เคี่ยวสามชั่วโมง หมดแล้วหมดเลย",
    tags: ["ขายดี"],
  },
  {
    name: "ผัดผักบุ้งไฟแดง",
    en: "Stir-fried morning glory",
    price: 90,
    category: "จานหลัก",
    tags: ["มังสวิรัติ", "เผ็ด"],
  },
  {
    name: "ข้าวเหนียวมะม่วง",
    en: "Mango sticky rice",
    price: 130,
    category: "ของหวาน",
    note: "มีเฉพาะหน้ามะม่วง",
  },
  {
    name: "ลอดช่องน้ำกะทิ",
    en: "Pandan noodles in coconut cream",
    price: 80,
    category: "ของหวาน",
    tags: ["มังสวิรัติ"],
  },
  {
    name: "น้ำมะพร้าวสด",
    en: "Fresh coconut",
    price: 70,
    category: "เครื่องดื่ม",
  },
  {
    name: "ชามะลิเย็น",
    en: "Iced jasmine tea",
    price: 60,
    category: "เครื่องดื่ม",
  },
  {
    name: "น้ำอัญชันมะนาว",
    en: "Butterfly pea and lime",
    price: 70,
    category: "เครื่องดื่ม",
    tags: ["ขายดี"],
  },
];

const DAY_NAMES = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

// Derived rather than a second hand-kept list: the dishes a shop photographs
// are the ones it already calls its best sellers.
const FEATURED = MENU.filter((dish) => dish.tags?.includes("ขายดี")).slice(0, 3);

// The badge depends on the visitor's own clock, which exists only on the
// client. That makes it external state, the same reasoning as the locale store
// in `lib/i18n`: React renders the server snapshot, then swaps to the client
// value itself, with no setState inside an effect.
//
// The snapshot is minutes-since-Sunday-midnight rather than a Date, because
// useSyncExternalStore compares snapshots by identity and a fresh Date on
// every read would never settle.
let clock: number | null = null;
const clockListeners = new Set<() => void>();

function readClock() {
  const now = new Date();
  const next = now.getDay() * 1440 + now.getHours() * 60 + now.getMinutes();
  if (next === clock) return;
  clock = next;
  for (const onChange of clockListeners) onChange();
}

function subscribeClock(onChange: () => void) {
  clockListeners.add(onChange);
  readClock();
  const id = window.setInterval(readClock, 30_000);
  return () => {
    clockListeners.delete(onChange);
    window.clearInterval(id);
  };
}

const getClock = () => clock;
const getServerClock = () => null;

/**
 * "Counter": the site a restaurant actually needs. One link that answers
 * what is on the menu, what it costs, whether the kitchen is open right now
 * and how to call. Warm paper, one hot accent, no hero video.
 *
 * The open/closed badge is the point of the demo: it is real, it reads the
 * visitor's clock, and it is the sort of small live detail that makes a shop
 * owner believe the page is more than a picture.
 */
export function CounterDemo() {
  const [category, setCategory] = useState(CATEGORIES[0]);

  const clock = useSyncExternalStore(subscribeClock, getClock, getServerClock);
  const today = clock === null ? null : Math.floor(clock / 1440);
  const minuteOfDay = clock === null ? null : clock % 1440;

  const todayHours = today === null ? null : HOURS[today];
  const openNow =
    todayHours != null && minuteOfDay !== null
      ? minuteOfDay >= todayHours[0] * 60 && minuteOfDay < todayHours[1] * 60
      : false;

  const shown =
    category === CATEGORIES[0]
      ? MENU
      : MENU.filter((dish) => dish.category === category);

  return (
    <main
      className="min-h-dvh"
      style={{ background: PAPER, color: INK }}
    >
      {/* ── the bar that has to survive scrolling: name, status, phone ── */}
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-[2px]"
        style={{ borderColor: "#e3dbcd", background: "rgba(251,247,240,0.92)" }}
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:px-8">
          <span className="text-lg font-semibold tracking-tight">
            ครัวริมคลอง
          </span>

          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              background: openNow ? "#e6f2e6" : "#f0e9df",
              color: openNow ? "#2f6b34" : MUTED,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: openNow ? "#3f9a46" : "#b3a897" }}
            />
            {clock === null
              ? "กำลังเช็คเวลา"
              : openNow
                ? "เปิดอยู่ตอนนี้"
                : "ปิดอยู่"}
          </span>

          <a
            href="tel:021234567"
            className="ml-auto rounded-full px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            โทรสั่ง 02-123-4567
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        {/* ── hero ── */}
        <section className="py-16 sm:py-24">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium tracking-[0.2em] uppercase"
            style={{ color: ACCENT }}
          >
            อาหารไทยริมน้ำ · นนทบุรี
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease }}
            className="mt-4 text-4xl leading-[1.15] font-semibold tracking-tight sm:text-6xl"
          >
            กับข้าวบ้านๆ
            <br />
            ที่เคี่ยวมาตั้งแต่เช้า
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease }}
            className="mt-6 max-w-md leading-relaxed"
            style={{ color: BODY }}
          >
            สูตรเดิมตั้งแต่ปี 2537 ทำวันต่อวัน ของหมดก่อนร้านปิดเป็นเรื่องปกติ
            โทรจองโต๊ะได้ตั้งแต่สิบโมง
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a
              href="#menu"
              className="rounded-full px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: INK }}
            >
              ดูเมนูทั้งหมด
            </a>
            <a
              href="#visit"
              className="rounded-full border px-6 py-3 text-sm font-medium transition-colors"
              style={{ borderColor: "#d8cfbf" }}
            >
              เส้นทางมาร้าน
            </a>
          </motion.div>
        </section>

        {/* ── the three the shop would photograph ── */}
        <section className="pb-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            จานเด่น
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {FEATURED.map((dish, i) => (
              <motion.article
                key={dish.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.06, ease }}
                className="overflow-hidden rounded-xl border"
                style={{ borderColor: "#e3dbcd" }}
              >
                <div className="relative aspect-[4/3]">
                  <DishImage dish={dish} sizes="(min-width: 640px) 30vw, 92vw" />
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-medium">{dish.name}</h3>
                    <span className="shrink-0 tabular-nums">{dish.price}.-</span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: MUTED }}>
                    {dish.en}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── menu ── */}
        <section id="menu" className="scroll-mt-20 pb-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            เมนู
          </h2>

          {/* filter chips: the one interaction a menu page really needs */}
          <div
            className="mt-6 flex gap-2 overflow-x-auto pb-2"
            role="tablist"
            aria-label="หมวดอาหาร"
          >
            {CATEGORIES.map((name) => {
              const active = name === category;
              return (
                <button
                  key={name}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(name)}
                  className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    borderColor: active ? INK : "#ddd4c4",
                    background: active ? INK : "transparent",
                    color: active ? PAPER : BODY,
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <ul className="mt-8 divide-y" style={{ borderColor: "#e8e0d2" }}>
            {shown.map((dish, i) => (
              <motion.li
                key={dish.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.03 }}
                className="flex items-start gap-4 border-t py-5 first:border-t-0"
                style={{ borderColor: "#e8e0d2" }}
              >
                <div
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20"
                  style={{ background: "#f6f0e6" }}
                >
                  <DishImage dish={dish} sizes="80px" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <h3 className="font-medium">{dish.name}</h3>
                    {dish.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-[11px]"
                        style={{
                          background: tag === "เผ็ด" ? "#fbe7e1" : "#efe8dc",
                          color: tag === "เผ็ด" ? CHIP_HOT : CHIP_INK,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-sm" style={{ color: MUTED }}>
                    {dish.en}
                  </p>
                  {dish.note && (
                    <p className="mt-1.5 text-sm" style={{ color: BODY }}>
                      {dish.note}
                    </p>
                  )}
                </div>
                <span className="shrink-0 tabular-nums">{dish.price}.-</span>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* ── hours and how to get there ── */}
        <section id="visit" className="scroll-mt-20 py-16">
          <div
            className="rounded-2xl border p-6 sm:p-10"
            style={{ borderColor: "#e3dbcd", background: "#f6f0e6" }}
          >
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  เวลาเปิด
                </h2>
                <dl className="mt-4 space-y-1.5 text-sm">
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                    const hours = HOURS[day];
                    const isToday = today === day;
                    return (
                      <div
                        key={day}
                        className="flex justify-between gap-4"
                        style={{
                          color: isToday ? INK : MUTED,
                          fontWeight: isToday ? 600 : 400,
                        }}
                      >
                        <dt>{DAY_NAMES[day]}</dt>
                        <dd className="tabular-nums">
                          {hours
                            ? `${hours[0]}.00 - ${hours[1]}.00 น.`
                            : "ปิดทำการ"}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>

              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  มาที่ร้าน
                </h2>
                <p
                  className="mt-4 text-sm leading-relaxed"
                  style={{ color: BODY }}
                >
                  119/4 ซอยท่าน้ำนนท์ 12
                  <br />
                  ตำบลสวนใหญ่ อำเภอเมือง นนทบุรี 11000
                  <br />
                  จอดรถได้ 12 คัน หลังร้านติดท่าเรือ
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="tel:021234567"
                    className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: ACCENT }}
                  >
                    โทรจองโต๊ะ
                  </a>
                  <a
                    href="#visit"
                    className="rounded-full border px-5 py-2.5 text-sm font-medium"
                    style={{ borderColor: "#d8cfbf" }}
                  >
                    เปิดใน Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── the pitch this direction exists to make ── */}
        <section className="border-t py-16" style={{ borderColor: "#e3dbcd" }}>
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <h2 className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
                หน้านี้ แต่เป็นร้านคุณ
              </h2>
              <p
                className="mt-3 max-w-md leading-relaxed"
                style={{ color: BODY }}
              >
                สามวัน ส่งเมนูกับรูปมา ที่เหลือผมจัดให้ แก้ราคาเองได้ทีหลัง
                ไม่ต้องเรียกช่าง
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
                style={{ borderColor: "#d8cfbf" }}
              >
                ทักมาคุย
              </Link>
            </div>
          </div>

          <p className="mt-10 text-xs" style={{ color: MUTED }}>
            ครัวริมคลองเป็นร้านสมมติ ใช้สาธิตงานออกแบบเท่านั้น
          </p>
        </section>
      </div>
    </main>
  );
}

/**
 * A dish photo, or the plate that stands in for one.
 *
 * The demo ships without photography and an empty grey box reads as a page
 * that failed to load. A plate seen from above reads as a decision, and it is
 * exactly the slot a shop's own photo drops into: set `photo` on the dish and
 * nothing else here changes.
 */
function DishImage({ dish, sizes }: { dish: Dish; sizes: string }) {
  if (dish.photo) {
    return (
      <Image
        src={dish.photo}
        alt={dish.name}
        fill
        sizes={sizes}
        unoptimized
        className="object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden
      className="h-full w-full"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #f4ede1 0 34%, #e7dcc9 34% 37%, #f7f2e8 37%)",
      }}
    />
  );
}
