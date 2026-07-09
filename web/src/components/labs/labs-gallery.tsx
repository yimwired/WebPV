"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { labs } from "@/lib/labs";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function LabsGallery() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-neutral-950 text-white">
      {/* backdrop */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-130 w-[52rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600/20 via-violet-600/20 to-cyan-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>

          <p className="mt-10 text-sm font-medium tracking-widest text-neutral-500 uppercase">
            Design experiments
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            One portfolio,{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
              many faces
            </span>
            .
          </h1>
          <p className="mt-5 max-w-xl text-neutral-400 sm:text-lg">
            The same work, rebuilt in radically different visual languages —
            because a website is a design decision, not a template. Pick a
            universe and step in.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:mt-20 sm:grid-cols-2">
          {labs.map((lab, i) => (
            <motion.div
              key={lab.slug}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease }}
            >
              <Link
                href={`/labs/${lab.slug}`}
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-white/25"
              >
                {/* preview */}
                <div
                  className="relative h-44 overflow-hidden sm:h-52"
                  style={{
                    background: `linear-gradient(135deg, ${lab.preview.from}, ${lab.preview.to})`,
                  }}
                >
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                    {/* abstract mini-composition per style */}
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
                            <div key={s} className="h-8 border border-neutral-400/40" />
                          ))}
                        </div>
                        <div className="absolute bottom-8 left-8 h-4 w-4 bg-[#e11d48]" />
                      </>
                    )}
                  </div>
                </div>

                {/* meta */}
                <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-semibold tracking-tight">
                        {lab.name}
                      </h2>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{
                          color: lab.accent,
                          background: `color-mix(in oklab, ${lab.accent} 14%, transparent)`,
                        }}
                      >
                        {lab.vibe}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                      {lab.description}
                    </p>
                  </div>
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-neutral-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-14 text-center text-sm text-neutral-600">
          Built with Next.js · Tailwind · Framer Motion — no templates.
        </p>
      </div>
    </main>
  );
}
