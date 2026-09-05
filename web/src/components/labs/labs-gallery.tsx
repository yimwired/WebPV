"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { labs } from "@/lib/labs";
import { labCardVersions } from "@/lib/lab-cards";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function LabsGallery() {
  return (
    <main className="bg-background min-h-dvh text-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>

          <h1 className="mt-10 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {labs.length} directions your site could take
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
            Every one is a working page built from scratch, not a theme with the
            colours swapped. Open the ones that fit your business, then tell me
            which you want and I build your content in that direction. Each card
            says what it suits and roughly how long it takes.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-2">
          {labs.map((lab, i) => (
            <motion.div
              key={lab.slug}
              initial={{ opacity: 0, y: 16 }}
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
                    src={`/labs/cards/${lab.slug}.jpg?v=${labCardVersions[lab.slug] ?? ""}`}
                    alt={`${lab.name}: ${lab.vibe}`}
                    fill
                    sizes="(min-width: 640px) 45vw, 92vw"
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
                      <p className="spec mt-1">{lab.vibe}</p>
                    </div>
                    <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {lab.description}
                  </p>

                  <dl className="border-line mt-auto space-y-2 border-t pt-4 text-sm">
                    <div className="flex gap-4">
                      <dt className="w-24 shrink-0 text-muted-foreground">
                        Best for
                      </dt>
                      <dd className="text-foreground/90">{lab.bestFor}</dd>
                    </div>
                    <div className="flex gap-4">
                      <dt className="w-24 shrink-0 text-muted-foreground">
                        Build time
                      </dt>
                      <dd className="text-foreground/90">{lab.buildTime}</dd>
                    </div>
                  </dl>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="border-line mt-16 border-t pt-10">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Know which one you want?
          </h2>
          <p className="mt-3 max-w-lg text-muted-foreground">
            Send me the name of the direction and what your business does. You
            get back scope, a timeline and a fixed price before anything starts.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {/* scope -> price -> ask, in that order: the copy above promises a
                fixed price and /pricing is where the numbers actually are. */}
            <Link
              href="/services"
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-neutral-950 transition-opacity hover:opacity-90"
            >
              What I build
            </Link>
            <Link
              href="/pricing"
              className="border-line-strong inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white"
            >
              What it costs
            </Link>
            <Link
              href="/#contact"
              className="border-line-strong inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white"
            >
              Ask for a quote
            </Link>
          </div>
          <p className="mt-10 text-sm text-muted-foreground">
            Every page here is hand-built in Next.js, Tailwind and Framer
            Motion. No themes, no page builders.
          </p>
        </div>
      </div>
    </main>
  );
}
