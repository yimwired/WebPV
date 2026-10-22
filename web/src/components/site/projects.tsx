"use client";

import { projects } from "@/lib/projects";
import { FeaturedProjectCard, ProjectCard } from "./project-card";
import { Reveal } from "./reveal";
import { useLocale } from "@/lib/i18n";

export function Projects() {
  const { t } = useLocale();

  // the featured project leads the list at full width
  const ordered = [...projects].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
  );

  return (
    <section
      id="work"
      className="scroll-mt-24 px-5 pt-24 pb-16 sm:px-8 sm:pt-32 sm:pb-20"
    >
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[32px] leading-[1.1] font-medium tracking-[-0.025em] sm:text-[44px]">
                {t.work.title}
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl text-[17px] leading-relaxed">
                {t.work.sub}
              </p>
            </div>
            <span className="text-muted-foreground pb-1 text-[15px]">
              {projects.length} {t.work.label}
            </span>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {ordered.map((project, i) => {
            const Card = project.featured ? FeaturedProjectCard : ProjectCard;
            return (
              <Card
                key={project.id}
                project={project}
                delay={Math.min(i, 3) * 0.05}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
