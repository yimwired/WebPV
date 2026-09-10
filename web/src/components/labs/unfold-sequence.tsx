"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";

/**
 * The unfold, scrubbed off a frame sequence rather than played.
 *
 * A `<video>` driven by `currentTime` is the obvious way to do this and it is
 * the wrong one: seeking to an arbitrary time stutters wherever the codec has
 * to walk back to a keyframe, and iOS Safari will not do it smoothly inline at
 * all. Decoded stills drawn to a canvas behave the same everywhere.
 *
 * The first frame is the same photograph as `folded-*.webp` and the last is the
 * same photograph as `lit-*.webp`, so the still layers on either side of this
 * one can cross-fade into it without anything appearing to move.
 */

export const UNFOLD_FRAMES = 48;

/** Frame sets, smallest first. The first one wide enough for the screen wins. */
const SETS = [
  { dir: "seq-620", width: 620, height: 352, maxDevicePx: 900 },
  { dir: "seq-1100", width: 1100, height: 624, maxDevicePx: Infinity },
] as const;

type FrameSet = (typeof SETS)[number];

const LARGEST = SETS[SETS.length - 1];

function pickSet(): FrameSet {
  if (typeof window === "undefined") return LARGEST;
  const devicePx = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  return SETS.find((set) => devicePx <= set.maxDevicePx) ?? LARGEST;
}

const frameUrl = (dir: string, index: number) =>
  `/lab-assets/unfold/${dir}/${String(index).padStart(2, "0")}.webp`;

export function UnfoldSequence({
  progress,
  className,
}: {
  /** 0 folded, 1 open and lit. Values outside the range are clamped. */
  progress: MotionValue<number>;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const paint = useRef<(at: number) => void>(() => {});
  const queued = useRef(0);

  useEffect(() => {
    // Chosen once, on mount. Re-picking on resize would re-download 48 files
    // because someone dragged a window wider.
    const set = pickSet();
    const surface = canvas.current;
    if (surface) {
      surface.width = set.width;
      surface.height = set.height;
    }

    const frames: HTMLImageElement[] = [];
    let shown = -1;
    let wanted = 0;
    let cancelled = false;

    paint.current = (at: number) => {
      wanted = at;
      const context = canvas.current?.getContext("2d");
      if (!context) return;

      const target = Math.min(
        UNFOLD_FRAMES - 1,
        Math.max(0, Math.round(at * (UNFOLD_FRAMES - 1)))
      );
      // Hold the nearest frame that has actually arrived. Early in the load
      // this shows a slightly stale pose instead of a blank canvas.
      let index = target;
      while (index >= 0 && !frames[index]) index -= 1;
      if (index < 0 || index === shown) return;

      context.drawImage(frames[index], 0, 0, set.width, set.height);
      shown = index;
    };

    // Sequential and in order, so the frames a viewer reaches first are the
    // frames that exist first. Firing all 48 at once lets the network finish
    // them in whatever order it likes.
    void (async () => {
      for (let i = 0; i < UNFOLD_FRAMES && !cancelled; i += 1) {
        const image = new Image();
        image.decoding = "async";
        image.src = frameUrl(set.dir, i);
        try {
          await image.decode();
        } catch {
          continue; // one missing frame should not stop the other 47
        }
        if (cancelled) return;
        frames[i] = image;
        if (i <= Math.round(wanted * (UNFOLD_FRAMES - 1))) paint.current(wanted);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useMotionValueEvent(progress, "change", (value) => {
    if (queued.current) cancelAnimationFrame(queued.current);
    queued.current = requestAnimationFrame(() => {
      queued.current = 0;
      paint.current(value);
    });
  });

  return (
    <canvas
      ref={canvas}
      className={className}
      width={LARGEST.width}
      height={LARGEST.height}
      aria-hidden
    />
  );
}
