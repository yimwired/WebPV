"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowDown, ChevronsDown, ReceiptText } from "lucide-react";
import { withCounts } from "@/lib/counts";
import { useLocale } from "@/lib/i18n";
import { thaiWrap } from "@/lib/thai-text";
import { cn } from "@/lib/utils";
import { HeroCardBand, HeroCardCloud } from "./hero-cards";
import { pillPrimary, pillSecondary } from "./pill";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * A pen arrow for the margin note: a short stroke bowing outward, with its
 * head at the far end. Drawn pointing right; the left one is mirrored.
 */
function NoteArrow({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 56 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-[18px] w-[44px] shrink-0", className)}
    >
      <path d="M3 15C17 6 35 5 51 11" />
      <path d="M43 5L51 11L42 16" />
    </svg>
  );
}

export function Hero() {
  const { locale, t } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const isThai = locale === "th";
  const wrap = (text: string) => (isThai ? thaiWrap(text) : text);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative isolate overflow-hidden"
    >
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[640px] flex-col items-center justify-center px-5 pt-28 pb-16 text-center lg:pb-20">
        {/*
          The headline does not fade in, and that is a performance decision
          rather than a stylistic one. It is the largest thing above the fold,
          so the browser times the page by it, and an entrance driven by
          Motion has to wait for hydration before it can run.
        */}
        {/* Thai runs a size smaller: at the English size its first line
            overflows the 640px column and the headline takes three lines. */}
        <h1
          className={cn(
            "font-medium tracking-[-0.025em] text-balance",
            isThai
              ? "text-[36px] leading-[1.22] sm:text-[50px] lg:text-[58px]"
              : "text-[40px] leading-[1.06] sm:text-[56px] lg:text-[66px]",
          )}
        >
          {wrap(t.hero.headline)}
        </h1>

        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex w-full flex-col items-center"
        >
          <motion.p
            variants={item}
            className="text-muted-foreground mt-6 max-w-[34rem] text-[17px] leading-relaxed text-pretty sm:text-lg"
          >
            {withCounts(t.hero.sub)}
          </motion.p>

          {/* The four numbers a buyer checks, read off one plate like the
              spec line on a drawing, each filled from the data it describes.
              The label is the term and the number its value, so the order is
              flipped on screen and not in the markup. Two by two on a phone,
              hence the dividers that change sides at sm. */}
          <motion.dl
            variants={item}
            className="border-line bg-card mt-9 grid w-full max-w-[34rem] grid-cols-2 rounded-[22px] border sm:grid-cols-4"
          >
            {t.hero.facts.map((fact) => (
              <div
                key={fact.label}
                className="border-line flex flex-col-reverse items-center justify-center px-3 py-4 even:border-s sm:border-s sm:py-5 sm:first:border-s-0 [&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-t-0"
              >
                <dt className="text-muted-foreground mt-1.5 text-[13px] leading-snug">
                  {fact.label}
                </dt>
                <dd className="text-[30px] leading-none tracking-tight tabular-nums sm:text-[34px]">
                  {withCounts(fact.value)}
                </dd>
              </div>
            ))}
          </motion.dl>

          {/* Try first, then the price: the two questions a buyer arrives
              with. Getting in touch stays in the navbar, always on screen. */}
          <motion.div
            variants={item}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <a href="#showcase" className={cn(pillPrimary, "group")}>
              {t.hero.tryLabs}
              <ArrowDown
                aria-hidden
                className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
              />
            </a>
            <Link href="/pricing" className={pillSecondary}>
              <ReceiptText aria-hidden className="h-4 w-4" />
              {t.hero.seePricing}
            </Link>
          </motion.div>
        </motion.div>

        {/* A note in the margin, in Film's hand, pointing at the cards: out to
            both sides where they float beside the text, down where a phone
            stacks them underneath. Decorative, since the showcase that
            follows lists every one of these demos properly. */}
        <p
          aria-hidden
          className="font-hand hand-write text-brand mt-8 -rotate-2 text-[19px] leading-none sm:text-[21px]"
        >
          <span className="hidden items-center gap-3 lg:flex">
            <NoteArrow className="-scale-x-100" />
            {t.hero.note.wide}
            <NoteArrow />
          </span>
          <span className="flex items-center gap-2 lg:hidden">
            {t.hero.note.narrow}
            <NoteArrow className="rotate-[70deg]" />
          </span>
        </p>

        <HeroCardBand />
      </div>

      <HeroCardCloud target={sectionRef} />

      <p
        aria-hidden
        className="text-muted-foreground absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-sm lg:flex"
      >
        {t.hero.scrollHint}
        <ChevronsDown className="h-4 w-4" />
      </p>
    </section>
  );
}
