"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { labCardVersions } from "@/lib/lab-cards";
import { labBestFor, labs } from "@/lib/labs";
import { cn } from "@/lib/utils";

/** How far the page scrolls, in viewport heights, to move on by one lab. */
const STEP_VH = 28;

/** Where the stage pins: the navbar's 64px plus a 16px gap (`top-20`). */
const PIN_TOP_PX = 80;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The Lab as a pinned stage, for screens wide enough to hold one (lg and up).
 *
 * The section is a tall track and the stage sticks under the navbar while it
 * scrolls past, so reading on down the page flips through the demos one at a
 * time without the frame ever moving. Which lab is showing follows only from
 * how far the track has scrolled. The rail is a tablist, and a click or an
 * arrow key gets there by scrolling the page to that lab's stretch of track,
 * so the rail and the scroll position can never disagree.
 */
export function LabStage() {
  const { locale, t } = useLocale();
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  // 0 when the track's top reaches the pin line, 1 when its bottom reaches
  // the bottom of the viewport, which is the moment the stage lets go.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: [`start ${PIN_TOP_PX}px`, "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const index = Math.floor(progress * labs.length);
    setActive(Math.min(labs.length - 1, Math.max(0, index)));
  });

  function select(index: number) {
    const track = trackRef.current;
    if (!track) return;

    // The same range useScroll measures, so landing in the middle of a lab's
    // stretch makes the progress handler agree with the choice.
    const start = track.getBoundingClientRect().top + window.scrollY - PIN_TOP_PX;
    const range = track.offsetHeight - window.innerHeight + PIN_TOP_PX;
    const top = start + ((index + 0.5) / labs.length) * range;

    // Instant on purpose: a smooth scroll would flick through every lab in
    // between on its way there.
    window.scrollTo({ top, behavior: "instant" });
    setActive(index);
  }

  function onRailKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let index: number;
    switch (event.key) {
      case "ArrowDown":
        index = Math.min(labs.length - 1, active + 1);
        break;
      case "ArrowUp":
        index = Math.max(0, active - 1);
        break;
      case "Home":
        index = 0;
        break;
      case "End":
        index = labs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    select(index);
    tabRefs.current[index]?.focus({ preventScroll: true });
  }

  const lab = labs[active];
  const href = `/labs/${lab.slug}`;

  return (
    <div
      ref={trackRef}
      className="relative mt-10 hidden lg:block"
      style={{ height: `calc(${labs.length * STEP_VH}vh + 100svh - ${PIN_TOP_PX}px)` }}
    >
      <div
        className="sticky flex items-center"
        style={{ top: PIN_TOP_PX, height: `calc(100svh - ${PIN_TOP_PX}px)` }}
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[13rem_minmax(0,1fr)] gap-12 px-8">
          <div>
            <p id={`${id}-label`} className="spec">
              {t.lab.pick}
            </p>
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-labelledby={`${id}-label`}
              onKeyDown={onRailKeyDown}
              className="border-line mt-4 border-l"
            >
              {labs.map((item, i) => {
                const selected = i === active;
                return (
                  <button
                    key={item.slug}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`${id}-tab-${i}`}
                    aria-selected={selected}
                    aria-controls={`${id}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(i)}
                    className={cn(
                      "-ml-px flex w-full items-baseline gap-3 border-l-2 py-1.5 ps-4 text-left transition-colors",
                      selected
                        ? "border-brand text-foreground"
                        : "text-muted-foreground hover:text-foreground border-transparent",
                    )}
                  >
                    <span className="spec tabular-nums">{pad(i + 1)}</span>
                    <span className="text-[0.9375rem] font-medium tracking-tight">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capped by the height left over for it as well as the width, so a
              short laptop screen still fits the frame and the text under it.
              The cards are 16:10, which is the 1.6. The cap is on the panel
              rather than the picture so the text lines up with the frame. */}
          {/* One link for the whole panel: "Try it live" stretches over the
              picture with an ::after, so the frame is clickable without being
              a second, nameless stop in the tab order. */}
          <div
            role="tabpanel"
            id={`${id}-panel`}
            aria-labelledby={`${id}-tab-${active}`}
            className="group relative w-full min-w-0"
            style={{ maxWidth: "calc((100svh - 19rem) * 1.6)" }}
          >
            <div
              className="border-line group-hover:border-line-strong relative aspect-[16/10] w-full overflow-hidden rounded-md border transition-colors"
              style={{
                background: `linear-gradient(135deg, ${lab.preview.from}, ${lab.preview.to})`,
              }}
            >
              {labs.map((item, i) => (
                <Image
                  key={item.slug}
                  src={`/labs/cards/${item.slug}.webp?v=${labCardVersions[item.slug] ?? ""}`}
                  alt=""
                  fill
                  sizes="(min-width: 1152px) 816px, 66vw"
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    i === active ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>

            <div className="mt-6 flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h3 className="text-2xl font-semibold tracking-tight">
                  {lab.name}
                </h3>
                <p className="spec mt-1">{lab.vibe}</p>
              </div>
              <p className="spec shrink-0 pt-2 tabular-nums">
                {pad(active + 1)} / {pad(labs.length)}
              </p>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-relaxed">
              <span className="text-muted-foreground">{t.lab.bestFor} </span>
              <span className="text-foreground/90">{labBestFor(lab, locale)}</span>
            </p>

            <Link
              href={href}
              className="text-brand mt-4 -mb-2 inline-flex items-center gap-1.5 py-2 text-sm font-medium group-hover:underline after:absolute after:inset-0"
            >
              {t.lab.tryLive}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
