"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { LanguageSwitch } from "./language-switch";
import { Reveal } from "./reveal";

const ACCENT = "#f59e0b"; // matches the AURUM card in lib/projects.ts

export function AurumCaseStudy() {
  const { t } = useLocale();
  const cs = t.aurum;

  return (
    <main className="relative mx-auto max-w-4xl px-5 pb-24 pt-24 sm:px-8 sm:pb-32">
      {/* gold ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px 400px at 50% 0%, rgba(245,158,11,0.10), transparent 70%)",
        }}
      />

      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {cs.back}
        </Link>
        <LanguageSwitch />
      </div>

      <motion.header
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mt-14"
      >
        <p
          className="text-sm font-medium uppercase tracking-widest"
          style={{ color: ACCENT }}
        >
          {cs.label}
        </p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-7xl">
          {cs.title}
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">{cs.subtitle}</p>

        <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cs.meta.map((m) => (
            <div
              key={m.k}
              className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-md"
            >
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                {m.k}
              </dt>
              <dd className="mt-1.5 text-sm font-medium">{m.v}</dd>
            </div>
          ))}
        </dl>
      </motion.header>

      <Reveal className="mt-12 overflow-hidden rounded-3xl border border-white/10">
        <Image
          src="/projects/aurum.png"
          alt="AURUM trading terminal dashboard"
          width={1400}
          height={900}
          priority
          className="w-full object-cover"
        />
      </Reveal>

      <div className="mt-16 space-y-14">
        {cs.sections.map((s, i) => (
          <Reveal key={s.h} delay={i * 0.05}>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr] sm:gap-10">
              <h2 className="text-lg font-semibold tracking-tight sm:text-right">
                <span className="mr-2 text-sm" style={{ color: ACCENT }}>
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

      <Reveal className="mt-20 rounded-[2rem] border border-white/10 bg-card/40 p-8 text-center backdrop-blur-md sm:p-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {cs.ctaTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          {cs.ctaSub}
        </p>
        <a
          href="mailto:yimwired@gmail.com"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-95"
        >
          <Mail className="h-4 w-4" />
          {cs.ctaButton}
        </a>
      </Reveal>
    </main>
  );
}
