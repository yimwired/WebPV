"use client";

import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { pricingTiers, type PricingTier } from "@/lib/pricing";
import { thaiWrap } from "@/lib/thai-text";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function Pricing() {
  const { t, locale } = useLocale();
  const p = t.pricing;

  const packages = pricingTiers.filter((tier) => tier.price !== null);
  const quoted = pricingTiers.filter((tier) => tier.price === null);

  return (
    <section
      id="pricing"
      className="mx-auto max-w-6xl px-5 pb-8 pt-32 sm:px-8 sm:pt-40"
    >
      <Reveal>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {locale === "th" ? thaiWrap(p.title) : p.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{p.sub}</p>
      </Reveal>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {packages.map((tier, i) => (
          <Reveal key={tier.id} delay={i * 0.05}>
            <TierCard tier={tier} />
          </Reveal>
        ))}
      </div>

      {quoted.map((tier) => (
        <Reveal key={tier.id} className="mt-5">
          <TierCard tier={tier} wide />
        </Reveal>
      ))}

      <Reveal className="border-line mt-20 border-t pt-12">
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

      <Reveal className="mt-20">
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

      <Reveal className="border-line mt-20 border-t pt-12">
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
        <p className="text-muted-foreground mt-5 text-sm">{p.proof}</p>
      </Reveal>
    </section>
  );
}

function TierCard({ tier, wide }: { tier: PricingTier; wide?: boolean }) {
  const { t } = useLocale();
  const p = t.pricing;
  const copy = p.tiers[tier.id];

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border p-6 sm:p-8",
        tier.featured ? "border-line-strong bg-surface" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{copy.name}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{copy.forWho}</p>
        </div>
        {tier.featured && (
          <span className="spec text-brand border-line-strong shrink-0 rounded-md border px-2 py-1">
            {p.recommended}
          </span>
        )}
      </div>

      <p className="mt-6 text-3xl font-semibold tracking-tight tabular-nums">
        {tier.price ? (
          <>
            <span className="text-muted-foreground mr-0.5 text-xl font-normal">
              ฿
            </span>
            {tier.price}
          </>
        ) : (
          <span className="text-muted-foreground text-xl font-normal">
            {p.perProject}
          </span>
        )}
      </p>

      <p
        className={cn(
          "mt-5 leading-relaxed text-muted-foreground",
          // the quoted card is full width, so the paragraph needs its own
          // measure or the lines get too long to track
          wide && "max-w-2xl",
        )}
      >
        {copy.blurb}
      </p>

      <ul
        className={cn(
          "mt-6 space-y-2.5",
          // the quoted tier spans the full width, so its list can too
          wide && "sm:columns-2 sm:gap-8 sm:space-y-0",
        )}
      >
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
