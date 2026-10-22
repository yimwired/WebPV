"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ChevronRight, UserRound } from "lucide-react";
import { withCounts } from "@/lib/counts";
import { prefersReducedMotion } from "@/lib/reduced-motion";
import { labStillSrc } from "@/lib/lab-images";
import { pricingTiers } from "@/lib/pricing";
import { resolvedCategories } from "@/lib/showcase";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Sweep } from "./marks";

const ease = [0.22, 1, 0.36, 1] as const;
const once = { once: true, margin: "-80px" } as const;

// The quote in the second illustration is the real Standard package, split
// the way /pricing says Standard is paid: half to start, half on launch day.
const standard = pricingTiers.find((tier) => tier.id === "standard");
const standardTotal = Number(standard?.price?.replaceAll(",", "") ?? 0);
const formatBaht = (amount: number) => `฿${amount.toLocaleString("en-US")}`;

/** Three demos, a hand-drawn arrow, and what it costs to try all of them. */
function TryFreeArt() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const faces = resolvedCategories.slice(0, 3).map((category) => category.labs[0]);

  return (
    <div aria-hidden className="relative mx-auto h-[210px] w-full max-w-[420px]">
      <div className="absolute top-2 left-0 flex items-center gap-2.5">
        <span className="flex">
          {faces.map((lab, i) => (
            <motion.span
              key={lab.slug}
              initial={{ scale: 0.4, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={once}
              transition={{ type: "spring", stiffness: 420, damping: 24, delay: i * 0.08 }}
              className={cn(
                "ring-card relative h-8 w-8 overflow-hidden rounded-full ring-2",
                i > 0 && "-ms-2.5",
              )}
              style={{
                zIndex: faces.length - i,
                backgroundImage: `url(${labStillSrc(lab.slug)})`,
                backgroundSize: "cover",
                backgroundPosition: "top",
              }}
            />
          ))}
        </span>
        <span className="text-muted-foreground text-[13px]">
          {withCounts(t.promise.rows.tryFirst.from)}
        </span>
      </div>

      <svg
        viewBox="0 0 160 120"
        className="text-foreground absolute top-[46px] left-[14px] h-[120px] w-[160px] overflow-visible"
      >
        <motion.path
          d="M4 2C1 52 30 92 140 96"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          // Drawing a line is not a transform, so MotionConfig's reduced
          // setting leaves it running; it finishes at once here instead.
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={once}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.9, ease, delay: 0.3 }}
        />
        <motion.path
          d="M127 85L142 96L127 107"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={once}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.2, delay: 1.1 }}
        />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={once}
        transition={{ duration: 0.6, ease, delay: 1 }}
        className="absolute top-[78px] left-[188px]"
      >
        {/* Set as a figure, not handwriting: the arrow is the pen here, and
            the number it lands on reads like the total on a receipt. */}
        <span className="block text-[92px] leading-[0.9] font-light tracking-[-0.04em] tabular-nums">
          <span className="text-muted-foreground me-1 align-[0.6em] text-[0.42em] font-normal tracking-normal">
            ฿
          </span>
          0
        </span>
        <span className="text-muted-foreground mt-2 block text-[13px]">
          {t.promise.rows.tryFirst.to}
        </span>
      </motion.div>
    </div>
  );
}

/** A client's first message, then the quote that answers it, deposit paid. */
function QuoteArt() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const copy = t.promise.rows.fixedPrice;
  const half = standardTotal / 2;

  return (
    <div aria-hidden className="mx-auto w-full max-w-[440px]">
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={once}
        transition={{ duration: 0.5, ease }}
        className="flex items-start gap-2.5"
      >
        <span className="bg-surface text-muted-foreground grid h-8 w-8 shrink-0 place-items-center rounded-full">
          <UserRound className="h-4 w-4" />
        </span>
        {/* A client's message, so it keeps the same pale blue and blue ink in
            either theme, the way a chat app's colours do: 14.0:1. */}
        <p className="rounded-[18px] rounded-tl-md bg-[oklch(0.93_0.025_255)] px-4 py-2.5 text-[14px] leading-snug text-[oklch(0.225_0.05_261.7)]">
          {copy.message}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={once}
        transition={{ duration: 0.6, ease, delay: 0.35 }}
        className="border-line bg-card shadow-float ms-10 mt-4 rounded-[20px] border p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-[12px]">{copy.quote}</p>
            <p className="mt-0.5 text-[15px] font-medium">{copy.tier}</p>
          </div>
          <p className="text-[26px] leading-none tracking-tight tabular-nums">
            {formatBaht(standardTotal)}
          </p>
        </div>

        <div className="bg-surface mt-4 h-1.5 overflow-hidden rounded-full">
          <motion.div
            initial={{ width: "0%" }}
            whileInView={{ width: "50%" }}
            viewport={once}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease, delay: 0.9 }}
            className="bg-brand h-full rounded-full"
          />
        </div>

        <dl className="mt-4 space-y-2.5 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{copy.deposit}</dt>
            <dd className="flex items-center gap-2.5">
              <span className="tabular-nums">{formatBaht(half)}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-medium text-emerald-800">
                {copy.paid}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{copy.launch}</dt>
            <dd className="flex items-center gap-2.5">
              <span className="tabular-nums">{formatBaht(half)}</span>
              <span className="bg-surface text-muted-foreground rounded-full px-2 py-0.5 text-[12px] font-medium">
                {copy.due}
              </span>
            </dd>
          </div>
        </dl>
      </motion.div>
    </div>
  );
}

function PromiseRow({
  art,
  title,
  body,
  link,
}: {
  art: ReactNode;
  title: { lead: string; mark: string; tail: string };
  body: string;
  link: ReactNode;
}) {
  return (
    <div className="grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      {art}
      <div>
        <h3 className="text-[26px] leading-[1.2] font-medium tracking-[-0.02em] text-balance sm:text-[32px]">
          {title.lead}
          <Sweep>{title.mark}</Sweep>
          {title.tail}
        </h3>
        <p className="text-muted-foreground mt-4 max-w-xl text-[17px] leading-relaxed text-pretty">
          {body}
        </p>
        {link}
      </div>
    </div>
  );
}

// py-1 lifts the target past the 24px floor; mt-5 keeps it where mt-6 had it.
const rowLink =
  "group text-foreground mt-5 inline-flex items-center gap-1 py-1 text-[15px] font-medium underline decoration-1 underline-offset-4";

/**
 * The card that rises over the ledger of worries and spells out the two terms
 * that rule most of them out. It starts a little narrower than the screen, so
 * the deep blue shows round it, and widens to the full width as it comes up.
 */
export function PromiseCard() {
  const { t } = useLocale();
  const card = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: card,
    offset: ["start end", "start 0.15"],
  });
  // Under reduced motion the card rests at full width with its corners.
  const scale = useTransform(scrollYProgress, (progress) =>
    prefersReducedMotion() ? 1 : 0.94 + 0.06 * progress,
  );
  const radius = useTransform(scrollYProgress, (progress) =>
    prefersReducedMotion() || progress < 0.7 ? 32 : 32 * ((1 - progress) / 0.3),
  );
  const rows = t.promise.rows;

  return (
    <section aria-labelledby="promise-title" className="bg-zone-dark">
      <motion.div
        ref={card}
        style={{ scale, borderRadius: radius }}
        className="bg-card text-card-foreground relative z-10 -mt-28 origin-top rounded-[32px] px-5 pt-20 pb-10 sm:-mt-40 sm:px-10 sm:pt-28 sm:pb-16"
      >
        {/* The whole process in three steps, the first one gilded: it is the
            step nobody else offers, and the one the two rows below expand. */}
        <h2
          id="promise-title"
          className="mx-auto max-w-4xl text-center text-[32px] leading-[1.18] font-medium tracking-[-0.025em] text-balance sm:text-[46px] lg:text-[52px]"
        >
          <Sweep>{t.promise.title.mark}</Sweep>
          {t.promise.title.rest}
        </h2>

        <div className="divide-line mx-auto mt-10 max-w-[1080px] divide-y sm:mt-16">
          <PromiseRow
            art={<TryFreeArt />}
            title={rows.tryFirst.title}
            body={rows.tryFirst.body}
            link={
              <a href="#showcase" className={rowLink}>
                {t.hero.tryLabs}
                <ChevronRight
                  aria-hidden
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </a>
            }
          />
          <PromiseRow
            art={<QuoteArt />}
            title={rows.fixedPrice.title}
            body={withCounts(rows.fixedPrice.body)}
            link={
              <Link href="/pricing" className={rowLink}>
                {t.hero.seePricing}
                <ChevronRight
                  aria-hidden
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            }
          />
        </div>
      </motion.div>
    </section>
  );
}
