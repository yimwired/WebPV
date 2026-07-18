"use client";

import Image from "next/image";
import { projects } from "@/lib/projects";
import { ProjectCard } from "./project-card";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { useLocale } from "@/lib/i18n";

export function Projects() {
  const { t } = useLocale();
  return (
    <section id="work" className="scroll-mt-24">
      {/* Cinematic scroll reveal — tilts up and flattens as you scroll into Work */}
      <ContainerScroll
        titleComponent={
          <div className="pb-2">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {t.work.label}
            </p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              {t.work.title}
            </h2>
          </div>
        }
      >
        <Image
          src="/projects/aurum.png"
          alt="AURUM — automated XAU/USD trading terminal"
          width={1400}
          height={900}
          priority
          draggable={false}
          className="mx-auto h-full w-full rounded-2xl object-cover object-top"
        />
      </ContainerScroll>

      {/* Full project grid */}
      <div className="mx-auto -mt-24 max-w-6xl px-5 pb-24 sm:px-8 sm:pb-32 md:-mt-48">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
