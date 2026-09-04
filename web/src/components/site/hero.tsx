"use client";

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

  // the headline count stays honest as projects.ts grows
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

        <motion.h1
          variants={item}
          className="mt-5 max-w-4xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl"
        >
          {locale === "th" ? thaiWrap(t.hero.headline) : t.hero.headline}
        </motion.h1>

        <motion.p
          variants={item}
          className="text-muted-foreground mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg"
        >
          {withCounts(t.hero.sub)}
        </motion.p>

        <motion.div variants={item} className="mt-9 flex flex-wrap gap-3">
          <a
            href="#work"
            className="group bg-foreground text-background inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90"
          >
            {t.hero.viewWork}
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </a>
          <a
            href="#contact"
            className="border-line-strong text-foreground/90 hover:border-foreground/40 hover:text-foreground inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors"
          >
            {t.hero.contact}
          </a>
        </motion.div>

        {/* Measured facts, not adjectives. Every number is traceable to a
            project on this page. */}
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
