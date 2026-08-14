"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { labs } from "@/lib/labs";

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
            Eight directions your site could take
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
                {/* preview */}
                <div
                  className="border-line relative h-44 overflow-hidden border-b sm:h-52"
                  style={{
                    background: `linear-gradient(135deg, ${lab.preview.from}, ${lab.preview.to})`,
                  }}
                >
                  <div className="absolute inset-0">
                    {/* abstract mini-composition per style */}
                    {lab.slug === "sable" && (
                      <>
                        {/* the slate, tilted, with a folio edge under it */}
                        <div className="absolute top-9 left-1/2 h-32 w-24 -translate-x-1/2 rotate-[-4deg] rounded-md bg-[#3b3833] p-1.5 shadow-[0_10px_24px_-10px_rgba(23,21,15,0.5)]">
                          <div className="h-full w-full rounded-sm bg-[#d9d6cd] p-1.5">
                            {[14, 11, 13, 8].map((w, s) => (
                              <div
                                key={s}
                                className="mb-1 h-px bg-[#2f2c26]/45"
                                style={{ width: `${w * 5}%` }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="absolute top-[10.2rem] left-1/2 h-2 w-28 -translate-x-1/2 rounded-b-md bg-[#2c2a26]/80" />
                        <div className="absolute top-6 left-6 h-1.5 w-1.5 rounded-full bg-[#a8432b]" />
                      </>
                    )}
                    {lab.slug === "meridian" && (
                      <>
                        {/* keycap field with one lit key */}
                        <div className="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] grid-cols-4 gap-1.5">
                          {[...Array(12)].map((_, s) => (
                            <div
                              key={s}
                              className="h-7 w-7 rounded-[3px] bg-gradient-to-b from-[#4a4741] to-[#2b2925] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]"
                              style={
                                s === 9
                                  ? { background: "#f7a445", opacity: 0.85 }
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                        <div className="absolute top-1/2 right-7 h-10 w-10 -translate-y-1/2 rounded-full border-2 border-[#6b6760] bg-gradient-to-b from-[#57534c] to-[#33302b]" />
                      </>
                    )}
                    {lab.slug === "dimension" && (
                      <>
                        {/* chrome ring impression */}
                        <div className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-slate-200/90 [border-style:double] shadow-[0_0_50px_rgba(240,171,252,0.45)]" />
                        <div className="absolute top-1/2 left-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/40" />
                        <div className="absolute top-6 right-6 text-[9px] tracking-[0.3em] text-slate-300/80 uppercase">
                          WebGL
                        </div>
                      </>
                    )}
                    {lab.slug === "vision" && (
                      <>
                        {/* glowing visor */}
                        <div className="absolute top-1/2 left-1/2 h-20 w-52 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(41,151,255,0.75)_0%,rgba(94,92,230,0.4)_50%,transparent_78%)] blur-md" />
                        <div className="absolute top-1/2 left-1/2 h-16 w-44 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/25" />
                      </>
                    )}
                    {lab.slug === "nebula" && (
                      <>
                        <div className="absolute top-8 left-8 h-3 w-40 rounded-full bg-white/70" />
                        <div className="absolute top-14 left-8 h-3 w-28 rounded-full bg-white/35" />
                        <div className="absolute -right-8 -bottom-10 h-40 w-40 rounded-full bg-gradient-to-tr from-white/60 to-white/5 blur-[2px]" />
                      </>
                    )}
                    {lab.slug === "space" && (
                      <>
                        {[...Array(24)].map((_, s) => (
                          <span
                            key={s}
                            className="absolute h-px w-px rounded-full bg-white"
                            style={{
                              top: `${(s * 37) % 100}%`,
                              left: `${(s * 53) % 100}%`,
                              opacity: 0.3 + ((s * 7) % 10) / 14,
                            }}
                          />
                        ))}
                        <div className="absolute -bottom-14 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-cyan-300/80 blur-[1px] shadow-[0_0_60px_20px_rgba(34,211,238,0.35)]" />
                      </>
                    )}
                    {lab.slug === "luxe" && (
                      <>
                        <div className="absolute top-10 left-8 font-serif text-4xl tracking-wide text-neutral-800 italic">
                          Maison
                        </div>
                        <div className="absolute top-24 right-8 left-8 h-px bg-neutral-800/30" />
                        <div className="absolute top-28 left-8 h-2 w-24 rounded-full bg-[#c8a24a]/70" />
                      </>
                    )}
                    {lab.slug === "minimal" && (
                      <>
                        <div className="absolute inset-x-8 top-8 grid grid-cols-4 gap-2">
                          {[...Array(8)].map((_, s) => (
                            <div
                              key={s}
                              className="h-8 border border-neutral-400/40"
                            />
                          ))}
                        </div>
                        <div className="absolute bottom-8 left-8 h-4 w-4 bg-[#e11d48]" />
                      </>
                    )}
                  </div>
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
            <Link
              href="/services"
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-neutral-950 transition-opacity hover:opacity-90"
            >
              What I build
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
