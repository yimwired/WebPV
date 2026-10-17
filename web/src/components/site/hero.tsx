"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { withCounts } from "@/lib/counts";
import { useLocale } from "@/lib/i18n";
import { thaiWrap } from "@/lib/thai-text";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

export function Hero() {
  const { locale, t } = useLocale();

  // every count and price here is filled from the data it describes
  const facts = t.hero.facts.map((f) => withCounts(f.value));

  return (
    <section
      id="top"
      className="mx-auto flex min-h-[84svh] max-w-6xl flex-col justify-center px-5 pt-24 pb-10 sm:px-8"
    >
      <motion.div variants={container} initial="hidden" animate="visible">
        <motion.p variants={item} className="spec">
          {t.hero.name} · {t.hero.location}
        </motion.p>

        {/*
          The headline does not animate, and that is a performance decision
          rather than a stylistic one. It is the largest thing above the fold,
          so the browser times the page by it, and every entrance - even one
          that only moves and never fades - has to wait for hydration before it
          can run. On a throttled phone that put the largest paint at 3.9s for
          text that was in the HTML the whole time. Everything around it still
          staggers in; the heading is simply already there.
        */}
        <h1 className="mt-5 max-w-4xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl">
          {locale === "th" ? thaiWrap(t.hero.headline) : t.hero.headline}
        </h1>

        <motion.p
          variants={item}
          className="text-muted-foreground mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg"
        >
          {withCounts(t.hero.sub)}
        </motion.p>

        {/* Try first, then the price: the two questions a buyer arrives with.
            Getting in touch stays in the navbar, which is always on screen. */}
        <motion.div variants={item} className="mt-9 flex flex-wrap gap-3">
          <a
            href="#lab"
            className="group bg-foreground text-background inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90"
          >
            {t.hero.tryLabs}
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </a>
          <Link
            href="/pricing"
            className="border-line-strong text-foreground/90 hover:border-foreground/40 hover:text-foreground inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors"
          >
            {t.hero.seePricing}
          </Link>
        </motion.div>

        {/* Measured facts, not adjectives. Each one is checkable on this site:
            the demos in The Lab, the packages on /pricing, the work below. */}
        <motion.dl
          variants={item}
          className="border-line mt-16 grid grid-cols-2 gap-px border-t sm:grid-cols-4"
        >
          {t.hero.facts.map((f, i) => (
            <div key={f.label} className="pt-5">
              <dt className="text-2xl font-semibold tracking-tight tabular-nums">
                {facts[i]}
              </dt>
              <dd className="text-muted-foreground mt-1 text-sm">{f.label}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}
