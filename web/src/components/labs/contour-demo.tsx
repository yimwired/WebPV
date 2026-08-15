"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PACKS } from "./contour-scene";
import { cn } from "@/lib/utils";

const ease = [0.22, 0.61, 0.36, 1] as const;

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
  const pack = PACKS[active];
  const facts = FACTS[pack.id];

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

  const tallest = Math.max(...PACKS.map((p) => p.heightMm));

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#4a0206] text-white">
      {/* the set: a warm pool of light behind the pack, falling off to
          near-black at the corners so the product is the only bright thing */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(75% 55% at 50% 42%, #c11119 0%, #7a0409 42%, #2c0104 78%, #150002 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent 0 22px, rgba(255,255,255,0.5) 22px 23px)",
        }}
      />

      <header className="relative z-20 flex items-center justify-between px-6 pt-7 sm:px-10">
        <span className={cn(scriptClass, "text-2xl leading-none sm:text-3xl")}>
          Coca-Cola
        </span>
        <span className="rounded-full border border-white/25 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
          Concept study
        </span>
      </header>

      {/* the pack fills the page and everything else floats over it */}
      <div className="absolute inset-0 z-10">
        <ContourScene
          active={active}
          spin={!reduced}
          compact={compact}
          scriptFamily={scriptFamily}
        />
      </div>

      {/* Clicking the pack itself advances it. Hidden from assistive tech on
          purpose: the pager below already exposes every size as a real
          control, so announcing this would just be a second unlabelled copy. */}
      <div
        aria-hidden
        onClick={() => step(1)}
        className="absolute inset-0 z-10 cursor-pointer"
      />

      {/* pb clears the lab switcher, which is fixed over the bottom of every demo */}
      <div className="pointer-events-none relative z-20 mx-auto flex min-h-dvh max-w-7xl flex-col justify-between px-6 pb-36 pt-6 sm:px-10 sm:pb-32">
        {/* the copy owns the top of a phone screen and the left of a desktop
            one, and the pack is moved out of its way in each case */}
        <div className="flex flex-1 items-start pt-2 sm:items-center sm:pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: reduced ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -10 }}
              transition={{ duration: 0.42, ease }}
              className="max-w-xs sm:max-w-sm"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/55">
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(PACKS.length).padStart(2, "0")}
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                {pack.name}
              </h1>
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
            </motion.div>
          </AnimatePresence>
        </div>

        {/* true-scale silhouettes: the only place the three sizes are shown
            against each other, since the camera reframes each one on stage */}
        <div>
        <div className="pointer-events-auto flex items-end justify-between gap-6">
          <div className="flex items-end gap-3">
            {PACKS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${p.name}, ${p.volume}`}
                aria-current={i === active}
                className="flex flex-col items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                style={{ height: 74 }}
              >
                <span className="flex flex-1 items-end">
                  <span
                    className={cn(
                      "block w-3 rounded-sm transition-colors sm:w-4",
                      i === active ? "bg-white" : "bg-white/25"
                    )}
                    style={{ height: (p.heightMm / tallest) * 60 }}
                  />
                </span>
                <span
                  className={cn(
                    "text-[9px] tabular-nums transition-colors",
                    i === active ? "text-white" : "text-white/40"
                  )}
                >
                  {p.volume}
                </span>
              </button>
            ))}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous pack size"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next pack size"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Not optional. The page borrows a real brand to make a point about
            craft, and it has to say so where nobody can miss it. */}
        <p className="mt-6 max-w-3xl text-[9px] leading-relaxed text-white/35 sm:text-[10px]">
          Unofficial concept, made as a portfolio study. Not affiliated with, or
          endorsed by, The Coca-Cola Company. Coca-Cola is their trademark.
          Every model and label here was generated in the browser for this demo.
        </p>
        </div>
      </div>
    </main>
  );
}
