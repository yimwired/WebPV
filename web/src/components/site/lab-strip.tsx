"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { labs } from "@/lib/labs";
import { labCardVersions } from "@/lib/lab-cards";
import { useLocale } from "@/lib/i18n";
import { Reveal } from "./reveal";

/**
 * The Lab, on the home page.
 *
 * Deliberately a different shape from the Work grid above it: this one runs
 * off the right edge of the screen instead of wrapping, so the count reads as
 * "there is more of this" rather than as a tidy set. The gallery at /labs is
 * still where a visitor compares them properly — this is the part that has to
 * survive someone who never clicks through.
 */
export function LabStrip() {
  const { t } = useLocale();

  return (
    <section
      id="lab"
      className="scroll-mt-20 overflow-hidden pt-10 pb-20 sm:pt-14 sm:pb-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="border-line flex flex-wrap items-end justify-between gap-4 border-b pb-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.lab.title}
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed sm:text-base">
                {t.lab.sub}
              </p>
            </div>
            <Link
              href="/labs"
              className="text-foreground/90 hover:text-foreground group inline-flex items-center gap-1.5 pb-1 text-sm font-medium transition-colors"
            >
              {t.lab.seeAll.replace("{count}", String(labs.length))}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Full-bleed rail. --rail-gutter resolves to the same gutter the max-w-6xl
          sections use — half the leftover width plus their own px-8 — so the
          first card lines up with the heading above while
          the rest of the row runs off the right edge. It has to feed scroll-ps
          as well as ps: without it snap-mandatory snaps the first card to the
          viewport edge on load and eats the alignment. */}
      <ul
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 ps-(--rail-gutter) pe-5 scroll-ps-(--rail-gutter) [--rail-gutter:max(1.25rem,calc((100%_-_72rem)/2_+_2rem))] sm:pe-8 sm:[--rail-gutter:max(2rem,calc((100%_-_72rem)/2_+_2rem))]"
        style={{ scrollbarWidth: "thin" }}
      >
        {labs.map((lab) => (
          <li key={lab.slug} className="w-[264px] shrink-0 snap-start sm:w-[300px]">
            <Link
              href={`/labs/${lab.slug}`}
              className="group block rounded-md"
            >
              <div
                className="border-line group-hover:border-line-strong relative aspect-[16/10] overflow-hidden rounded-md border transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${lab.preview.from}, ${lab.preview.to})`,
                }}
              >
                <Image
                  src={`/labs/cards/${lab.slug}.jpg?v=${labCardVersions[lab.slug] ?? ""}`}
                  alt={`${lab.name}: ${lab.vibe}`}
                  fill
                  sizes="300px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <h3 className="mt-3 text-sm font-semibold tracking-tight">
                {lab.name}
              </h3>
              <p className="spec mt-0.5">{lab.vibe}</p>
              <p className="text-muted-foreground mt-2 text-sm leading-snug">
                {lab.bestFor}
              </p>
            </Link>
          </li>
        ))}

        <li className="w-[264px] shrink-0 snap-start sm:w-[300px]">
          <Link
            href="/labs"
            className="border-line hover:border-line-strong group flex aspect-[16/10] flex-col justify-end rounded-md border p-5 transition-colors"
          >
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {labs.length}
            </span>
            <span className="text-muted-foreground group-hover:text-foreground mt-1 flex items-center gap-1.5 text-sm transition-colors">
              {t.lab.railEnd}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      </ul>

      {/* The part a template cannot claim: specifics that only come from having
          built the thing. Every figure here is checkable in a demo. The labels
          run to two lines, so the columns need a rule between them — at gap
          alone they read as one paragraph. */}
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <dl className="border-line divide-line mt-6 grid gap-y-7 border-t pt-6 sm:grid-cols-3 sm:gap-y-0 sm:divide-x">
            {t.lab.proof.map((item) => (
              <div
                key={item.label}
                className="sm:px-7 sm:first:ps-0 sm:last:pe-0"
              >
                <dt className="text-2xl font-semibold tracking-tight tabular-nums">
                  {item.value}
                </dt>
                <dd className="text-muted-foreground mt-1.5 text-sm leading-relaxed text-pretty">
                  {item.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
