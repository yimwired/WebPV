"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { SignalScope, type Channel, type Reading } from "./signal-scope";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

// ─────────────────────────────────────────────────────────────
//  Signal: the page a company that sells measuring equipment needs.
//
//  Deep Space already covers the sci-fi HUD. This is the opposite register and
//  the harder one: a real instrument is quiet, dense and exact, and it earns
//  attention by being right rather than by glowing. Everything on the readout
//  is measured off the trace, so the numbers move when the controls do.
// ─────────────────────────────────────────────────────────────

const CHANNELS: Channel[] = [
  {
    id: "vibration",
    name: "Bearing vibration",
    unit: "mm/s",
    perDivision: 2,
    frequency: 48,
    amplitude: 3.1,
    noise: 0.12,
    harmonics: [0.35, 0.18],
    about: "A motor turning at 2,880 rpm, read at the housing",
  },
  {
    id: "current",
    name: "Line current",
    unit: "A",
    perDivision: 5,
    frequency: 50,
    amplitude: 9.4,
    noise: 0.03,
    harmonics: [0.04, 0.22],
    about: "One phase of a 50 Hz supply, clamp on the feed",
  },
  {
    id: "acoustic",
    name: "Acoustic leak",
    unit: "Pa",
    perDivision: 0.5,
    frequency: 1180,
    amplitude: 0.62,
    noise: 0.45,
    harmonics: [0.12, 0.08],
    about: "Compressed air escaping a fitting, mic at 300 mm",
  },
  {
    id: "flow",
    name: "Pump pressure",
    unit: "bar",
    perDivision: 1,
    frequency: 6.4,
    amplitude: 1.7,
    noise: 0.07,
    harmonics: [0.5, 0.3],
    about: "Three-lobe pump, one pulse per lobe per turn",
  },
];

/**
 * Sweep settings, in seconds across the full ten divisions.
 *
 * The slow end matters more than the fast one here: frequency is measured
 * between crossings, so a sweep that holds less than one full cycle has
 * nothing to measure and reads "-". The pump runs at 6.4 Hz, which is a
 * 156 ms period, and that is what 500 ms is for.
 */
// Labels are per division, the way a scope face is marked; `value` is the
// whole ten-division sweep, which is what the trace is drawn across.
const TIMEBASES = [
  { label: "50 ms", value: 0.5 },
  { label: "10 ms", value: 0.1 },
  { label: "2 ms", value: 0.02 },
  { label: "0.5 ms", value: 0.005 },
];

/** Significant figures that survive being read off a screen. */
function figure(value: number, unit: string): string {
  if (!Number.isFinite(value) || value === 0) return `0 ${unit}`;
  const digits = Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${unit}`;
}

function hertz(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value >= 1000) return `${(value / 1000).toFixed(2)} kHz`;
  return `${value.toFixed(value >= 100 ? 0 : 1)} Hz`;
}

export function SignalDemo() {
  const reduced = useReducedMotion();

  const [channelId, setChannelId] = useState(CHANNELS[0].id);
  // 10 ms/div holds several cycles of three of the four channels on load
  const [timebase, setTimebase] = useState(TIMEBASES[1].value);
  const [reading, setReading] = useState<Reading | null>(null);

  const channel = useMemo(
    () => CHANNELS.find((c) => c.id === channelId) ?? CHANNELS[0],
    [channelId],
  );

  // The scope calls this four times a second from inside its loop; a stable
  // identity keeps that loop from being rebuilt on every reading.
  const onReading = useCallback((next: Reading) => setReading(next), []);

  return (
    <main className="min-h-dvh bg-[#080b0a] font-mono text-[#c8d8cf] selection:bg-[#5cf08a]/25">
      {/* ── header ── */}
      <header className="mx-auto max-w-6xl px-5 pt-12 pb-7 sm:px-8 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <p className="text-[11px] tracking-[0.36em] text-[#5cf08a] uppercase">
            Signal · instrumentation
          </p>
          <h1 className="mt-5 max-w-2xl font-sans text-4xl leading-[1.08] font-semibold tracking-tight text-white text-balance sm:text-5xl">
            Every number here was measured, not printed.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#8aa396]">
            Pick a sensor and a sweep rate. The trace is generated, the readings
            are taken off it: peak to peak from the extremes, RMS from the sum of
            squares, frequency from the rising zero crossings.
          </p>
        </motion.div>
      </header>

      {/* ── the instrument ── */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease }}
          className="overflow-hidden rounded-lg border border-[#1d2b24] bg-[#0b100e]"
        >
          {/* face */}
          <div className="relative h-[15rem] border-b border-[#1d2b24] bg-[#070b09] sm:h-[19rem]">
            <SignalScope
              channel={channel}
              timebase={timebase}
              running={!reduced}
              onReading={onReading}
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3 text-[10px] tracking-[0.2em] text-[#6f8a7c] uppercase">
              <span>{channel.name}</span>
              <span>
                {channel.perDivision} {channel.unit}/div ·{" "}
                {TIMEBASES.find((t) => t.value === timebase)?.label}/div
              </span>
            </div>

            {reduced && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 py-3 text-[10px] tracking-[0.2em] text-[#6f8a7c] uppercase">
                Motion reduced · single sweep held
              </div>
            )}
          </div>

          {/* readout, measured off the buffer above */}
          <dl className="grid grid-cols-2 divide-x divide-[#1d2b24] border-b border-[#1d2b24] sm:grid-cols-4 sm:divide-y-0">
            {[
              { label: "Peak to peak", value: reading ? figure(reading.peakToPeak, reading.unit) : "-" },
              { label: "RMS", value: reading ? figure(reading.rms, reading.unit) : "-" },
              { label: "Frequency", value: reading ? hertz(reading.frequency) : "-" },
              { label: "Sweep", value: `${TIMEBASES.find((t) => t.value === timebase)?.label}/div` },
            ].map((cell) => (
              <div key={cell.label} className="px-4 py-4 sm:px-5">
                <dt className="text-[10px] tracking-[0.22em] text-[#6f8a7c] uppercase">
                  {cell.label}
                </dt>
                {/* tabular figures, or the readout jitters as digits change */}
                <dd className="mt-1.5 text-lg text-[#5cf08a] tabular-nums">{cell.value}</dd>
              </div>
            ))}
          </dl>

          {/* controls */}
          <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
            <fieldset>
              <legend className="text-[10px] tracking-[0.22em] text-[#6f8a7c] uppercase">
                Channel
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannelId(c.id)}
                    aria-pressed={c.id === channelId}
                    className={`rounded border px-3 py-2.5 text-xs transition-colors ${
                      c.id === channelId
                        ? "border-[#5cf08a] bg-[#5cf08a]/10 text-[#5cf08a]"
                        : "border-[#233329] text-[#8aa396] hover:border-[#334a3c] hover:text-[#c8d8cf]"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#6f8a7c]">{channel.about}</p>
            </fieldset>

            <fieldset>
              <legend className="text-[10px] tracking-[0.22em] text-[#6f8a7c] uppercase">
                Timebase
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {TIMEBASES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setTimebase(t.value)}
                    aria-pressed={t.value === timebase}
                    className={`rounded border px-3 py-2.5 text-xs tabular-nums transition-colors ${
                      t.value === timebase
                        ? "border-[#5cf08a] bg-[#5cf08a]/10 text-[#5cf08a]"
                        : "border-[#233329] text-[#8aa396] hover:border-[#334a3c] hover:text-[#c8d8cf]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#6f8a7c]">
                Slower sweeps fit more cycles on the screen; the frequency
                reading holds because it is taken between crossings, not counted
                per frame.
              </p>
            </fieldset>
          </div>
        </motion.div>
      </section>

      {/* ── what the product is ── */}
      <section className="border-t border-[#141d18]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="max-w-xl font-sans text-2xl font-semibold tracking-tight text-white text-balance sm:text-3xl">
            Specifications, not adjectives.
          </h2>

          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-[#1d2b24] bg-[#1d2b24] sm:grid-cols-3">
            {[
              { k: "Sample rate", v: "48 kS/s", n: "per channel, simultaneous" },
              { k: "Resolution", v: "16 bit", n: "±0.02% of range" },
              { k: "Channels", v: "4", n: "isolated to 600 V" },
              { k: "Interface", v: "USB-C", n: "bus powered, no adapter" },
              { k: "Logging", v: "32 GB", n: "about 40 days continuous" },
              { k: "Enclosure", v: "IP54", n: "aluminium, DIN rail or bench" },
            ].map((row) => (
              <div key={row.k} className="bg-[#0b100e] px-5 py-5">
                <div className="text-[10px] tracking-[0.22em] text-[#6f8a7c] uppercase">
                  {row.k}
                </div>
                <div className="mt-1.5 text-xl text-white tabular-nums">{row.v}</div>
                <div className="mt-1 text-xs text-[#6f8a7c]">{row.n}</div>
              </div>
            ))}
          </div>

          <div className="mt-14 grid gap-x-8 gap-y-9 sm:grid-cols-3">
            {[
              {
                head: "The readout is arithmetic",
                body: "Peak to peak, RMS and frequency are computed from the same 1,024 samples the trace is drawn from. Change the channel and every figure follows, because none of them were typed in.",
              },
              {
                head: "The trace is triggered",
                body: "Each sweep starts at the same point in the cycle, the way a real scope holds a picture still. Without it the waveform slides sideways, which is the clearest sign a scope is an animation.",
              },
              {
                head: "It costs nothing at rest",
                body: "The loop stops when the instrument scrolls off screen or the tab goes to the back, and under reduced motion it draws one sweep and holds it.",
              },
            ].map((block) => (
              <div key={block.head}>
                <h3 className="font-sans text-sm font-semibold tracking-tight text-white">
                  {block.head}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#8aa396]">{block.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-start gap-5 rounded-lg border border-[#1d2b24] bg-[#0b100e] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h3 className="font-sans text-xl font-semibold tracking-tight text-white text-balance sm:text-2xl">
                Selling something that measures?
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#8aa396]">
                Swap the sensors for yours and the instrument still reads
                correctly. Suits sensors, lab equipment, IoT and anything sold on
                its specification sheet.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2.5">
              <Link
                href="/pricing"
                className="rounded bg-[#5cf08a] px-6 py-3 text-xs font-semibold tracking-[0.15em] text-[#062012] uppercase transition-colors hover:bg-[#7ff5a4]"
              >
                See prices
              </Link>
              <Link
                href="/#contact"
                className="rounded border border-[#2b3f34] px-6 py-3 text-xs font-semibold tracking-[0.15em] text-[#c8d8cf] uppercase transition-colors hover:border-[#5cf08a] hover:text-[#5cf08a]"
              >
                Ask for a quote
              </Link>
            </div>
          </div>

          {/* the switcher floats over the bottom of the page */}
          <p className="mt-14 pb-16 text-xs leading-relaxed text-[#6f8a7c]">
            A fictional instrument, built as a style study. The specification is
            invented; the measurements on the screen above are real, taken from
            the signal being drawn.
          </p>
        </div>
      </section>
    </main>
  );
}
