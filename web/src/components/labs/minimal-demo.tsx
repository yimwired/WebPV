"use client";

import { motion } from "framer-motion";
import { projects } from "@/lib/projects";

const ease = [0.21, 0.47, 0.32, 0.98] as const;
const RED = "#e11d48";

/**
 * "Grid": International Typographic Style. White page, strict columns,
 * uppercase mono labels, generous whitespace, exactly one accent colour.
 * No decoration that doesn't carry information.
 */
export function MinimalDemo() {
  return (
    <main className="min-h-dvh bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* ── header row ── */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-4 border-b border-neutral-900 py-6 font-mono text-[11px] tracking-widest uppercase sm:grid-cols-4"
        >
          <span>Film</span>
          <span className="text-neutral-600">Portfolio, index</span>
          <span className="hidden text-neutral-600 sm:block">BKK / remote</span>
          <span className="text-right" style={{ color: RED }}>
            2026
          </span>
        </motion.header>

        {/* ── hero ── */}
        <section className="py-24 sm:py-36">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="text-5xl leading-[0.95] font-bold tracking-tighter sm:text-8xl"
          >
            Work is the
            <br />
            only argument
            <span style={{ color: RED }}>.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease }}
            className="mt-12 grid gap-8 sm:grid-cols-2"
          >
            <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
              Trading systems, AI assistants, dashboards and content pipelines.
              Designed, built and operated by one person. Everything below is
              real and running.
            </p>
            <div className="font-mono text-[11px] tracking-widest text-neutral-600 uppercase sm:text-right">
              <p>{projects.length} projects, all active</p>
              <p className="mt-1">Next.js / Python / MT5 / Claude</p>
            </div>
          </motion.div>
        </section>

        {/* ── index table ── */}
        <section className="pb-40">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-[3rem_1fr_auto] gap-4 border-b border-neutral-900 pb-3 font-mono text-[11px] tracking-widest text-neutral-600 uppercase sm:grid-cols-[3rem_1fr_1fr_auto]"
          >
            <span>No.</span>
            <span>Project</span>
            <span className="hidden sm:block">Description</span>
            <span>Field</span>
          </motion.div>

          {projects.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease }}
              className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 border-b border-neutral-200 py-6 transition-colors hover:bg-neutral-50 sm:grid-cols-[3rem_1fr_1fr_auto]"
            >
              <span className="font-mono text-[11px] text-neutral-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-xl font-bold tracking-tight transition-colors group-hover:text-[#e11d48] sm:text-2xl">
                {p.name}
              </h2>
              <p className="hidden max-w-xs text-sm leading-relaxed text-neutral-500 sm:block">
                {p.tagline}
              </p>
              <span className="font-mono text-[11px] tracking-widest text-neutral-600 uppercase">
                {p.category}
              </span>
            </motion.article>
          ))}

          {/* the index ends with the one thing it is selling */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 grid gap-6 border-t-2 border-neutral-900 pt-8 sm:grid-cols-[1fr_auto] sm:items-end"
          >
            <div>
              <h2 className="max-w-lg text-2xl font-bold tracking-tight sm:text-3xl">
                This grid, with your work in it.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
                Under a week. You send the content, I set it.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/services"
                className="bg-neutral-900 px-6 py-3 font-mono text-[11px] tracking-widest text-white uppercase transition-opacity hover:opacity-90"
              >
                What I build
              </a>
              <a
                href="/#contact"
                className="border border-neutral-900 px-6 py-3 font-mono text-[11px] tracking-widest uppercase transition-colors hover:bg-neutral-900 hover:text-white"
              >
                Quote
              </a>
            </div>
          </motion.div>

          <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 flex items-center justify-between font-mono text-[11px] tracking-widest text-neutral-500 uppercase"
          >
            <span>© 2026 Film</span>
            <span className="h-3 w-3" style={{ background: RED }} />
            <span>Set in Geist</span>
          </motion.footer>
        </section>
      </div>
    </main>
  );
}
