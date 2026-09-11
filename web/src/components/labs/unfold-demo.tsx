"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { UnfoldClip } from "./unfold-clip";
import { kelvinToRgb } from "./unfold-light";

/**
 * A launch page for one physical object, built the way the feature sections of
 * a hardware launch page are built: each section states one thing, and the
 * media that proves it sits in a frame of its own on a flat ground.
 *
 * An earlier version pinned the whole page and scrubbed the unfold off a
 * frame sequence at the speed of the reader's finger. Film's call was to take
 * the shape here instead - framed media, a clip that plays when it arrives -
 * which is what the reference page does and what a client will recognise. The
 * scrubbed version is in history on this branch if it is ever wanted.
 *
 * Framing the media is what fixed the thing three attempts at a full-bleed
 * seam could not: a photograph with rounded corners on a flat ground reads as
 * a picture placed on a page. Nobody expects it to dissolve into one, so
 * nothing has to.
 *
 * The product is fictional and nothing here is for sale. The page says so.
 */

// Sampled from the folded photograph's own corner, so the light section and
// the picture standing on it are the same tone and the frame has no step in
// brightness to announce itself with.
const PAPER = "#f3f1ed";
const ROOM = "#080704";

/** Roughly the colour temperature the lit photograph was generated at. */
const NATIVE_KELVIN = 3050;

const CLIP_SOURCES = [
  { src: "/lab-assets/unfold/unfold.webm", type: "video/webm" },
  { src: "/lab-assets/unfold/unfold.mp4", type: "video/mp4" },
];

const SPECS: ReadonlyArray<[string, string]> = [
  ["Output", "2,200 lm"],
  ["Colour", "2700 to 5000 K, adjustable"],
  ["Colour rendering", "CRI 97"],
  ["Power", "18 W over USB-C"],
  ["Folded", "320 x 44 x 32 mm"],
  ["Open height", "280 mm"],
  ["Weight", "340 g"],
  ["Finish", "Anodised aluminium, graphite head"],
  ["Warranty", "5 years"],
];

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function UnfoldDemo() {
  const [kelvin, setKelvin] = useState(3200);
  const light = kelvinToRgb(kelvin);

  // How hard to push the relight. The photograph was already lit at roughly
  // NATIVE_KELVIN, so near that value the overlay should do almost nothing; a
  // flat blend at full strength turned the graphite head gold and flattened
  // the picture into one colour.
  const relight = (Math.abs(kelvin - NATIVE_KELVIN) / 1950) * 0.52;

  return (
    <main id="top" className="bg-[#080704]">
      <TopBar />

      {/* ── 1. the object, closed ─────────────────────────────────────── */}
      <section
        className="px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32"
        style={{ background: PAPER }}
      >
        {/* The hero is on screen before anything has been scrolled, so it
            animates on load rather than on arrival, one line behind the next.
            `Rise` uses whileInView, which for this block would fire everything
            at the same instant and read as no entrance at all. */}
        <div className="mx-auto max-w-3xl text-center">
          <Enter>
            <h1 className="text-[clamp(3rem,11vw,7.5rem)] leading-[0.86] font-semibold tracking-[-0.045em] text-[#14130f]">
              Unfold
            </h1>
          </Enter>
          <Enter delay={0.14}>
            <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-[#4c4941] text-balance">
              A desk light that folds down to the size of a pencil case.
            </p>
          </Enter>
          <Enter delay={0.26}>
            <Readout
              tone="light"
              className="mt-8 justify-center"
              items={["320 mm closed", "340 g", "aluminium"]}
            />
          </Enter>
        </div>

        <Enter className="mx-auto mt-16 max-w-5xl" delay={0.4} distance={26}>
          <Frame tone="light">
            <Image
              src="/lab-assets/unfold/folded-1100.webp"
              alt="The lamp folded flat: a slim aluminium bar with the graphite head lying along it."
              width={1100}
              height={624}
              priority
              className="w-full"
            />
          </Frame>
        </Enter>
      </section>

      {/* ── 2. the unfold, as a clip that starts when it arrives ──────── */}
      <section className="px-5 py-24 sm:px-8 sm:py-32" style={{ background: ROOM }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <Rise className="lg:order-2">
            <h2 className="text-[clamp(1.9rem,4.6vw,3rem)] leading-[1.06] font-medium tracking-[-0.03em] text-[#f6f4ef] text-balance">
              One hinge, and it is already a lamp.
            </h2>
            <p className="mt-5 leading-relaxed text-[#a8a29a]">
              The arm rises, the head swings off it and points at the desk. No
              catch to release, no second joint to line up, and nothing to
              tighten once it is there.
            </p>
            <Readout
              tone="dark"
              className="mt-8"
              items={["one moving part", "friction hinge"]}
            />
          </Rise>

          <Rise className="lg:order-1" delay={0.08}>
            <Frame tone="dark">
              <div className="aspect-[1200/688]">
                <UnfoldClip
                  sources={CLIP_SOURCES}
                  poster="/lab-assets/unfold/folded-1100.webp"
                  label="The lamp opening: the arm rises on its hinge, the head swings out and points down at the desk, and the strip comes on as the room darkens."
                  className="h-full w-full"
                />
              </div>
            </Frame>
          </Rise>
        </div>
      </section>

      {/* ── 3. the light ─────────────────────────────────────────────── */}
      <section className="px-5 pb-24 sm:px-8 sm:pb-32" style={{ background: ROOM }}>
        <Rise className="mx-auto max-w-5xl">
          <Frame tone="dark">
            <Image
              src="/lab-assets/unfold/lit-1100.webp"
              alt="The lamp open on a dark walnut desk, its strip lit and throwing a warm pool of light."
              width={1100}
              height={624}
              className="w-full"
            />
          </Frame>
        </Rise>

        <Rise className="mx-auto mt-14 max-w-2xl text-center" delay={0.08}>
          <h2 className="text-[clamp(1.9rem,4.6vw,3rem)] leading-[1.06] font-medium tracking-[-0.03em] text-[#f6f4ef] text-balance">
            Then the room changes.
          </h2>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-[#a8a29a]">
            2,200 lumens off a single strip, aimed at the desk and nowhere else.
            Nobody sitting opposite you gets it in the eyes.
          </p>
          <Readout
            tone="dark"
            className="mt-8 justify-center"
            items={["2200 lm", "CRI 97", "no flicker"]}
          />
        </Rise>
      </section>

      {/* ── 4. the one control on the page ───────────────────────────── */}
      <section className="px-5 pb-24 sm:px-8 sm:pb-32" style={{ background: ROOM }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <Rise>
            <Frame tone="dark">
              <div className="relative">
                <Image
                  src="/lab-assets/unfold/lit-1100.webp"
                  alt=""
                  width={1100}
                  height={624}
                  className="w-full"
                />
                {/* Hue and saturation come from this layer, luminosity from the
                    photograph underneath, so the slider relights the whole
                    picture instead of tinting a rectangle over it. */}
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: light,
                    mixBlendMode: "color",
                    opacity: relight,
                  }}
                />
              </div>
            </Frame>
          </Rise>

          <Rise delay={0.08}>
            <h2 className="text-[clamp(1.9rem,4.6vw,3rem)] leading-[1.06] font-medium tracking-[-0.03em] text-[#f6f4ef] text-balance">
              Warm to work by. Cool to read by.
            </h2>
            <p className="mt-5 leading-relaxed text-[#a8a29a]">
              Move the slider. The light changes, and so does everything it
              lands on.
            </p>
            <TemperatureControl
              kelvin={kelvin}
              onChange={setKelvin}
              light={light}
            />
          </Rise>
        </div>
      </section>

      {/* ── 5. the measurements ──────────────────────────────────────── */}
      <section className="px-5 pb-24 sm:px-8 sm:pb-32" style={{ background: ROOM }}>
        <Rise className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(1.7rem,4.2vw,2.6rem)] leading-[1.1] font-medium tracking-[-0.03em] text-[#f6f4ef] text-balance">
            Folded, it is a 320 mm bar.
          </h2>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-[#a8a29a]">
            Open, the head sits 280 mm above the desk and stays there on
            friction, with no knob to tighten.
          </p>
        </Rise>

        <Rise className="mx-auto mt-14 max-w-4xl" delay={0.08}>
          <Frame tone="dark">
            <div className="relative">
              <Image
                src="/lab-assets/unfold/lit-1100.webp"
                alt=""
                width={1100}
                height={624}
                className="w-full"
              />
              <DimensionLines />
            </div>
          </Frame>
        </Rise>
      </section>

      {/* ── 6. the spec sheet, because a spec sheet is a list ─────────── */}
      <section className="px-5 pb-28 sm:px-8" style={{ background: ROOM }}>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[clamp(1.7rem,4.2vw,2.6rem)] leading-[1.1] font-medium tracking-[-0.03em] text-[#f6f4ef]">
            Unfold, in full
          </h2>

          <dl className="mt-12 divide-y divide-white/10 border-y border-white/10">
            {SPECS.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6"
              >
                <dt className="font-mono text-[0.6875rem] tracking-[0.04em] text-[#a8a29a] uppercase">
                  {label}
                </dt>
                <dd className="text-[#f6f4ef]">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-5">
            <p className="text-[2rem] font-medium tracking-[-0.02em] text-[#f6f4ef]">
              THB 6,900
            </p>
            <a
              href="#top"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#f6f4ef] px-7 text-[0.95rem] font-medium text-[#080704] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ffc489]"
            >
              Pre-order
            </a>
          </div>

          <p className="mt-16 max-w-xl text-sm leading-relaxed text-[#8d887e]">
            Unfold is not a real product and none of it is for sale. The lamp
            was generated; the page is the point. The clip starts when you reach
            it and stops when it is done, the stills either side of it are the
            same lamp in a different state, and the slider relights the
            photograph rather than swapping to a second one.
          </p>
        </div>
      </section>
    </main>
  );
}

/**
 * The frame every picture on this page sits in.
 *
 * It is meant to be seen. Three earlier attempts tried to make the boundary
 * between photograph and page vanish - matching the page to a corner pixel,
 * feathering all four sides, blurring a copy of the frame behind it - and each
 * drew something worse than the seam it was hiding, because a photograph
 * cannot dissolve into a flat colour. Rounding the corners says the picture is
 * placed on the page, and then the edge is not a defect.
 */
function Frame({
  tone,
  children,
}: {
  tone: "light" | "dark";
  children: ReactNode;
}) {
  // The light section is the one where the picture and the page are the same
  // material. Measured across all four sides the step is 1 to 4 units out of
  // 255, and it was still visible, because what the eye catches is a straight
  // line a thousand pixels long rather than a difference in tone. Removing
  // the outline and then the shadow lowered the step and kept the line.
  //
  // So there is no line: the picture fades out over its last few per cent on
  // every side. This is the treatment that drew a grey halo when it was tried
  // against a mismatched ground and over a much longer fade. Against a ground
  // this close, over this distance, and with only empty studio in the margin
  // it has to eat, it dissolves. Rounded corners come off with it; a feathered
  // edge and a drawn corner are two different claims about where the picture
  // stops.
  if (tone === "light") {
    return (
      <div
        style={{
          maskImage: LIGHT_FADE,
          maskComposite: "intersect",
          WebkitMaskImage: LIGHT_FADE,
          WebkitMaskComposite: "source-in",
        }}
      >
        {children}
      </div>
    );
  }

  // On the dark ground the picture really is a different tone from the page,
  // so a hairline defines an edge that exists rather than inventing one.
  return (
    <div className="overflow-hidden rounded-[1.25rem] ring-1 ring-white/10 sm:rounded-[1.75rem]">
      {children}
    </div>
  );
}

const LIGHT_FADE =
  "linear-gradient(to right, transparent, #000 4%, #000 96%, transparent), linear-gradient(to bottom, transparent, #000 4%, #000 96%, transparent)";

/**
 * Enters on load, for the block that is already on screen when the page
 * opens. Framer's MotionConfig turns it off for anyone who has asked for less
 * motion, so nothing here is load-bearing.
 */
function Enter({
  children,
  className = "",
  delay = 0,
  distance = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Enters once, on arrival. Framer's MotionConfig turns this off for
 *  anyone who has asked for less motion. */
function Rise({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Back to the gallery, plus the wordmark, in the manner of a product page. */
function TopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-black/[0.08] bg-[#f2f1ec]/95">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/labs"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-[#4c4941] transition-colors hover:text-[#14130f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          The Lab
        </Link>
        <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-[#65615a] uppercase">
          Unfold
        </span>
      </div>
    </header>
  );
}

/** A row of measured values. Monospaced, because these are readings. */
function Readout({
  items,
  tone,
  className = "",
}: {
  items: string[];
  tone: "light" | "dark";
  className?: string;
}) {
  const colour = tone === "light" ? "text-[#65615a]" : "text-[#a8a29a]";
  const rule = tone === "light" ? "bg-black/20" : "bg-white/25";

  return (
    <ul
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.6875rem] tracking-[0.06em] uppercase ${colour} ${className}`}
    >
      {items.map((item, i) => (
        <li key={item} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden className={`block h-3 w-px ${rule}`} />}
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The track carries the range it controls: warm at one end, daylight at the
 * other, so the control shows its own scale without a legend. The thumb takes
 * the current colour, which makes it the third place on screen showing the
 * same value.
 */
const RANGE_CSS = `
.unfold-range { -webkit-appearance: none; appearance: none; }
.unfold-range::-webkit-slider-runnable-track {
  height: 2px; border-radius: 999px;
  background: linear-gradient(90deg, rgb(255 166 87), rgb(255 236 224));
}
.unfold-range::-moz-range-track {
  height: 2px; border-radius: 999px;
  background: linear-gradient(90deg, rgb(255 166 87), rgb(255 236 224));
}
.unfold-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 22px; height: 22px; margin-top: -10px; border-radius: 999px;
  background: var(--unfold-thumb); border: 2px solid #080704;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.35), 0 0 18px var(--unfold-thumb);
}
.unfold-range::-moz-range-thumb {
  width: 22px; height: 22px; border-radius: 999px;
  background: var(--unfold-thumb); border: 2px solid #080704;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.35), 0 0 18px var(--unfold-thumb);
}
/* the default ring lands on the input box, not on the thumb the eye follows */
.unfold-range:focus-visible { outline: none; }
.unfold-range:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px #f6f4ef, 0 0 18px var(--unfold-thumb);
}
.unfold-range:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 3px #f6f4ef, 0 0 18px var(--unfold-thumb);
}
`;

/**
 * The page's one control. A real range input: it takes keyboard focus, reports
 * its value to assistive technology, and the number beside it is the value the
 * photograph is being relit with rather than a label.
 */
function TemperatureControl({
  kelvin,
  onChange,
  light,
}: {
  kelvin: number;
  onChange: (value: number) => void;
  light: string;
}) {
  return (
    <div className="mt-9">
      {/* Scoped to the lab. The site's globals.css is its design system and a
          style study has no business adding to it. */}
      <style>{RANGE_CSS}</style>

      <div className="flex items-baseline justify-between">
        <label
          htmlFor="unfold-kelvin"
          className="font-mono text-[0.6875rem] tracking-[0.06em] text-[#a8a29a] uppercase"
        >
          Colour temperature
        </label>
        <output
          htmlFor="unfold-kelvin"
          className="font-mono text-2xl tabular-nums"
          style={{ color: light }}
        >
          {kelvin.toLocaleString("en-US")} K
        </output>
      </div>

      <input
        id="unfold-kelvin"
        type="range"
        min={2700}
        max={5000}
        step={100}
        value={kelvin}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Colour temperature in kelvin"
        className="unfold-range mt-4 h-11 w-full cursor-pointer bg-transparent"
        style={{ "--unfold-thumb": light } as CSSProperties}
      />

      <div className="mt-1 flex justify-between font-mono text-[0.6875rem] tracking-[0.06em] text-[#8d887e] uppercase">
        <span>2700 K warm</span>
        <span>5000 K daylight</span>
      </div>
    </div>
  );
}

/**
 * Measurements drawn over the photograph. Positions are fractions of the
 * frame, matched to where the lamp sits in the shot. Hidden below `sm`, where
 * the picture is small enough that the brackets would crowd the lamp.
 */
const RULE = "rgba(246,244,239,0.5)";

function DimensionLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
      <Bracket
        text="320 mm"
        sides="horizontal"
        style={{ left: "13%", width: "42%", top: "80%", height: "5%" }}
      />
      <Bracket
        text="280 mm"
        sides="vertical"
        style={{ right: "8%", width: "4%", top: "12%", height: "72%" }}
      />
    </div>
  );
}

function Bracket({
  text,
  style,
  sides,
}: {
  text: string;
  style: CSSProperties;
  sides: "horizontal" | "vertical";
}) {
  const edges =
    sides === "horizontal"
      ? { borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1 }
      : { borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1 };

  return (
    <div
      className="absolute flex items-center justify-center"
      style={{ ...style, ...edges, borderStyle: "solid", borderColor: RULE }}
    >
      <span
        className={`absolute font-mono text-[0.7rem] tracking-[0.08em] whitespace-nowrap text-[#e6e1d8] ${
          sides === "vertical" ? "right-full pr-2" : "bg-[#080704] px-2"
        }`}
      >
        {text}
      </span>
    </div>
  );
}
