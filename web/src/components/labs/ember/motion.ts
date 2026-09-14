/**
 * Every timing on this page, in one file.
 *
 * The hero plays as a sequence - title, then subtitle, then the buttons - and
 * the follow-on delays are derived from the title's own numbers rather than
 * typed twice. Retiming the title retimes what comes after it, which is the
 * only way a hand-tuned sequence survives being edited.
 *
 * Framer's MotionConfig at the app root runs `reducedMotion="user"`, so every
 * transform below is dropped automatically for visitors who ask for that. That
 * is also why nothing here animates a colour or a size to convey meaning.
 */

/** Cubic beziers, named for what they feel like rather than their numbers. */
export const EASE = {
  /** the house curve: fast out, long settle */
  out: [0.16, 1, 0.3, 1],
  /** gentler, for things that move a long way */
  soft: [0.22, 0.61, 0.36, 1],
  /** a little overshoot, for stickers and badges */
  back: [0.34, 1.32, 0.64, 1],
} as const;

export const DUR = {
  fast: 0.32,
  base: 0.62,
  slow: 0.95,
  /** one full pass of the ticker */
  marquee: 26,
} as const;

/** The hero sequence. Change a number here and the whole page follows. */
export const HERO = {
  eyebrow: 0.06,
  titleStart: 0.2,
  /** gap between one title line starting and the next */
  lineStagger: 0.1,
  /** how long after the last title line the subtitle starts */
  subtitleGap: 0.18,
  /** and the buttons after the subtitle */
  ctaGap: 0.16,
} as const;

/** When the subtitle under an n-line title should start. */
export const subtitleDelay = (lines: number) =>
  HERO.titleStart + lines * HERO.lineStagger + HERO.subtitleGap;

/** And the buttons under it. */
export const ctaDelay = (lines: number) => subtitleDelay(lines) + HERO.ctaGap;

/** Scroll reveal used by every section below the hero. */
export const reveal = {
  hidden: { opacity: 0, y: 26 },
  shown: { opacity: 1, y: 0 },
} as const;

export const revealTransition = { duration: DUR.base, ease: EASE.out } as const;

/** Applied to a list so its children reveal one after another. */
export const stagger = (gap = 0.08, start = 0) => ({
  hidden: {},
  shown: { transition: { staggerChildren: gap, delayChildren: start } },
});

/** Shared viewport settings, so nothing re-plays when you scroll back up. */
export const ONCE = { once: true, amount: 0.25 } as const;

/** The dialog. Its panel grows out of the card that opened it. */
export const MODAL = {
  backdrop: { duration: DUR.fast, ease: EASE.soft },
  panelIn: { duration: 0.46, ease: EASE.out },
  panelOut: { duration: 0.22, ease: EASE.soft },
  /** how small the panel starts, as a fraction of its final size */
  fromScale: 0.86,
} as const;
