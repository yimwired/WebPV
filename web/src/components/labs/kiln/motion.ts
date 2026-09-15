/**
 * Kiln's timings.
 *
 * The slowest set in The Lab, and the least of it. This style is about
 * stillness, so most of the page does not move at all: things arrive once and
 * stay. Where something does move it takes its time, because a quick snap
 * would contradict everything the copy says about drying for three days.
 */

export const EASE = {
  soft: [0.25, 0.6, 0.3, 1],
} as const;

export const DUR = {
  fast: 0.28,
  base: 0.7,
} as const;

export const reveal = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0 },
} as const;

export const revealTransition = { duration: DUR.base, ease: EASE.soft } as const;

export const stagger = (gap = 0.1, start = 0) => ({
  hidden: {},
  shown: { transition: { staggerChildren: gap, delayChildren: start } },
});

export const ONCE = { once: true, amount: 0.25 } as const;
