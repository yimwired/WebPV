"use client";

import { motion } from "framer-motion";
import { projects } from "@/lib/projects";
import { cn } from "@/lib/utils";

const ease = [0.21, 0.47, 0.32, 0.98] as const;
const GOLD = "#a8823c";

/**
 * "Maison" — printed-matter luxury: ivory paper, serif display type,
 * hairline rules, gold accents, an editorial index of works.
 * Deliberately no glass, no glow, no gradients.
 */
export function LuxeDemo({ serifClass }: { serifClass: string }) {
  return (
    <main className="min-h-dvh bg-[#f7f3ea] text-[#1c1917] selection:bg-[#a8823c]/20">
      {/* ── masthead ── */}
      <header className="mx-auto max-w-4xl px-6 pt-12 sm:pt-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9 }}
          className="flex items-center justify-between text-[11px] tracking-[0.35em] uppercase"
          style={{ color: GOLD }}
        >
          <span>Est. 2026</span>
          <span>Bangkok — Online</span>
        </motion.div>
        <div className="mt-4 h-px bg-[#1c1917]/20" />
      </header>

      {/* ── hero ── */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-24 text-center sm:pt-28">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="text-[11px] tracking-[0.45em] uppercase"
          style={{ color: GOLD }}
        >
          Maison de Film
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
          className={cn(
            serifClass,
            "mt-8 text-5xl leading-[1.08] text-balance sm:text-7xl"
          )}
        >
          Software, made
          <br />
          <em className="font-normal">à la main</em>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease }}
          className="mx-auto mt-8 max-w-md text-[15px] leading-relaxed text-[#57534e]"
        >
          A private atelier of trading systems, intelligent assistants and
          content machines — each piece designed, built and finished by hand.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.7 }}
          className="mx-auto mt-12 flex max-w-xs items-center gap-4"
        >
          <span className="h-px flex-1 bg-[#1c1917]/20" />
          <span className="text-lg" style={{ color: GOLD }}>
            ❦
          </span>
          <span className="h-px flex-1 bg-[#1c1917]/20" />
        </motion.div>
      </section>

      {/* ── collection index ── */}
      <section className="mx-auto max-w-4xl px-6 pb-40">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-[11px] tracking-[0.45em] uppercase"
          style={{ color: GOLD }}
        >
          The collection
        </motion.h2>

        <div className="mt-6 border-t border-[#1c1917]/20">
          {projects.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.05, ease }}
              className="group grid gap-2 border-b border-[#1c1917]/15 py-8 sm:grid-cols-[4rem_1fr_auto] sm:items-baseline sm:gap-8"
            >
              <span className={cn(serifClass, "text-xl text-[#a8a29e] italic")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3
                  className={cn(
                    serifClass,
                    "text-2xl tracking-tight transition-colors sm:text-3xl"
                  )}
                >
                  <span className="bg-gradient-to-r from-[#a8823c] to-[#a8823c] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                    {p.name}
                  </span>
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#57534e]">
                  {p.tagline} — {p.category.toLowerCase()}.
                </p>
              </div>
              <span className="text-[10px] tracking-[0.3em] text-[#a8a29e] uppercase">
                No. {i + 1} / {projects.length}
              </span>
            </motion.article>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={cn(
            serifClass,
            "mt-16 text-center text-lg text-[#57534e] italic"
          )}
        >
          “Par appointement seulement.”
        </motion.p>
      </section>
    </main>
  );
}
