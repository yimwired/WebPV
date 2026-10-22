"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { withCounts } from "@/lib/counts";
import { labBestFor, labKind, type Lab } from "@/lib/labs";
import { labCardSrc, labStillSrc } from "@/lib/lab-images";
import { resolvedCategories, type ResolvedCategory } from "@/lib/showcase";
import { useLocale } from "@/lib/i18n";
import { thaiWrap } from "@/lib/thai-text";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

const ease = [0.22, 1, 0.36, 1] as const;

/** A lab's picture on its own preview gradient, so nothing flashes white while it loads. */
function LabPicture({
  lab,
  src,
  sizes,
  className,
}: {
  lab: Lab;
  src: string;
  sizes: string;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(135deg, ${lab.preview.from}, ${lab.preview.to})`,
      }}
    >
      <Image src={src} alt="" fill sizes={sizes} className="object-cover object-top" />
    </div>
  );
}

/**
 * One kind of business, laid out as a spec sheet: the lead example large, what
 * it is for, and the three figures a buyer weighs, read along dotted leaders
 * the way a parts list is. Then every example in the kind, and the packages
 * that build it.
 */
function CategoryCard({ category }: { category: ResolvedCategory }) {
  const { locale, t } = useLocale();
  const lead = category.labs[0];
  const cheapest = category.packages[0].tier;
  const count = category.labs.length;

  const specs = [
    { label: t.showcase.stats.from, value: `฿${cheapest.price}` },
    { label: t.showcase.stats.time, value: t.pricing.tiers[cheapest.id].timeline },
    { label: t.showcase.stats.examples, value: String(count) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <div className="grid gap-7 lg:grid-cols-[1.12fr_1fr] lg:gap-10">
        <div>
          <Link
            href={`/labs/${lead.slug}`}
            aria-label={t.showcase.openDemo.replace("{name}", lead.name)}
            className="group relative block"
          >
            <LabPicture
              lab={lead}
              src={labCardSrc(lead.slug)}
              sizes="(max-width: 1024px) 100vw, 600px"
              className="aspect-[16/10] rounded-[20px] transition-transform duration-500 group-hover:scale-[1.01]"
            />
            <span className="bg-card text-foreground shadow-float absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium">
              <span aria-hidden className="bg-brand h-1.5 w-1.5 rounded-full" />
              {t.showcase.live}
            </span>
          </Link>
          <ul className="mt-3 flex flex-wrap gap-2">
            {category.labs.map((lab) => (
              <li
                key={lab.slug}
                className="border-line-strong rounded-full border px-3 py-1 text-[13px]"
              >
                {labKind(lab, locale)}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col">
          <p className="text-muted-foreground text-[15px]">
            {t.showcase.categories[category.id]} ·{" "}
            {count === 1
              ? t.showcase.exampleCount
              : t.showcase.examplesCount.replace("{count}", String(count))}
          </p>
          <h3 className="mt-2 text-[28px] leading-tight font-medium tracking-tight sm:text-[32px]">
            {lead.name}
          </h3>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-[13px]">
            <Link
              href={`/labs/${lead.slug}`}
              className="hover:text-foreground -my-1 py-1 underline underline-offset-2"
            >
              /labs/{lead.slug}
            </Link>
            <span aria-hidden>·</span>
            <span>{labKind(lead, locale)}</span>
          </p>
          <p className="text-muted-foreground mt-4 max-w-md text-[15px] leading-relaxed text-pretty">
            {labBestFor(lead, locale)}
          </p>

          <dl className="border-line mt-6 border-t">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="border-line flex items-baseline gap-3 border-b py-3"
              >
                <dt className="text-muted-foreground shrink-0 text-[14px]">{spec.label}</dt>
                <span
                  aria-hidden
                  className="border-line-strong min-w-4 flex-1 -translate-y-1 border-b border-dotted"
                />
                <dd className="shrink-0 text-[15px] font-medium tabular-nums">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border-line mt-8 grid gap-8 border-t pt-7 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <h4 className="text-[17px] font-medium">{t.showcase.examples}</h4>
          <ul className="mt-4 grid grid-cols-3 gap-3">
            {category.labs.map((lab) => (
              <li key={lab.slug}>
                <Link
                  href={`/labs/${lab.slug}`}
                  className="group relative block overflow-hidden rounded-[14px]"
                >
                  <LabPicture
                    lab={lab}
                    src={labStillSrc(lab.slug)}
                    sizes="(max-width: 640px) 33vw, 220px"
                    className="aspect-[4/5] transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="bg-card text-foreground absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[12px] font-medium">
                    {lab.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h4 className="text-[17px] font-medium">{t.showcase.packages}</h4>
            <Link
              href="/pricing"
              className="group text-foreground -my-1 inline-flex items-center gap-1 py-1 text-[15px] font-medium"
            >
              {t.hero.seePricing}
              <ArrowRight
                aria-hidden
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {category.packages.map(({ tier, lab }) => (
              <li
                key={tier.id}
                className="border-line flex items-center gap-4 rounded-[18px] border p-2.5 pe-4"
              >
                <LabPicture
                  lab={lab}
                  src={labCardSrc(lab.slug)}
                  sizes="96px"
                  className="h-[72px] w-[96px] shrink-0 rounded-[12px]"
                />
                <div className="min-w-0">
                  <p className="text-[17px] leading-tight font-medium">
                    {t.pricing.tiers[tier.id].name}
                  </p>
                  <p className="mt-1 text-[14px]">
                    ฿{tier.price}
                    <span className="text-muted-foreground">
                      {" "}
                      · {t.pricing.tiers[tier.id].timeline}
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-0.5 truncate text-[13px]">
                    {t.pricing.tiers[tier.id].forWho}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Every listed lab, grouped by the business a visitor would say they run.
 *
 * The kinds are tabs across the top, each carrying a round still of its lead
 * example, worked by click, arrow keys, Home and End. Nothing pins: the home
 * page Lab was a pinned stage for a day and Film had it taken out because
 * getting past it took four screens of scrolling.
 */
export function Showcase() {
  const { locale, t } = useLocale();
  const [activeIndex, setActiveIndex] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = resolvedCategories[activeIndex];
  const isThai = locale === "th";

  const select = (index: number) => {
    setActiveIndex(index);
    tabs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = resolvedCategories.length - 1;
    const next = {
      ArrowRight: activeIndex === last ? 0 : activeIndex + 1,
      ArrowDown: activeIndex === last ? 0 : activeIndex + 1,
      ArrowLeft: activeIndex === 0 ? last : activeIndex - 1,
      ArrowUp: activeIndex === 0 ? last : activeIndex - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  };

  return (
    <section
      id="showcase"
      className="scroll-mt-24 px-4 pt-16 pb-24 sm:px-6 sm:pt-24 sm:pb-32"
    >
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2
          className={cn(
            "text-[34px] font-medium tracking-[-0.025em] text-balance sm:text-[48px] lg:text-[54px]",
            isThai ? "leading-[1.25]" : "leading-[1.1]",
          )}
        >
          {isThai ? thaiWrap(t.showcase.title) : t.showcase.title}
        </h2>
        <p className="text-muted-foreground mx-auto mt-5 max-w-[40rem] text-[17px] leading-relaxed text-pretty">
          {t.showcase.sub}
        </p>
      </Reveal>

      {/* The tab row is allowed wider than the panel under it: at 1180px the
          six kinds wrapped five and one, which left the last tab stranded. */}
      <div className="mx-auto mt-10 max-w-[1280px] lg:mt-14">
        <div
          role="tablist"
          aria-label={t.showcase.tablistLabel}
          onKeyDown={onKeyDown}
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0"
        >
          {resolvedCategories.map((category, index) => {
            const selected = index === activeIndex;
            const lead = category.labs[0];
            return (
              <button
                key={category.id}
                ref={(node) => {
                  tabs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`showcase-tab-${category.id}`}
                aria-selected={selected}
                aria-controls="showcase-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => select(index)}
                className={cn(
                  "flex h-12 shrink-0 items-center gap-2 rounded-full border ps-1.5 pe-4 text-[15px] font-medium whitespace-nowrap transition-[color,background-color,border-color] duration-200",
                  selected
                    ? "bg-foreground text-background border-transparent"
                    : "bg-card text-foreground border-line hover:border-line-control",
                )}
              >
                {/* The stills arrive one after another the first time the row
                    is on screen: a small sign that each tab holds real work. */}
                <motion.span
                  aria-hidden
                  initial={{ scale: 0.4, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ type: "spring", stiffness: 420, damping: 24, delay: index * 0.06 }}
                  className="block h-8 w-8 shrink-0"
                >
                  <LabPicture
                    lab={lead}
                    src={labStillSrc(lead.slug)}
                    sizes="32px"
                    className="h-full w-full rounded-full"
                  />
                </motion.span>
                {t.showcase.categories[category.id]}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id="showcase-panel"
          aria-labelledby={`showcase-tab-${active.id}`}
          className="border-line bg-card shadow-float mx-auto mt-6 max-w-[1180px] rounded-[32px] border p-5 sm:mt-8 sm:p-8"
        >
          <CategoryCard key={active.id} category={active} />
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/labs"
          className="group text-foreground inline-flex items-center gap-1.5 py-1 text-[15px] font-medium"
        >
          {withCounts(t.showcase.seeAll)}
          <ArrowUpRight
            aria-hidden
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
    </section>
  );
}
