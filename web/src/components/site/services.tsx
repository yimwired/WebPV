"use client";

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
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {s.label}
        </p>
        <h1 className="mt-3 max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          {s.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{s.sub}</p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {s.offerings.map((o, i) => (
          <Reveal key={o.title} delay={i * 0.05}>
            <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-card/40 p-6 backdrop-blur-md sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight">
                {o.title}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {o.blurb}
              </p>

              <ul className="mt-6 space-y-2.5">
                {o.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span className="text-foreground/80">{p}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-auto pt-6 text-sm text-muted-foreground">
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
              className="rounded-3xl border border-white/10 bg-card/40 p-6 backdrop-blur-md"
            >
              <span className="text-sm font-medium text-cyan-300">
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

      <Reveal className="mt-20 rounded-[2rem] border border-white/10 bg-card/40 p-8 text-center backdrop-blur-md sm:p-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {s.ctaTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          {s.ctaSub}
        </p>
        <a
          href="#contact"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-95"
        >
          {s.ctaButton}
        </a>
      </Reveal>
    </section>
  );
}
