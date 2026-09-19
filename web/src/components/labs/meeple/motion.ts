/**
 * Meeple's timings. Everything here moves in whole frames.
 *
 * A sprite-era interface had no interpolation: a thing was at one position on
 * one frame and at the next position on the next. Easing a pixel sprite
 * smoothly across the screen is the motion equivalent of scaling it by 1.37 —
 * it is still pixel art in the file and no longer pixel art on the screen. So
 * every transition on this page runs through `steps`, and the frame counts are
 * low enough to see.
 */

import { UNIT } from "./theme";

/**
 * A stepped easing for framer-motion, which takes `ease` as a plain function.
 *
 * `frames` is how many positions the thing is drawn at, including where it
 * starts. The last frame lands exactly on the end value; without the clamp the
 * final step overshoots, which is visible as a one-frame jitter at the end of
 * every animation on the page.
 */
export const steps =
  (frames: number) =>
  (t: number): number =>
    Math.min(1, Math.floor(t * frames) / (frames - 1));

export const DUR = {
  /** a button reacting: three frames is the shortest that reads as movement */
  press: 0.12,
  fast: 0.2,
  base: 0.36,
} as const;

/** Reveals come in on four frames, which at 0.36s is about one frame per 90ms. */
export const reveal = {
  hidden: { opacity: 0, y: UNIT * 3 },
  shown: { opacity: 1, y: 0 },
} as const;

export const revealTransition = { duration: DUR.base, ease: steps(4) } as const;

export const stagger = (gap = 0.06, start = 0) => ({
  hidden: {},
  shown: { transition: { staggerChildren: gap, delayChildren: start } },
});

export const ONCE = { once: true, amount: 0.2 } as const;
