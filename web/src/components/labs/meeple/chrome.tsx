"use client";

import { Sprite } from "./pixel";
import { MEEPLE } from "./sprites";
import { ACCENT, COLOR, UNIT, pixelFrame, thaiStyle } from "./theme";

const NAV = [
  { href: "#finder", label: "เล่นอะไรดี" },
  { href: "#shelf", label: "ชั้นเกม" },
  { href: "#rates", label: "ค่าโต๊ะ" },
  { href: "#visit", label: "มาหาเรา" },
];

/**
 * The bar. The wordmark is a meeple beside the name rather than a logo, because
 * a cafe at this size has a sticker and a rubber stamp, not an identity system,
 * and pretending otherwise is the thing that makes a demo look like a template.
 */
export function TopBar() {
  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: COLOR.paperDeep, boxShadow: `0 ${UNIT}px 0 0 ${COLOR.ink}` }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
        <a
          href="#top"
          className="mpl-focus flex items-center gap-3"
          style={{ ...thaiStyle, color: COLOR.ink }}
        >
          <Sprite map={MEEPLE} scale={2} palette={{ "3": ACCENT.tomato.value }} />
          <span className="text-xl font-bold tracking-tight">ตาถัดไป</span>
        </a>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1" style={thaiStyle}>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="mpl-focus -my-2 py-2 text-base font-medium hover:underline"
              style={{ color: COLOR.ink, textUnderlineOffset: UNIT }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function MeepleFooter() {
  return (
    <footer style={{ background: COLOR.ink }}>
      <div
        className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8"
        style={thaiStyle}
      >
        <div>
          <div className="flex items-center gap-3">
            <Sprite map={MEEPLE} scale={2} palette={{ "3": ACCENT.gold.value, "0": COLOR.paper }} />
            <span className="text-xl font-bold" style={{ color: COLOR.paper }}>
              ตาถัดไป
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: COLOR.onInkMuted }}>
            คาเฟ่บอร์ดเกมสมมติ ใช้สาธิตงานออกแบบเว็บ ไม่ได้เปิดจริง
            และชื่อเกมทั้งสิบสองกล่องแต่งขึ้นเองทั้งหมด
          </p>
        </div>

        <a
          href="/labs"
          className="mpl-focus self-start px-5 py-3 text-sm font-bold sm:self-auto"
          style={{
            background: COLOR.paper,
            color: COLOR.ink,
            boxShadow: pixelFrame(COLOR.paper),
          }}
        >
          กลับไปที่ The Lab
        </a>
      </div>
    </footer>
  );
}
