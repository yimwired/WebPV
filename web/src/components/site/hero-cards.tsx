"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { labBySlug, labKind } from "@/lib/labs";
import { labCardSrc, labStillSrc } from "@/lib/lab-images";
import { prefersReducedMotion } from "@/lib/reduced-motion";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Where one card sits. Desktop positions are measured from the middle of the
 * screen, so the two columns keep their distance from the headline at any
 * width and simply run off the edges on narrower ones. `depth` is how far the
 * card rises over the hero's scroll: different depths are what make the cloud
 * read as layers rather than a flat collage.
 */
interface CardSpot {
  slug: string;
  /** "portrait" is a 4:5 still made for this hero, "square" 1:1, "wide" the 16:10 gallery card */
  shape: "portrait" | "square" | "wide";
  /** px from the centre line to the card's left edge (desktop), or % of the band's width (phone) */
  x: number;
  /** px from the top of the hero (desktop) or of the band (phone) */
  y: number;
  width: number;
  rotate: number;
  depth: number;
}

// Two columns a side, the outer one cut by the screen edge. Overlaps are
// deliberate: depth by one card hiding another, not by blur. The inner edges
// stay 370px or more from the centre line, clear of the 640px text column.
const desktopSpots: CardSpot[] = [
  { slug: "counter", shape: "portrait", x: -610, y: -26, width: 200, rotate: -2.5, depth: 140 },
  { slug: "slab", shape: "wide", x: -790, y: 168, width: 236, rotate: 3, depth: 220 },
  { slug: "clash", shape: "portrait", x: -585, y: 318, width: 210, rotate: 2, depth: 90 },
  { slug: "trellis", shape: "square", x: -760, y: 500, width: 190, rotate: -3, depth: 200 },
  { slug: "meeple", shape: "square", x: -625, y: 660, width: 220, rotate: -1.5, depth: 120 },
  { slug: "thock", shape: "portrait", x: 410, y: -14, width: 200, rotate: 2.5, depth: 120 },
  { slug: "trine", shape: "portrait", x: 585, y: 132, width: 200, rotate: -3, depth: 210 },
  { slug: "longtail", shape: "portrait", x: 400, y: 334, width: 210, rotate: -2, depth: 80 },
  { slug: "gaze", shape: "square", x: 610, y: 488, width: 206, rotate: 3, depth: 190 },
  { slug: "ember", shape: "portrait", x: 420, y: 670, width: 210, rotate: 2, depth: 130 },
];

// Below lg there is no room beside the text, so a short band of cards sits
// under the buttons and is cut off by the bottom of the hero.
const phoneSpots: CardSpot[] = [
  { slug: "slab", shape: "wide", x: -8, y: 46, width: 168, rotate: -4, depth: 0 },
  { slug: "counter", shape: "portrait", x: 24, y: 6, width: 128, rotate: 3, depth: 0 },
  { slug: "thock", shape: "portrait", x: 52, y: 36, width: 136, rotate: -2, depth: 0 },
  { slug: "trine", shape: "portrait", x: 80, y: 12, width: 128, rotate: 4, depth: 0 },
];

/** Distance from the centre line to the edge of the card nearest it. */
const innerGap = (spot: CardSpot) =>
  spot.x < 0 ? -(spot.x + spot.width) : spot.x;

// Copies sorted rather than toSorted(): Safari before 16 has no toSorted, and
// this runs at import time, so a missing method would blank the page.

/** Dealing order: nearest the headline first, the cut-off outer column last. */
const dealOrder = new Map(
  [...desktopSpots]
    .sort((a, b) => innerGap(a) - innerGap(b))
    .map((spot, order) => [spot.slug, order]),
);

/** Paint order is the reverse, so the inner cards lie on top of the outer ones. */
const stackedSpots = [...desktopSpots].sort((a, b) => innerGap(b) - innerGap(a));

const cardImage = (spot: CardSpot) =>
  spot.shape === "wide" ? labCardSrc(spot.slug) : labStillSrc(spot.slug);

const aspectClass: Record<CardSpot["shape"], string> = {
  portrait: "aspect-[4/5]",
  square: "aspect-square",
  wide: "aspect-[16/10]",
};

/** The card itself: a still of the demo, its name and the business it plays. */
function LabCard({ spot }: { spot: CardSpot }) {
  const { locale } = useLocale();
  const lab = labBySlug(spot.slug);

  return (
    <Link
      href={`/labs/${lab.slug}`}
      // The cloud repeats the showcase below, which is where keyboard and
      // screen reader users meet these demos. Here they would be ten tab
      // stops between the hero's buttons and the rest of the page.
      tabIndex={-1}
      className="bg-card shadow-float block rounded-[18px] p-2 transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[11px]",
          aspectClass[spot.shape],
        )}
        style={{
          background: `linear-gradient(135deg, ${lab.preview.from}, ${lab.preview.to})`,
        }}
      >
        <Image
          src={cardImage(spot)}
          alt=""
          fill
          sizes={`${spot.width}px`}
          className="object-cover"
        />
      </div>
      <div className="px-1.5 pt-2.5 pb-1 text-left">
        <p className="text-[13px] leading-tight font-semibold">{lab.name}</p>
        <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11.5px] leading-tight">
          <span
            aria-hidden
            className="bg-brand h-1.5 w-1.5 shrink-0 rounded-full"
          />
          <span className="truncate">{labKind(lab, locale)}</span>
        </p>
      </div>
    </Link>
  );
}

/** One desktop card: dealt out from the headline on load, rises as the hero scrolls away. */
function FloatingCard({
  spot,
  order,
  progress,
}: {
  spot: CardSpot;
  order: number;
  progress: MotionValue<number>;
}) {
  // Under reduced motion the cards hold still while the page scrolls.
  const rise = useTransform(progress, (value) =>
    prefersReducedMotion() ? 0 : value * -spot.depth,
  );

  return (
    <motion.div
      className="pointer-events-auto absolute"
      style={{
        left: `calc(50% + ${spot.x}px)`,
        top: spot.y,
        width: spot.width,
        y: rise,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: spot.x < 0 ? 36 : -36 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{
          duration: 0.9,
          delay: 0.2 + order * 0.06,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ rotate: spot.rotate }}
      >
        <LabCard spot={spot} />
      </motion.div>
    </motion.div>
  );
}

// Both arrangements below are decorative on purpose: hidden from assistive
// technology and out of the tab order, because the showcase right after the
// hero lists every one of these demos properly.

/** The demos floating either side of the headline, from lg up. */
export function HeroCardCloud({
  target,
}: {
  target: React.RefObject<HTMLElement | null>;
}) {
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start start", "end start"],
  });

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
    >
      {stackedSpots.map((spot) => (
        <FloatingCard
          key={spot.slug}
          spot={spot}
          order={dealOrder.get(spot.slug) ?? 0}
          progress={scrollYProgress}
        />
      ))}
    </div>
  );
}

/** Below lg: a short band of cards under the buttons, cut off by the hero's bottom edge. */
export function HeroCardBand() {
  return (
    <div
      aria-hidden
      className="relative mx-auto mt-14 h-56 w-full max-w-md lg:hidden"
    >
      {phoneSpots.map((spot, i) => (
        <motion.div
          key={spot.slug}
          className="absolute"
          style={{ left: `${spot.x}%`, top: spot.y, width: spot.width }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.3 + i * 0.07,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div style={{ transform: `rotate(${spot.rotate}deg)` }}>
            <LabCard spot={spot} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
