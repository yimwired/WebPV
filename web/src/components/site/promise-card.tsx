"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { withCounts } from "@/lib/counts";
import { prefersReducedMotion } from "@/lib/reduced-motion";
import { labCardSrc } from "@/lib/lab-images";
import { pricedTier, priceValue } from "@/lib/pricing";
import { resolvedCategories } from "@/lib/showcase";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Sweep } from "./marks";

const ease = [0.22, 1, 0.36, 1] as const;
const once = { once: true, margin: "-80px" } as const;

// The quote in the second step is the real Standard package, split the way
// /pricing says Standard is paid: half to start, half on launch day.
const standardTotal = priceValue(pricedTier("standard"));
const formatBaht = (amount: number) => `฿${amount.toLocaleString("en-US")}`;

const TAB_INTERVAL_MS = 2600;

/**
 * A browser with three demos open, flicking between its tabs on its own, over
 * the line that says what trying all of them costs. The tabs only turn while
 * the window is on screen, and not at all under reduced motion.
 */
function TryArt() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame, { margin: "-80px" });
  const tabs = resolvedCategories.slice(0, 3).map((category) => category.labs[0]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    const timer = window.setInterval(
      () => setActive((index) => (index + 1) % tabs.length),
      TAB_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [reduceMotion, inView, tabs.length]);

  return (
    <div ref={frame} aria-hidden className="mx-auto w-full max-w-[360px]">
      <div className="border-line bg-card shadow-float overflow-hidden rounded-[16px] border">
        <div className="bg-surface flex gap-1 px-2 pt-2">
          {tabs.map((lab, i) => (
            <span
              key={lab.slug}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-1.5 rounded-t-[9px] px-2.5 py-1.5 text-[11.5px] transition-colors duration-300",
                i === active ? "bg-card text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300",
                  i === active ? "bg-brand" : "bg-line-strong",
                )}
              />
              <span className="truncate">{lab.name}</span>
            </span>
          ))}
        </div>
        <div className="relative aspect-[16/10]">
          {tabs.map((lab, i) => (
            <Image
              key={lab.slug}
              src={labCardSrc(lab.slug)}
              alt=""
              fill
              sizes="360px"
              className={cn(
                "object-cover object-top transition-opacity duration-500",
                i === active ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
        </div>
      </div>

      {/* A line off a receipt rather than a headline number: the total for
          trying every demo, read across a dotted leader. */}
      <div className="mt-5 flex items-baseline gap-2 text-[14px]">
        <span className="text-muted-foreground">
          {withCounts(t.promise.rows.tryFirst.from)}
        </span>
        <span className="border-line-strong mb-1 flex-1 border-b border-dotted" />
        <span className="text-[22px] leading-none font-medium tabular-nums">
          ฿0
        </span>
      </div>
      <p className="text-muted-foreground mt-1.5 text-end text-[12.5px]">
        {t.promise.rows.tryFirst.to}
      </p>
    </div>
  );
}

/** The quote that answers a first message: the real package, deposit paid. */
function QuoteArt() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const copy = t.promise.rows.fixedPrice;
  const half = standardTotal / 2;

  return (
    <div
      aria-hidden
      className="border-line bg-card shadow-float mx-auto w-full max-w-[360px] rounded-[16px] border p-5"
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
          transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease, delay: 0.5 }}
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
    </div>
  );
}

/** The build, ticked off in order: the terms that come with every package. */
function BuildArt() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();

  return (
    <ol
      aria-hidden
      className="border-line bg-card shadow-float divide-line mx-auto w-full max-w-[360px] divide-y rounded-[16px] border px-5 py-2"
    >
      {t.promise.rows.build.checklist.map((line, i) => (
        <li key={line} className="flex items-center gap-3 py-3 text-[14px]">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={once}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 22, delay: 0.3 + i * 0.32 }
            }
            className="bg-brand text-card grid h-5 w-5 shrink-0 place-items-center rounded-full"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </motion.span>
          {line}
        </li>
      ))}
    </ol>
  );
}

function Step({
  index,
  label,
  art,
  title,
  body,
  link,
}: {
  index: number;
  label: string;
  art: ReactNode;
  title: { lead: string; mark: string; tail: string };
  body: string;
  link: ReactNode;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={once}
      transition={{ duration: 0.6, ease, delay: index * 0.12 }}
      className="flex flex-col"
    >
      {/* The step's number and name on a gold rule that runs on into the
          next column, so the three read as one line of work. */}
      <div className="flex items-center gap-3">
        <span className="text-brand font-mono text-[12px] tracking-[0.04em] tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-[14px] font-medium">{label}</span>
        <span aria-hidden className="bg-brand/35 h-px flex-1" />
      </div>

      {/* One height for all three pictures, so the titles under them line up. */}
      <div className="mt-8 flex items-center lg:min-h-[336px]">{art}</div>

      <h3 className="mt-8 text-[23px] leading-[1.25] font-medium tracking-[-0.02em] text-balance sm:text-[26px]">
        {title.lead}
        <Sweep>{title.mark}</Sweep>
        {title.tail}
      </h3>
      <p className="text-muted-foreground mt-3 text-[16px] leading-relaxed text-pretty">
        {body}
      </p>
      {link}
    </motion.li>
  );
}

// py-1 lifts the target past the 24px floor.
const stepLink =
  "group text-foreground mt-4 inline-flex w-fit items-center gap-1 py-1 text-[15px] font-medium underline decoration-1 underline-offset-4";

function StepLink({ href, children }: { href: string; children: ReactNode }) {
  const chevron = (
    <ChevronRight
      aria-hidden
      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
    />
  );
  return href.startsWith("#") ? (
    <a href={href} className={stepLink}>
      {children}
      {chevron}
    </a>
  ) : (
    <Link href={href} className={stepLink}>
      {children}
      {chevron}
    </Link>
  );
}

/**
 * The card that rises over the ledger of worries and lays out the heading's
 * three steps side by side. It starts a little narrower than the screen, so
 * the ground shows round it, and widens to the full width as it comes up.
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
  const [tryLabel, priceLabel, buildLabel] = t.promise.steps;

  return (
    <section aria-labelledby="promise-title" className="bg-zone-dark">
      <motion.div
        ref={card}
        data-nav-tone="light"
        style={{ scale, borderRadius: radius }}
        className="bg-card text-card-foreground relative z-10 -mt-28 origin-top rounded-[32px] px-5 pt-20 pb-16 sm:-mt-40 sm:px-10 sm:pt-28 sm:pb-24"
      >
        {/* The whole process in three steps, the first one gilded: it is the
            step nobody else offers. The columns below take them in order. */}
        <h2
          id="promise-title"
          className="mx-auto max-w-4xl text-center text-[32px] leading-[1.18] font-medium tracking-[-0.025em] text-balance sm:text-[46px] lg:text-[52px]"
        >
          <Sweep>{t.promise.title.mark}</Sweep>
          {t.promise.title.rest}
        </h2>

        <ol className="mx-auto mt-14 grid max-w-[1180px] gap-x-10 gap-y-20 sm:mt-20 lg:grid-cols-3">
          <Step
            index={0}
            label={tryLabel}
            art={<TryArt />}
            title={rows.tryFirst.title}
            body={rows.tryFirst.body}
            link={<StepLink href="#showcase">{t.hero.tryLabs}</StepLink>}
          />
          <Step
            index={1}
            label={priceLabel}
            art={<QuoteArt />}
            title={rows.fixedPrice.title}
            body={withCounts(rows.fixedPrice.body)}
            link={<StepLink href="/pricing">{t.hero.seePricing}</StepLink>}
          />
          <Step
            index={2}
            label={buildLabel}
            art={<BuildArt />}
            title={rows.build.title}
            body={rows.build.body}
            link={<StepLink href="#contact">{t.nav.cta}</StepLink>}
          />
        </ol>
      </motion.div>
    </section>
  );
}
