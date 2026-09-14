/**
 * Slab's timings.
 *
 * Short and slightly stiff on purpose. This style is a reaction against soft
 * design, and a 600ms ease-out fade on a page built from hard borders and flat
 * shadows undoes it: the motion says gentle while everything else says blunt.
 * Nothing here runs longer than a third of a second, and the reveal snaps up
 * with a tiny overshoot rather than dissolving.
 */

export const EASE = {
  /** the house curve: quick, with a small overshoot at the end */
  snap: [0.2, 1.4, 0.4, 1],
  flat: [0.3, 0, 0.2, 1],
} as const;

export const DUR = {
  press: 0.08,
  base: 0.3,
  accordion: 0.22,
} as const;

export const reveal = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0 },
} as const;

export const revealTransition = { duration: DUR.base, ease: EASE.snap } as const;

export const stagger = (gap = 0.06, start = 0) => ({
  hidden: {},
  shown: { transition: { staggerChildren: gap, delayChildren: start } },
});

export const ONCE = { once: true, amount: 0.25 } as const;
