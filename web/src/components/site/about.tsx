"use client";

import { Reveal } from "./reveal";
import { useLocale } from "@/lib/i18n";

const skills = [
  "Python",
  "Next.js / React",
  "Trading systems (SMC)",
  "AI / Claude",
  "Automation",
  "Video & content",
  "Dashboards",
  "ffmpeg",
];

export function About() {
  const { t } = useLocale();

  return (
    <section
      id="about"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {t.about.label}
          </p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.about.title}
          </h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>{t.about.p1}</p>
            <p>{t.about.p2}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-foreground/80"
              >
                {s}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="flex flex-col justify-center gap-4">
          {t.about.stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-card/40 p-6 backdrop-blur-md"
            >
              <div className="text-2xl font-semibold tracking-tight">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
