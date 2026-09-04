"use client";

import { Reveal } from "./reveal";
import { withCounts } from "@/lib/counts";
import { useLocale } from "@/lib/i18n";
import { skills } from "@/lib/skills";

export function About() {
  const { t } = useLocale();

  return (
    <section
      id="about"
      className="border-line mx-auto max-w-6xl scroll-mt-20 border-t px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.about.title}
          </h2>
          <div className="text-muted-foreground mt-6 space-y-4 leading-relaxed">
            <p>{t.about.p1}</p>
            <p>{t.about.p2}</p>
          </div>

          <p className="spec mt-10">{t.about.label}</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {skills.map((s) => (
              <li key={s} className="text-foreground/85">
                {s}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <dl className="border-line border-t">
            {t.about.stats.map((s) => (
              <div
                key={s.label}
                className="border-line flex items-baseline justify-between gap-6 border-b py-5"
              >
                <dt className="text-muted-foreground text-sm">{s.label}</dt>
                <dd className="text-xl font-semibold tracking-tight tabular-nums">
                  {/* keeps the project count honest as projects.ts grows */}
                  {withCounts(s.value)}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
