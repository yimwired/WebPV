"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import type { CaseStudySlug } from "@/lib/dictionary";
import { projects } from "@/lib/projects";
import { LanguageSwitch } from "./language-switch";
import { Reveal } from "./reveal";

export function CaseStudy({ slug }: { slug: CaseStudySlug }) {
  const { t } = useLocale();
  const chrome = t.caseStudy;
  const cs = t.caseStudies[slug];

  // the hero image comes from the project card, so the two stay in sync
  const project = projects.find((p) => p.id === slug);

  return (
    <main className="relative mx-auto max-w-4xl px-5 pb-24 pt-24 sm:px-8 sm:pb-32">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {chrome.back}
        </Link>
        <LanguageSwitch />
      </div>

      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mt-14"
      >
        <p className="spec">{chrome.label}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
          {cs.title}
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">{cs.subtitle}</p>

        <dl className="border-line mt-10 grid grid-cols-2 border-t sm:grid-cols-4">
          {cs.meta.map((m) => (
            <div key={m.k} className="border-line border-b py-4 sm:border-b-0">
              <dt className="spec">{m.k}</dt>
              <dd className="mt-1.5 text-sm font-medium">{m.v}</dd>
            </div>
          ))}
        </dl>
      </motion.header>

      {project?.image && (
        <Reveal className="border-line mt-12 overflow-hidden rounded-lg border">
          <Image
            src={project.image}
            alt={cs.imageAlt}
            width={1400}
            height={900}
            priority
            className="w-full object-cover"
          />
        </Reveal>
      )}

      <div className="mt-16 space-y-14">
        {cs.sections.map((s, i) => (
          <Reveal key={s.h} delay={i * 0.05}>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr] sm:gap-10">
              <h2 className="text-lg font-semibold tracking-tight sm:text-right">
                <span className="text-brand mr-2 font-mono text-sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.h}
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {s.p}
              </p>
            </section>
          </Reveal>
        ))}
      </div>

      <Reveal className="border-line mt-20 border-t pt-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {chrome.ctaTitle}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-md">{chrome.ctaSub}</p>
        <a
          href="mailto:yimwired@gmail.com"
          className="bg-foreground text-background mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90"
        >
          <Mail className="h-4 w-4" />
          {chrome.ctaButton}
        </a>
      </Reveal>
    </main>
  );
}
