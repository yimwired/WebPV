"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { FINISHES, type Finish } from "./trine-scene";

const ease = [0.22, 0.61, 0.36, 1] as const;

const TrineScene = dynamic(() => import("./trine-scene"), {
  ssr: false,
  loading: () => null,
});

/**
 * Where the ring sits in the photograph, measured off the source frame.
 * The canvas is centred on that point and given room to turn without
 * clipping, so the 3D band lands exactly where the real one was.
 */
const RING = { x: 49.3, y: 39.7, size: 42 };

interface Combination {
  id: string;
  name: string;
  finishes: Finish[];
  price: number;
  note: string;
}

const byId = (id: string) => FINISHES.find((f) => f.id === id)!;

const COMBINATIONS: Combination[] = [
  {
    id: "trio",
    name: "The trio",
    finishes: FINISHES,
    price: 1980,
    note: "Rose, white and yellow, in the order they were first made.",
  },
  {
    id: "rose",
    name: "Rose only",
    finishes: [byId("rose"), byId("rose"), byId("rose")],
    price: 1840,
    note: "One metal, three bands. Warmest against most skin.",
  },
  {
    id: "white",
    name: "White only",
    finishes: [byId("white"), byId("white"), byId("white")],
    price: 1840,
    note: "The quietest of the three. Reads as steel until it catches light.",
  },
  {
    id: "pair",
    name: "Rose and white",
    finishes: [byId("rose"), byId("white"), byId("rose")],
    price: 1910,
    note: "A warm band either side of a cool one.",
  },
];

const SPEC = [
  { k: "Bands", v: "Three, interlaced" },
  { k: "Width", v: "3.6 mm each" },
  { k: "Weight", v: "9.4 g in size 52" },
  { k: "Metal", v: "18k, 750 parts per thousand" },
  { k: "Sizes", v: "46 to 62, half sizes on request" },
  { k: "Made in", v: "Bangkok, to order" },
];

const CHAPTERS = [
  {
    n: "01",
    h: "Three bands, one movement",
    p: "The bands are not soldered. Each turns against the other two, which is why the ring never sits the same way twice on a hand. It is also the hardest part to make: the tolerance between them is a tenth of a millimetre, and a tenth either way is the difference between a ring that moves and one that grinds.",
  },
  {
    n: "02",
    h: "Cast, then cut",
    p: "Each band is cast, then turned on a lathe until the wall is even to within 0.05 mm. The finish comes last, from a felt wheel rather than a chemical bath, so the surface keeps a direction to it. Hold it under a lamp and you can see which way the wheel went.",
  },
  {
    n: "03",
    h: "It will mark",
    p: "18k gold is soft on purpose. Within a month the ring carries the marks of whatever you do with your hands, and it keeps them. We do not polish that away at service unless you ask, because it is the part of the object that becomes yours.",
  },
];

export function TrineDemo({ serifClass }: { serifClass: string }) {
  const [selected, setSelected] = useState(COMBINATIONS[0]);
  const reduced = useReducedMotion();

  return (
    <main className="min-h-dvh bg-[#f4f2ef] text-[#141210] selection:bg-[#b08d57]/25">
      {/* ── masthead ── */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-8 text-[11px] tracking-[0.34em] uppercase sm:px-8">
        <span className="font-medium">Trine</span>
        <span className="text-[#141210]/45">Est. 2026 · Bangkok</span>
      </header>

      {/* ── hero: the photograph, with the ring rebuilt in 3D ── */}
      <section className="mx-auto max-w-5xl px-6 pt-10 sm:px-8 sm:pt-14">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_0.85fr] md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease }}
            className="order-2 md:order-1"
          >
            <h1
              className={`${serifClass} text-5xl leading-[1.02] font-light tracking-tight sm:text-7xl`}
            >
              A ring that
              <br />
              never sits
              <br />
              the same way.
            </h1>
            <p className="mt-7 max-w-sm text-[15px] leading-relaxed text-[#141210]/70">
              Three bands of 18k gold, interlaced and left free to turn. Take
              hold of it and see: the one on screen moves exactly as the one in
              your hand would.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3">
              <span className={`${serifClass} text-3xl font-light`}>
                £{selected.price.toLocaleString()}
              </span>
              <a
                href="#configure"
                className="inline-flex h-11 items-center border border-[#141210] px-7 text-[11px] tracking-[0.28em] uppercase transition-colors hover:bg-[#141210] hover:text-[#f4f2ef]"
              >
                Choose metal
              </a>
            </div>
          </motion.div>

          {/* the photograph */}
          <motion.figure
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease }}
            className="relative order-1 mx-auto w-full max-w-md md:order-2"
          >
            <Image
              src="/labs/trine-hand.webp"
              alt="A hand reaching upward, lit against a white backdrop"
              width={735}
              height={915}
              priority
              // The source is already a 16 KB webp, and re-encoding it shifts
              // the backdrop off pure white, which multiply then shows as a
              // grey rectangle around the photograph.
              unoptimized
              // multiply drops the photograph's near-white backdrop into the
              // page colour; the fade hides the frame edge at the bottom,
              // where the set has its own falloff and never reaches white
              className="w-full mix-blend-multiply [mask-image:linear-gradient(to_bottom,black_82%,transparent_100%)]"
            />

            {/* the ring itself: a live scene, sitting where the real one was */}
            <div
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                left: `${RING.x}%`,
                top: `${RING.y}%`,
                width: `${RING.size}%`,
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
              }}
            >
              <TrineScene finishes={selected.finishes} spin={!reduced} />
            </div>

            <figcaption className="mt-4 text-center text-[10px] tracking-[0.3em] text-[#141210]/40 uppercase">
              Drag the ring to turn it
            </figcaption>
          </motion.figure>
        </div>
      </section>

      {/* ── configurator ── */}
      <section
        id="configure"
        className="mx-auto max-w-5xl scroll-mt-10 px-6 pt-24 sm:px-8 sm:pt-32"
      >
        <div className="flex items-end justify-between border-b border-[#141210]/15 pb-4">
          <h2 className={`${serifClass} text-3xl font-light sm:text-4xl`}>
            Choose the metal
          </h2>
          <span className="text-[10px] tracking-[0.3em] text-[#141210]/45 uppercase">
            Four combinations
          </span>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COMBINATIONS.map((c) => {
            const active = c.id === selected.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c)}
                aria-pressed={active}
                className={`border p-5 text-left transition-colors ${
                  active
                    ? "border-[#141210] bg-white"
                    : "border-[#141210]/15 hover:border-[#141210]/40"
                }`}
              >
                <span className="flex gap-1.5">
                  {c.finishes.map((f, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="h-4 w-4 rounded-full ring-1 ring-[#141210]/10"
                      style={{ background: f.color }}
                    />
                  ))}
                </span>
                <span className="mt-4 block text-sm font-medium">{c.name}</span>
                <span className="mt-1.5 block text-[13px] leading-relaxed text-[#141210]/60">
                  {c.note}
                </span>
                <span className="mt-4 block font-mono text-xs text-[#141210]/70">
                  £{c.price.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── specification ── */}
      <section className="mx-auto max-w-5xl px-6 pt-24 sm:px-8 sm:pt-32">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <h2 className={`${serifClass} text-3xl font-light sm:text-4xl`}>
            The object,
            <br />
            in numbers
          </h2>
          <dl className="border-t border-[#141210]/15">
            {SPEC.map((s) => (
              <div
                key={s.k}
                className="flex items-baseline justify-between gap-6 border-b border-[#141210]/15 py-4"
              >
                <dt className="text-[10px] tracking-[0.3em] text-[#141210]/50 uppercase">
                  {s.k}
                </dt>
                <dd className="text-right text-sm">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── the making of it ── */}
      <section className="mx-auto max-w-5xl px-6 pt-24 sm:px-8 sm:pt-32">
        <div className="space-y-14">
          {CHAPTERS.map((c) => (
            <motion.article
              key={c.n}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease }}
              className="grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:gap-16"
            >
              <h3 className={`${serifClass} text-2xl font-light sm:text-3xl`}>
                <span className="mr-3 font-mono text-xs tracking-widest text-[#b08d57]">
                  {c.n}
                </span>
                {c.h}
              </h3>
              <p className="text-[15px] leading-relaxed text-[#141210]/75">
                {c.p}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── close ── */}
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-32 sm:px-8 sm:pt-32 sm:pb-40">
        <div className="border-t border-[#141210]/15 pt-10">
          <h2 className={`${serifClass} max-w-xl text-3xl font-light sm:text-4xl`}>
            Made to order, in about five weeks.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#141210]/70">
            Every ring is cut to one hand. Send a size, or ask for the gauge and
            we post it out the same week.
          </p>
          <a
            href="#configure"
            className="mt-8 inline-flex h-11 items-center bg-[#141210] px-8 text-[11px] tracking-[0.28em] text-[#f4f2ef] uppercase transition-opacity hover:opacity-90"
          >
            Enquire
          </a>
        </div>
      </section>
    </main>
  );
}
