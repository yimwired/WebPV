"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { DIMENSIONS, LAMP, UnfoldLamp, kelvinToRgb } from "./unfold-lamp";

/**
 * A launch page for one physical object, in the shape the big hardware pages
 * use: a single continuous shot where scrolling moves the product itself and
 * the copy arrives when the product reaches the state it describes.
 *
 * Two things separate it from a video-scrubbed page. The product is drawn in
 * CSS and lit live, so the page weighs nothing and the light is real rather
 * than a frame someone rendered; and the one control on it works, so the
 * colour temperature figure is measured off the same value that paints the
 * room.
 *
 * The product is fictional. Nothing here is for sale.
 */

/**
 * Where each act starts and ends, as a fraction of the pinned scroll. Acts
 * overlap on purpose: copy leaves while the object is already moving into the
 * next state, which is what keeps it reading as one shot.
 */
const ACTS = {
  closed: [0.0, 0.03, 0.11, 0.16],
  unfold: [0.16, 0.2, 0.28, 0.33],
  light: [0.42, 0.47, 0.54, 0.59],
  warmth: [0.61, 0.66, 0.74, 0.79],
  drawing: [0.81, 0.86, 0.95, 1.0],
} as const;

/**
 * The room has to be fully dark before any copy written for a dark room fades
 * in. Framer walks between two colours perceptually rather than linearly, so
 * this range finishes well before act three rather than trailing into it:
 * measured mid-sweep it was still rgb(67,66,65), which put the body colour at
 * 2.6:1 against its own background.
 */
const DARKEN = [0.31, 0.41];

const PAGE_LIGHT = "#f2f1ee";
const PAGE_DARK = "#12100e";

const SPECS: ReadonlyArray<[string, string]> = [
  ["Output", "2,200 lm"],
  ["Colour", "2700 to 5000 K, adjustable"],
  ["Colour rendering", "CRI 97"],
  ["Power", "18 W over USB-C"],
  ["Folded", `${DIMENSIONS.folded} x 42 x ${DIMENSIONS.thickness} mm`],
  ["Open height", `${DIMENSIONS.openHeight} mm`],
  ["Hinge", `${LAMP.openAngle}°, held by friction`],
  ["Weight", "340 g"],
  ["Finish", "Anodised aluminium"],
  ["Warranty", "5 years"],
];

/** Tracks a media query, starting false so the server and first paint agree. */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const sync = () => setMatches(list.matches);
    sync();
    list.addEventListener("change", sync);
    return () => list.removeEventListener("change", sync);
  }, [query]);

  return matches;
}

/** Fades a block in over [a, b] and back out over [c, d]. */
function useAct(progress: MotionValue<number>, act: readonly number[]) {
  return useTransform(progress, [...act], [0, 1, 1, 0]);
}

export function UnfoldDemo() {
  const reduced = useReducedMotion() ?? false;
  const stage = useRef<HTMLElement>(null);
  // measured against the pinned section alone: the spec sheet below it is not
  // part of the story, and including it would shift every act.
  const { scrollYProgress } = useScroll({
    target: stage,
    offset: ["start start", "end end"],
  });

  const [kelvin, setKelvin] = useState(3200);
  const [hinge, setHinge] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const light = kelvinToRgb(kelvin);

  // ── the object's state, driven by scroll ──────────────────────────────
  // Reduced motion gets the same states, reached in steps rather than swept,
  // so nothing large slides across the screen but every act still happens.
  const sweptAngle = useTransform(
    scrollYProgress,
    [0.15, 0.32],
    [0, LAMP.openAngle],
    { clamp: true }
  );
  const steppedAngle = useTransform(scrollYProgress, (p): number =>
    p >= 0.15 ? LAMP.openAngle : 0
  );
  const angle = reduced ? steppedAngle : sweptAngle;

  const sweptLit = useTransform(
    scrollYProgress,
    [0.34, 0.44, 0.84, 0.9],
    [0, 1, 1, 0.16],
    { clamp: true }
  );
  const steppedLit = useTransform(scrollYProgress, (p): number =>
    p >= 0.34 ? 1 : 0
  );
  const lit = reduced ? steppedLit : sweptLit;

  const sweptAmbient = useTransform(scrollYProgress, DARKEN, [0, 1], {
    clamp: true,
  });
  const steppedAmbient = useTransform(scrollYProgress, (p): number =>
    p >= DARKEN[0] ? 1 : 0
  );
  const ambient = reduced ? steppedAmbient : sweptAmbient;

  const sweptBlueprint = useTransform(
    scrollYProgress,
    [0.79, 0.87],
    [0, 1],
    { clamp: true }
  );
  const steppedBlueprint = useTransform(scrollYProgress, (p): number =>
    p >= 0.8 ? 1 : 0
  );
  const blueprint = reduced ? steppedBlueprint : sweptBlueprint;

  // ── how the object is framed, act by act ──────────────────────────────
  // No two neighbouring acts hold the product in the same place. On a wide
  // screen it slides sideways to make room for a column of copy; on a phone
  // there is no sideways to slide to, so it climbs instead and the copy takes
  // the bottom of the screen. Sharing one set of keyframes put the slider on
  // top of the lamp at 390px.
  const compact = useMediaQuery("(max-width: 639px)");
  const FRAME_AT = [0, 0.16, 0.33, 0.5, 0.66, 0.82];

  const restingX = useMotionValue<string>("0%");
  const restingScale = useMotionValue(0.84);
  const sweptX = useTransform(
    scrollYProgress,
    FRAME_AT,
    compact
      ? ["0%", "0%", "0%", "0%", "0%", "0%"]
      : ["0%", "0%", "0%", "17%", "-19%", "0%"]
  );
  const sweptScale = useTransform(
    scrollYProgress,
    FRAME_AT,
    compact
      ? [0.92, 0.92, 1, 0.82, 0.78, 0.74]
      : [1, 1, 1, 0.95, 0.86, 0.74]
  );
  const stageBottom = useTransform(
    scrollYProgress,
    FRAME_AT,
    compact
      ? ["24%", "24%", "30%", "52%", "54%", "24%"]
      : ["32%", "32%", "28%", "26%", "26%", "20%"]
  );
  const stageX = reduced ? restingX : sweptX;
  const stageScale = reduced ? restingScale : sweptScale;

  const pageBackground = useTransform(
    scrollYProgress,
    DARKEN,
    [PAGE_LIGHT, PAGE_DARK],
    { clamp: true }
  );
  const onDark = useTransform(scrollYProgress, DARKEN, [0, 1], { clamp: true });
  const bodyColour = useTransform(
    onDark,
    [0, 1],
    ["#57544d", "#a49e93"]
  );
  const headingColour = useTransform(
    onDark,
    [0, 1],
    ["#14130f", "#f4f1ea"]
  );

  const closedOpacity = useAct(scrollYProgress, ACTS.closed);
  const unfoldOpacity = useAct(scrollYProgress, ACTS.unfold);
  const lightOpacity = useAct(scrollYProgress, ACTS.light);
  const warmthOpacity = useAct(scrollYProgress, ACTS.warmth);
  const drawingOpacity = useAct(scrollYProgress, ACTS.drawing);

  // The hinge readout is the page's honesty check: it is measured off the
  // same value that rotates the arm, so it cannot say 40 while the arm is at 60.
  useMotionValueEvent(angle, "change", (value) => {
    setHinge(Math.round(value));
  });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (value > 0.004) setScrolled(true);
  });

  // The pinned stage is 600vh of scroll, so the page needs to open at the top
  // even when the browser restores a position from the last visit.
  useEffect(() => {
    if (!("scrollRestoration" in history)) return;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  return (
    // The darkening lives on the element the copy sits inside, not on a fixed
    // layer behind it. Anything that resolves a text colour by walking up to
    // the nearest painted background - the project's own audit script, and some
    // assistive tooling - cannot see a sibling, and read this page's headline
    // as 1.07:1 while the rendered pixels were fine.
    <motion.div className="relative" style={{ background: pageBackground }}>
      <TopBar onDark={onDark} />

      {/* ─── the pinned stage: five acts on one continuous shot ─── */}
      <section ref={stage} className="relative h-[600vh]">
        <div
          className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden"
          style={{ containerType: "size" }}
        >
          {/* the desk, and the product standing on it. The centring translate
              and the per-act offset live on separate elements: framer writes
              `x` into the same transform slot and they would fight. */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: stageBottom,
              fontSize: "clamp(7px, min(2.6cqw, 3cqh), 22px)",
            }}
          >
            <motion.div
              style={{ x: stageX, scale: stageScale }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <UnfoldLamp
                angle={angle}
                lit={lit}
                ambient={ambient}
                blueprint={blueprint}
                light={light}
              />
              <DimensionLines opacity={drawingOpacity} />
            </motion.div>
          </motion.div>

          {/* Act 1 - the object, closed. Full bleed, copy set against it. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[13%] px-6 text-center"
            style={{ opacity: closedOpacity }}
          >
            <motion.h1
              className="text-[clamp(3.2rem,13vw,9rem)] leading-[0.86] font-semibold tracking-[-0.045em]"
              style={{ color: headingColour }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              Unfold
            </motion.h1>
            <motion.p
              className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-balance"
              style={{ color: bodyColour }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.24, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              A desk light that folds down to the size of a pencil case.
            </motion.p>
            <Readout
              onDark={onDark}
              className="mt-7 justify-center"
              items={[`${DIMENSIONS.folded} mm closed`, "340 g", "aluminium"]}
            />
          </motion.div>

          {/* Act 2 - one line, and the angle it is describing, live. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[11%] px-6 text-center"
            style={{ opacity: unfoldOpacity }}
          >
            <motion.h2
              className="mx-auto max-w-2xl text-[clamp(1.9rem,5.2vw,3.4rem)] leading-[1.06] font-medium tracking-[-0.03em] text-balance"
              style={{ color: headingColour }}
            >
              One hinge, and it is already a lamp.
            </motion.h2>
            <Readout
              onDark={onDark}
              className="mt-6 justify-center"
              items={[`hinge ${hinge}°`, `of ${LAMP.openAngle}°`]}
            />
          </motion.div>

          {/* Act 3 - split: the room has changed, so the copy moves off centre. */}
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-end px-6 pb-32 sm:items-center sm:px-12 sm:pb-0"
            style={{ opacity: lightOpacity }}
          >
            <div className="w-full sm:max-w-md">
              <motion.h2
                className="text-[clamp(1.9rem,5vw,3.2rem)] leading-[1.06] font-medium tracking-[-0.03em] text-balance"
                style={{ color: headingColour }}
              >
                Then the room changes.
              </motion.h2>
              <motion.p
                className="mt-5 max-w-sm leading-relaxed"
                style={{ color: bodyColour }}
              >
                2,200 lumens off a single strip, aimed at the desk and nowhere
                else. Nobody sitting opposite you gets it in the eyes.
              </motion.p>
              <Readout
                onDark={onDark}
                className="mt-7"
                items={["2200 lm", "CRI 97", "no flicker"]}
              />
            </div>
          </motion.div>

          {/* Act 4 - the control panel, and the only thing on the page you touch. */}
          <motion.div
            className="absolute inset-0 flex items-end justify-end px-6 pb-28 sm:items-center sm:px-12 sm:pb-0"
            style={{
              opacity: warmthOpacity,
              pointerEvents: "none",
            }}
          >
            <motion.div
              className="w-full sm:max-w-sm"
              style={{ pointerEvents: "auto" }}
            >
              <motion.h2
                className="text-[clamp(1.9rem,5vw,3.2rem)] leading-[1.06] font-medium tracking-[-0.03em] text-balance"
                style={{ color: headingColour }}
              >
                Warm to work by. Cool to read by.
              </motion.h2>
              <motion.p
                className="mt-5 leading-relaxed"
                style={{ color: bodyColour }}
              >
                Move the slider. The strip changes, and so does everything the
                light lands on.
              </motion.p>
              <TemperatureControl
                kelvin={kelvin}
                onChange={setKelvin}
                light={light}
              />
            </motion.div>
          </motion.div>

          {/* Act 5 - the drawing. Centred, quiet, nothing but measurements. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[9%] px-6 text-center"
            style={{ opacity: drawingOpacity }}
          >
            <motion.h2
              className="mx-auto max-w-xl text-[clamp(1.7rem,4.4vw,2.8rem)] leading-[1.1] font-medium tracking-[-0.03em] text-balance"
              style={{ color: headingColour }}
            >
              Every figure on this page is a dimension.
            </motion.h2>
            <motion.p
              className="mx-auto mt-5 max-w-md leading-relaxed"
              style={{ color: bodyColour }}
            >
              Folded it is {DIMENSIONS.folded} mm end to end and{" "}
              {DIMENSIONS.thickness} mm thick. Open, the head sits{" "}
              {DIMENSIONS.openHeight} mm above the desk and stays there on
              friction, with no knob to tighten.
            </motion.p>
          </motion.div>

          <ScrollHint hidden={scrolled} />
        </div>
      </section>

      {/* ─── after the pin: a plain list, because a spec sheet is a list ─── */}
      <section className="relative px-6 pt-24 pb-28 sm:px-12 sm:pt-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[clamp(1.7rem,4.4vw,2.6rem)] leading-[1.1] font-medium tracking-[-0.03em] text-[#f4f1ea]">
            Unfold, in full
          </h2>

          <dl className="mt-12 divide-y divide-white/10 border-y border-white/10">
            {SPECS.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6"
              >
                <dt className="font-mono text-[0.6875rem] tracking-[0.04em] text-[#a49e93] uppercase">
                  {label}
                </dt>
                <dd className="text-[#f4f1ea]">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-5">
            <p className="text-[2rem] font-medium tracking-[-0.02em] text-[#f4f1ea]">
              THB 6,900
            </p>
            <a
              href="#top"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#f4f1ea] px-7 text-[0.95rem] font-medium text-[#12100e] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ffc489]"
            >
              Pre-order
            </a>
          </div>

          <p className="mt-16 max-w-xl text-sm leading-relaxed text-[#8d887e]">
            Unfold is not a real product. It exists so this page has something
            honest to describe: the lamp is drawn in CSS and lit in the browser,
            the slider changes the light rather than a picture of it, and the
            hinge figure is read off the same value that turns the arm.
          </p>
        </div>
      </section>
    </motion.div>
  );
}

/** Back to the gallery, plus the wordmark, in the manner of a product page. */
function TopBar({ onDark }: { onDark: MotionValue<number> }) {
  const colour = useTransform(onDark, [0, 1], ["#57544d", "#a49e93"]);
  const border = useTransform(
    onDark,
    [0, 1],
    ["rgba(20,19,15,0.10)", "rgba(244,241,234,0.12)"]
  );

  return (
    <motion.header
      id="top"
      className="fixed inset-x-0 top-0 z-20 border-b backdrop-blur-none"
      style={{ borderColor: border }}
    >
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6 sm:px-12">
        <Link
          href="/labs"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <motion.span
            className="inline-flex items-center gap-2"
            style={{ color: colour }}
          >
            <ArrowLeft className="h-4 w-4" />
            The Lab
          </motion.span>
        </Link>
        <motion.span
          className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase"
          style={{ color: colour }}
        >
          Unfold
        </motion.span>
      </div>
    </motion.header>
  );
}

/** A row of measured values. Monospaced, because these are readings. */
function Readout({
  items,
  onDark,
  className = "",
}: {
  items: string[];
  onDark: MotionValue<number>;
  className?: string;
}) {
  const colour = useTransform(onDark, [0, 1], ["#6b675f", "#98928a"]);
  const rule = useTransform(
    onDark,
    [0, 1],
    ["rgba(20,19,15,0.18)", "rgba(244,241,234,0.2)"]
  );

  return (
    <motion.ul
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.6875rem] tracking-[0.06em] uppercase ${className}`}
      style={{ color: colour }}
    >
      {items.map((item, i) => (
        <li key={item} className="flex items-center gap-3">
          {i > 0 && (
            <motion.span
              aria-hidden
              className="block h-3 w-px"
              style={{ background: rule }}
            />
          )}
          {item}
        </li>
      ))}
    </motion.ul>
  );
}

/**
 * The track carries the range it controls: warm at one end, daylight at the
 * other, so the control shows its own scale without a legend. The thumb takes
 * the lamp's current colour, which makes it the third place on screen showing
 * the same value.
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
  background: var(--unfold-thumb); border: 2px solid #12100e;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.35), 0 0 18px var(--unfold-thumb);
}
.unfold-range::-moz-range-thumb {
  width: 22px; height: 22px; border-radius: 999px;
  background: var(--unfold-thumb); border: 2px solid #12100e;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.35), 0 0 18px var(--unfold-thumb);
}
/* the default ring lands on the input box, not on the thumb the eye follows */
.unfold-range:focus-visible { outline: none; }
.unfold-range:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px #f4f1ea, 0 0 18px var(--unfold-thumb);
}
.unfold-range:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 3px #f4f1ea, 0 0 18px var(--unfold-thumb);
}
`;

/**
 * The page's one control. A real range input: it takes keyboard focus, reports
 * its value to assistive technology, and the number beside it is the value
 * the lamp is actually emitting rather than a label.
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
          className="font-mono text-[0.6875rem] tracking-[0.06em] text-[#98928a] uppercase"
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
        style={
          {
            "--unfold-thumb": light,
          } as CSSProperties
        }
      />

      <div className="mt-1 flex justify-between font-mono text-[0.6875rem] tracking-[0.06em] text-[#8d887e] uppercase">
        <span>2700 K warm</span>
        <span>5000 K daylight</span>
      </div>
    </div>
  );
}

/**
 * Measurements drawn onto the object in the last act, positioned against the
 * same constants the lamp is built from.
 *
 * The labels are sized in rem rather than in the lamp's own em: at 390px the
 * lamp's em is about 10px, and a label scaled with it came out at 7px.
 */
function DimensionLines({ opacity }: { opacity: MotionValue<number> }) {
  const rule = "rgba(244,241,234,0.5)";

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ opacity }}
    >
      {/* folded length, bracketed under the base */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: 0,
          width: `${LAMP.baseW}em`,
          bottom: "-3.4em",
          height: "0.9em",
          borderLeft: `1px solid ${rule}`,
          borderRight: `1px solid ${rule}`,
          borderBottom: `1px solid ${rule}`,
        }}
      >
        <span
          className="absolute font-mono text-xs tracking-[0.08em] whitespace-nowrap"
          style={{ color: "#d8d3ca", background: PAGE_DARK, padding: "0 0.5rem" }}
        >
          {DIMENSIONS.folded} mm
        </span>
      </div>

      {/* open height, bracketed up the right-hand side */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          right: "-2.6em",
          width: "0.9em",
          bottom: 0,
          height: `${LAMP.baseH + LAMP.armL * Math.sin((LAMP.openAngle * Math.PI) / 180)}em`,
          borderTop: `1px solid ${rule}`,
          borderRight: `1px solid ${rule}`,
          borderBottom: `1px solid ${rule}`,
        }}
      >
        <span
          className="absolute left-full font-mono text-xs tracking-[0.08em] whitespace-nowrap"
          style={{ color: "#d8d3ca", paddingLeft: "0.5rem" }}
        >
          {DIMENSIONS.openHeight} mm
        </span>
      </div>
    </motion.div>
  );
}

/** Present until the first scroll, then gone for good. */
function ScrollHint({ hidden }: { hidden: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-7 flex justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.5, delay: hidden ? 0 : 1.4 }}
    >
      <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-[#6b675f] uppercase">
        Scroll
      </span>
    </motion.div>
  );
}
