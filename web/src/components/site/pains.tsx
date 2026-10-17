"use client";

import { useRef, type PointerEvent } from "react";
import { motion, type Variants } from "framer-motion";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Where each sticky note lands, as a share of the stage: `x`/`y` on a phone,
 * `sx`/`sy` from sm up. The colours are paper, so they stay the same in
 * either theme, and the ink on them is the same near-black for the same
 * reason (11:1 or better on the palest of them).
 */
const spots = [
  { x: 2, y: 1, sx: 4, sy: 10, rotate: -4, paper: "#b8f0c4" },
  { x: 50, y: 0, sx: 35, sy: 3, rotate: 3, paper: "#d8c9ff" },
  { x: 4, y: 22, sx: 66, sy: 8, rotate: -2, paper: "#ffb8ab" },
  { x: 49, y: 21, sx: 13, sy: 47, rotate: 3, paper: "#ffe68f" },
  { x: 2, y: 43, sx: 43, sy: 43, rotate: -3, paper: "#aef3e6" },
  { x: 50, y: 42, sx: 71, sy: 50, rotate: 4, paper: "#ffd3a6" },
  { x: 25, y: 63, sx: 28, sy: 62, rotate: -2, paper: "#ffc9e6" },
];

const stage: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08 } },
};

// fastwork.com's "stick": each note lands slightly large and settles flat.
const note: Variants = {
  hidden: { opacity: 0, scale: 1.14 },
  shown: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.56, ease: [0.33, 1, 0.68, 1] },
  },
};

/**
 * A note a mouse can pick up and move. Touch is left alone on purpose: on a
 * phone the notes fill the width of the screen, and capturing touches would
 * stop the page scrolling for anyone whose thumb starts on one.
 */
function StickyNote({
  text,
  spot,
  lift,
}: {
  text: string;
  spot: (typeof spots)[number];
  lift: () => number;
}) {
  const offset = useRef({ x: 0, y: 0 });
  const grab = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLLIElement>) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    const element = event.currentTarget;
    element.setPointerCapture(event.pointerId);
    element.style.zIndex = String(lift());
    element.dataset.dragging = "";
    grab.current = {
      x: event.clientX - offset.current.x,
      y: event.clientY - offset.current.y,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLLIElement>) => {
    if (!grab.current) return;
    offset.current = {
      x: event.clientX - grab.current.x,
      y: event.clientY - grab.current.y,
    };
    // The individual `translate` property composes with the transform Motion
    // writes (the tilt and the landing scale), so neither overwrites the other.
    event.currentTarget.style.translate = `${offset.current.x}px ${offset.current.y}px`;
  };

  const onPointerUp = (event: PointerEvent<HTMLLIElement>) => {
    if (!grab.current) return;
    grab.current = null;
    delete event.currentTarget.dataset.dragging;
  };

  return (
    <motion.li
      variants={note}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "absolute flex aspect-square w-[47%] flex-col p-[clamp(12px,2.6vw,20px)] select-none sm:w-[29%]",
        "left-(--x) top-(--y) sm:left-(--sx) sm:top-(--sy)",
        "shadow-[0_2px_4px_rgb(0_0_0/0.08)] transition-shadow duration-200",
        "pointer-fine:cursor-grab data-[dragging]:cursor-grabbing data-[dragging]:shadow-[0_12px_28px_rgb(0_0_0/0.22)]",
      )}
      style={
        {
          "--x": `${spot.x}%`,
          "--y": `${spot.y}%`,
          "--sx": `${spot.sx}%`,
          "--sy": `${spot.sy}%`,
          rotate: `${spot.rotate}deg`,
          backgroundColor: spot.paper,
        } as React.CSSProperties
      }
    >
      <p className="font-hand text-[clamp(15px,2.2vw,21px)] leading-[1.3] tracking-[-0.01em] text-pretty text-[rgb(0_0_0/0.82)]">
        {text}
      </p>
    </motion.li>
  );
}

/**
 * The worries people bring to hiring someone for a website, as a pile of
 * sticky notes on fastwork.com's dark ground. The bottom of the pile runs
 * under the light card that answers them (see promise.tsx).
 */
export function Pains() {
  const { t } = useLocale();
  // Each note picked up goes on top of the pile.
  const topLayer = useRef(spots.length);
  const lift = () => ++topLayer.current;

  return (
    <section
      data-nav-tone="dark"
      aria-labelledby="pains-title"
      className="dark bg-background text-foreground overflow-hidden"
    >
      <div className="mx-auto max-w-3xl px-5 pt-24 text-center sm:pt-32">
        <h2
          id="pains-title"
          className="text-[34px] leading-[1.15] font-medium tracking-[-0.025em] text-balance sm:text-[48px] lg:text-[54px]"
        >
          {t.pains.title}
        </h2>
        <p className="text-muted-foreground mt-4 text-[17px]">{t.pains.sub}</p>
      </div>

      <motion.ul
        aria-label={t.pains.notesLabel}
        variants={stage}
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, amount: 0.25 }}
        className="relative isolate mx-auto mt-12 aspect-[390/640] w-full max-w-[820px] sm:mt-14 sm:aspect-[820/560]"
      >
        {t.pains.notes.map((text, i) => (
          <StickyNote key={text} text={text} spot={spots[i]} lift={lift} />
        ))}
      </motion.ul>
    </section>
  );
}
