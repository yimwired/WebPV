/**
 * Timings for Prism.
 *
 * Deliberately small. The panels are the subject, and a page that animates
 * around them competes with the thing it is showing. The one motion that
 * carries meaning is the crossfade when the backdrop changes: it is what tells
 * you the glass is reacting to something real underneath.
 */

export const EASE = {
  out: [0.16, 1, 0.3, 1],
  soft: [0.22, 0.61, 0.36, 1],
} as const;

export const DUR = {
  fast: 0.3,
  base: 0.55,
  /** the backdrop swap. Slow enough to watch the sheet flip mode with it */
  backdrop: 0.7,
} as const;

export const reveal = {
  hidden: { opacity: 0, y: 20 },
  shown: { opacity: 1, y: 0 },
} as const;

export const revealTransition = { duration: DUR.base, ease: EASE.out } as const;

export const stagger = (gap = 0.08, start = 0) => ({
  hidden: {},
  shown: { transition: { staggerChildren: gap, delayChildren: start } },
});

export const ONCE = { once: true, amount: 0.25 } as const;
