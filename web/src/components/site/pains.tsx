"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const sheet: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.32, delayChildren: 0.15 } },
};

const row: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

const answer: Variants = {
  hidden: { opacity: 0, x: -6 },
  shown: { opacity: 1, x: 0, transition: { duration: 0.4, ease, delay: 0.75 } },
};

/**
 * The pen stroke through a worry is `.strike`'s background (globals.css), and
 * crossing out is that background growing from nothing to the full width.
 * A background rather than an overlaid line because a long worry wraps on a
 * phone, and a cloned background strikes every line it wraps onto. Growing a
 * background is not a transform, so MotionConfig's reduced setting would leave
 * it running; under reduce the stroke is simply there.
 */
const strike = (reduceMotion: boolean | null): Variants => ({
  hidden: { backgroundSize: "0% 0.5em" },
  shown: {
    backgroundSize: "100% 0.5em",
    transition: reduceMotion ? { duration: 0 } : { duration: 0.55, ease, delay: 0.3 },
  },
});

/**
 * The worries people bring to hiring someone for a website, written down on a
 * ruled sheet and crossed out one at a time, each with a note in the margin
 * saying what rules it out. Every note is a term from /pricing, not a new
 * promise. The sheet stays ivory in either theme, like paper would, and its
 * blank bottom lines run under the card that follows (see promise-card.tsx).
 */
export function Pains() {
  const { locale, t } = useLocale();
  const reduceMotion = useReducedMotion();

  return (
    <section
      data-nav-tone="dark"
      aria-labelledby="pains-title"
      className="dark bg-background text-foreground overflow-hidden px-4 sm:px-6"
    >
      <div className="mx-auto max-w-3xl pt-24 text-center sm:pt-32">
        <h2
          id="pains-title"
          className="text-[34px] leading-[1.15] font-medium tracking-[-0.025em] text-balance sm:text-[48px] lg:text-[54px]"
        >
          {t.pains.title}
        </h2>
        <p className="text-muted-foreground mt-4 text-[17px]">{t.pains.sub}</p>
      </div>

      <div
        data-nav-tone="light"
        className="paper bg-background text-foreground relative mx-auto mt-12 max-w-[780px] rounded-t-[28px] px-5 pt-6 pb-[150px] sm:mt-14 sm:px-10 sm:pt-8 sm:pb-[210px]"
      >
        {/* The margin rule of a ledger page: numbers to its left, entries to its right. */}
        <span
          aria-hidden
          className="bg-brand/35 absolute top-0 bottom-0 left-[52px] w-px sm:left-[84px]"
        />

        {/* Keyed by language, so switching it writes the sheet out again,
            crossings and all, instead of swapping in text that never animated. */}
        <motion.ol
          key={locale}
          aria-label={t.pains.notesLabel}
          variants={sheet}
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.3 }}
        >
          {t.pains.notes.map((note, i) => (
            <motion.li
              key={note.worry}
              variants={row}
              className="border-line grid grid-cols-[32px_1fr] items-baseline gap-x-4 border-b py-4 sm:grid-cols-[44px_1fr_auto] sm:gap-x-6 sm:py-5"
            >
              <span className="text-muted-foreground font-mono text-[12px] tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-[16px] leading-snug text-pretty sm:text-[18px]">
                <motion.span variants={strike(reduceMotion)} className="strike">
                  {note.worry}
                </motion.span>
                <span className="sr-only">: </span>
              </p>
              <motion.p
                variants={answer}
                className={cn(
                  "font-hand text-brand col-start-2 mt-1.5 -rotate-1 text-[16px] leading-tight",
                  "sm:col-start-3 sm:mt-0 sm:text-end sm:text-[17px]",
                )}
              >
                {note.answer}
              </motion.p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
