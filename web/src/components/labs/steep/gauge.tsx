"use client";

import type { ReactNode } from "react";

/**
 * The picture of the disagreement. Every material in the pot gets a bar over
 * the range it actually gives what it has, and one rule is drawn across all of
 * them at what the pot is set to. A bar the rule misses is a material the pot
 * is wrong for, and it is the same material the notes underneath name.
 *
 * Positions are percentages of the scale's own span rather than a drawing in
 * its own units, so the figures stay real type at any width: a bar from 95 to
 * 100 on a 68 to 102 scale starts at exactly 79.4% of the track. A test can
 * measure that off the rendered page without being told where anything is.
 *
 * The scale's own figures are the table's last row rather than a strip under
 * it, so they line up with the tracks whatever the two columns beside them
 * need, which on a phone is not what they need on a desktop.
 */

export interface Band {
  id: string;
  name: string;
  from: number;
  to: number;
  /** whether the pot's setting falls inside this material's range */
  ok: boolean;
}

interface GaugeProps {
  caption: string;
  rows: Band[];
  /** where the rule is drawn */
  value: number;
  domain: [number, number];
  ticks: number[];
  /** how a figure on this scale is written */
  format: (value: number) => ReactNode;
  /** what follows the figure where the pot's own setting is announced */
  unit: string;
  scaleId: string;
}

const HATCH =
  "repeating-linear-gradient(45deg,#6d1f2a,#6d1f2a 2px,#a5545e 2px,#a5545e 4px)";

export function Gauge({
  caption,
  rows,
  value,
  domain,
  ticks,
  format,
  unit,
  scaleId,
}: GaugeProps) {
  const [low, high] = domain;
  const span = high - low;
  const pct = (at: number) => ((at - low) / span) * 100;

  return (
    <figure
      className="m-0"
      data-scale={scaleId}
      data-value={value}
      data-low={low}
      data-high={high}
    >
      <figcaption className="flex items-baseline justify-between border-b-2 border-[#221c17] pb-1">
        <span className="text-[13px] tracking-[0.2em] text-[#221c17] uppercase">
          {caption}
        </span>
        <span className="font-[family-name:var(--font-steep-display)] text-[19px] leading-none text-[#6d1f2a]">
          {format(value)}
          {unit}
        </span>
      </figcaption>

      <table className="mt-2 w-full border-collapse text-[13px]">
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th
                scope="row"
                className="w-px py-1 pr-3 text-left font-normal whitespace-nowrap"
              >
                {row.name}
              </th>
              <td className="w-px py-1 pr-3 text-right whitespace-nowrap text-[#4a4037] tabular-nums">
                {format(row.from)} - {format(row.to)}
              </td>
              <td className="py-1">
                <div
                  className="relative h-4 bg-[#221c17]/6"
                  data-track={row.id}
                  aria-hidden="true"
                >
                  <div
                    data-band={row.id}
                    data-from={row.from}
                    data-to={row.to}
                    data-ok={row.ok ? "yes" : "no"}
                    className="absolute inset-y-[3px] border border-[#221c17]/40"
                    style={{
                      left: `${pct(row.from)}%`,
                      width: `${pct(row.to) - pct(row.from)}%`,
                      background: row.ok ? "#23412f" : HATCH,
                    }}
                  />
                  <div
                    data-rule
                    className="absolute inset-y-[-1px] w-[2px] bg-[#221c17]"
                    style={{ left: `${pct(value)}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}

          {/* the scale's own figures, under the tracks and aligned to them */}
          <tr aria-hidden="true">
            <td />
            <td />
            <td>
              <div className="relative h-4">
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className="absolute top-0 -translate-x-1/2 text-[11px] text-[#4a4037] tabular-nums"
                    style={{ left: `${pct(tick)}%` }}
                  >
                    {format(tick)}
                  </span>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}
