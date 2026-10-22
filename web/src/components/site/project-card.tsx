"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STATUS_LABEL, type Project } from "@/lib/projects";
import { isCaseStudySlug } from "@/lib/dictionary";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

// Running is gold, the one accent, which the palette keeps for state; the rest
// fade in ink. A green or amber dot would be a second accent and a second
// warm colour beside the gold.
const statusDot: Record<Project["status"], string> = {
  live: "bg-brand",
  active: "bg-brand",
  building: "bg-foreground/40",
  paused: "bg-foreground/25",
};

/** The screenshot, or for a project with nothing to photograph, its name set as code. */
function ProjectPicture({
  project,
  sizes,
  className,
}: {
  project: Project;
  sizes: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {project.image ? (
        <Image
          src={project.image}
          alt={`${project.name} interface`}
          fill
          sizes={sizes}
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="bg-zone-dark grid h-full place-items-center px-3">
          <span className="font-mono text-[13px] text-white/85">{project.id}</span>
        </div>
      )}
    </div>
  );
}

function StatusLine({ project }: { project: Project }) {
  return (
    <p className="text-muted-foreground flex items-center gap-2 text-[13px]">
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", statusDot[project.status])} />
      {project.category} · {STATUS_LABEL[project.status]}
    </p>
  );
}

interface CardProps {
  project: Project;
  delay?: number;
}

/**
 * The project that leads the work list: the full row, and the facts table,
 * read from the case study so the card and the page never disagree.
 */
export function FeaturedProjectCard({ project, delay = 0 }: CardProps) {
  const { locale, t } = useLocale();
  const tagline = locale === "th" ? project.th.tagline : project.tagline;
  const description =
    locale === "th" ? project.th.description : project.description;
  const facts = isCaseStudySlug(project.id)
    ? t.caseStudies[project.id].meta
    : [];

  return (
    <Reveal delay={delay} className="sm:col-span-2">
      <Link
        href={project.href}
        className="group border-line bg-card hover:border-line-strong grid overflow-hidden rounded-[28px] border p-2.5 transition-colors lg:grid-cols-[1.2fr_1fr]"
      >
        <ProjectPicture
          project={project}
          sizes="(max-width: 1024px) 100vw, 640px"
          className="aspect-[16/10] rounded-[20px]"
        />
        <div className="flex flex-col justify-center p-4 sm:p-8">
          <StatusLine project={project} />
          <h3 className="mt-2 text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[34px]">
            {project.name}
          </h3>
          <p className="mt-1.5 text-[17px]">{tagline}</p>
          <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed">
            {description}
          </p>
          {facts.length > 0 && (
            <dl className="border-line mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-4 text-[13px]">
              {facts.map((fact) => (
                <div key={fact.k} className="flex flex-col-reverse">
                  <dt className="text-muted-foreground">{fact.k}</dt>
                  <dd className="font-medium">{fact.v}</dd>
                </div>
              ))}
            </dl>
          )}
          <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium">
            {t.work.caseStudy}
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * Every other project, drawn like a service on a fastwork.com profile:
 * picture on the left, the few facts that decide a click on the right.
 */
export function ProjectCard({ project, delay = 0 }: CardProps) {
  const { locale, t } = useLocale();
  const tagline = locale === "th" ? project.th.tagline : project.tagline;

  return (
    <Reveal delay={delay} className="h-full">
      <Link
        href={project.href}
        className="group border-line bg-card hover:border-line-strong flex h-full items-center gap-4 rounded-[24px] border p-2.5 pe-5 transition-colors sm:gap-5"
      >
        <ProjectPicture
          project={project}
          sizes="176px"
          className="aspect-[4/3] w-32 shrink-0 rounded-[16px] sm:w-44"
        />
        <div className="min-w-0 py-1">
          <StatusLine project={project} />
          <h3 className="mt-1 text-[19px] leading-tight font-medium tracking-[-0.01em] sm:text-[21px]">
            {project.name}
          </h3>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-[14px] leading-snug">
            {tagline}
          </p>
          <span className="mt-2.5 inline-flex items-center gap-1 text-[14px] font-medium">
            {t.work.caseStudy}
            <ArrowRight
              aria-hidden
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
