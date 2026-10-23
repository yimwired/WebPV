"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { withCounts } from "@/lib/counts";
import { labBySlug } from "@/lib/labs";
import { labCardSrc, labStillSrc } from "@/lib/lab-images";
import {
  carePlans,
  currentPrice,
  introOffer,
  isPriced,
  onLaunchPrice,
  pricingTiers,
  type CarePlan,
  type PricedTier,
  type PricingTier,
} from "@/lib/pricing";
import { FASTWORK_URL } from "@/lib/site";
import { useLocale } from "@/lib/i18n";
import { thaiWrap } from "@/lib/thai-text";
import { cn } from "@/lib/utils";
import { LabPicture } from "./lab-picture";
import { pillPrimary, pillSecondary } from "./pill";
import { Reveal } from "./reveal";
import { SpecRows } from "./spec-rows";

// The four designed packages make one ladder of rising prices. Quick page and
// the quoted tier are the two ways off it: cheaper and faster, or not a website.
const ladder = pricingTiers.filter(isPriced).filter((tier) => tier.id !== "quick");
const quickPage = pricingTiers.filter(isPriced).find((tier) => tier.id === "quick");
const quoted = pricingTiers.find((tier) => !isPriced(tier));

// Quick page buys any Lab style used as it already looks, so it shows several
// rather than one demo. Upright stills, the ones the home page floats.
const QUICK_PAGE_STYLES = ["counter", "trellis", "gaze", "longtail"];

const sectionTitle =
  "text-[32px] leading-[1.15] font-medium tracking-[-0.025em] text-balance sm:text-[44px] lg:text-[48px]";

// Pills keep to one line on the home page; a card's call to action can be a
// long one ("Talk about a Signature build"), so here it may wrap and grow.
const cardAction = "h-auto min-h-12 w-full py-3 text-center whitespace-normal";

/**
 * The packages and their terms, in the home page's language: the headline
 * with the launch offer on a plate, the ladder with the one recommended
 * package set in midnight, what every package includes as a receipt on a
 * midnight band, the care plans, then the questions with a way to ask.
 */
export function Pricing() {
  const { t, locale } = useLocale();
  const p = t.pricing;
  const isThai = locale === "th";
  // Headings keep each Thai word whole and break only where the copy allows.
  const wrap = (text: string) => (isThai ? thaiWrap(text) : text);

  return (
    <>
      <section aria-labelledby="pricing-title" className="px-5 pt-32 pb-16 sm:px-8 sm:pt-36 sm:pb-20">
        <Reveal immediate className="mx-auto max-w-[760px] text-center">
          <h1
            id="pricing-title"
            className={cn(
              "font-medium tracking-[-0.025em] text-balance",
              isThai
                ? "text-[36px] leading-[1.22] sm:text-[50px] lg:text-[58px]"
                : "text-[40px] leading-[1.06] sm:text-[56px] lg:text-[66px]",
            )}
          >
            {wrap(p.title)}
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-[36rem] text-[17px] leading-relaxed text-pretty sm:text-lg">
            {p.sub}
          </p>
        </Reveal>

        {/* The launch offer as a figure and its terms, on the same kind of
            plate the home page reads its figures from. */}
        {introOffer.active && (
          <Reveal immediate className="mx-auto mt-10 max-w-[640px]">
            <div className="border-line bg-card grid rounded-[22px] border sm:grid-cols-[auto_minmax(0,1fr)]">
              <p className="border-line flex flex-col items-center justify-center px-8 py-5 sm:border-e">
                <span className="text-brand text-[40px] leading-none tracking-tight tabular-nums">
                  −{introOffer.percentOff}%
                </span>
                <span className="text-muted-foreground mt-1.5 text-[13px]">{p.introBadge}</span>
              </p>
              <p className="border-line border-t px-6 py-5 text-[15px] leading-relaxed text-pretty sm:border-t-0">
                {p.introNote}
              </p>
            </div>
          </Reveal>
        )}
      </section>

      <section aria-labelledby="packages-title" className="px-5 pb-24 sm:px-8 sm:pb-28">
        <h2 id="packages-title" className="sr-only">
          {t.showcase.packages}
        </h2>
        {/* Two up at tablet, all four only once a column is wide enough for a
            price to sit on one line; past ~1300px the lines inside a card get
            too long to track, so the ladder stops growing there. */}
        <div className="mx-auto grid max-w-[1320px] gap-5 md:grid-cols-2 xl:grid-cols-4">
          {ladder.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 0.05} className="h-full">
              <TierCard tier={tier} />
            </Reveal>
          ))}
        </div>

        <div className="mx-auto mt-5 grid max-w-[1320px] gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {quickPage && (
            <Reveal className="h-full">
              <QuickPageCard tier={quickPage} />
            </Reveal>
          )}
          {quoted && (
            <Reveal delay={0.05} className="h-full">
              <QuotedCard tier={quoted} />
            </Reveal>
          )}
        </div>
      </section>

      {/* What comes with every package, set as a receipt on a pearl sheet: each
          line marked included, and what they add to the price, which is
          nothing. The home page's "฿0 to try them all" in the same hand. */}
      <section
        data-nav-tone="dark"
        aria-labelledby="included-title"
        className="dark bg-background text-foreground px-5 py-24 sm:px-8 sm:py-28"
      >
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="included-title" className={sectionTitle}>
            {wrap(p.includedTitle)}
          </h2>
        </Reveal>
        <Reveal className="mx-auto mt-12 max-w-[560px]">
          <div
            data-nav-tone="light"
            className="paper bg-background text-foreground shadow-float rounded-[20px] px-6 py-7 sm:px-9 sm:py-9"
          >
            <SpecRows
              specs={p.included.map((item) => ({
                label: item,
                value: <span className="text-brand">{p.includedValue}</span>,
              }))}
            />
            <div className="border-line-strong mt-3 flex items-baseline justify-between gap-4 border-t-2 border-dashed pt-5">
              <span className="text-[15px] font-medium">{p.includedTotal}</span>
              <span className="text-[30px] leading-none font-medium tracking-tight tabular-nums">฿0</span>
            </div>
          </div>
        </Reveal>
      </section>

      <section aria-labelledby="care-title" className="px-5 py-24 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-2xl">
            <h2 id="care-title" className={sectionTitle}>
              {wrap(p.careTitle)}
            </h2>
            <p className="text-muted-foreground mt-4 text-[17px] leading-relaxed text-pretty">
              {p.careSub}
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {carePlans.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 0.05} className="h-full">
                <CarePlanCard plan={plan} />
              </Reveal>
            ))}
          </div>
          <p className="text-muted-foreground mt-5 text-[14px]">{p.careNote}</p>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="px-5 sm:px-8">
        <div className="border-line mx-auto grid max-w-[1180px] gap-12 border-t pt-20 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div>
            <Reveal>
              <h2 id="faq-title" className={sectionTitle}>
                {wrap(p.faqTitle)}
              </h2>
            </Reveal>
            {/* Native disclosure: it opens with a tap, Enter or Space, and a
                screen reader announces it, without a line of script. */}
            <Reveal className="border-line mt-8 border-t">
              {p.faq.map((item) => (
                <details key={item.q} className="group border-line border-b">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Plus
                      aria-hidden
                      className="text-muted-foreground h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-45"
                    />
                  </summary>
                  <p className="text-muted-foreground max-w-[62ch] pb-6 text-[15px] leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </Reveal>
          </div>

          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <div className="bg-surface rounded-[28px] p-7 sm:p-8">
              <h3 className="text-[24px] leading-tight font-medium tracking-[-0.015em]">{p.ctaTitle}</h3>
              <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed">{p.ctaSub}</p>
              <div className="mt-6 flex flex-col gap-3">
                <a href="#contact" className={pillPrimary}>
                  {t.nav.cta}
                </a>
                <Link href="/labs" className={pillSecondary}>
                  {p.ctaSecondary}
                </Link>
              </div>
              <p className="text-muted-foreground mt-5 text-[13px] leading-relaxed">{withCounts(p.proof)}</p>

              {/* Escrow is the objection this answers: a stranger's bank
                  transfer is the riskiest-feeling step of hiring online. A
                  line of text rather than a third button, so it never
                  competes with asking for a quote. */}
              {FASTWORK_URL !== null && (
                <p className="text-muted-foreground mt-3 text-[13px] leading-relaxed">
                  {p.fastworkNote}{" "}
                  <a
                    href={FASTWORK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand -my-2 inline-flex items-center gap-1 py-2 font-medium hover:underline"
                  >
                    {p.fastworkLink}
                    <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                  </a>
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/** The figure a card is sold at, with the list price struck beside the launch one. */
function Price({ tier }: { tier: PricedTier }) {
  const { t } = useLocale();
  const p = t.pricing;

  return (
    <div className="mt-6">
      <p className="flex items-baseline gap-1 text-[40px] leading-none font-medium tracking-[-0.02em] tabular-nums">
        <span className="text-muted-foreground text-[22px] font-normal">฿</span>
        {currentPrice(tier)}
      </p>
      {onLaunchPrice(tier) && (
        <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[13px]">
          <span className="text-brand font-medium">{p.introBadge}</span>
          <s className="text-muted-foreground tabular-nums">
            <span className="sr-only">{p.regularPrice} </span>฿{tier.price}
          </s>
        </p>
      )}
    </div>
  );
}

function Points({ points }: { points: readonly string[] }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-2.5 text-[14px] leading-snug">
          <Check aria-hidden className="text-brand mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} />
          {point}
        </li>
      ))}
    </ul>
  );
}

/**
 * A package on the ladder, led by the demo it builds: the cards sell a site
 * you can open, so each shows one. The recommended package is set in
 * midnight, the way a dark section is, which makes it the one card that
 * stands forward without a badge doing all the work.
 */
function TierCard({ tier }: { tier: PricedTier }) {
  const { t } = useLocale();
  const p = t.pricing;
  const copy = p.tiers[tier.id];
  const demoSlug = tier.demoHref?.split("/").pop();

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[24px] p-2.5",
        tier.featured
          ? "dark bg-background text-foreground shadow-float"
          : "border-line bg-card border",
      )}
    >
      {/* The picture is the way into the demo, and says so on its face: the
          label is the link's name, so a screen reader and a thumb meet the
          same "See it live" in one place rather than two. */}
      {tier.demoHref && demoSlug && (
        <Link
          href={tier.demoHref}
          className="group bg-surface relative block aspect-[16/10] overflow-hidden rounded-[16px]"
        >
          <Image
            src={labCardSrc(demoSlug)}
            alt=""
            fill
            sizes="(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 310px"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="bg-card text-foreground shadow-float absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium">
            {p.seeDemo}
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      <div className="flex flex-1 flex-col px-4 pt-5 pb-3 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[22px] leading-tight font-medium tracking-[-0.015em]">{copy.name}</h3>
            <p className="text-muted-foreground mt-1 text-[14px]">{copy.forWho}</p>
          </div>
          {tier.featured && (
            <span className="text-brand border-brand/50 shrink-0 rounded-full border px-2.5 py-1 text-[12px] font-medium">
              {p.recommended}
            </span>
          )}
        </div>

        <Price tier={tier} />
        <p className="text-muted-foreground mt-4 text-[15px] leading-relaxed text-pretty">{copy.blurb}</p>
        <Points points={copy.points} />

        <div className="mt-auto pt-7">
          <a href="#contact" className={cn(tier.featured ? pillPrimary : pillSecondary, cardAction)}>
            {copy.cta}
          </a>
          <SpecRows className="mt-3" specs={[{ label: t.showcase.stats.time, value: copy.timeline }]} />
        </div>
      </div>
    </article>
  );
}

/** Quick page: any Lab style as it already looks, so a few of them beside the terms. */
function QuickPageCard({ tier }: { tier: PricedTier }) {
  const { t } = useLocale();
  const p = t.pricing;
  const copy = p.tiers[tier.id];

  return (
    <article className="border-line bg-card grid h-full gap-8 rounded-[24px] border p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
      <div className="flex flex-col">
        <h3 className="text-[22px] leading-tight font-medium tracking-[-0.015em]">{copy.name}</h3>
        <p className="text-muted-foreground mt-1 text-[14px]">{copy.forWho}</p>
        <Price tier={tier} />
        <p className="text-muted-foreground mt-4 max-w-xl text-[15px] leading-relaxed text-pretty">{copy.blurb}</p>
        <Points points={copy.points} />
        <div className="mt-auto pt-7">
          <a href="#contact" className={cn(pillSecondary, "w-full sm:w-auto")}>
            {copy.cta}
          </a>
          <SpecRows className="mt-3 max-w-sm" specs={[{ label: t.showcase.stats.time, value: copy.timeline }]} />
        </div>
      </div>

      <div className="self-start">
        <ul aria-hidden className="grid grid-cols-2 gap-2.5">
          {QUICK_PAGE_STYLES.map((slug) => {
            const lab = labBySlug(slug);
            return (
              <li key={slug}>
                <LabPicture
                  lab={lab}
                  src={labStillSrc(slug)}
                  sizes="(max-width: 768px) 40vw, 112px"
                  className="aspect-[4/5] rounded-[12px]"
                />
              </li>
            );
          })}
        </ul>
        <Link
          href="/labs"
          className="group text-foreground mt-3 inline-flex items-center gap-1 py-1 text-[14px] font-medium underline decoration-1 underline-offset-4"
        >
          {p.ctaSecondary}
          <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

/** The quoted tier: not a website, so a scope and a conversation instead of a figure. */
function QuotedCard({ tier }: { tier: PricingTier }) {
  const { t } = useLocale();
  const p = t.pricing;
  const copy = p.tiers[tier.id];

  return (
    <article className="bg-surface flex h-full flex-col rounded-[24px] p-6 sm:p-8">
      <h3 className="text-[22px] leading-tight font-medium tracking-[-0.015em]">{copy.name}</h3>
      <p className="text-muted-foreground mt-1 text-[14px]">{copy.forWho}</p>
      <p className="mt-6 text-[28px] leading-none font-medium tracking-[-0.02em]">{p.perProject}</p>
      <p className="text-muted-foreground mt-4 text-[15px] leading-relaxed text-pretty">{copy.blurb}</p>
      <Points points={copy.points} />
      <div className="mt-auto pt-7">
        <a href="#contact" className={cn(pillSecondary, cardAction)}>
          {copy.cta}
        </a>
        <SpecRows className="mt-3" specs={[{ label: t.showcase.stats.time, value: copy.timeline }]} />
      </div>
    </article>
  );
}

// Upkeep sold after handover. No call to action of its own: these get offered
// on the day a site goes live, so the card only has to make the offer legible.
function CarePlanCard({ plan }: { plan: CarePlan }) {
  const { t } = useLocale();
  const p = t.pricing;
  const copy = p.carePlans[plan.id];

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[24px] p-6 sm:p-8",
        plan.featured ? "bg-surface" : "border-line bg-card border",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h3 className="text-[22px] leading-tight font-medium tracking-[-0.015em]">{copy.name}</h3>
          <p className="text-muted-foreground mt-1 text-[14px]">{copy.forWho}</p>
        </div>
        <p className="flex items-baseline gap-1 text-[28px] leading-none font-medium tracking-tight tabular-nums">
          <span className="text-muted-foreground text-[17px] font-normal">฿</span>
          {plan.price}
          <span className="text-muted-foreground ml-1 text-[14px] font-normal">{p.carePer}</span>
        </p>
      </div>
      <Points points={copy.points} />
    </article>
  );
}
