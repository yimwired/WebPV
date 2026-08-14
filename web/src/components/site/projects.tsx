"use client";

import { projects } from "@/lib/projects";
import { ProjectCard } from "./project-card";
import { Reveal } from "./reveal";
import { useLocale } from "@/lib/i18n";

export function Projects() {
  const { t } = useLocale();

  // the featured project leads the grid at full width
  const ordered = [...projects].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
  );

  return (
    <section
      id="work"
      className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-10 pb-20 sm:px-8 sm:pt-14 sm:pb-28"
    >
      <Reveal>
        <div className="border-line flex flex-wrap items-end justify-between gap-4 border-b pb-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.work.title}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed sm:text-base">
              {t.work.sub}
            </p>
          </div>
          <span className="spec pb-1">
            {projects.length} {t.work.label}
          </span>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {ordered.map((p, i) => (
          <ProjectCard
            key={p.id}
            project={p}
            featured={p.featured}
            delay={Math.min(i, 3) * 0.05}
          />
        ))}
      </div>
    </section>
  );
}
