"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ROSE, WHITE, YELLOW, type Finish } from "./trine-finishes";

const ease = [0.22, 0.61, 0.36, 1] as const;

const TrineScene = dynamic(() => import("./trine-scene"), {
  ssr: false,
  loading: () => null,
});

const TrineCloseUp = dynamic(() => import("./trine-scene").then((scene) => scene.TrineCloseUp), {
  ssr: false,
  loading: () => null,
});

/**
 * Where the ring is held, measured off the photograph: the middle of the gap
 * between fingertip and thumb, 153px across in a frame 472 wide. The size is the
 * canvas, set so the narrowest way the ring can sit still spans that gap and
 * goes in under the finger and the thumb.
 */
const RING = { x: 54.5, y: 37.3, size: 60 };

interface Combination {
  id: string;
  name: string;
  finishes: Finish[];
  price: number;
  note: string;
}

const COMBINATIONS: Combination[] = [
  {
    id: "trio",
    name: "The trio",
    finishes: [ROSE, WHITE, YELLOW],
    price: 86000,
    note: "Rose, white and yellow, in the order they were first made.",
  },
  {
    id: "rose",
    name: "Rose only",
    finishes: [ROSE, ROSE, ROSE],
    price: 79000,
    note: "One metal, three bands. Warmest against most skin.",
  },
  {
    id: "white",
    name: "White only",
    finishes: [WHITE, WHITE, WHITE],
    price: 79000,
    note: "The quietest of the three. Reads as steel until it catches light.",
  },
  {
    id: "pair",
    name: "Rose and white",
    finishes: [ROSE, WHITE, ROSE],
    price: 82000,
    note: "A warm band either side of a cool one.",
  },
];

/** A fixed locale, so the server and a Thai browser agree on the first render. */
const formatPrice = (price: number) => `THB ${price.toLocaleString("en-US")}`;

// The width and weight are worked out from the model on screen, at size 52.
const SPEC = [
  { k: "Bands", v: "Three, linked" },
  { k: "Width", v: "2.3 mm each" },
  { k: "Weight", v: "6.6 g in size 52" },
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

function Swatches({ finishes }: { finishes: Finish[] }) {
  return (
    <span aria-hidden className="flex shrink-0 -space-x-1">
      {finishes.map((finish, index) => (
        <span
          key={index}
          className="size-4 rounded-full ring-1 ring-[#141210]/25"
          style={{ background: finish.color }}
        />
      ))}
    </span>
  );
}

function RingCloseUp({
  finishes,
  moving,
  serifClass,
}: {
  finishes: Finish[];
  moving: boolean;
  serifClass: string;
}) {
  const band = useRef<HTMLElement>(null);

  // Mounted on approach: a second WebGL context means compiling the metal again,
  // which nobody should pay for until they scroll this far.
  const near = useInView(band, { once: true, margin: "400px 0px" });

  return (
    <section
      ref={band}
      className="relative mt-16 overflow-hidden bg-[#141210] text-[#f4f2ef] lg:mt-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[68%] lg:inset-y-0 lg:right-[-6%] lg:left-auto lg:h-full lg:w-[70%]"
      >
        {near && <TrineCloseUp finishes={finishes} moving={moving} />}
      </div>
      {/* The ring wanders, and a bright band must never pass behind the words at full strength. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141210] from-40% to-transparent lg:inset-y-0 lg:right-auto lg:h-full lg:w-[52%] lg:bg-gradient-to-r"
      />
      <div className="relative mx-auto flex min-h-[86svh] max-w-7xl items-end px-6 py-12 sm:px-8 sm:py-16">
        <p className={`${serifClass} max-w-sm text-4xl leading-[1.1] font-light sm:text-5xl`}>
          A tenth of a millimetre between each band.
        </p>
      </div>
    </section>
  );
}

export function TrineDemo({ serifClass }: { serifClass: string }) {
  const [selected, setSelected] = useState(COMBINATIONS[0]);
  const [enquired, setEnquired] = useState(false);
  const reduced = useReducedMotion();

  return (
    <main className="min-h-dvh overflow-x-clip bg-[#f4f2ef] text-[#141210] selection:bg-[#b08d57]/25">
      {/* ── masthead ── */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 pt-8 text-[11px] tracking-[0.34em] uppercase sm:px-8">
        <span className="font-medium">Trine</span>
        <span className="text-[#141210]/65">Est. 2026 · Bangkok</span>
      </header>

      {/* ── hero: the photograph, with the ring rebuilt in 3D and held in it ── */}
      <section className="mx-auto grid max-w-7xl gap-x-10 px-6 pt-8 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:grid-rows-[auto_1fr] lg:pt-12">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
          className={`${serifClass} relative z-10 text-[clamp(3rem,15.4vw,4.5rem)] leading-[1.02] font-light tracking-tight lg:col-start-1 lg:row-start-1 lg:text-[clamp(4.5rem,min(6.6vw,11.5svh),6rem)]`}
        >
          A ring that
          <br />
          never sits
          <br />
          the same way.
        </motion.h1>

        <motion.figure
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease }}
          className="relative mt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-mt-16"
        >
          <div className="relative mx-auto w-[min(100%,calc((100svh-10rem)*0.61))] lg:w-[min(100%,calc((100svh-3.5rem)*0.61))]">
            <div
              className="absolute"
              style={{
                left: `${RING.x}%`,
                top: `${RING.y}%`,
                width: `${RING.size}%`,
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
              }}
            >
              <TrineScene finishes={selected.finishes} moving={!reduced} />
            </div>

            {/* Above the ring, and opaque, so the fingers hold it rather than float over it. */}
            <Image
              src="/labs/trine-hand-cutout.webp"
              alt="A hand reaching upward, holding the ring between finger and thumb"
              width={472}
              height={774}
              priority
              // Its edge is a soft alpha worked out by hand, which a re-encode would blur.
              unoptimized
              className="pointer-events-none relative w-full"
            />
          </div>

          <figcaption className="pointer-events-none absolute top-[2%] right-0 max-w-[11rem] text-right text-[10px] leading-relaxed tracking-[0.3em] text-[#141210]/65 uppercase lg:top-[8%]">
            Drag it, let go, see where it settles
          </figcaption>
        </motion.figure>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease }}
          className="relative z-10 lg:col-start-1 lg:row-start-2 lg:pt-6"
        >
          <p className="max-w-md text-[15px] leading-relaxed text-[#141210]/70">
            Three bands of 18k gold, linked and left free to turn. Take hold of
            it and see: let go, and it settles somewhere new.
          </p>

          <fieldset className="mt-6 max-w-lg">
            <legend className="sr-only">Choose the metal</legend>
            <div className="border-t border-[#141210]/15">
              {COMBINATIONS.map((combination) => (
                <label
                  key={combination.id}
                  className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-[#141210]/15 text-sm transition-colors outline-offset-2 outline-[#141210] hover:bg-white/60 has-[:focus-visible]:outline-1"
                >
                  <input
                    type="radio"
                    name="metal"
                    value={combination.id}
                    checked={combination.id === selected.id}
                    onChange={() => setSelected(combination)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-[#141210] opacity-0 transition-opacity peer-checked:opacity-100"
                  />
                  <Swatches finishes={combination.finishes} />
                  <span className="flex-1 pl-1 text-[#141210]/75 peer-checked:font-medium peer-checked:text-[#141210]">
                    {combination.name}
                  </span>
                  <span className="pr-1 font-mono text-xs text-[#141210]/80">
                    {formatPrice(combination.price)}
                  </span>
                </label>
              ))}
            </div>
            {/* Room for two lines, so a shorter note does not pull the button up. */}
            <p
              aria-live="polite"
              className="mt-3 min-h-[2lh] text-[13px] leading-relaxed text-[#141210]/75"
            >
              {selected.note}
            </p>
          </fieldset>

          <a
            href="#enquire"
            className="mt-3 inline-flex h-11 items-center border border-[#141210] px-7 text-[11px] tracking-[0.28em] uppercase transition-colors hover:bg-[#141210] hover:text-[#f4f2ef]"
          >
            Enquire
          </a>
        </motion.div>
      </section>

      <RingCloseUp finishes={selected.finishes} moving={!reduced} serifClass={serifClass} />

      {/* ── specification ── */}
      <section className="mx-auto max-w-7xl px-6 pt-24 sm:px-8 sm:pt-32">
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
                <dt className="text-[10px] tracking-[0.3em] text-[#141210]/65 uppercase">
                  {s.k}
                </dt>
                <dd className="text-right text-sm">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── the making of it ── */}
      <section className="mx-auto max-w-7xl px-6 pt-24 sm:px-8 sm:pt-32">
        <div className="space-y-14">
          {CHAPTERS.map((c) => (
            <motion.article
              key={c.n}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px 0px" }}
              transition={{ duration: 0.6, ease }}
              className="grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:gap-16"
            >
              <h3 className={`${serifClass} text-2xl font-light sm:text-3xl`}>
                {/*
                  A darker gold than the ring's own #b08d57: at 12px these
                  numerals are small text, and the metal colour measures 2.8:1
                  on this paper. Same hue, taken down to 5.3:1.
                */}
                <span className="mr-3 font-mono text-xs tracking-widest text-[#7d5f31]">
                  {c.n}
                </span>
                {c.h}
              </h3>
              <p className="max-w-[62ch] text-[15px] leading-relaxed text-[#141210]/75">
                {c.p}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── close ── */}
      <section
        id="enquire"
        className="mx-auto max-w-7xl scroll-mt-10 px-6 pt-24 pb-16 sm:px-8 sm:pt-32"
      >
        <div className="border-t border-[#141210]/15 pt-10">
          <h2 className={`${serifClass} max-w-xl text-3xl font-light sm:text-4xl`}>
            Made to order, in about five weeks.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#141210]/70">
            Every ring is cut to one hand. Send a size, or ask for the gauge and
            we post it out the same week.
          </p>
          <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Swatches finishes={selected.finishes} />
            <span className="font-medium">{selected.name}</span>
            <span className="font-mono text-xs text-[#141210]/80">
              {formatPrice(selected.price)}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setEnquired(true)}
            className="mt-5 inline-flex h-11 items-center bg-[#141210] px-8 text-[11px] tracking-[0.28em] text-[#f4f2ef] uppercase transition-opacity hover:opacity-90"
          >
            Ask for the gauge
          </button>
          <p role="status" className="mt-4 min-h-[1lh] text-[15px] text-[#141210]/75">
            {enquired ? "It would be in the post this week, if Trine existed." : ""}
          </p>
        </div>
      </section>

      {/* ── what this page is ── */}
      <footer className="mx-auto max-w-7xl px-6 pb-28 text-[13px] text-[#141210]/70 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-[#141210]/15 pt-6">
          <p>Trine is made up: no workshop, no gold, nothing for sale. A style study by Yim.</p>
          <p className="flex gap-6">
            <Link
              href="/labs"
              className="-my-3 py-3 underline decoration-[#141210]/30 underline-offset-4 hover:decoration-[#141210]"
            >
              More studies
            </Link>
            <Link
              href="/"
              className="-my-3 py-3 underline decoration-[#141210]/30 underline-offset-4 hover:decoration-[#141210]"
            >
              Yim&apos;s site
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
