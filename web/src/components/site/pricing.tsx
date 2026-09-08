"use client";

import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { withCounts } from "@/lib/counts";
import { useLocale } from "@/lib/i18n";
import {
  carePlans,
  introOffer,
  pricingTiers,
  type CarePlan,
  type PricingTier,
} from "@/lib/pricing";
import { thaiWrap } from "@/lib/thai-text";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function Pricing() {
  const { t, locale } = useLocale();
  const p = t.pricing;

  // Quick page leaves the main grid on purpose. Five cards across came out at
  // 205px each, which is not enough for a Thai bullet to hold a line, and Quick
  // page is the odd one out anyway: it is the only tier that uses a Lab style
  // as it already looks instead of designing anything. It reads better beside
  // the quoted tier as one of the two ways out of the four-card ladder.
  const packages = pricingTiers.filter(
    (tier) => tier.price !== null && tier.id !== "quick",
  );
  const asides = pricingTiers.filter(
    (tier) => tier.price === null || tier.id === "quick",
  );

  return (
    <section id="pricing" className="pb-8 pt-32 sm:pt-40">
      <Reveal className="mx-auto max-w-6xl px-5 sm:px-8">
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {locale === "th" ? thaiWrap(p.title) : p.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{p.sub}</p>
        {introOffer.active && (
          <p className="border-line-strong bg-surface text-foreground/80 mt-6 max-w-2xl rounded-md border px-4 py-3 text-sm leading-relaxed">
            {p.introNote}
          </p>
        )}
      </Reveal>

      {/* the four designed packages, as one ladder of rising prices: two up at
          tablet, all four only once a column is wide enough for a price to sit
          on one line. Wider than the prose around it - the cards are the point
          of this page - but capped, since past ~1400px the lines inside a card
          get too long to track. */}
      <div className="mx-auto mt-14 grid max-w-[88rem] gap-5 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {packages.map((tier, i) => (
          <Reveal key={tier.id} delay={i * 0.05}>
            <TierCard tier={tier} />
          </Reveal>
        ))}
      </div>

      {/* the two ways off that ladder: cheaper and faster, or quoted per
          project. Half width each, so the longer copy in them has a measure */}
      <div className="mx-auto mt-10 grid max-w-[88rem] gap-5 px-5 sm:px-8 lg:grid-cols-2">
        {asides.map((tier, i) => (
          <Reveal key={tier.id} delay={i * 0.05}>
            <TierCard tier={tier} wide />
          </Reveal>
        ))}
      </div>

      <Reveal className="border-line mx-auto mt-20 max-w-6xl border-t px-5 pt-12 sm:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {p.includedTitle}
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {p.included.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm">
              <Check className="text-brand mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-foreground/80">{item}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="border-line mx-auto mt-20 max-w-6xl border-t px-5 pt-12 sm:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {p.careTitle}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          {p.careSub}
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {carePlans.map((plan) => (
            <CarePlanCard key={plan.id} plan={plan} />
          ))}
        </div>
        <p className="text-muted-foreground mt-5 text-sm">{p.careNote}</p>
      </Reveal>

      <Reveal className="mx-auto mt-20 max-w-6xl px-5 sm:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {p.faqTitle}
        </h2>
        <dl className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {p.faq.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold tracking-tight">{item.q}</dt>
              <dd className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal className="border-line mx-auto mt-20 max-w-6xl border-t px-5 pt-12 sm:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {p.ctaTitle}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-md">{p.ctaSub}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/#contact"
            className="bg-foreground text-background inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90"
          >
            {p.ctaButton}
          </Link>
          <Link
            href="/labs"
            className="border-line-strong text-foreground/80 hover:text-foreground inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors"
          >
            {p.ctaSecondary}
          </Link>
        </div>
        <p className="text-muted-foreground mt-5 text-sm">
          {withCounts(p.proof)}
        </p>
      </Reveal>
    </section>
  );
}

function TierCard({ tier, wide }: { tier: PricingTier; wide?: boolean }) {
  const { t } = useLocale();
  const p = t.pricing;
  const copy = p.tiers[tier.id];
  const onIntro = introOffer.active && Boolean(tier.introPrice);

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border p-6",
        // only the full-width quoted card has room for the roomier padding
        wide && "sm:p-8",
        tier.featured ? "border-line-strong bg-surface" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{copy.name}</h2>
          {/* two lines' worth of room whether the line wraps or not: the
              prices below have to sit on one row to be comparable */}
          <p className={cn("text-muted-foreground mt-1 text-sm", !wide && "min-h-10")}>
            {copy.forWho}
          </p>
        </div>
        {tier.featured && (
          <span className="spec text-brand border-line-strong shrink-0 rounded-md border px-2 py-1">
            {p.recommended}
          </span>
        )}
      </div>

      {/* the struck list price sits on the badge line, not beside the number:
          four columns leave a card too narrow for both prices in one row */}
      <div className="mt-6">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {tier.price ? (
            <>
              <span className="text-muted-foreground mr-0.5 text-xl font-normal">
                ฿
              </span>
              {onIntro ? tier.introPrice : tier.price}
            </>
          ) : (
            <span className="text-muted-foreground text-xl font-normal">
              {p.perProject}
            </span>
          )}
        </p>
        {onIntro && (
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="spec text-brand">{p.introBadge}</span>
            <s className="text-muted-foreground text-sm tabular-nums">
              <span className="sr-only">{p.regularPrice} </span>฿{tier.price}
            </s>
          </p>
        )}
      </div>

      <p className="mt-5 leading-relaxed text-muted-foreground">{copy.blurb}</p>

      <ul className="mt-6 space-y-2.5">
        {copy.points.map((point) => (
          <li
            key={point}
            className={cn(
              "flex items-start gap-2.5 text-sm",
              wide && "sm:mb-2.5 sm:break-inside-avoid",
            )}
          >
            <Check className="text-brand mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-foreground/80">{point}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <Link
          href="/#contact"
          className={cn(
            // 44px tall so it stays a comfortable target on a phone
            "flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90",
            tier.featured
              ? "bg-foreground text-background"
              : "border-line-strong text-foreground/90 hover:text-foreground border transition-colors",
            wide && "sm:inline-flex sm:w-auto",
          )}
        >
          {copy.cta}
        </Link>
      </div>

      <div className="border-line mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-muted-foreground text-sm">{copy.timeline}</p>
        {tier.demoHref && (
          <Link
            href={tier.demoHref}
            className="text-brand inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            {p.seeDemo}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}

// Upkeep sold after handover. No CTA of its own: these get offered on the day
// a site goes live, so the card only has to make the offer legible here.
function CarePlanCard({ plan }: { plan: CarePlan }) {
  const { t } = useLocale();
  const p = t.pricing;
  const copy = p.carePlans[plan.id];

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border p-6 sm:p-8",
        plan.featured ? "border-line-strong bg-surface" : "border-line",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{copy.name}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{copy.forWho}</p>
        </div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          <span className="text-muted-foreground mr-0.5 text-base font-normal">
            ฿
          </span>
          {plan.price}
          <span className="text-muted-foreground ml-1.5 text-sm font-normal">
            {p.carePer}
          </span>
        </p>
      </div>

      <ul className="mt-6 space-y-2.5">
        {copy.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm">
            <Check className="text-brand mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-foreground/80">{point}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
