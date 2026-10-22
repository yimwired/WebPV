"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { labBySlug, labKind } from "@/lib/labs";
import { labStillShape, labStillSrc } from "@/lib/lab-images";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One column of demos drifting upward. Durations differ so the lanes never
 * move as one block, and `offset` starts each lane partway through its loop so
 * no two set off level. How the loop works is in globals.css, under
 * `.drift-track`.
 */
interface Lane {
  slugs: string[];
  /** seconds for one set of cards to pass */
  duration: number;
  /** seconds into the loop the lane starts */
  offset: number;
}

interface DesktopLane extends Lane {
  /** px from the centre line to the lane's left edge */
  x: number;
  width: number;
}

// Two lanes a side, the outer one cut by the screen edge. Measured from the
// middle of the screen, so the lanes keep their distance from the headline at
// any width; the inner edges sit 370px from the centre line, clear of the
// 640px text column. Every listed demo appears once, and the two right-hand
// lanes borrow one each from the far side, so no lane shows the same card
// twice on one screen. Between 12 and 17px a second: slow enough to read as
// drifting rather than scrolling.
const desktopLanes: DesktopLane[] = [
  { slugs: ["slab", "clash", "trellis", "cart"], x: -808, width: 200, duration: 168, offset: 40 },
  { slugs: ["counter", "meeple", "unfold", "ember"], x: -580, width: 210, duration: 140, offset: 10 },
  { slugs: ["thock", "stall", "gaze", "slab"], x: 370, width: 210, duration: 156, offset: 74 },
  { slugs: ["trine", "minimal", "longtail", "counter"], x: 608, width: 200, duration: 180, offset: 22 },
];

// Below lg there is no room beside the text, so three narrow lanes drift
// inside a short window under the buttons.
const phoneLanes: Lane[] = [
  { slugs: ["counter", "slab", "trellis", "cart"], duration: 60, offset: 14 },
  { slugs: ["thock", "unfold", "gaze", "longtail"], duration: 72, offset: 40 },
  { slugs: ["trine", "stall", "meeple", "ember"], duration: 66, offset: 4 },
];

const aspectClass = {
  portrait: "aspect-[4/5]",
  square: "aspect-square",
  wide: "aspect-[16/10]",
} as const;

/** The card itself: a still of the demo, its name and the business it plays. */
function LabCard({
  slug,
  width,
  compact,
}: {
  slug: string;
  width: number;
  compact: boolean;
}) {
  const { locale } = useLocale();
  const lab = labBySlug(slug);
  // Labs with an upright still made for the home page show it; the rest show
  // their 16:10 gallery card, which is what labStillSrc falls back to.
  const shape = labStillShape(slug) ?? "wide";

  return (
    <Link
      href={`/labs/${lab.slug}`}
      // The lanes repeat the showcase below, which is where keyboard and
      // screen reader users meet these demos. Here they would be dozens of
      // tab stops between the hero's buttons and the rest of the page.
      tabIndex={-1}
      className={cn(
        "drift-card bg-card shadow-float block",
        compact ? "rounded-[14px] p-1.5" : "rounded-[18px] p-2",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          compact ? "rounded-[9px]" : "rounded-[11px]",
          aspectClass[shape],
        )}
        style={{
          background: `linear-gradient(135deg, ${lab.preview.from}, ${lab.preview.to})`,
        }}
      >
        <Image
          src={labStillSrc(slug)}
          alt=""
          fill
          sizes={`${width}px`}
          className="object-cover"
        />
      </div>
      <div className={cn("text-left", compact ? "px-1 pt-2 pb-0.5" : "px-1.5 pt-2.5 pb-1")}>
        <p className={cn("leading-tight font-semibold", compact ? "text-[12px]" : "text-[13px]")}>
          {lab.name}
        </p>
        <p
          className={cn(
            "text-muted-foreground mt-0.5 flex items-center gap-1.5 leading-tight",
            compact ? "text-[10.5px]" : "text-[11.5px]",
          )}
        >
          <span aria-hidden className="bg-brand h-1.5 w-1.5 shrink-0 rounded-full" />
          <span className="truncate">{labKind(lab, locale)}</span>
        </p>
      </div>
    </Link>
  );
}

/**
 * A lane's cards twice over, so sliding it up by exactly one set lands on a
 * frame identical to the first. `copies` repeats the set inside itself for a
 * lane that would otherwise be shorter than the window it drifts through.
 */
function DriftLane({
  lane,
  width,
  copies = 1,
  compact = false,
  className,
  style,
}: {
  lane: Lane;
  width: number;
  copies?: number;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const set = Array.from({ length: copies }, () => lane.slugs).flat();

  return (
    <div className={cn("drift-lane", className)} style={style}>
      <div
        className="drift-track"
        style={{
          animationDuration: `${lane.duration}s`,
          animationDelay: `-${lane.offset}s`,
        }}
      >
        {[0, 1].map((half) =>
          set.map((slug, i) => (
            <div key={`${half}-${i}`} className={compact ? "pb-2.5" : "pb-6"}>
              <LabCard slug={slug} width={width} compact={compact} />
            </div>
          )),
        )}
      </div>
    </div>
  );
}

// Both arrangements below are decorative on purpose: hidden from assistive
// technology and out of the tab order, because the showcase right after the
// hero lists every one of these demos properly.

/** Tailwind's `lg`: where the lanes move from under the buttons to beside the headline. */
const WIDE = "(min-width: 64rem)";

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Which arrangement this screen shows, or null on the server and through
 * hydration. Both used to go into the HTML, CSS hiding one: 88 cards to parse
 * and hydrate on every visit, 64 of them invisible on a phone, and the home
 * page's blocking time two to three times main's. Now the cards for this
 * screen are drawn once the page is live, and fade in as they always did.
 */
function useArrangement(): "wide" | "narrow" | null {
  return useSyncExternalStore(
    subscribeToWidth,
    () => (window.matchMedia(WIDE).matches ? "wide" : "narrow"),
    () => null,
  );
}

/** The demos drifting up either side of the headline, from lg up. */
export function HeroDrift() {
  const arrangement = useArrangement();
  // An overlay, so drawing it late moves nothing.
  if (arrangement !== "wide") return null;

  return (
    <div
      aria-hidden
      className="drift-fade drift-in pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block"
    >
      {desktopLanes.map((lane) => (
        <DriftLane
          key={lane.x}
          lane={lane}
          width={lane.width}
          // One set is about one screen tall; doubling it keeps the loop from
          // showing its end on a tall monitor.
          copies={2}
          className="pointer-events-auto absolute top-0"
          style={{ left: `calc(50% + ${lane.x}px)`, width: lane.width }}
        />
      ))}
    </div>
  );
}

/** Below lg: three narrow lanes drifting inside a window under the buttons. */
export function HeroDriftBand() {
  const arrangement = useArrangement();

  // The window is in the hero's flow, so it is there from the first paint,
  // empty, and only its cards arrive late: the headline above it never moves.
  return (
    <div
      aria-hidden
      className="drift-fade relative mx-auto mt-12 h-72 w-full max-w-md overflow-hidden lg:hidden"
      // No pointer to wake a card on a phone, so the band rests less faded.
      style={{ "--drift-rest": 0.6 } as CSSProperties}
    >
      {arrangement === "narrow" && (
        <div className="drift-in grid h-full grid-cols-3 gap-2.5">
          {phoneLanes.map((lane, i) => (
            <DriftLane key={i} lane={lane} width={120} compact />
          ))}
        </div>
      )}
    </div>
  );
}
