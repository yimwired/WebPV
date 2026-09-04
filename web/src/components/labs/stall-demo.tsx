"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Search, X } from "lucide-react";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const BG = "#0e1013";
const PANEL = "#171a20";
const LINE = "#252a33";
const TEXT = "#e6e8ec";
const MUTED = "#8b93a1";
// the quietest tone on this page, still 5.1:1 on the background
const FAINT = "#7d8593";
const ACCENT = "#facc15";

interface Listing {
  id: string;
  title: string;
  game: string;
  price: number;
  seller: string;
  sales: number;
  verified: boolean;
  detail: string;
  swatch: [string, string];
}

const GAMES = ["ทั้งหมด", "ROV", "Valorant", "Genshin", "FC Online", "Roblox"];

const LISTINGS: Listing[] = [
  {
    id: "l1",
    title: "ไอดี ROV ฮีโร่ครบ 120 ตัว สกินตำนาน 8",
    game: "ROV",
    price: 4500,
    seller: "kaokao_shop",
    sales: 212,
    verified: true,
    detail: "แรงค์ Conqueror ซีซั่นล่าสุด ผูกเมลได้ ส่งข้อมูลครบ",
    swatch: ["#1e3a8a", "#0f172a"],
  },
  {
    id: "l2",
    title: "Valorant สกิน Reaver Vandal + Prime Phantom",
    game: "Valorant",
    price: 3200,
    seller: "midnight.acc",
    sales: 87,
    verified: true,
    detail: "ภูมิภาค AP อีเมลเดิมยังอยู่ เปลี่ยนชื่อได้ 1 ครั้ง",
    swatch: ["#7f1d1d", "#171717"],
  },
  {
    id: "l3",
    title: "Genshin AR60 ตัว 5 ดาว 14 ตัว อาวุธจำกัด 6",
    game: "Genshin",
    price: 8900,
    seller: "teyvat_trade",
    sales: 41,
    verified: false,
    detail: "ผูก HoYoverse เปลี่ยนเมลให้หลังโอน มีคลิปยืนยันของ",
    swatch: ["#0f766e", "#0b3b39"],
  },
  {
    id: "l4",
    title: "FC Online นักเตะไอคอน 3 ใบ ทีมเรต 108",
    game: "FC Online",
    price: 15000,
    seller: "squad_builder",
    sales: 156,
    verified: true,
    detail: "ไม่มีประวัติโดนแบน ดูของผ่านแชร์จอก่อนโอนได้",
    swatch: ["#166534", "#0a2416"],
  },
  {
    id: "l5",
    title: "Roblox ไอดีมี Limited 12 ชิ้น + Robux 4,000",
    game: "Roblox",
    price: 2600,
    seller: "limited.th",
    sales: 63,
    verified: false,
    detail: "อายุไอดี 6 ปี ไม่มีประวัติแจ้งเตือน",
    swatch: ["#78350f", "#291505"],
  },
  {
    id: "l6",
    title: "ROV ไอดีเก่า 2559 สกินฉลอง 5 ตัว",
    game: "ROV",
    price: 1800,
    seller: "oldschool_id",
    sales: 24,
    verified: false,
    detail: "ไอดีเก่าจริง มีสกินที่ปิดขายไปแล้ว ดูของก่อนโอนได้",
    swatch: ["#3730a3", "#141233"],
  },
];

const baht = (value: number) => value.toLocaleString("th-TH");

/**
 * "Stall": a listings marketplace with accounts, the plain version a lot of
 * people actually ask for. Sellers post, buyers filter and message the seller
 * directly.
 *
 * The site never holds the money on purpose. Escrow means someone else's cash
 * moving through the operator, which brings fraud, chargebacks and a party to
 * blame, and that is not a liability a one-person shop should sign up for. The
 * banner in the listing header says so out loud, because it is also the honest
 * pitch: fewer promises, less to go wrong.
 */
export function StallDemo() {
  const [game, setGame] = useState(GAMES[0]);
  const [query, setQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  const shown = LISTINGS.filter((listing) => {
    const inGame = game === GAMES[0] || listing.game === game;
    const text = `${listing.title} ${listing.game} ${listing.seller}`;
    return inGame && text.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <main className="min-h-dvh" style={{ background: BG, color: TEXT }}>
      <header
        className="sticky top-0 z-20 border-b"
        style={{ borderColor: LINE, background: "rgba(14,16,19,0.92)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5 sm:px-8">
          <span className="text-lg font-semibold tracking-tight">
            STALL
            <span style={{ color: ACCENT }}>.</span>
          </span>

          <div className="relative ml-2 hidden flex-1 sm:block">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              style={{ color: MUTED }}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาไอดี ไอเท็ม หรือชื่อร้าน"
              aria-label="ค้นหาประกาศ"
              className="w-full rounded-md border py-2 pr-3 pl-9 text-sm outline-none placeholder:text-[#6b7280] focus:border-[#3a424f]"
              style={{ borderColor: LINE, background: PANEL }}
            />
          </div>

          {account ? (
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm sm:inline" style={{ color: MUTED }}>
                {account}
              </span>
              <button
                className="rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: ACCENT, color: "#1a1400" }}
              >
                ลงประกาศ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="ml-auto rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:border-[#3a424f]"
              style={{ borderColor: LINE }}
            >
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="py-14 sm:py-20">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl"
          >
            ตลาดไอดีและไอเท็ม
            <br />
            ที่คุยกันตรงกับคนขาย
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="mt-5 max-w-xl leading-relaxed"
            style={{ color: MUTED }}
          >
            สมัครแล้วลงประกาศได้เลย ค้นหาตามเกม ดูประวัติคนขาย
            แล้วทักไปคุยเอง เว็บไม่ถือเงินให้ใครทั้งนั้น
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-md px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: ACCENT, color: "#1a1400" }}
            >
              {account ? "ลงประกาศของคุณ" : "สมัครสมาชิกฟรี"}
            </button>
            <a
              href="#listings"
              className="rounded-md border px-6 py-3 text-sm font-medium transition-colors hover:border-[#3a424f]"
              style={{ borderColor: LINE }}
            >
              ดูประกาศทั้งหมด
            </a>
          </motion.div>
        </section>

        <section id="listings" className="scroll-mt-20 pb-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {GAMES.map((name) => {
                const active = name === game;
                return (
                  <button
                    key={name}
                    onClick={() => setGame(name)}
                    aria-pressed={active}
                    className="shrink-0 rounded-md border px-3.5 py-2 text-sm transition-colors"
                    style={{
                      borderColor: active ? ACCENT : LINE,
                      color: active ? ACCENT : MUTED,
                      background: active ? "rgba(250,204,21,0.08)" : "transparent",
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <p className="text-sm tabular-nums" style={{ color: MUTED }}>
              {shown.length} ประกาศ
            </p>
          </div>

          {shown.length === 0 ? (
            <p className="mt-14 text-sm" style={{ color: MUTED }}>
              ไม่พบประกาศที่ตรงกับที่ค้นหา ลองเปลี่ยนคำหรือเลือกเกมอื่น
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((listing, i) => (
                <motion.article
                  key={listing.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.04 }}
                  className="flex flex-col overflow-hidden rounded-lg border"
                  style={{ borderColor: LINE, background: PANEL }}
                >
                  {/* stand-in for the seller's screenshot: a listing board is
                      mostly user-uploaded images, and none exist in a demo */}
                  <div
                    className="flex aspect-[16/9] items-end p-4"
                    style={{
                      background: `linear-gradient(135deg, ${listing.swatch[0]}, ${listing.swatch[1]})`,
                    }}
                  >
                    <span className="rounded-md bg-black/40 px-2 py-1 text-xs font-medium">
                      {listing.game}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="leading-snug font-medium">{listing.title}</h2>
                    <p
                      className="mt-2 flex-1 text-sm leading-relaxed"
                      style={{ color: MUTED }}
                    >
                      {listing.detail}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <span style={{ color: MUTED }}>{listing.seller}</span>
                      {listing.verified && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                          style={{
                            background: "rgba(250,204,21,0.12)",
                            color: ACCENT,
                          }}
                        >
                          <Check className="h-3 w-3" />
                          ยืนยันตัวตน
                        </span>
                      )}
                      <span className="ml-auto tabular-nums" style={{ color: MUTED }}>
                        ขายแล้ว {listing.sales}
                      </span>
                    </div>

                    <div
                      className="mt-4 flex items-center justify-between border-t pt-4"
                      style={{ borderColor: LINE }}
                    >
                      <p className="text-lg font-semibold tabular-nums">
                        ฿{baht(listing.price)}
                      </p>
                      <button
                        onClick={() => !account && setAuthOpen(true)}
                        className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:border-[#3a424f]"
                        style={{ borderColor: LINE }}
                      >
                        ทักคนขาย
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          <p
            className="mt-10 rounded-lg border p-4 text-sm leading-relaxed"
            style={{ borderColor: LINE, color: MUTED }}
          >
            เว็บนี้เป็นกระดานประกาศ ไม่ได้ถือเงินแทนใคร ตกลงราคาและโอนกันเองระหว่าง
            ผู้ซื้อกับผู้ขาย ตรวจของให้ครบก่อนโอนทุกครั้ง
          </p>
        </section>

        <section className="border-t py-16" style={{ borderColor: LINE }}>
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <h2 className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
                อยากได้เว็บแบบนี้เป็นของตัวเอง
              </h2>
              <p className="mt-3 max-w-md leading-relaxed" style={{ color: MUTED }}>
                สมาชิก ลงประกาศ ค้นหา ระบบหลังบ้านจริง ใช้ได้กับตลาดอะไรก็ได้
                ไม่ใช่แค่ของในเกม
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/pricing"
                className="rounded-md px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: ACCENT, color: "#1a1400" }}
              >
                ดูราคา
              </Link>
              <Link
                href="/#contact"
                className="rounded-md border px-6 py-3 text-sm font-medium transition-colors hover:border-[#3a424f]"
                style={{ borderColor: LINE }}
              >
                ทักมาคุย
              </Link>
            </div>
          </div>

          <p className="mt-10 text-xs" style={{ color: FAINT }}>
            STALL เป็นร้านสมมติ ประกาศทั้งหมดแต่งขึ้นเพื่อสาธิตงานออกแบบ
          </p>
        </section>
      </div>

      <AnimatePresence>
        {authOpen && (
          <AuthDialog
            onClose={() => setAuthOpen(false)}
            onSignIn={(name) => {
              setAccount(name);
              setAuthOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/**
 * Sign in and register, as a demo. Nothing is sent anywhere and nothing is
 * stored: the form hands a display name back to the page and forgets the rest
 * on unmount. The notice under the button is not decoration - a login box that
 * looks real will otherwise collect a real password from a curious visitor.
 */
function AuthDialog({
  onClose,
  onSignIn,
}: {
  onClose: () => void;
  onSignIn: (name: string) => void;
}) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const handle = email.split("@")[0];
    onSignIn(handle.length > 1 ? handle : "สมาชิกใหม่");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-30 flex items-center justify-center p-5"
      style={{ background: "rgba(4,6,9,0.72)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
        transition={{ duration: 0.25, ease }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stall-auth-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-xl border p-6"
        style={{ borderColor: LINE, background: PANEL }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="stall-auth-title" className="text-lg font-semibold tracking-tight">
            {mode === "in" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </h2>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="-m-2 p-2 transition-colors hover:text-white"
            style={{ color: MUTED }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="mt-5 grid grid-cols-2 gap-1 rounded-md border p-1"
          style={{ borderColor: LINE }}
        >
          {(["in", "up"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className="rounded py-2 text-sm font-medium transition-colors"
              style={{
                background: mode === value ? ACCENT : "transparent",
                color: mode === value ? "#1a1400" : MUTED,
              }}
            >
              {value === "in" ? "เข้าสู่ระบบ" : "สมัครใหม่"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-sm" style={{ color: MUTED }}>
              อีเมล
            </span>
            <input
              ref={emailRef}
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-md border px-3 py-2.5 text-sm outline-none placeholder:text-[#7d8593] focus:border-[#3a424f]"
              style={{ borderColor: LINE, background: BG }}
            />
          </label>

          <label className="block">
            <span className="text-sm" style={{ color: MUTED }}>
              รหัสผ่าน
            </span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="off"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className="mt-1.5 w-full rounded-md border px-3 py-2.5 text-sm outline-none placeholder:text-[#7d8593] focus:border-[#3a424f]"
              style={{ borderColor: LINE, background: BG }}
            />
          </label>

          {mode === "up" && (
            <label className="flex items-start gap-2.5 pt-1 text-sm" style={{ color: MUTED }}>
              <input type="checkbox" required className="mt-1" />
              <span>ยอมรับกติกาการซื้อขายและนโยบายข้อมูลส่วนบุคคล</span>
            </label>
          )}

          <button
            type="submit"
            className="w-full rounded-md py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: ACCENT, color: "#1a1400" }}
          >
            {mode === "in" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
          </button>
        </form>

        <p className="mt-4 text-xs leading-relaxed" style={{ color: FAINT }}>
          ตัวอย่างงานออกแบบ ยังไม่มีระบบหลังบ้านจริง ไม่มีการส่งหรือเก็บข้อมูลใดๆ
          กรุณาอย่ากรอกรหัสผ่านที่คุณใช้จริง
        </p>
      </motion.div>
    </motion.div>
  );
}
