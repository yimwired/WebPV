"use client";

import { useState } from "react";

import { LOAN, baht } from "./data";
import type { YearRow } from "./loan";

/**
 * Where each year's instalments actually go. The instalment is the same every
 * month for thirty years, so the bars are all the same height and the only
 * thing that moves is the line inside them: early on almost all of it is
 * interest, and the year the split turns over is the year the flat starts
 * belonging to the buyer rather than the bank.
 *
 * Two series, so there is a legend. Heights are percentages of the tallest
 * year, which lets a test read a bar off the page and check it against the
 * schedule without being told where anything is.
 */

const PRINCIPAL = "#1b5e9c";
const INTEREST = "#a3492a";

interface ChartProps {
  rows: YearRow[];
  crossoverYear: number | null;
}

export function Chart({ rows, crossoverYear }: ChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const tallest = Math.max(...rows.map((row) => row.principal + row.interest));
  const step = 100 / rows.length;
  const ticks = rows
    .map((row) => row.year)
    .filter((year) => year === 1 || year % 5 === 0);

  const active = hovered !== null ? rows[hovered] : null;
  const promoYears = rows.filter((row) => row.promo).length;

  return (
    <figure className="m-0" data-chart="amortisation" data-years={rows.length}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="text-[12px] tracking-[0.18em] text-[#5d6470] uppercase">
          เงินที่ผ่อนไปในแต่ละปี
        </span>
        <span className="flex items-center gap-4 text-[13px]">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-[2px]"
              style={{ background: PRINCIPAL }}
              aria-hidden="true"
            />
            ตัดเงินต้น
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-[2px]"
              style={{ background: INTEREST }}
              aria-hidden="true"
            />
            เป็นดอกเบี้ย
          </span>
        </span>
      </figcaption>

      <div className="relative mt-3">
        <svg
          viewBox="0 0 100 62"
          preserveAspectRatio="none"
          className="block h-[220px] w-full sm:h-[260px]"
          role="img"
          aria-label={`สัดส่วนเงินต้นกับดอกเบี้ยรายปี ตลอด ${rows.length} ปี`}
          onMouseLeave={() => setHovered(null)}
        >
          {[0.25, 0.5, 0.75].map((line) => (
            <line
              key={line}
              x1="0"
              y1={62 * line}
              x2="100"
              y2={62 * line}
              stroke="#d8d3ca"
              strokeWidth="0.25"
            />
          ))}

          {promoYears > 0 && promoYears < rows.length && (
            <line
              data-promo-edge
              x1={promoYears * step}
              y1="0"
              x2={promoYears * step}
              y2="62"
              stroke="#1a1c20"
              strokeWidth="0.3"
              strokeDasharray="1.2 1.2"
            />
          )}

          {rows.map((row, index) => {
            const total = row.principal + row.interest;
            const height = (total / tallest) * 62;
            const principalHeight = (row.principal / total) * height;
            const x = index * step;
            const width = step - Math.min(step * 0.22, 0.9);

            return (
              <g
                key={row.year}
                data-bar={row.year}
                onMouseEnter={() => setHovered(index)}
              >
                {/* the whole column is the hit target, not just the paint */}
                <rect
                  x={x}
                  y="0"
                  width={step}
                  height="62"
                  fill="transparent"
                />
                <rect
                  data-interest={row.year}
                  x={x}
                  y={62 - height}
                  width={width}
                  height={height - principalHeight}
                  fill={INTEREST}
                  rx="0.4"
                />
                <rect
                  data-principal={row.year}
                  x={x}
                  y={62 - principalHeight}
                  width={width}
                  height={principalHeight}
                  fill={PRINCIPAL}
                  rx="0.4"
                />
                {hovered === index && (
                  <rect
                    x={x - 0.2}
                    y={62 - height - 0.6}
                    width={width + 0.4}
                    height={height + 0.6}
                    fill="none"
                    stroke="#1a1c20"
                    strokeWidth="0.35"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {active && (
          <div
            data-tooltip
            // inside the plot rather than above it: floated out of the box it
            // covered the verdict sitting above the chart
            className="pointer-events-none absolute top-1 z-10 border border-[#1a1c20] bg-[#f6f4f0] px-3 py-2 text-[12px] whitespace-nowrap shadow-sm"
            style={{
              left: `${Math.min(Math.max((hovered! + 0.5) * step, 12), 88)}%`,
              transform: "translateX(-50%)",
            }}
          >
            <span className="font-semibold">ปีที่ {active.year}</span>
            <span className="mt-0.5 block">
              ตัดเงินต้น {baht(active.principal)} บาท
            </span>
            <span className="block">
              ดอกเบี้ย {baht(active.interest)} บาท
            </span>
            <span className="block text-[#5d6470]">
              เหลือหนี้ {baht(active.balance)} บาท
            </span>
          </div>
        )}
      </div>

      {/* the years, under the bars and aligned to them */}
      <div className="relative mt-1 h-4" aria-hidden="true">
        {promoYears > 0 && promoYears < rows.length && (
          <span
            className="absolute top-0 text-[11px] text-[#1a1c20]"
            style={{ left: `${promoYears * step + 0.6}%` }}
          >
            โปรโมชันจบ
          </span>
        )}
        {ticks.map((year) => (
          <span
            key={year}
            className="absolute top-0 -translate-x-1/2 text-[11px] text-[#5d6470] tabular-nums"
            style={{ left: `${(year - 0.5) * step}%` }}
          >
            {year}
          </span>
        ))}
      </div>

      <div className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-[#5d6470]">
        <p data-crossover>
          {crossoverYear
            ? `ค่างวดเท่ากันทุกเดือน แต่ปีแรกๆ ส่วนใหญ่หายไปกับดอกเบี้ย ปีที่ ${crossoverYear} คือปีที่เงินเริ่มไปตัดเงินต้นมากกว่าดอกเบี้ยและไม่กลับไปอีก`
            : "ค่างวดนี้ยังไม่มีปีไหนที่เงินไปตัดเงินต้นมากกว่าดอกเบี้ยแบบถาวรเลย"}
        </p>
        <p data-promo-note>
          แท่งน้ำเงิน {LOAN.promoYears} ปีแรกสูงกว่าปีที่ {LOAN.promoYears + 1} เพราะดอกเบี้ยยังเป็น{" "}
          {LOAN.promoRate}% ค่างวดเท่าเดิมแต่ตัดต้นได้มากกว่า พอโปรโมชันหมด
          อัตราขึ้นเป็น {LOAN.floatRate}% แท่งน้ำเงินเลยหดลงแล้วค่อยไต่ขึ้นใหม่
        </p>
      </div>
    </figure>
  );
}
