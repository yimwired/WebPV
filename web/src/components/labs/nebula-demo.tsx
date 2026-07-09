"use client";

import { motion } from "framer-motion";
import { projects } from "@/lib/projects";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

/**
 * "Nebula" — the maximal AI-startup look from the reference clip:
 * deep violet radial gradients, oversized tracking-tight type,
 * a floating chrome-like shape, glass nav, marquee.
 */
export function NebulaDemo() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0b0416] text-white selection:bg-violet-400/30">
      {/* ── backdrop: layered violet glow ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[120vh] bg-[radial-gradient(80%_60%_at_50%_0%,#4c1d95_0%,#2e1065_45%,transparent_100%)]" />
        <div className="animate-aurora absolute top-[30%] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#8b5cf6_0%,transparent_65%)] opacity-40 blur-3xl" />
        <div className="absolute right-[-10%] top-[15%] h-96 w-96 rounded-full bg-[radial-gradient(circle,#d946ef_0%,transparent_70%)] opacity-25 blur-3xl" />
      </div>

      {/* ── glass nav ── */}
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className="relative z-10 mx-auto mt-6 flex w-[min(92%,56rem)] items-center justify-between rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 backdrop-blur-xl"
      >
        <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 text-[11px]">
            ✦
          </span>
          Nebula
        </span>
        <div className="hidden gap-6 text-sm text-white/60 sm:flex">
          <span className="cursor-default transition-colors hover:text-white">What we do</span>
          <span className="cursor-default transition-colors hover:text-white">Programs</span>
          <span className="cursor-default transition-colors hover:text-white">Updates</span>
        </div>
        <span className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-[#2e1065]">
          Get started
        </span>
      </motion.nav>

      {/* ── hero ── */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pt-20 pb-28 sm:px-8 sm:pt-28 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="text-5xl leading-[1.02] font-semibold tracking-tighter text-balance sm:text-7xl"
          >
            Build beyond
            <br />
            <span className="text-white/50">all limits.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease }}
            className="mt-6 max-w-md text-white/60 sm:text-lg"
          >
            Bots, tools and content pipelines that think ahead — designed and
            shipped end to end by one person and a fleet of agents.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <a
              href="#nebula-work"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2e1065] shadow-[0_0_40px_rgba(167,139,250,0.45)] transition-transform hover:scale-[1.03]"
            >
              Start the journey
            </a>
            <a
              href="/#work"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
            >
              See the full site
            </a>
          </motion.div>
        </div>

        {/* floating chrome shape */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.3, ease }}
          className="relative mx-auto h-72 w-72 sm:h-88 sm:w-88"
        >
          <motion.div
            animate={{ y: [-12, 12, -12] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {/* glossy planet */}
            <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#d8c7ff_18%,#8b5cf6_48%,#3b0a7e_78%,#1a0533_100%)] shadow-[0_0_120px_rgba(139,92,246,0.55),inset_-18px_-24px_60px_rgba(10,2,30,0.55)]" />
            {/* specular highlight */}
            <div className="absolute top-[16%] left-[22%] h-[22%] w-[30%] rounded-full bg-white/70 blur-xl" />
            {/* tilted orbit ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-6%] [transform-style:preserve-3d]"
              style={{ rotate: 0 }}
            >
              <div className="absolute inset-0 rounded-full border border-fuchsia-200/40 [transform:rotateX(68deg)]" />
              <div className="absolute inset-[3%] rounded-full border border-violet-300/25 [transform:rotateX(68deg)]" />
            </motion.div>
            {/* small moon */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute top-[6%] left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fdf4ff,#e879f9_60%,#86198f)] shadow-[0_0_18px_rgba(232,121,249,0.8)]" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── marquee ── */}
      <div className="relative z-10 border-y border-white/10 bg-white/[0.03] py-4 backdrop-blur-sm">
        <div className="flex gap-12 overflow-hidden whitespace-nowrap text-sm font-medium tracking-widest text-white/40 uppercase [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            className="flex shrink-0 gap-12"
          >
            {[...Array(2)].flatMap((_, r) =>
              [
                "Trading systems",
                "AI agents",
                "Dashboards",
                "Content pipelines",
                "Automation",
                "Games",
              ].map((t) => (
                <span key={`${r}-${t}`} className="flex items-center gap-12">
                  {t} <span className="text-violet-400">✦</span>
                </span>
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* ── work grid ── */}
      <section
        id="nebula-work"
        className="relative z-10 mx-auto max-w-6xl scroll-mt-8 px-6 py-24 pb-36 sm:px-8"
      >
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease }}
          className="text-3xl font-semibold tracking-tight sm:text-5xl"
        >
          Prompts that <span className="text-white/50">think ahead.</span>
        </motion.h2>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 6).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.07, ease }}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-sm transition-colors hover:border-violet-300/40"
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={p.name}
                  className="aspect-[16/9] w-full object-cover object-top opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
              <div className="p-6 pt-5">
                <span className="text-xs font-medium tracking-widest text-violet-300/80 uppercase">
                  {p.category}
                </span>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{p.tagline}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
