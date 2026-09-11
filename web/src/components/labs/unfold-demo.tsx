"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { UnfoldSequence, type FrameSample } from "./unfold-sequence";
import { kelvinToRgb } from "./unfold-light";

/**
 * A launch page for one physical object, in the shape the big hardware pages
 * use: a single continuous shot where scroll position moves the product and
 * the copy arrives when the product reaches the state it describes.
 *
 * The photograph fills the screen. Three earlier versions floated it in a box
 * and tried to make the page around it disappear - matching the background to
 * a corner pixel, feathering the edges, spreading a blurred copy behind it -
 * and every one drew either a rectangle or a halo, because a photograph cannot
 * dissolve into a flat colour. Full bleed has no edge to hide.
 *
 * What that costs is that the copy sits on the picture, and the picture goes
 * from a white studio to an unlit desk partway through. So each block takes
 * its ink from a reading of the region it is actually sitting on, and carries
 * a soft wash in the opposite direction. Neither is tied to a scroll position,
 * so neither can disagree with what is on screen.
 *
 * The product is fictional and nothing here is for sale. The page says so.
 */

/** Where each act starts and ends, as a fraction of the pinned scroll. */
const ACTS = {
  closed: [0.0, 0.03, 0.12, 0.17],
  unfold: [0.18, 0.21, 0.3, 0.35],
  light: [0.44, 0.49, 0.56, 0.61],
  warmth: [0.63, 0.68, 0.76, 0.81],
  drawing: [0.83, 0.88, 0.96, 1.0],
} as const;

/** The sequence scrubs across this range: folded, room darkens, light on. */
const SCRUB = [0.14, 0.42] as const;

/** Ink pairs: [on a light picture, on a dark one]. */
const HEADING = ["#14130f", "#f6f4ef"] as const;
const BODY = ["#4c4941", "#c3bdb2"] as const;
const QUIET = ["#65615a", "#a8a29a"] as const;

/** Until the first frame is decoded there is nothing to sample. */
const PAGE_BASE = "#f3f1ed";

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

/** 0 below `from`, 1 above `to`, linear in between. */
function ramp(value: number, from: number, to: number) {
  return Math.min(1, Math.max(0, (value - from) / (to - from)));
}

/** Fades a block in over [a, b] and back out over [c, d]. */
function useAct(progress: MotionValue<number>, act: readonly number[]) {
  return useTransform(progress, [...act], [0, 1, 1, 0]);
}

/** Picks one of a colour pair by how dark the picture under it is. */
function useInk(dark: MotionValue<number>, pair: readonly [string, string]) {
  return useTransform(dark, [0, 1], [pair[0], pair[1]]);
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
  // NATIVE_KELVIN, so near that value the overlay should do almost nothing; a
  // flat blend at full strength turned the graphite head gold and flattened
  // the picture into one colour.
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

  // ── ink, read off the region each block is sitting on ──────────────────
  const inkTop = useMotionValue(0);
  const inkBottom = useMotionValue(0);
  const inkLeft = useMotionValue(0);
  const inkRight = useMotionValue(0);
  const pageBase = useMotionValue(PAGE_BASE);

  const takeSample = useCallback(
    (sample: FrameSample) => {
      // A fast flip rather than a fade. Ink crossing the midpoint at the same
      // moment as the picture under it measured 2.39:1 at the crossover, and
      // no choice of endpoint colours fixes that.
      inkTop.set(1 - ramp(sample.top.luma, 0.22, 0.42));
      inkBottom.set(1 - ramp(sample.bottom.luma, 0.22, 0.42));
      inkLeft.set(1 - ramp(sample.left.luma, 0.22, 0.42));
      inkRight.set(1 - ramp(sample.right.luma, 0.22, 0.42));

      // Only the phone shows page beside the picture, and only below it, so
      // the bottom of the frame is the colour that has to continue.
      const [r, g, b] = sample.bottom.rgb;
      pageBase.set(`rgb(${r} ${g} ${b})`);
    },
    [inkTop, inkBottom, inkLeft, inkRight, pageBase]
  );

  const headingTop = useInk(inkTop, HEADING);
  const bodyTop = useInk(inkTop, BODY);
  const headingBottom = useInk(inkBottom, HEADING);
  const headingLeft = useInk(inkLeft, HEADING);
  const bodyLeft = useInk(inkLeft, BODY);
  const headingRight = useInk(inkRight, HEADING);
  const bodyRight = useInk(inkRight, BODY);

  const phoneFade = useTransform(
    pageBase,
    (c) => `linear-gradient(to bottom, transparent, ${c})`
  );

  // ── how the frame is composed, act by act ──────────────────────────────
  // Scale never drops below 1: the picture covers the stage, and anything
  // smaller would put an edge back on screen.
  const FRAME_AT = [0, 0.16, 0.36, 0.5, 0.68, 0.84];
  const restingScale = useMotionValue(1);
  const sweptScale = useTransform(
    scrollYProgress,
    FRAME_AT,
    compact ? [1, 1, 1, 1, 1, 1] : [1, 1, 1, 1.02, 1.05, 1.02]
  );
  const frameScale = reduced ? restingScale : sweptScale;

  // Covering a screen this wide with a 16:9 frame crops top and bottom, and
  // which part gets cropped is the only framing control left. Act one pulls
  // the folded lamp down out from under the headline; the later acts sit the
  // desk lower so the copy has the dark upper half of the room to itself.
  const restingPosition = useMotionValue("50% 45%");
  const sweptPosition = useTransform(
    scrollYProgress,
    FRAME_AT,
    compact
      ? ["50% 50%", "50% 50%", "50% 50%", "50% 50%", "50% 50%", "50% 50%"]
      : ["50% 4%", "50% 10%", "50% 40%", "50% 62%", "50% 66%", "50% 52%"]
  );
  const framePosition = reduced ? restingPosition : sweptPosition;

  const closedOpacity = useAct(scrollYProgress, ACTS.closed);
  const unfoldOpacity = useAct(scrollYProgress, ACTS.unfold);
  const lightOpacity = useAct(scrollYProgress, ACTS.light);
  const warmthOpacity = useAct(scrollYProgress, ACTS.warmth);
  const drawingOpacity = useAct(scrollYProgress, ACTS.drawing);
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

  /** On a phone the picture takes the top of the screen, not all of it. */
  const mediaClass = compact
    ? "absolute inset-x-0 top-0 h-[58%]"
    : "absolute inset-0";

  return (
    <motion.div className="relative" style={{ background: pageBase }}>
      <TopBar ink={inkTop} />

      {/* ─── the pinned stage: five acts on one continuous shot ─── */}
      <section ref={stage} className="relative h-[600vh]">
        <div className="sticky top-0 h-dvh overflow-hidden">
          {/* The three layers share one frame, so cross-fading between them
              reads as the same photograph changing state. On a phone the shot
              is too wide to cover a portrait screen without cutting the lamp
              in half, so it takes the top and hands the rest to the copy. */}
          <motion.div
            data-unfold="frame"
            className={mediaClass}
            style={{ scale: frameScale }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ opacity: foldedOpacity }}
            >
              <Image
                src="/lab-assets/unfold/folded-1100.webp"
                alt="The lamp folded flat: a slim aluminium bar with the graphite head lying along it."
                fill
                sizes="100vw"
                priority
                className="object-cover"
                style={{ objectPosition: framePosition as unknown as string }}
              />
            </motion.div>

            <motion.div
              className="absolute inset-0"
              style={{ opacity: sequenceOpacity }}
            >
              <UnfoldSequence
                progress={scrub}
                onSample={takeSample}
                position={framePosition}
                className="h-full w-full object-cover"
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
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: framePosition as unknown as string }}
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
              <DimensionLines opacity={drawingOpacity} ink={inkRight} />
            </motion.div>

            {/* Where the picture meets the copy on a phone it continues into
                the page rather than stopping at a line. The colour it fades to
                is read off the bottom of the frame, so it is the same colour
                and not an approximation of it. */}
            {compact && (
              <motion.div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[24%]"
                style={{ backgroundImage: phoneFade }}
              />
            )}
          </motion.div>

          {/* Act 1 - the object, closed. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[7%] px-6 text-center sm:top-[9%]"
            style={{ opacity: closedOpacity }}
          >
            <Scrim ink={inkTop} from="top" />
            <motion.h1
              className="relative text-[clamp(3rem,12vw,8.5rem)] leading-[0.86] font-semibold tracking-[-0.045em]"
              style={{ color: headingTop }}
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
              className="relative mx-auto mt-5 max-w-md text-lg leading-relaxed text-balance"
              style={{ color: bodyTop }}
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
              ink={inkTop}
              className="relative mt-7 justify-center"
              // two, not three: at 1920 the third ran onto the lamp, which
              // fills the right half of the frame at this crop
              items={["320 mm closed", "340 g"]}
            />
          </motion.div>

          {/* Act 2 - one line, and how far open the thing in front of you is. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[11%] px-6 text-center"
            style={{ opacity: unfoldOpacity }}
          >
            <Scrim ink={inkBottom} from="bottom" />
            <motion.h2
              className="relative mx-auto max-w-2xl text-[clamp(1.8rem,5vw,3.2rem)] leading-[1.06] font-medium tracking-[-0.03em] text-balance"
              style={{ color: headingBottom }}
            >
              One hinge, and it is already a lamp.
            </motion.h2>
            <Readout
              ink={inkBottom}
              className="relative mt-6 justify-center"
              items={[
                <OpenPercent key="open" scrub={scrub} />,
                "one moving part",
              ]}
            />
          </motion.div>

          {/* Act 3 - the room has changed, so the copy moves off centre. */}
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-end px-6 pb-[8%] sm:items-center sm:px-12 sm:pb-0"
            style={{ opacity: lightOpacity }}
          >
            <Scrim ink={inkLeft} from={compact ? "bottom" : "left"} />
            <div className="relative w-full sm:max-w-md">
              <motion.h2
                className="text-[clamp(1.8rem,4.8vw,3rem)] leading-[1.06] font-medium tracking-[-0.03em] text-balance"
                style={{ color: headingLeft }}
              >
                Then the room changes.
              </motion.h2>
              <motion.p
                className="mt-5 max-w-sm leading-relaxed"
                style={{ color: bodyLeft }}
              >
                2,200 lumens off a single strip, aimed at the desk and nowhere
                else. Nobody sitting opposite you gets it in the eyes.
              </motion.p>
              <Readout
                ink={inkLeft}
                className="mt-7"
                items={["2200 lm", "CRI 97", "no flicker"]}
              />
            </div>
          </motion.div>

          {/* Act 4 - the only thing on the page you touch. */}
          <motion.div
            className="absolute inset-0 flex items-end justify-end px-6 pb-[7%] sm:items-center sm:px-12 sm:pb-0"
            style={{ opacity: warmthOpacity, pointerEvents: "none" }}
          >
            <Scrim ink={inkRight} from={compact ? "bottom" : "right"} />
            <div
              className="relative w-full sm:max-w-sm"
              style={{ pointerEvents: "auto" }}
            >
              <motion.h2
                className="text-[clamp(1.8rem,4.8vw,3rem)] leading-[1.06] font-medium tracking-[-0.03em] text-balance"
                style={{ color: headingRight }}
              >
                Warm to work by. Cool to read by.
              </motion.h2>
              <motion.p
                className="mt-5 leading-relaxed"
                style={{ color: bodyRight }}
              >
                Move the slider. The light changes, and so does everything it
                lands on.
              </motion.p>
              <TemperatureControl
                kelvin={kelvin}
                onChange={setKelvin}
                light={light}
                ink={inkRight}
              />
            </div>
          </motion.div>

          {/* Act 5 - quiet, centred, nothing but measurements. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[8%] px-6 text-center"
            style={{ opacity: drawingOpacity }}
          >
            <Scrim ink={inkTop} from="top" />
            <motion.h2
              className="relative mx-auto max-w-xl text-[clamp(1.6rem,4.2vw,2.6rem)] leading-[1.1] font-medium tracking-[-0.03em] text-balance"
              style={{ color: headingTop }}
            >
              Folded, it is a 320 mm bar.
            </motion.h2>
            <motion.p
              className="relative mx-auto mt-5 max-w-md leading-relaxed"
              style={{ color: bodyTop }}
            >
              Open, the head sits 280 mm above the desk and stays there on
              friction, with no knob to tighten.
            </motion.p>
          </motion.div>

          <ScrollHint hidden={scrolled} ink={inkBottom} />
        </div>
      </section>

      {/* ─── after the pin: a plain list, because a spec sheet is a list ─── */}
      <section className="relative bg-[#080704] px-6 pt-24 pb-28 sm:px-12 sm:pt-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[clamp(1.7rem,4.4vw,2.6rem)] leading-[1.1] font-medium tracking-[-0.03em] text-[#f6f4ef]">
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

/**
 * A soft wash under a block of copy, running in the opposite direction to its
 * ink.
 *
 * Picking the right ink for the picture is not always enough on its own: the
 * lit shot has a bright pool of light in it, and a block that lands on the
 * pool needs help no colour choice provides. The gradient has no edge and no
 * box, so it reads as the room falling off rather than as a panel.
 */
function Scrim({
  ink,
  from,
}: {
  ink: MotionValue<number>;
  from: "top" | "bottom" | "left" | "right";
}) {
  const direction = {
    top: "to bottom",
    bottom: "to top",
    left: "to right",
    right: "to left",
  }[from];

  const wash = useTransform(ink, (dark) => {
    const base = dark > 0.5 ? "0 0 0" : "255 255 255";
    return `linear-gradient(${direction}, rgb(${base} / 0.6), rgb(${base} / 0.26) 45%, transparent 78%)`;
  });

  // Stretched well past the copy so the fade finishes off screen rather than
  // ending somewhere a viewer can see it end.
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute -inset-x-[14%] -inset-y-[55%] -z-10"
      style={{ backgroundImage: wash }}
    />
  );
}

/** Back to the gallery, plus the wordmark, in the manner of a product page. */
function TopBar({ ink }: { ink: MotionValue<number> }) {
  const colour = useInk(ink, QUIET);
  const border = useTransform(
    ink,
    [0, 1],
    ["rgba(20,19,15,0.12)", "rgba(246,244,239,0.14)"]
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
  ink,
  className = "",
}: {
  items: ReactNode[];
  ink: MotionValue<number>;
  className?: string;
}) {
  const colour = useInk(ink, QUIET);
  const rule = useTransform(
    ink,
    [0, 1],
    ["rgba(20,19,15,0.22)", "rgba(246,244,239,0.24)"]
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
 * page once already: a `setState` on every scroll tick re-rendered the whole
 * demo, and each re-render restarted the opacity animations on the three
 * stacked photographs, so two of them sat half-visible at once.
 *
 * It reports a percentage rather than an angle because frame index over frame
 * count is exactly true, while degrees would be a guess.
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
  ink,
}: {
  kelvin: number;
  onChange: (value: number) => void;
  light: string;
  ink: MotionValue<number>;
}) {
  const label = useInk(ink, QUIET);

  return (
    <div className="mt-9">
      {/* Scoped to the lab. The site's globals.css is its design system and a
          style study has no business adding to it. */}
      <style>{RANGE_CSS}</style>

      <div className="flex items-baseline justify-between">
        <motion.label
          htmlFor="unfold-kelvin"
          className="font-mono text-[0.6875rem] tracking-[0.06em] uppercase"
          style={{ color: label }}
        >
          Colour temperature
        </motion.label>
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

      <motion.div
        className="mt-1 flex justify-between font-mono text-[0.6875rem] tracking-[0.06em] uppercase"
        style={{ color: label }}
      >
        <span>2700 K warm</span>
        <span>5000 K daylight</span>
      </motion.div>
    </div>
  );
}

/**
 * Measurements drawn over the photograph in the last act. Positions are
 * fractions of the frame, matched to where the lamp sits in the shot. Hidden
 * on a phone, where the frame is cropped and the brackets would point at the
 * wrong part of the lamp.
 */
function DimensionLines({
  opacity,
  ink,
}: {
  opacity: MotionValue<number>;
  ink: MotionValue<number>;
}) {
  const rule = useTransform(
    ink,
    [0, 1],
    ["rgba(20,19,15,0.5)", "rgba(246,244,239,0.5)"]
  );
  const label = useInk(ink, ["#14130f", "#e6e1d8"]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden sm:block"
      style={{ opacity }}
    >
      <Bracket
        rule={rule}
        label={label}
        text="320 mm"
        sides="horizontal"
        style={{ left: "16%", width: "34%", top: "76%", height: "5%" }}
      />
      <Bracket
        rule={rule}
        label={label}
        text="280 mm"
        sides="vertical"
        style={{ right: "12%", width: "4%", top: "18%", height: "60%" }}
      />
    </motion.div>
  );
}

function Bracket({
  rule,
  label,
  text,
  style,
  sides,
}: {
  rule: MotionValue<string>;
  label: MotionValue<string>;
  text: string;
  style: CSSProperties;
  sides: "horizontal" | "vertical";
}) {
  const edges =
    sides === "horizontal"
      ? { borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1 }
      : { borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1 };

  return (
    <motion.div
      className="absolute flex items-center justify-center"
      style={{ ...style, ...edges, borderStyle: "solid", borderColor: rule }}
    >
      <motion.span
        className={`absolute font-mono text-[0.7rem] tracking-[0.08em] whitespace-nowrap ${
          sides === "vertical" ? "right-full pr-2" : "px-2"
        }`}
        style={{ color: label }}
      >
        {text}
      </motion.span>
    </motion.div>
  );
}

/** Present until the first scroll, then gone for good. */
function ScrollHint({
  hidden,
  ink,
}: {
  hidden: boolean;
  ink: MotionValue<number>;
}) {
  const colour = useInk(ink, QUIET);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-7 flex justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.5, delay: hidden ? 0 : 1.4 }}
    >
      <motion.span
        className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase"
        style={{ color: colour }}
      >
        Scroll
      </motion.span>
    </motion.div>
  );
}
