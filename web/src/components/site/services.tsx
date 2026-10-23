"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Clock3 } from "lucide-react";
import { withCounts } from "@/lib/counts";
import { labs } from "@/lib/labs";
import { labCardSrc } from "@/lib/lab-images";
import { lighthouse } from "@/lib/lighthouse";
import { resolvedCategories } from "@/lib/showcase";
import { useLocale } from "@/lib/i18n";
import { thaiWrap } from "@/lib/thai-text";
import { cn } from "@/lib/utils";
import { LabPicture } from "./lab-picture";
import { pillPrimary, pillSecondary } from "./pill";
import { Reveal } from "./reveal";
import { SpecRows } from "./spec-rows";

// Anchors for the four offerings, in the dictionary's order. The hero's plate
// links to them, so they stay the same whichever language is showing.
const OFFERING_IDS = ["websites", "automation", "dashboards", "ai"] as const;

// The two demos beside the websites offering: the lead examples of the first
// two kinds of business on the home page, so the two pages show the same work.
const [frontLab, backLab] = resolvedCategories.slice(0, 2).map((category) => category.labs[0]);

const sectionTitle =
  "text-[32px] leading-[1.15] font-medium tracking-[-0.025em] text-balance sm:text-[44px] lg:text-[48px]";

/**
 * What Film builds, laid out the way the home page reads: the headline over a
 * plate of the four kinds of work, websites at length with the demos that
 * prove them, the other three on a midnight band, then how a job runs and
 * what this site measures. The footer's form closes the page.
 */
export function Services() {
  const { locale, t } = useLocale();
  const s = t.services;
  const isThai = locale === "th";
  // Headings keep each Thai word whole and break only where the copy allows.
  const wrap = (text: string) => (isThai ? thaiWrap(text) : text);
  const [websites, ...beyondWebsites] = s.offerings;

  return (
    <>
      <section aria-labelledby="services-title" className="px-5 pt-32 pb-20 sm:px-8 sm:pt-36 sm:pb-28">
        <Reveal immediate className="mx-auto max-w-[760px] text-center">
          <h1
            id="services-title"
            className={cn(
              "font-medium tracking-[-0.025em] text-balance",
              isThai
                ? "text-[36px] leading-[1.22] sm:text-[50px] lg:text-[58px]"
                : "text-[40px] leading-[1.06] sm:text-[56px] lg:text-[66px]",
            )}
          >
            {wrap(s.title)}
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-[34rem] text-[17px] leading-relaxed text-pretty sm:text-lg">
            {s.sub}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#contact" className={pillPrimary}>
              {t.nav.cta}
            </a>
            <Link href="/pricing" className={pillSecondary}>
              {s.ctaPricing}
            </Link>
          </div>
        </Reveal>

        {/* The page's contents on one plate, the way the home page sets its
            four figures: two by two on a phone, a row of four from sm. Each
            cell jumps to its offering below. */}
        <Reveal immediate className="mx-auto mt-14 max-w-[1000px]">
          <nav aria-label={s.indexLabel}>
            <ol className="border-line bg-card grid grid-cols-2 overflow-hidden rounded-[22px] border sm:grid-cols-4">
              {s.offerings.map((offering, i) => (
                <li
                  key={offering.title}
                  className="border-line even:border-s sm:border-s sm:first:border-s-0 [&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-t-0"
                >
                  <a
                    href={`#${OFFERING_IDS[i]}`}
                    className="group hover:bg-surface flex h-full items-end justify-between gap-3 px-4 py-5 transition-colors sm:px-5 sm:py-6"
                  >
                    <span className="text-[15px] leading-snug font-medium text-pretty">{offering.title}</span>
                    <ArrowDown
                      aria-hidden
                      className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-hover:translate-y-0.5"
                    />
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </Reveal>
      </section>

      <section
        id={OFFERING_IDS[0]}
        aria-labelledby="websites-title"
        className="scroll-mt-24 px-5 pb-24 sm:px-8 sm:pb-32"
      >
        <div className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <Reveal>
            <WebsitesArt />
          </Reveal>

          <Reveal>
            <h2 id="websites-title" className={sectionTitle}>
              {wrap(websites.title)}
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xl text-[17px] leading-relaxed text-pretty">
              {websites.blurb}
            </p>
            <ul className="mt-7 space-y-3">
              {websites.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[15px]">
                  <Check aria-hidden className="text-brand mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} />
                  {point}
                </li>
              ))}
            </ul>
            <SpecRows
              className="border-line mt-8 max-w-xl border-t pt-2"
              specs={[
                { label: t.showcase.stats.from, value: withCounts("฿{fromPrice}") },
                { label: t.showcase.stats.time, value: websites.timeline },
                { label: t.showcase.stats.examples, value: String(labs.length) },
              ]}
            />
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link href="/labs" className={pillSecondary}>
                {t.hero.tryLabs}
              </Link>
              <Link
                href="/pricing"
                className="group text-foreground inline-flex items-center gap-1 py-2 text-[15px] font-medium underline decoration-1 underline-offset-4"
              >
                {s.ctaPricing}
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The other three on midnight, as rows rather than a second grid of
          cards: name, what it does, and how long it takes, read across. */}
      <section
        data-nav-tone="dark"
        aria-labelledby="beyond-title"
        className="dark bg-background text-foreground px-5 py-24 sm:px-8 sm:py-32"
      >
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-2xl">
            <h2 id="beyond-title" className={sectionTitle}>
              {wrap(s.beyond.title)}
            </h2>
            <p className="text-muted-foreground mt-4 text-[17px] leading-relaxed text-pretty">
              {s.beyond.sub}
            </p>
          </Reveal>

          <ul className="mt-14 sm:mt-16">
            {beyondWebsites.map((offering, i) => (
              <li
                key={offering.title}
                id={OFFERING_IDS[i + 1]}
                className="border-line scroll-mt-24 border-t py-10 sm:py-12"
              >
                <Reveal className="grid gap-x-12 gap-y-5 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,13rem)]">
                  <h3 className="text-[24px] leading-tight font-medium tracking-[-0.015em] text-balance">
                    {offering.title}
                  </h3>
                  <div>
                    <p className="text-muted-foreground max-w-[60ch] text-[16px] leading-relaxed text-pretty">
                      {offering.blurb}
                    </p>
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {offering.points.map((point) => (
                        <li key={point} className="border-line-strong rounded-full border px-3 py-1.5 text-[13px]">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* The clock rides inline, so it stays against the words
                      when a right-aligned timeline wraps onto two lines. */}
                  <p className="text-[14px] leading-relaxed lg:text-end">
                    <Clock3 aria-hidden className="text-brand me-1.5 inline h-4 w-4 align-[-3px]" />
                    {offering.timeline}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="process-title" className="px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 id="process-title" className={sectionTitle}>
              {wrap(s.processTitle)}
            </h2>
            <p className="text-muted-foreground mt-4 text-[17px] leading-relaxed text-pretty">
              {s.processSub}
            </p>
          </div>

          {/* A rail, not a grid: here the order is the message. The one gold
              mark is the moment the client commits, which is the only state
              change on it. Indented on phones so the numbers, which straddle
              the hairline, line up with the page gutter instead of the edge. */}
          <div className="border-line ml-4 max-w-2xl border-l lg:ml-0">
            <ProcessSteps steps={s.process.before} start={1} />

            <div className="relative py-9 pl-8">
              <span
                aria-hidden
                className="bg-brand ring-background absolute top-1/2 left-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4"
              />
              <span className="text-brand border-brand/40 inline-flex rounded-full border px-3 py-1 text-[13px] font-medium">
                {s.process.deal}
              </span>
            </div>

            <ProcessSteps steps={s.process.after} start={s.process.before.length + 1} />
          </div>
        </Reveal>
      </section>

      {/* The page claims speed and accessibility get measured rather than
          assumed, so it shows what this site scores. Worst-of, not best-of:
          a visitor lands on one page and it might be the slow one. Numbers
          come from lib/lighthouse.ts, which only a production run writes. */}
      <section
        data-nav-tone="dark"
        aria-labelledby="proof-title"
        className="dark bg-background text-foreground px-5 py-24 sm:px-8 sm:py-28"
      >
        <div className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-16">
          <Reveal>
            <h2 id="proof-title" className={sectionTitle}>
              {wrap(s.proof.title)}
            </h2>
            <p className="text-muted-foreground mt-4 text-[17px] leading-relaxed text-pretty">
              {s.proof.sub.replace("{routes}", String(lighthouse.routes))}
            </p>
          </Reveal>

          <Reveal>
            <dl className="border-line bg-card grid grid-cols-2 rounded-[22px] border sm:grid-cols-4">
              {(
                [
                  ["performance", lighthouse.lowest.performance],
                  ["accessibility", lighthouse.lowest.accessibility],
                  ["bestPractices", lighthouse.lowest.bestPractices],
                  ["seo", lighthouse.lowest.seo],
                ] as const
              ).map(([key, score]) => (
                <div
                  key={key}
                  className="border-line flex flex-col-reverse items-center justify-center px-3 py-6 even:border-s sm:border-s sm:first:border-s-0 [&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-t-0"
                >
                  <dt className="text-muted-foreground mt-2 text-center text-[13px] leading-snug">
                    {s.proof.labels[key]}
                  </dt>
                  <dd className="text-[40px] leading-none tracking-tight tabular-nums">
                    {score}
                    <span className="text-muted-foreground text-[15px]">/100</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-muted-foreground mt-4 text-[13px] leading-relaxed">
              {s.proof.measured.replace("{date}", lighthouse.measuredAt)}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/**
 * Two working demos, the second laid over the corner of the first: depth by
 * overlap, the way the rest of the site builds it, and both open the real
 * thing.
 */
function WebsitesArt() {
  const { t } = useLocale();

  return (
    <div className="relative pe-[12%] pb-[14%]">
      <Link
        href={`/labs/${backLab.slug}`}
        aria-label={t.showcase.openDemo.replace("{name}", backLab.name)}
        className="group relative block"
      >
        <LabPicture
          lab={backLab}
          src={labCardSrc(backLab.slug)}
          sizes="(max-width: 1024px) 88vw, 560px"
          className="shadow-float aspect-[16/10] rounded-[20px] transition-transform duration-500 group-hover:scale-[1.01]"
        />
        {/* Bottom left: the one corner the second demo leaves open, and away
            from the logo every demo sets top left. */}
        <span className="bg-card text-foreground shadow-float absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium">
          <span aria-hidden className="bg-brand h-1.5 w-1.5 rounded-full" />
          {t.showcase.live}
        </span>
      </Link>
      <Link
        href={`/labs/${frontLab.slug}`}
        aria-label={t.showcase.openDemo.replace("{name}", frontLab.name)}
        className="group absolute end-0 bottom-0 block w-[52%]"
      >
        <LabPicture
          lab={frontLab}
          src={labCardSrc(frontLab.slug)}
          sizes="(max-width: 1024px) 46vw, 300px"
          className="shadow-float ring-background aspect-[16/10] rounded-[16px] ring-4 transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </Link>
    </div>
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
            className="text-brand bg-background absolute top-0 left-0 w-8 -translate-x-1/2 text-center font-mono text-[12px] leading-6 tabular-nums"
          >
            {String(start + i).padStart(2, "0")}
          </span>
          <h3 className="text-[17px] leading-6 font-medium tracking-tight">{step.h}</h3>
          <p className="text-muted-foreground mt-2 max-w-[62ch] text-[15px] leading-relaxed">{step.p}</p>
        </li>
      ))}
    </ol>
  );
}
