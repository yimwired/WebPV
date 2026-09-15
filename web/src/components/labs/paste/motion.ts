/**
 * Paste's timings.
 *
 * Things on this page were stuck down by hand, so they arrive the way a hand
 * would put them: a short drop and a small rotation into place, never a slide
 * or a fade from nothing. Nothing loops, because a scrapbook is a finished
 * object and a page that keeps moving reads as a slideshow of one.
 */

export const EASE = {
  /** lands with a little weight, like a card set down */
  soft: [0.25, 0.8, 0.35, 1],
} as const;

export const DUR = {
  fast: 0.24,
  base: 0.42,
} as const;

/** The reveal carries a rotation so pieces settle rather than appear. */
export const reveal = {
  hidden: { opacity: 0, y: 16, rotate: -1.5 },
  shown: { opacity: 1, y: 0, rotate: 0 },
} as const;

export const revealTransition = { duration: DUR.base, ease: EASE.soft } as const;

export const stagger = (gap = 0.08, start = 0) => ({
  hidden: {},
  shown: { transition: { staggerChildren: gap, delayChildren: start } },
});

export const ONCE = { once: true, amount: 0.2 } as const;
