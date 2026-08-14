"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/site/language-switch";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <main className="relative flex min-h-[100svh] flex-col justify-center px-5 sm:px-8">
      <div className="absolute top-5 right-5 sm:top-6 sm:right-8">
        <LanguageSwitch />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mx-auto w-full max-w-2xl"
      >
        <p className="spec">404</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t.notFound.title}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md leading-relaxed text-pretty">
          {t.notFound.sub}
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="group bg-foreground text-background inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {t.notFound.home}
          </Link>
          <Link
            href="/labs"
            className="border-line-strong text-foreground hover:border-foreground/40 inline-flex h-11 items-center justify-center gap-2 rounded-md border px-6 text-sm font-medium transition-colors"
          >
            <FlaskConical className="h-4 w-4" />
            {t.notFound.labs}
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
