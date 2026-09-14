"use client";

import Link from "next/link";
import { Press } from "./block";
import { ACCENTS, COLOR, sansStyle, Z, type Accent } from "./theme";

interface TopBarProps {
  accent: Accent;
  onPick: (id: string) => void;
}

/**
 * The bar carries the palette switcher as three swatches.
 *
 * Colour only, with the course name on `aria-label`. The first pass put the
 * Thai initial inside each one and it was unreadable at 40px: Kanit at 800
 * needs room for its vowel marks, and "เ" as an initial says nothing anyway.
 * Colour is not the only signal either, which is the usual objection to a bare
 * swatch: the chosen one sits down on its shadow, so it differs in shape too.
 */
export function TopBar({ accent, onPick }: TopBarProps) {
  return (
    <header
      className="sticky top-0 border-b-[3px]"
      style={{ background: COLOR.paper, borderColor: COLOR.ink, zIndex: Z.bar }}
    >
      <div
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12"
        style={sansStyle}
      >
        <a
          href="#top"
          className="flex items-center py-2 text-xl font-extrabold uppercase focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ color: COLOR.ink, outlineColor: COLOR.ink }}
        >
          ตัดจบ
        </a>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-extrabold uppercase sm:block" style={{ color: COLOR.ink }}>
            สลับคอร์ส
          </span>
          {ACCENTS.map((swatch) => (
            <Press
              key={swatch.id}
              onClick={() => onPick(swatch.id)}
              held={swatch.id === accent.id}
              pressedState={swatch.id === accent.id}
              background={swatch.value}
              ariaLabel={`สลับไปคอร์ส${swatch.label}`}
              className="h-10 w-10"
            >
              <span className="sr-only">{swatch.label}</span>
            </Press>
          ))}
        </div>
      </div>
    </header>
  );
}

export function SlabFooter({ accent }: { accent: Accent }) {
  return (
    <footer
      className="border-t-[3px] px-5 pb-28 pt-12 sm:px-8 lg:px-12"
      style={{ background: COLOR.paper, borderColor: COLOR.ink, ...sansStyle }}
    >
      <div className="mx-auto max-w-6xl">
        {/* The wordmark obeys the rule in theme.ts rather than breaking it in
            the footer: the accent is the block and the ink is the letters. The
            first pass had it the other way round with a 3px stroke holding it
            together, which measured 1.28:1 on its fill and only worked because
            of the outline. A filled band is also the more honest version of
            this style, which blocks colour rather than tinting letters. */}
        <div
          aria-hidden
          className="select-none border-[3px] px-5 py-2"
          style={{ background: accent.value, borderColor: COLOR.ink, boxShadow: `8px 8px 0 0 ${COLOR.ink}` }}
        >
          <p
            className="text-[clamp(2.6rem,14vw,9rem)] font-extrabold uppercase leading-[0.9]"
            style={{ color: COLOR.ink }}
          >
            ตัดจบ
          </p>
        </div>

        <p className="mt-8 max-w-2xl text-sm font-medium leading-relaxed" style={{ color: COLOR.ink }}>
          ตัดจบเป็นแบรนด์สมมติ หน้านี้เป็นตัวอย่างงานออกแบบในพอร์ตของ Film ชื่อคอร์ส ราคา
          และเนื้อหาบทเรียนแต่งขึ้นมาทั้งหมด ไม่มีคอร์สนี้ขายอยู่จริง
        </p>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/labs"
            className="inline-flex items-center py-1.5 text-sm font-extrabold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ color: COLOR.ink, outlineColor: COLOR.ink }}
          >
            กลับไปที่ The Lab
          </Link>
          <Link
            href="/"
            className="inline-flex items-center py-1.5 text-sm font-extrabold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ color: COLOR.ink, outlineColor: COLOR.ink }}
          >
            ดูพอร์ตของ Film
          </Link>
        </div>
      </div>
    </footer>
  );
}
