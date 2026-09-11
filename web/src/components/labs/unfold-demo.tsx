"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
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
import { UnfoldSequence } from "./unfold-sequence";
import { kelvinToRgb } from "./unfold-light";

/**
 * A launch page for one physical object, in the shape the big hardware pages
 * use: a single continuous shot where scroll position moves the product and
 * the copy arrives when the product reaches the state it describes.
 *
 * Three views of the same lamp are stacked in one frame - folded, the unfold
 * as a scrubbed sequence, and lit on a desk - all made from one master image,
 * so the layers cross-fade without anything appearing to jump. The
 * colour-temperature control relights the photograph for real rather than
 * swapping to a second picture of it.
 *
 * The product is fictional and nothing here is for sale. The page says so.
 */

/** Where each act starts and ends, as a fraction of the pinned scroll. */
const ACTS = {
  closed: [0.0, 0.03, 0.11, 0.16],
  // Out before the room turns. Cross-fading ink and paper through mid-grey at
  // the same time put this line at 2.39:1 against its own background halfway
  // through the change, which no colour choice fixes: the two have to not
  // overlap.
  unfold: [0.17, 0.2, 0.25, 0.29],
  light: [0.44, 0.49, 0.56, 0.61],
  warmth: [0.63, 0.68, 0.76, 0.81],
  drawing: [0.83, 0.88, 0.96, 1.0],
} as const;

/** The sequence scrubs across this range: folded, room darkens, light on. */
const SCRUB = [0.14, 0.42] as const;

/**
 * When the page follows the clip into the dark. The clip's own lights go down
 * around its halfway mark, so this tracks that rather than running on past it:
 * the background was still pale grey while the photograph was already black.
 */
const DARKEN = [0.28, 0.345] as const;

/** Sampled from the corners of the two photographs, so no seam shows. */
const PAGE_LIGHT = "#f2f1ec";
const PAGE_DARK = "#080704";

const MEDIA = { width: 1100, height: 624 };

/**
 * The photographs are not a flat colour out to their edges, so a hard boundary
 * drew a visible rectangle on the page even with the background sampled off
 * their corners. Feathering all four sides dissolves it.
 */
const EDGE_MASK =
  "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 6%, #000 88%, transparent)";

/** Roughly the colour temperature the lit photograph was generated at. */
const NATIVE_KELVIN = 3050;

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

/**
 * 0 below `from`, 1 above `to`, linear in between.
 *
 * Every scroll-linked ramp on this page goes through here rather than through
 * `useTransform(value, [a, b], [c, d], { clamp: true })`. That call is read
 * wrongly by this version of framer when the input range has only two stops:
 * it produced a value that rose across the whole remaining scroll instead of
 * finishing at `b`, which left two of the three stacked photographs visible
 * at once. Four-stop ranges are unaffected.
 */
function ramp(value: number, from: number, to: number) {
  return Math.min(1, Math.max(0, (value - from) / (to - from)));
}

/** Fades a block in over [a, b] and back out over [c, d]. */
function useAct(progress: MotionValue<number>, act: readonly number[]) {
  return useTransform(progress, [...act], [0, 1, 1, 0]);
}

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

export function UnfoldDemo() {
  const reduced = useReducedMotion() ?? false;
  const compact = useMediaQuery("(max-width: 639px)");
  const stage = useRef<HTMLElement>(null);

  // Measured against the pinned section alone: the spec sheet below it is not
  // part of the story, and including it would shift every act.
  const { scrollYProgress } = useScroll({
    target: stage,
    offset: ["start start", "end end"],
  });

  const [kelvin, setKelvin] = useState(3200);
  const [scrolled, setScrolled] = useState(false);
  const light = kelvinToRgb(kelvin);

  // How hard to push the relight. The photograph was already lit at roughly
  // NATIVE_KELVIN, so near that value the overlay should do almost nothing;
  // a flat blend at full strength turned the graphite head gold and flattened
  // the whole picture into one colour.
  const relight = (Math.abs(kelvin - NATIVE_KELVIN) / 1950) * 0.52;

  // ── the sequence ───────────────────────────────────────────────────────
  const sweptScrub = useTransform(scrollYProgress, (p): number =>
    ramp(p, SCRUB[0], SCRUB[1])
  );
  const steppedScrub = useTransform(scrollYProgress, (p): number =>
    p >= SCRUB[0] ? 1 : 0
  );
  const scrub = reduced ? steppedScrub : sweptScrub;

  // ── which of the three layers is showing ───────────────────────────────
  // The sequence's first frame is the folded photograph and its last frame is
  // the lit one, so these cross-fades are between identical pictures.
  const foldedOpacity = useTransform(scrollYProgress, (p): number =>
    1 - ramp(p, 0.12, 0.16)
  );
  const sequenceOpacity = useTransform(
    scrollYProgress,
    (p): number => ramp(p, 0.12, 0.16) * (1 - ramp(p, 0.42, 0.46))
  );
  const litOpacity = useTransform(scrollYProgress, (p): number =>
    ramp(p, 0.42, 0.46)
  );

  // ── how the frame is composed, act by act ──────────────────────────────
  // On a wide screen the product slides sideways to make room for a column of
  // copy. On a phone there is no sideways to slide to, so it climbs instead
  // and the copy takes the bottom of the screen.
  const FRAME_AT = [0, 0.16, 0.36, 0.5, 0.68, 0.84];
  const restingOffset = useMotionValue<string>("0%");
  const restingScale = useMotionValue(0.9);

  const sweptX = useTransform(
    scrollYProgress,
    FRAME_AT,
    compact
      ? ["0%", "0%", "0%", "0%", "0%", "0%"]
      : ["0%", "0%", "0%", "15%", "-17%", "0%"]
  );
  const sweptY = useTransform(
    scrollYProgress,
    FRAME_AT,
    compact
      ? ["-2%", "-4%", "-18%", "-48%", "-50%", "-30%"]
      : ["4%", "2%", "-9%", "0%", "0%", "2%"]
  );
  const sweptScale = useTransform(
    scrollYProgress,
    FRAME_AT,
    compact ? [1, 1, 0.96, 1, 1, 0.94] : [0.96, 0.95, 0.9, 0.94, 0.88, 0.86]
  );

  const frameX = reduced ? restingOffset : sweptX;
  const frameY = reduced ? restingOffset : sweptY;
  const frameScale = reduced ? restingScale : sweptScale;

  // ── the room, and the copy that has to stay legible in it ──────────────
  // Derived from `onDark` rather than from scroll directly, so the room and
  // the colours it forces are one value and cannot drift apart.
  const onDark = useTransform(scrollYProgress, (p): number =>
    ramp(p, DARKEN[0], DARKEN[1])
  );
  const pageBackground = useTransform(
    onDark,
    [0, 1],
    [PAGE_LIGHT, PAGE_DARK]
  );
  const bodyColour = useTransform(onDark, [0, 1], ["#57544d", "#a49e93"]);
  const headingColour = useTransform(onDark, [0, 1], ["#14130f", "#f4f1ea"]);

  const closedOpacity = useAct(scrollYProgress, ACTS.closed);
  const unfoldOpacity = useAct(scrollYProgress, ACTS.unfold);
  const lightOpacity = useAct(scrollYProgress, ACTS.light);
  const warmthOpacity = useAct(scrollYProgress, ACTS.warmth);
  const drawingOpacity = useAct(scrollYProgress, ACTS.drawing);

  // The relight only exists while its act is on screen, and only as far as
  // the slider has been moved away from the photograph's own temperature.
  const relightOpacity = useTransform(warmthOpacity, (v) => v * relight);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (value > 0.004) setScrolled(true);
  });

  // The pinned stage is 600vh, so the page has to open at the top even when
  // the browser restores a position from the last visit.
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
    // the nearest painted background - the project's own audit script, and
    // some assistive tooling - cannot see a sibling, and read the headline as
    // 1.07:1 while the rendered pixels were fine.
    <motion.div className="relative" style={{ background: pageBackground }}>
      <TopBar onDark={onDark} />

      {/* ─── the pinned stage: five acts on one continuous shot ─── */}
      <section ref={stage} className="relative h-[600vh]">
        <div className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden">
          {/* The three layers share one box and one framing, so cross-fading
              between them reads as the same photograph changing state. */}
          <motion.div
            className="absolute w-full max-w-[68rem] sm:px-8"
            style={{ x: frameX, y: frameY, scale: frameScale }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <div
              className="relative w-full"
              style={{
                // A wide product shot on a portrait phone comes out tiny. The
                // phone gets a squarer window onto the same picture instead,
                // cropping margin the shots have plenty of, which buys about a
                // third more height for the lamp.
                aspectRatio: compact ? "4 / 3" : `${MEDIA.width} / ${MEDIA.height}`,
                // The photographs are not a flat colour to their edges, so a
                // hard boundary drew a visible rectangle on the page even with
                // the background sampled off their corners. Feather all four.
                maskImage: EDGE_MASK,
                maskComposite: "intersect",
                WebkitMaskImage: EDGE_MASK,
                WebkitMaskComposite: "source-in",
              }}
            >
              <motion.div
                className="absolute inset-0"
                style={{ opacity: foldedOpacity }}
              >
                <Image
                  src="/lab-assets/unfold/folded-1100.webp"
                  alt="The lamp folded flat: a slim aluminium bar with the graphite head lying along it."
                  fill
                  sizes="(min-width: 640px) 68rem, 100vw"
                  priority
                  className={compact ? "object-cover" : "object-contain"}
                />
              </motion.div>

              <motion.div
                className="absolute inset-0"
                style={{ opacity: sequenceOpacity }}
              >
                <UnfoldSequence
                  progress={scrub}
                  className={`h-full w-full ${compact ? "object-cover" : "object-contain"}`}
                />
              </motion.div>

              <motion.div
                className="absolute inset-0"
                style={{ opacity: litOpacity }}
              >
                <Image
                  src="/lab-assets/unfold/lit-1100.webp"
                  alt="The lamp open on a dark walnut desk, its strip lit and throwing a warm pool of light."
                  fill
                  sizes="(min-width: 640px) 68rem, 100vw"
                  className={compact ? "object-cover" : "object-contain"}
                />
                {/* Hue and saturation come from this layer, luminosity from the
                    photograph underneath, so moving the slider relights the
                    whole picture instead of tinting a rectangle over it. */}
                <motion.div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: light,
                    mixBlendMode: "color",
                    opacity: relightOpacity,
                  }}
                />
                <DimensionLines opacity={drawingOpacity} />
              </motion.div>
            </div>
          </motion.div>

          {/* Act 1 - the object, closed. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[10%] px-6 text-center"
            style={{ opacity: closedOpacity }}
          >
            <motion.h1
              className="text-[clamp(3.2rem,13vw,9rem)] leading-[0.86] font-semibold tracking-[-0.045em]"
              style={{ color: headingColour }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.1,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
            >
              Unfold
            </motion.h1>
            <motion.p
              className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-balance"
              style={{ color: bodyColour }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.24,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
            >
              A desk light that folds down to the size of a pencil case.
            </motion.p>
            <Readout
              onDark={onDark}
              className="mt-7 justify-center"
              items={["320 mm closed", "340 g", "aluminium"]}
            />
          </motion.div>

          {/* Act 2 - one line, and how far open the thing in front of you is. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[13%] px-6 text-center"
            style={{ opacity: unfoldOpacity }}
          >
            {/* The room goes from a white studio to an unlit desk underneath
                this line, so it cannot be one fixed colour: dark ink stayed
                dark and vanished into the photograph halfway through. */}
            <motion.h2
              className="mx-auto max-w-2xl text-[clamp(1.9rem,5.2vw,3.4rem)] leading-[1.06] font-medium tracking-[-0.03em] text-balance"
              style={{ color: headingColour }}
            >
              One hinge, and it is already a lamp.
            </motion.h2>
            <Readout
              onDark={onDark}
              className="mt-6 justify-center"
              items={[<OpenPercent key="open" scrub={scrub} />, "one moving part"]}
            />
          </motion.div>

          {/* Act 3 - the room has changed, so the copy moves off centre. */}
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-end px-6 pb-28 sm:items-center sm:px-12 sm:pb-0"
            style={{ opacity: lightOpacity }}
          >
            <div className="w-full sm:max-w-md">
              <h2
                className="text-[clamp(1.9rem,5vw,3.2rem)] leading-[1.06] font-medium tracking-[-0.03em] text-balance"
                style={{ color: "#f4f1ea" }}
              >
                Then the room changes.
              </h2>
              <p
                className="mt-5 max-w-sm leading-relaxed"
                style={{ color: "#a49e93" }}
              >
                2,200 lumens off a single strip, aimed at the desk and nowhere
                else. Nobody sitting opposite you gets it in the eyes.
              </p>
              <Readout
                onDark={onDark}
                className="mt-7"
                items={["2200 lm", "CRI 97", "no flicker"]}
              />
            </div>
          </motion.div>

          {/* Act 4 - the only thing on the page you touch. */}
          <motion.div
            className="absolute inset-0 flex items-end justify-end px-6 pb-24 sm:items-center sm:px-12 sm:pb-0"
            style={{ opacity: warmthOpacity, pointerEvents: "none" }}
          >
            <div
              className="w-full sm:max-w-sm"
              style={{ pointerEvents: "auto" }}
            >
              <h2
                className="text-[clamp(1.9rem,5vw,3.2rem)] leading-[1.06] font-medium tracking-[-0.03em] text-balance"
                style={{ color: "#f4f1ea" }}
              >
                Warm to work by. Cool to read by.
              </h2>
              <p className="mt-5 leading-relaxed" style={{ color: "#a49e93" }}>
                Move the slider. The light changes, and so does everything it
                lands on.
              </p>
              <TemperatureControl
                kelvin={kelvin}
                onChange={setKelvin}
                light={light}
              />
            </div>
          </motion.div>

          {/* Act 5 - quiet, centred, nothing but measurements. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[8%] px-6 text-center"
            style={{ opacity: drawingOpacity }}
          >
            <h2
              className="mx-auto max-w-xl text-[clamp(1.7rem,4.4vw,2.8rem)] leading-[1.1] font-medium tracking-[-0.03em] text-balance"
              style={{ color: "#f4f1ea" }}
            >
              Folded, it is a 320 mm bar.
            </h2>
            <p
              className="mx-auto mt-5 max-w-md leading-relaxed"
              style={{ color: "#a49e93" }}
            >
              Open, the head sits 280 mm above the desk and stays there on
              friction, with no knob to tighten.
            </p>
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
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#f4f1ea] px-7 text-[0.95rem] font-medium text-[#080704] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ffc489]"
            >
              Pre-order
            </a>
          </div>

          <p className="mt-16 max-w-xl text-sm leading-relaxed text-[#8d887e]">
            Unfold is not a real product and none of it is for sale. The lamp
            was generated; the page is the point. One photograph unfolds as you
            scroll, the stills on either side of it are the same shot in a
            different state, and the slider relights the picture rather than
            swapping to a second one.
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
      className="fixed inset-x-0 top-0 z-20 border-b"
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
  items: ReactNode[];
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
        <li key={i} className="flex items-center gap-3">
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
 * How far open the picture in front of you is, written straight into the DOM.
 *
 * The obvious version holds this in React state, and that is what broke the
 * page: a `setState` on every scroll tick re-rendered the whole demo, and each
 * re-render restarted the opacity animations on the three stacked photographs,
 * so two of them sat half-visible at once. A motion value written to
 * `textContent` never re-renders anything.
 *
 * It reports a percentage rather than an angle because frame index over frame
 * count is exactly true, while degrees would be a guess: the clip's motion is
 * eased and nobody measured the arm in each frame.
 */
function OpenPercent({ scrub }: { scrub: MotionValue<number> }) {
  const node = useRef<HTMLSpanElement>(null);

  useMotionValueEvent(scrub, "change", (value) => {
    const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
    if (node.current) node.current.textContent = `open ${percent}%`;
  });

  return <span ref={node}>open 0%</span>;
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
  box-shadow: 0 0 0 3px #f4f1ea, 0 0 18px var(--unfold-thumb);
}
.unfold-range:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 3px #f4f1ea, 0 0 18px var(--unfold-thumb);
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
        style={{ "--unfold-thumb": light } as CSSProperties}
      />

      <div className="mt-1 flex justify-between font-mono text-[0.6875rem] tracking-[0.06em] text-[#8d887e] uppercase">
        <span>2700 K warm</span>
        <span>5000 K daylight</span>
      </div>
    </div>
  );
}

const RULE = "rgba(244,241,234,0.55)";

/**
 * Measurements drawn over the photograph in the last act. Positions are
 * fractions of the frame, matched to where the lamp sits in the shot. Labels
 * are sized in rem rather than against the frame, so they stay legible at
 * 390px where the picture is a third of its desktop width.
 */
function DimensionLines({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ opacity }}
    >
      {/* the folded length, bracketed under the base */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: "9%",
          width: "46%",
          top: "83%",
          height: "5%",
          borderLeft: `1px solid ${RULE}`,
          borderRight: `1px solid ${RULE}`,
          borderBottom: `1px solid ${RULE}`,
        }}
      >
        <span
          className="absolute font-mono text-[0.7rem] tracking-[0.08em] whitespace-nowrap"
          style={{
            color: "#e6e1d8",
            background: PAGE_DARK,
            padding: "0 0.4rem",
          }}
        >
          320 mm
        </span>
      </div>

      {/* the open height, bracketed up the right-hand side */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          right: "5%",
          width: "4%",
          top: "10%",
          height: "75%",
          borderTop: `1px solid ${RULE}`,
          borderRight: `1px solid ${RULE}`,
          borderBottom: `1px solid ${RULE}`,
        }}
      >
        <span
          className="absolute right-full font-mono text-[0.7rem] tracking-[0.08em] whitespace-nowrap"
          style={{
            color: "#e6e1d8",
            background: PAGE_DARK,
            padding: "0 0.4rem",
          }}
        >
          280 mm
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
