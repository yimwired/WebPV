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

export function Hero() {
  const { locale, t } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const isThai = locale === "th";
  const wrap = (text: string) => (isThai ? thaiWrap(text) : text);
  const { lead, hand, tail } = t.hero.headline;

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
          Motion has to wait for hydration before it can run. The handwritten
          word animates in CSS instead, which starts with the first paint.
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
          {wrap(lead)}
          <span className="font-hand hand-write text-brand relative mx-[0.04em] -rotate-3 text-[1.12em] leading-none font-medium">
            {hand}
          </span>
          {wrap(tail)}
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

          {/* fastwork.com counts down to its launch in four tiles; these four
              are the numbers a buyer checks, each one filled from the data it
              describes. The label is the term and the number its value, so
              the order is flipped on screen and not in the markup. */}
          <motion.dl
            variants={item}
            className="mt-9 grid w-full max-w-[34rem] grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {t.hero.facts.map((fact) => (
              <div
                key={fact.label}
                className="bg-surface flex flex-col-reverse items-center justify-center rounded-[20px] px-3 py-4 sm:aspect-square sm:py-0"
              >
                <dt className="text-muted-foreground mt-1.5 text-[13px] leading-snug">
                  {fact.label}
                </dt>
                <dd className="text-[34px] leading-none tracking-tight tabular-nums sm:text-[38px]">
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
