"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { projects } from "@/lib/projects";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const SpaceScene = dynamic(() => import("./space-scene"), {
  ssr: false,
  loading: () => null,
});

/**
 * Starfield on <canvas>: slow drift + twinkle, DPR-aware.
 *
 * `animate` off draws the field once and stops, for reduced motion. The loop
 * also parks itself while the tab is in the background, which it previously
 * did not: this canvas covers the whole page, so it never scrolls out of
 * view and would otherwise redraw for as long as the tab existed.
 */
function Starfield({ animate }: { animate: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stars: { x: number; y: number; r: number; v: number; tw: number }[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 3200);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: Math.random() * 1.3 + 0.2,
        v: Math.random() * 0.06 + 0.015,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const paint = (t: number) => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (const s of stars) {
        if (animate) {
          s.y -= s.v;
          if (s.y < -2) {
            s.y = canvas.offsetHeight + 2;
            s.x = Math.random() * canvas.offsetWidth;
          }
        }
        const alpha = animate
          ? 0.45 + 0.55 * Math.abs(Math.sin(t / 1400 + s.tw))
          : 0.7;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 240, 255, ${alpha})`;
        ctx.fill();
      }
    };

    const draw = (t: number) => {
      paint(t);
      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    if (animate) {
      start();
      document.addEventListener("visibilitychange", onVisibility);
    } else {
      paint(0);
    }

    window.addEventListener("resize", resize);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, [animate]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

/**
 * "Deep Space": the portfolio as a spacecraft dashboard. Black void,
 * live starfield, glowing planet on the horizon, HUD mono labels and
 * projects presented as a mission log.
 */
export function SpaceDemo() {
  const reduced = useReducedMotion();

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#020617] font-mono text-slate-200 selection:bg-cyan-400/30">
      <Starfield animate={!reduced} />

      {/* The planet on the horizon: a real lit sphere, so it turns, carries a
          terminator and holds an atmosphere at its edge. The box is wider than
          the body itself to leave the halo somewhere to fall off. */}
      <div className="pointer-events-none absolute inset-x-0 top-[62vh] flex justify-center sm:top-[56vh]">
        <div className="h-[98vw] w-[98vw] max-h-[54rem] max-w-[54rem]">
          <SpaceScene spin={!reduced} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[60vh] h-24 bg-gradient-to-b from-transparent via-cyan-300/10 to-transparent blur-xl sm:top-[53vh]" />

      {/* HUD frame */}
      <div className="pointer-events-none absolute inset-4 rounded-2xl border border-cyan-300/15 sm:inset-6" />
      <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-b-lg border border-t-0 border-cyan-300/15 bg-[#020617]/80 px-4 py-1 text-[10px] tracking-[0.3em] text-cyan-300/70 uppercase sm:top-6">
        FLM-01 · orbital portfolio
      </div>

      {/* ── hero ── */}
      <section className="relative z-10 mx-auto flex min-h-[92vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xs tracking-[0.5em] text-cyan-300/80 uppercase"
        >
          [ signal acquired ]
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease }}
          className="mt-6 font-sans text-5xl font-semibold tracking-tight text-balance sm:text-7xl"
        >
          Exploring the edge
          <br />
          <span className="bg-gradient-to-b from-cyan-200 to-cyan-500 bg-clip-text text-transparent">
            of what ships.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease }}
          className="mt-6 max-w-xl text-sm leading-relaxed text-slate-400"
        >
          Mission commander: Film. Payload: trading systems, AI agent fleets,
          dashboards and content machines, all built solo, all operational.
        </motion.p>

        {/* telemetry row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease }}
          className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-cyan-300/20 bg-cyan-300/20 text-left"
        >
          {[
            ["missions", String(projects.length).padStart(2, "0")],
            ["status", "nominal"],
            ["crew", "01 + agents"],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#020617] px-5 py-3">
              <div className="text-[10px] tracking-[0.25em] text-cyan-300/60 uppercase">{k}</div>
              <div className="mt-1 text-sm text-slate-100">{v}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── mission log ── */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-8 pb-40">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-xs tracking-[0.5em] text-cyan-300/80 uppercase"
        >
          {/* the slashes are the costume: this demo dresses its headings as
              lines from a mission log, so they are content and not a comment */}
          {"// mission log"}
        </motion.h2>

        <div className="mt-8 space-y-3">
          {projects.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.06, ease }}
              className="group rounded-lg border border-slate-700/60 bg-slate-900/40 p-5 backdrop-blur-sm transition-colors hover:border-cyan-300/50"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-sans text-lg font-semibold tracking-tight text-slate-100">
                  <span className="mr-3 text-cyan-400/80">M-{String(i + 1).padStart(2, "0")}</span>
                  {p.name}
                </h3>
                <span className="shrink-0 text-[10px] tracking-[0.25em] text-emerald-400/90 uppercase">
                  ● {p.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-slate-700 px-2 py-0.5 text-[10px] tracking-wider text-slate-400 uppercase"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>

        {/* the transmission ends with a way to answer it */}
        <div className="mt-16 border border-cyan-400/25 bg-cyan-950/20 p-8 text-center">
          <p className="text-[10px] tracking-[0.4em] text-cyan-300/90 uppercase">
            {"// incoming channel open"}
          </p>
          <h3 className="mt-4 font-sans text-2xl font-semibold tracking-tight text-slate-100">
            Want a site that flies like this one?
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            The starfield is a canvas and the planet is a lit sphere, not a
            video. Every panel here is yours to fill.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/services"
              className="border border-cyan-400/60 bg-cyan-400/10 px-6 py-3 text-[11px] tracking-[0.3em] text-cyan-200 uppercase transition-colors hover:bg-cyan-400/20"
            >
              What I build
            </Link>
            <Link
              href="/#contact"
              className="border border-slate-600 px-6 py-3 text-[11px] tracking-[0.3em] text-slate-300 uppercase transition-colors hover:border-slate-400"
            >
              Ask for a quote
            </Link>
          </div>
        </div>

        <p className="mt-12 text-center text-[10px] tracking-[0.4em] text-slate-500 uppercase">
          end of transmission
        </p>

        {/* Whose work is whose. The imagery is NASA's and public domain; what
            is built here is the sphere it is wrapped on. A portfolio that does
            not say so is claiming the wrong thing. */}
        <p className="mt-6 text-center text-[10px] leading-relaxed text-slate-600">
          Surface, cloud and night-lights imagery: NASA Visible Earth (public
          domain). Lighting, atmosphere and motion built for this page.
        </p>
      </section>
    </main>
  );
}
