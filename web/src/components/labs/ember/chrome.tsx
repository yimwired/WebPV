"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { BRANCHES, TICKER } from "./data";
import { DUR } from "./motion";
import { COLOR, Z, displayStyle, thaiStyle } from "./theme";

const NAV = [
  { href: "#sets", label: "ชุดบุฟเฟต์" },
  { href: "#branches", label: "สาขา" },
  { href: "#kit", label: "สั่งกลับบ้าน" },
];

/**
 * The strip across the top of the page.
 *
 * Hidden from assistive tech on purpose: it is two copies of the same list, so
 * a screen reader would read every claim twice, and each of those claims is
 * stated properly further down the page. The marquee runs on a transform, so
 * `reducedMotion="user"` parks it without any handling here.
 */
export function Ticker() {
  const row = [...TICKER, ...TICKER];

  return (
    <div aria-hidden className="overflow-hidden py-2.5" style={{ background: COLOR.flame }}>
      <motion.div
        className="flex w-max items-center gap-8"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: DUR.marquee, repeat: Infinity, ease: "linear" }}
      >
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex shrink-0 items-center gap-8 text-xs font-bold tracking-wide"
            style={{ color: COLOR.onFlame, ...thaiStyle }}
          >
            {item}
            {/* The separator is `onFlame` and not the ember accent: the accent
                measures 2.45:1 on the red, and a star is still text. */}
            <span style={{ color: COLOR.onFlame }}>★</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function TopBar() {
  return (
    <header
      className="sticky top-0 border-b"
      style={{ background: COLOR.cream, borderColor: "rgba(58,37,30,0.14)", zIndex: Z.bar }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <a
          href="#top"
          className="flex items-center py-2 text-2xl focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ ...displayStyle, color: COLOR.flame, outlineColor: COLOR.char }}
        >
          TAODANG
        </a>

        <nav className="hidden items-center gap-7 md:flex" style={thaiStyle}>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center py-2 text-sm font-semibold transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: COLOR.ink, outlineColor: COLOR.flame }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href={`tel:${BRANCHES[0].phone}`}
          className="flex h-10 items-center gap-2 rounded-full px-5 text-sm font-bold transition-transform hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: COLOR.flame, color: COLOR.onFlame, outlineColor: COLOR.char, ...thaiStyle }}
        >
          <Phone className="h-3.5 w-3.5" aria-hidden />
          โทรจอง
        </a>
      </div>
    </header>
  );
}

export function EmberFooter() {
  return (
    // pb-28 clears the lab switcher, fixed over the bottom of every demo
    <footer
      className="relative overflow-hidden px-5 pb-28 pt-20 sm:px-8 lg:px-12"
      style={{ background: COLOR.char, zIndex: Z.content }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-3" style={thaiStyle}>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: COLOR.ember }}>
              เวลาเปิด
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: COLOR.onCharMuted }}>
              ทุกวัน 16:00 ถึง 02:00
              <br />
              สาขาอารีย์เปิด 17:00 สาขาบางแคปิดเที่ยงคืน
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: COLOR.ember }}>
              สาขา
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: COLOR.onCharMuted }}>
              {BRANCHES.map((branch) => branch.name).join(" / ")}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: COLOR.ember }}>
              จองโต๊ะ
            </h2>
            <a
              href={`tel:${BRANCHES[0].phone}`}
              className="mt-3 inline-flex items-center py-1 text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: COLOR.onChar, outlineColor: COLOR.ember }}
            >
              02 123 4571
            </a>
          </div>
        </div>

        <p
          className="mt-16 max-w-2xl text-xs leading-relaxed"
          style={{ color: COLOR.onCharMuted, ...thaiStyle }}
        >
          เตาแดงเป็นแบรนด์สมมติ หน้านี้เป็นตัวอย่างงานออกแบบในพอร์ตของ Film ที่อยู่ เบอร์โทร
          และราคาทั้งหมดแต่งขึ้นมา รูปทั้งหมดเป็นภาพสต็อกที่ใช้แทนภาพจริงของร้าน ไม่มีร้านตามที่อยู่ในหน้านี้
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2" style={thaiStyle}>
          <Link
            href="/labs"
            className="inline-flex items-center py-1.5 text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ color: COLOR.onChar, outlineColor: COLOR.ember }}
          >
            กลับไปที่ The Lab
          </Link>
          <Link
            href="/"
            className="inline-flex items-center py-1.5 text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ color: COLOR.onChar, outlineColor: COLOR.ember }}
          >
            ดูพอร์ตของ Film
          </Link>
        </div>

        {/* The wordmark is decoration at this size, and the brand name is
            already in the heading at the top of the page and in the text above. */}
        <p
          aria-hidden
          className="mt-10 select-none text-center leading-[0.8]"
          style={{
            ...displayStyle,
            color: COLOR.flame,
            fontSize: "clamp(3.5rem, 19vw, 15rem)",
          }}
        >
          TAODANG
        </p>
      </div>
    </footer>
  );
}
