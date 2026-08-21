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
import { contourCopy } from "@/lib/contour-copy";
import { useLocale } from "@/lib/i18n";
import { thaiWrap } from "@/lib/thai-text";
import { cn } from "@/lib/utils";

const ContourScene = dynamic(() => import("./contour-scene"), {
  ssr: false,
  loading: () => null,
});

/**
 * Published figures for Coca-Cola Original Taste: 10.6 g of sugar and 42 kcal
 * per 100 ml, carried through to each pack size. Numbers live apart from the
 * copy because they read the same in either language.
 */
const NUMBERS: Record<string, { kcal: number; sugar: number }> = {
  can: { kcal: 137, sugar: 34 },
  bottle: { kcal: 214, sugar: 54 },
  magnum: { kcal: 525, sugar: 132 },
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
  const { locale, setLocale } = useLocale();

  const copy = contourCopy[locale];
  // Thai has no spaces, so display sizes need explicit break opportunities
  const display = (text: string) => (locale === "th" ? thaiWrap(text) : text);

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
  const packCopy = copy.packs[pack.id];
  const numbers = NUMBERS[pack.id];

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
        <div
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

        <header className="relative z-30 flex items-center justify-between px-6 pt-7 sm:px-10">
          <span
            className={cn(
              scriptClass,
              "pointer-events-none text-2xl leading-none sm:text-3xl"
            )}
          >
            Coca-Cola
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "th" : "en")}
              aria-label={
                locale === "en" ? "อ่านเป็นภาษาไทย" : "Read this in English"
              }
              className="rounded-full border border-white/25 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {locale === "en" ? "ไทย" : "EN"}
            </button>
            <span className="pointer-events-none rounded-full border border-white/25 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70 mix-blend-difference">
              Concept study
            </span>
          </div>
        </header>

        {/* ── act one: the family on its plinth ── */}
        <motion.div
          style={{ opacity: familyOpacity }}
          className="pointer-events-none absolute inset-x-0 top-[15vh] z-20 px-6 text-center sm:top-[18vh] sm:px-10"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/80">
            {copy.eyebrow}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight text-black/85 sm:text-5xl">
            {display(copy.headline)}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-black/75">
            {copy.intro}
          </p>
        </motion.div>

        {/* ── act two: one pack, filling the frame ── */}
        <motion.div
          style={{ opacity: focusOpacity }}
          className="pointer-events-none absolute inset-x-0 top-[11vh] z-20 px-6 sm:top-auto sm:bottom-[16vh] sm:px-10"
        >
          <div className="max-w-xs sm:max-w-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/75">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(PACKS.length).padStart(2, "0")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              {display(packCopy.name)}
            </h2>
            <p className="mt-1 text-lg text-white/85 sm:text-xl">
              {pack.volume}
            </p>
            <p className="mt-5 text-sm leading-relaxed text-white/85">
              {packCopy.line}
            </p>

            <dl className="mt-6 flex gap-6">
              {[
                { label: copy.stats.energy, value: `${numbers.kcal} kcal` },
                { label: copy.stats.sugar, value: `${numbers.sugar} g` },
                { label: copy.stats.height, value: `${pack.heightMm} mm` },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-white/75">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-base font-medium tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] text-white/75">{packCopy.serves}</p>
          </div>
        </motion.div>

        {/* ── act three: claims pinned to the pack while it turns ── */}
        <motion.div
          style={{ opacity: detailOpacity }}
          className="pointer-events-none absolute inset-0 z-20"
        >
          {packCopy.callouts.map((callout, i) => (
            <div
              key={callout.title}
              className={cn(
                "absolute w-52 rounded-xl border border-white/15 bg-black/70 p-4 backdrop-blur-md sm:w-64",
                i === 0
                  ? "left-5 top-[16vh] sm:left-[4vw] sm:top-[24vh]"
                  : "right-5 bottom-[22vh] sm:right-[4vw] sm:bottom-[20vh]"
              )}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/75">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm font-semibold leading-snug">
                {callout.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/80">
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
            {display(copy.lineup.title)}
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-black/75">
            {copy.lineup.body}
          </p>
          <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-black/75 tabular-nums">
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
              aria-label={`${copy.packs[p.id].name}, ${p.volume}`}
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

        {/* Not optional. The page borrows a real brand to make a point about
            craft, and it has to say so where nobody can miss it. It carries its
            own plate rather than blending into the scene: at 9px, white/30 and
            mix-blend-difference measured 2.4:1 over the red, which is a notice
            nobody can read. Solid white on black/70 clears 9:1 over every act,
            light or dark, because the plate is ours and not the background's. */}
        <p className="absolute inset-x-4 bottom-[4.5rem] z-20 mx-auto max-w-3xl rounded-md bg-black/70 px-4 py-2 text-center text-[11px] leading-relaxed text-white sm:text-xs">
          {copy.disclaimer}
        </p>
      </div>
    </div>
  );
}
