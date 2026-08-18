"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { Reveal } from "./reveal";

export function Services() {
  const { t } = useLocale();
  const s = t.services;

  return (
    <section
      id="services"
      className="mx-auto max-w-6xl px-5 pb-8 pt-32 sm:px-8 sm:pt-40"
    >
      <Reveal>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {s.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{s.sub}</p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {s.offerings.map((o, i) => (
          <Reveal key={o.title} delay={i * 0.05}>
            <article className="border-line flex h-full flex-col rounded-lg border p-6 sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight">
                {o.title}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {o.blurb}
              </p>

              <ul className="mt-6 space-y-2.5">
                {o.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm">
                    <Check className="text-brand mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-foreground/80">{p}</span>
                  </li>
                ))}
              </ul>

              <p className="border-line text-muted-foreground mt-auto border-t pt-4 text-sm">
                {o.timeline}
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-20">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {s.processTitle}
        </h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {s.process.map((step, i) => (
            <li
              key={step.h}
              className="border-line rounded-lg border p-6"
            >
              <span className="text-brand font-mono text-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-semibold tracking-tight">{step.h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.p}
              </p>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal className="border-line mt-20 border-t pt-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {s.ctaTitle}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-md">{s.ctaSub}</p>
        {/* This page states scope and timeline but no numbers, so the reader
            who is ready to see prices had only the navbar to get there. */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#contact"
            className="bg-foreground text-background inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90"
          >
            {s.ctaButton}
          </a>
          <Link
            href="/pricing"
            className="border-line-strong text-foreground/90 hover:border-foreground/40 hover:text-foreground inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors"
          >
            {s.ctaPricing}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
