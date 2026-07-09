"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { projects } from "@/lib/projects";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const DimensionScene = dynamic(() => import("./dimension-scene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-xs tracking-[0.4em] text-slate-500 uppercase">
      loading scene…
    </div>
  ),
});

/**
 * "Dimension" — an actual WebGL scene as the hero: chrome torus knot,
 * iridescent lighting, drag to orbit. Content floats above the canvas.
 */
export function DimensionDemo() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#05060f] text-slate-100 selection:bg-fuchsia-400/30">
      {/* ── hero: full-viewport canvas ── */}
      <section className="relative h-dvh">
        <div className="absolute inset-0">
          <DimensionScene />
        </div>

        {/* vignette so text stays readable over chrome */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,transparent_0%,#05060f_100%)]" />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-between px-6 pt-24 pb-10 text-center sm:pt-20">
          <motion.p
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-[11px] tracking-[0.5em] text-slate-400 uppercase"
          >
            Film · spatial index
          </motion.p>

          <div className="mt-auto pb-6">
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease }}
              className="text-5xl font-semibold tracking-tighter text-balance sm:text-8xl"
            >
              <span className="bg-gradient-to-r from-cyan-200 via-slate-100 to-fuchsia-200 bg-clip-text text-transparent">
                Depth is a feature.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.65, ease }}
              className="mx-auto mt-6 max-w-md text-sm text-slate-400 sm:text-base"
            >
              Real-time WebGL, running in your browser right now. Drag the
              chrome — it&apos;s not a video.
            </motion.p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="text-[11px] tracking-[0.4em] text-slate-500 uppercase"
          >
            ↓ scroll · drag to orbit
          </motion.p>
        </div>
      </section>

      {/* ── work: tilting glass cards ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 pb-40 sm:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease }}
          className="text-3xl font-semibold tracking-tight sm:text-5xl"
        >
          Work, in{" "}
          <span className="bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
            three dimensions
          </span>
          .
        </motion.h2>

        <div className="mt-12 grid gap-5 [perspective:1200px] sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 32, rotateX: -8 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.07, ease }}
              whileHover={{ rotateX: 6, rotateY: -6, y: -6, scale: 1.02 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-sm transition-colors hover:border-cyan-300/40 [transform-style:preserve-3d]"
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={p.name}
                  className="aspect-video w-full rounded-xl object-cover object-top"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight">{p.name}</h3>
                  <span
                    className="text-[10px] font-medium tracking-[0.25em] uppercase"
                    style={{ color: p.accent }}
                  >
                    {p.category}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{p.tagline}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
