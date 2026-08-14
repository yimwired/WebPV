"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STATUS_LABEL, type Project } from "@/lib/projects";
import { isCaseStudySlug } from "@/lib/dictionary";
import { useLocale } from "@/lib/i18n";
import { Reveal } from "./reveal";

const statusDot: Record<Project["status"], string> = {
  live: "bg-brand",
  active: "bg-brand",
  building: "bg-foreground/40",
  paused: "bg-foreground/20",
};

/**
 * One project, presented as a spec sheet: a screenshot of the real thing,
 * then the facts that decide whether it is worth reading about. The facts
 * are the same ones the case study opens with, so the two never drift.
 */
export function ProjectCard({
  project,
  featured = false,
  delay = 0,
}: {
  project: Project;
  featured?: boolean;
  delay?: number;
}) {
  const { locale, t } = useLocale();

  const tagline = locale === "th" ? project.th.tagline : project.tagline;
  const description =
    locale === "th" ? project.th.description : project.description;
  const facts = isCaseStudySlug(project.id)
    ? t.caseStudies[project.id].meta
    : [];

  return (
    <Reveal delay={delay} className={featured ? "sm:col-span-2" : undefined}>
      <Link
        href={project.href}
        className="border-line hover:border-line-strong group flex h-full flex-col overflow-hidden rounded-lg border transition-colors"
      >
        {project.image && (
          <div
            className={`border-line relative border-b ${
              featured ? "aspect-[21/9]" : "aspect-[16/10]"
            }`}
          >
            <Image
              src={project.image}
              alt={`${project.name} interface`}
              fill
              sizes={
                featured
                  ? "(max-width: 768px) 100vw, 1152px"
                  : "(max-width: 768px) 100vw, 576px"
              }
              // the featured shot is the first thing below the fold and is
              // usually the largest paint on the page
              priority={featured}
              className="object-cover object-top"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="spec">{project.category}</span>
            <span className="text-foreground/70 inline-flex items-center gap-1.5 text-xs">
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]}`}
              />
              {STATUS_LABEL[project.status]}
            </span>
          </div>

          <h3 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
            {project.name}
          </h3>
          <p className="text-foreground/80 mt-1 text-sm">{tagline}</p>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {description}
          </p>

          {facts.length > 0 && (
            <dl className="border-line mt-6 grid grid-cols-1 gap-x-8 border-t pt-4 text-sm sm:grid-cols-2">
              {facts.map((f) => (
                <div
                  key={f.k}
                  className="border-line flex justify-between gap-4 border-b py-2 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
                >
                  <dt className="text-muted-foreground">{f.k}</dt>
                  <dd className="text-foreground/90 text-right">{f.v}</dd>
                </div>
              ))}
            </dl>
          )}

          <span className="text-brand mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
            {t.work.caseStudy}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
