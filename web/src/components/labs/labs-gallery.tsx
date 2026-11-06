"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { LanguageSwitch } from "@/components/site/language-switch";
import { withCounts } from "@/lib/counts";
import { useLocale } from "@/lib/i18n";
import { labCard, labs } from "@/lib/labs";
import { labCardVersions } from "@/lib/lab-cards";
import { thaiWrap } from "@/lib/thai-text";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function LabsGallery() {
  const { locale, t } = useLocale();
  const copy = t.gallery;
  const title = withCounts(copy.title);

  return (
    <main className="font-site bg-background text-foreground min-h-dvh">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          {/* The site's navbar is not on this page, so the language switch sits here. */}
          <div className="flex items-center justify-between gap-4">
            {/* Padded to clear the 24px target floor; the negative margin keeps
                the label on the same gutter as the heading under it. */}
            <Link
              href="/"
              className="-mx-2 -my-2 inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {copy.back}
            </Link>
            <LanguageSwitch />
          </div>

          <h1 className="mt-10 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {locale === "th" ? thaiWrap(title) : title}
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
            {copy.sub}
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-2">
          {labs.map((lab, i) => {
            const card = labCard(lab, locale);
            return (
              // The first two cards are on screen before any scrolling, and one
              // of them is the largest thing the browser paints. An entrance
              // cannot start until hydration does, so animating them meant the
              // page measured as blank for five seconds with the image already
              // downloaded. The rest of the grid still staggers in.
              <motion.div
                key={lab.slug}
                initial={i < 2 ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease }}
              >
                <Link
                  href={`/labs/${lab.slug}`}
                  className="border-line hover:border-line-strong group flex h-full flex-col overflow-hidden rounded-lg border transition-colors"
                >
                  {/* preview: a real frame of the demo, shot by shoot-lab-cards.mjs.
                      The gradient stays underneath as the colour while the image
                      decodes, so the card never flashes empty. */}
                  <div
                    className="border-line relative aspect-[16/10] overflow-hidden border-b"
                    style={{
                      background: `linear-gradient(135deg, ${lab.preview.from}, ${lab.preview.to})`,
                    }}
                  >
                    <Image
                      // the hash comes from the file itself, so a reshoot
                      // changes the URL and the day-long cache stops hiding it
                      src={`/labs/cards/${lab.slug}.webp?v=${labCardVersions[lab.slug] ?? ""}`}
                      alt={`${lab.name}: ${card.vibe}`}
                      fill
                      sizes="(min-width: 640px) 45vw, 92vw"
                      // The first two cards are above the fold at every width, so
                      // one of them is the LCP element. Left lazy, the browser
                      // only discovers it after the CSS resolves and Lighthouse
                      // scored the largest paint at 8.2s.
                      priority={i < 2}
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>

                  {/* what it is, who it suits, what it costs in time */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight">
                          {lab.name}
                        </h2>
                        <p className="spec mt-1">{card.vibe}</p>
                      </div>
                      <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>

                    <dl className="border-line mt-auto space-y-2 border-t pt-4 text-sm">
                      <div className="flex gap-4">
                        <dt className="w-24 shrink-0 text-muted-foreground">
                          {copy.bestFor}
                        </dt>
                        <dd className="text-foreground/90">{card.bestFor}</dd>
                      </div>
                      <div className="flex gap-4">
                        <dt className="w-24 shrink-0 text-muted-foreground">
                          {copy.buildTime}
                        </dt>
                        <dd className="text-foreground/90">{card.buildTime}</dd>
                      </div>
                    </dl>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="border-line mt-16 border-t pt-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            {copy.ctaTitle}
          </h2>
          <p className="mt-3 max-w-lg text-muted-foreground">
            {copy.ctaSub}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {/* scope -> price -> ask, in that order: the copy above promises a
                fixed price and /pricing is where the numbers actually are. */}
            <Link
              href="/services"
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-neutral-950 transition-opacity hover:opacity-90"
            >
              {copy.build}
            </Link>
            <Link
              href="/pricing"
              className="border-line-strong text-foreground/80 hover:border-line-control hover:text-foreground inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm transition-colors"
            >
              {copy.cost}
            </Link>
            <Link
              href="/#contact"
              className="border-line-strong text-foreground/80 hover:border-line-control hover:text-foreground inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm transition-colors"
            >
              {copy.quote}
            </Link>
          </div>
          <p className="mt-10 text-sm text-muted-foreground">
            {copy.note}
          </p>
        </div>
      </div>
    </main>
  );
}
