"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { projects } from "@/lib/projects";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

/** Animated starfield on <canvas> — slow drift + twinkle, DPR-aware. */
function Starfield() {
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

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (const s of stars) {
        s.y -= s.v;
        if (s.y < -2) {
          s.y = canvas.offsetHeight + 2;
          s.x = Math.random() * canvas.offsetWidth;
        }
        const alpha = 0.45 + 0.55 * Math.abs(Math.sin(t / 1400 + s.tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 240, 255, ${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

/**
 * "Deep Space" — the portfolio as a spacecraft dashboard: black void,
 * live starfield, glowing planet on the horizon, HUD mono labels and
 * projects presented as a mission log.
 */
export function SpaceDemo() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#020617] font-mono text-slate-200 selection:bg-cyan-400/30">
      <Starfield />

      {/* planet on the horizon */}
      <div className="pointer-events-none absolute inset-x-0 top-[62vh] flex justify-center sm:top-[55vh]">
        <div className="h-[80vw] w-[80vw] max-h-[44rem] max-w-[44rem] rounded-full bg-[radial-gradient(circle_at_50%_18%,#67e8f9_0%,#0e7490_28%,#083344_55%,#020617_78%)] shadow-[0_-20px_120px_rgba(34,211,238,0.35)]" />
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
          dashboards and content machines — all built solo, all operational.
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
          // mission log
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

        <p className="mt-12 text-center text-[10px] tracking-[0.4em] text-slate-600 uppercase">
          end of transmission
        </p>
      </section>
    </main>
  );
}
