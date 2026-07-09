"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { projects } from "@/lib/projects";

const ease = [0.21, 0.47, 0.32, 0.98] as const;
const BLUE = "#2997ff";

/** One pinned statement that fades in and out inside the cinematic scroll. */
function Statement({
  progress,
  window: [a, b, c],
  children,
}: {
  progress: MotionValue<number>;
  window: [number, number, number];
  children: React.ReactNode;
}) {
  const opacity = useTransform(progress, [a, b, (b + c) / 2, c], [0, 1, 1, 0]);
  const y = useTransform(progress, [a, b], [40, 0]);
  const blur = useTransform(opacity, (o) => `blur(${(1 - o) * 10}px)`);
  return (
    <motion.h2
      style={{ opacity, y, filter: blur }}
      className="absolute inset-x-6 text-center text-4xl font-semibold tracking-tight text-balance sm:text-7xl"
    >
      {children}
    </motion.h2>
  );
}

/**
 * "Vision" — Apple-Vision-Pro-style cinematic scroll: pure black,
 * gradient display type, pinned crossfading statements, then the
 * portfolio as floating spatial glass windows with parallax.
 */
export function VisionDemo() {
  // pinned statements section
  const cinemaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: cinema } = useScroll({
    target: cinemaRef,
    offset: ["start start", "end end"],
  });

  // spatial windows section
  const spatialRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: spatial } = useScroll({
    target: spatialRef,
    offset: ["start end", "end start"],
  });
  const yFast = useTransform(spatial, [0, 1], [120, -120]);
  const ySlow = useTransform(spatial, [0, 1], [60, -60]);
  const yMid = useTransform(spatial, [0, 1], [90, -90]);
  const lanes = [yFast, ySlow, yMid, ySlow, yFast];

  // hero glow scales away as you scroll into the film
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: hero } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(hero, [0, 1], [1, 1.18]);
  const heroFade = useTransform(hero, [0, 0.8], [1, 0]);

  return (
    <main className="relative bg-black text-white selection:bg-[#2997ff]/40">
      {/* ── hero ── */}
      <section ref={heroRef} className="relative flex h-dvh flex-col items-center justify-center overflow-hidden px-6">
        {/* visor glow */}
        <motion.div
          style={{ scale: heroScale, opacity: heroFade }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute top-[24%] left-1/2 h-[38vh] w-[min(88vw,64rem)] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(41,151,255,0.55)_0%,rgba(94,92,230,0.3)_45%,transparent_75%)] blur-2xl" />
          <div className="absolute top-[30%] left-1/2 h-[22vh] w-[min(70vw,46rem)] -translate-x-1/2 rounded-[50%] border border-white/15 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative text-sm font-medium tracking-[0.2em] text-white/60 uppercase"
        >
          Film Vision
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease }}
          className="relative mt-5 max-w-4xl text-center text-5xl font-semibold tracking-tight text-balance sm:text-8xl"
        >
          Welcome to the era of{" "}
          <span className="bg-gradient-to-r from-[#2997ff] via-[#a972ff] to-[#ff5ea8] bg-clip-text text-transparent">
            spatial work
          </span>
          .
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative mt-6 max-w-lg text-center text-white/60 sm:text-lg"
        >
          One builder. A fleet of agents. Software that blends into everything
          you see below.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10 text-xs tracking-[0.3em] text-white/40 uppercase"
        >
          scroll to enter
        </motion.div>
      </section>

      {/* ── pinned cinematic statements ── */}
      <section ref={cinemaRef} className="relative h-[320vh]">
        <div className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden">
          <Statement progress={cinema} window={[0.02, 0.14, 0.3]}>
            Bots that <span className="text-[#f5b950]">trade gold</span> while you sleep.
          </Statement>
          <Statement progress={cinema} window={[0.34, 0.46, 0.62]}>
            Agents that <span className="text-[#2997ff]">think in fleets</span>.
          </Statement>
          <Statement progress={cinema} window={[0.66, 0.78, 0.96]}>
            Content that <span className="bg-gradient-to-r from-[#a972ff] to-[#ff5ea8] bg-clip-text text-transparent">ships itself</span>.
          </Statement>
        </div>
      </section>

      {/* ── spatial glass windows ── */}
      <section ref={spatialRef} className="relative overflow-hidden py-40">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="text-center text-sm font-medium tracking-[0.2em] text-white/50 uppercase"
          >
            The apps, in your space
          </motion.p>

          <div className="mt-20 flex flex-wrap items-start justify-center gap-6 [perspective:1400px]">
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                style={{ y: lanes[i % lanes.length] }}
                className="w-[min(100%,22rem)]"
              >
                <motion.div
                  initial={{ opacity: 0, rotateX: 14, y: 60 }}
                  whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, delay: (i % 3) * 0.1, ease }}
                  className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
                >
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      className="aspect-[16/10] w-full object-cover object-top"
                    />
                  )}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <h3 className="font-semibold tracking-tight">{p.name}</h3>
                      <p className="mt-0.5 text-sm text-white/50">{p.tagline}</p>
                    </div>
                    <span
                      className="ml-4 shrink-0 rounded-full px-3 py-1 text-[11px] font-medium"
                      style={{ color: BLUE, background: "rgba(41,151,255,0.12)" }}
                    >
                      {p.category}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── closing statement + CTA ── */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 pb-44 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease }}
          className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          Built by one.
          <br />
          <span className="text-white/40">Powered by many agents.</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25, ease }}
          className="mt-10"
        >
          <a
            href="/#work"
            className="rounded-full px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.04]"
            style={{ background: BLUE }}
          >
            See the work
          </a>
        </motion.div>

        <p className="absolute bottom-10 text-xs text-white/30">
          A style study — no headsets were harmed.
        </p>
      </section>
    </main>
  );
}
