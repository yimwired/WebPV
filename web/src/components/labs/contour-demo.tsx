"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { PACKS } from "./contour-scene";
import { cn } from "@/lib/utils";

const ContourScene = dynamic(() => import("./contour-scene"), {
  ssr: false,
  loading: () => null,
});

/**
 * Published figures for Coca-Cola Original Taste: 10.6 g of sugar and 42 kcal
 * per 100 ml, carried through to each pack size sold in Thailand.
 */
interface Facts {
  kcal: number;
  sugar: number;
  line: string;
  serves: string;
}

const FACTS: Record<string, Facts> = {
  can: {
    kcal: 137,
    sugar: 34,
    serves: "One person, cold, gone in ten minutes",
    line: "The format that has to survive a cooler, a vending slot and a bare hand. Aluminium takes the chill fastest and gives the shelf its wall of red.",
  },
  bottle: {
    kcal: 214,
    sugar: 54,
    serves: "One person, resealable",
    line: "The contour carried into PET. The waist is the reason you can name the brand from a silhouette across the street, so the label sits below it and leaves the shape alone.",
  },
  magnum: {
    kcal: 525,
    sugar: 132,
    serves: "Four glasses at a table",
    line: "The sharing size keeps the same 28 mm neck as the 510, so one cap tools both lines. The body grows, the finish does not.",
  },
};

/** The claims that fly in over the pack while it is turned around. */
const CALLOUTS: Record<string, { title: string; body: string }[]> = {
  can: [
    {
      title: "Two minutes to cold",
      body: "Aluminium moves heat about a thousand times faster than PET, which is why the can is the format vending machines were built around.",
    },
    {
      title: "Printed, not stuck on",
      body: "The artwork is cured straight onto the barrel, so there is no label edge to lift when the can sweats in a cooler.",
    },
  ],
  bottle: [
    {
      title: "The waist does the work",
      body: "Take the colour away and the silhouette still reads. That is the whole argument for keeping the label clear of the contour.",
    },
    {
      title: "Opens twice",
      body: "The screw finish is what separates this from the can: the same drink, sold to someone who is not going to finish it standing up.",
    },
  ],
  magnum: [
    {
      title: "One cap, two bottles",
      body: "The neck stays at 28 mm whatever the body does, so the sharing size runs down the same capping line as the 510.",
    },
    {
      title: "Priced by the table",
      body: "At 132 g of sugar this is never a single serve. The pack has to look like something you put in the middle, not something you hold.",
    },
  ],
};

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
function useActOpacity(
  progress: MotionValue<number>,
  a: number,
  b: number,
  c: number,
  d: number
) {
  return useTransform(progress, [a, b, c, d], [0, 1, 1, 0]);
}

export function ContourDemo({
  scriptClass,
  scriptFamily,
}: {
  /** applied to the wordmark, which is also what makes next/font fetch the face */
  scriptClass: string;
  /** the same family, as a string the canvas label painter can use */
  scriptFamily: string;
}) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const compact = useMediaQuery("(max-width: 639px)");

  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  // The scene reads scroll through a ref and never through state: routing it
  // through React would re-render three lathed packs on every wheel event.
  const progress = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    progress.current = value;
  });

  const step = useCallback((delta: number) => {
    setActive((current) => (current + delta + PACKS.length) % PACKS.length);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const pack = PACKS[active];
  const facts = FACTS[pack.id];
  const callouts = CALLOUTS[pack.id];

  const familyOpacity = useActOpacity(scrollYProgress, 0, 0.02, 0.17, 0.27);
  const focusOpacity = useActOpacity(scrollYProgress, 0.28, 0.38, 0.48, 0.57);
  const detailOpacity = useActOpacity(scrollYProgress, 0.57, 0.66, 0.73, 0.8);
  const lineupOpacity = useTransform(
    scrollYProgress,
    [0.8, 0.89, 1],
    [0, 1, 1]
  );
  // the picker belongs to the two acts that are about one pack at a time
  const pickerOpacity = useActOpacity(scrollYProgress, 0.26, 0.36, 0.74, 0.82);

  // warm set for the family shots, a deep red room for the close work
  const warmOpacity = useTransform(
    scrollYProgress,
    [0.18, 0.34, 0.72, 0.86],
    [1, 0, 0, 1]
  );

  return (
    <div ref={container} className="relative h-[460vh] bg-[#150002]">
      <div className="sticky top-0 h-dvh overflow-hidden text-white">
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(75% 55% at 50% 42%, #c11119 0%, #7a0409 42%, #2c0104 78%, #150002 100%)",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{
            opacity: warmOpacity,
            background:
              "radial-gradient(78% 60% at 50% 46%, #f7ded2 0%, #e9b8a8 34%, #b06a63 66%, #3b1418 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent 0 22px, rgba(255,255,255,0.5) 22px 23px)",
          }}
        />

        <div className="absolute inset-0">
          <ContourScene
            progress={progress}
            active={active}
            compact={compact}
            float={!reduced}
            scriptFamily={scriptFamily}
          />
        </div>

        <header className="pointer-events-none relative z-20 flex items-center justify-between px-6 pt-7 sm:px-10">
          <span className={cn(scriptClass, "text-2xl leading-none sm:text-3xl")}>
            Coca-Cola
          </span>
          <span className="rounded-full border border-white/25 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70 mix-blend-difference">
            Concept study
          </span>
        </header>

        {/* ── act one: the family on its plinth ── */}
        <motion.div
          style={{ opacity: familyOpacity }}
          className="pointer-events-none absolute inset-x-0 top-[15vh] z-20 px-6 text-center sm:top-[18vh] sm:px-10"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/45">
            Original Taste
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight text-black/85 sm:text-5xl">
            One drink, three ways to hold it
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-black/55">
            The same 10.6 grams of sugar per 100 ml, tooled three ways for three
            different moments. Scroll to take each one apart.
          </p>
        </motion.div>

        {/* ── act two: one pack, filling the frame ── */}
        <motion.div
          style={{ opacity: focusOpacity }}
          className="pointer-events-none absolute inset-x-0 top-[11vh] z-20 px-6 sm:top-auto sm:bottom-[16vh] sm:px-10"
        >
          <div className="max-w-xs sm:max-w-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/55">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(PACKS.length).padStart(2, "0")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              {pack.name}
            </h2>
            <p className="mt-1 text-lg text-white/70 sm:text-xl">
              {pack.volume}
            </p>
            <p className="mt-5 text-sm leading-relaxed text-white/65">
              {facts.line}
            </p>

            <dl className="mt-6 flex gap-6">
              {[
                { label: "Energy", value: `${facts.kcal} kcal` },
                { label: "Sugar", value: `${facts.sugar} g` },
                { label: "Height", value: `${pack.heightMm} mm` },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-base font-medium tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] text-white/40">{facts.serves}</p>
          </div>
        </motion.div>

        {/* ── act three: claims pinned to the pack while it turns ── */}
        <motion.div
          style={{ opacity: detailOpacity }}
          className="pointer-events-none absolute inset-0 z-20"
        >
          {callouts.map((callout, i) => (
            <div
              key={callout.title}
              className={cn(
                "absolute w-52 rounded-xl border border-white/15 bg-black/70 p-4 backdrop-blur-md sm:w-64",
                i === 0
                  ? "left-5 top-[16vh] sm:left-[4vw] sm:top-[24vh]"
                  : "right-5 bottom-[22vh] sm:right-[4vw] sm:bottom-[20vh]"
              )}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm font-semibold leading-snug">
                {callout.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                {callout.body}
              </p>
            </div>
          ))}
        </motion.div>

        {/* ── act four: the range, at true scale ── */}
        <motion.div
          style={{ opacity: lineupOpacity }}
          className="pointer-events-none absolute inset-x-0 top-[14vh] z-20 px-6 text-center sm:px-10"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-black/85 sm:text-5xl">
            The range, to scale
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-black/55">
            Every other view reframes each pack to fill the screen. This is the
            only one where they are measured against each other.
          </p>
          <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-black/45 tabular-nums">
            {PACKS.map((p) => `${p.volume} · ${p.heightMm} mm`).join("   /   ")}
          </p>
        </motion.div>

        {/* the format picker, right rail, like the reference */}
        <motion.div
          style={{ opacity: pickerOpacity }}
          className="absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 sm:right-7"
        >
          {PACKS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${p.name}, ${p.volume}`}
              aria-current={i === active}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full border text-[9px] font-medium tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                i === active
                  ? "border-white bg-white text-neutral-900"
                  : "border-white/30 text-white/60 hover:border-white/60 hover:text-white"
              )}
            >
              {p.volume.replace(" ml", "").replace(" L", "L")}
            </button>
          ))}
        </motion.div>

        <motion.p
          style={{ opacity: familyOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-24 z-20 text-center text-[10px] uppercase tracking-[0.3em] text-black/40"
        >
          Scroll
        </motion.p>

        {/* Not optional. The page borrows a real brand to make a point about
            craft, and it has to say so where nobody can miss it. */}
        <p className="absolute inset-x-0 bottom-[4.5rem] z-20 px-6 text-center text-[9px] leading-relaxed text-white/30 mix-blend-difference sm:px-10 sm:text-[10px]">
          Unofficial concept, made as a portfolio study. Not affiliated with, or
          endorsed by, The Coca-Cola Company. Coca-Cola is their trademark.
          Every model and label here was generated in the browser for this demo.
        </p>
      </div>
    </div>
  );
}
