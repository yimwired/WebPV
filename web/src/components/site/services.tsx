"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { lighthouse } from "@/lib/lighthouse";
import { Reveal } from "./reveal";

export function Services() {
  const { t } = useLocale();
  const s = t.services;

  return (
    <section
      id="services"
      className="mx-auto max-w-6xl px-5 pb-8 pt-32 sm:px-8 sm:pt-40"
    >
      <Reveal>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {s.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{s.sub}</p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {s.offerings.map((o, i) => (
          <Reveal key={o.title} delay={i * 0.05}>
            <article className="border-line flex h-full flex-col rounded-lg border p-6 sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight">
                {o.title}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {o.blurb}
              </p>

              <ul className="mt-6 space-y-2.5">
                {o.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm">
                    <Check className="text-brand mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-foreground/80">{p}</span>
                  </li>
                ))}
              </ul>

              <p className="border-line text-muted-foreground mt-auto border-t pt-4 text-sm">
                {o.timeline}
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-20">
        <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {s.processTitle}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-[62ch] leading-relaxed">
              {s.processSub}
            </p>
          </div>

          {/* A rail, not a second card grid: the offerings above are already
              a grid, and here the order is the message. The one amber mark
              is the moment the client commits, which is the only state
              change on the timeline. */}
          {/* Indented on phones so the numbers, which straddle the hairline,
              line up with the page gutter instead of crowding the edge. */}
          <div className="border-line ml-4 max-w-2xl border-l lg:ml-0">
            <ProcessSteps steps={s.process.before} start={1} />

            <div className="relative py-9 pl-8">
              <span
                aria-hidden
                className="bg-brand absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              />
              <span className="spec text-brand">{s.process.deal}</span>
            </div>

            <ProcessSteps
              steps={s.process.after}
              start={s.process.before.length + 1}
            />
          </div>
        </div>
      </Reveal>

      {/* The page claims speed and accessibility get measured rather than
          assumed, so it shows what this site scores. Worst-of, not best-of:
          a visitor lands on one page and it might be the slow one. Numbers
          come from lib/lighthouse.ts, which only a production run writes. */}
      <Reveal className="border-line mt-20 border-t pt-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {s.proof.title}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-xl leading-relaxed">
          {s.proof.sub.replace("{routes}", String(lighthouse.routes))}
        </p>

        <dl className="border-line mt-8 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-lg border bg-[var(--line)] sm:grid-cols-4">
          {(
            [
              ["performance", lighthouse.lowest.performance],
              ["accessibility", lighthouse.lowest.accessibility],
              ["bestPractices", lighthouse.lowest.bestPractices],
              ["seo", lighthouse.lowest.seo],
            ] as const
          ).map(([key, score]) => (
            <div key={key} className="bg-background px-5 py-5">
              <dt className="spec">{s.proof.labels[key]}</dt>
              {/* tabular figures so the row of scores lines up on its digits */}
              <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {score}
                <span className="text-muted-foreground ml-1 text-base font-normal">
                  /100
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="text-muted-foreground mt-4 text-sm">
          {s.proof.measured.replace("{date}", lighthouse.measuredAt)}
        </p>
      </Reveal>

      <Reveal className="border-line mt-20 border-t pt-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {s.ctaTitle}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-md">{s.ctaSub}</p>
        {/* This page states scope and timeline but no numbers, so the reader
            who is ready to see prices had only the navbar to get there. */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#contact"
            className="bg-foreground text-background inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90"
          >
            {s.ctaButton}
          </a>
          <Link
            href="/pricing"
            className="border-line-strong text-foreground/90 hover:border-foreground/40 hover:text-foreground inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors"
          >
            {s.ctaPricing}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/**
 * One run of numbered steps on the process rail. Split into two runs so the
 * deal marker can sit between them while the numbering stays continuous.
 */
function ProcessSteps({
  steps,
  start,
}: {
  steps: readonly { h: string; p: string }[];
  start: number;
}) {
  return (
    <ol start={start} className="space-y-9">
      {steps.map((step, i) => (
        <li key={step.h} className="relative pl-8">
          {/* Sits on the hairline and paints over it, so the rail reads as
              one line passing behind each number. */}
          <span
            aria-hidden
            className="text-muted-foreground bg-background absolute left-0 top-0 w-8 -translate-x-1/2 text-center font-mono text-xs leading-6"
          >
            {String(start + i).padStart(2, "0")}
          </span>
          <h3 className="font-semibold leading-6 tracking-tight">{step.h}</h3>
          <p className="text-muted-foreground mt-2 max-w-[62ch] text-sm leading-relaxed">
            {step.p}
          </p>
        </li>
      ))}
    </ol>
  );
}
