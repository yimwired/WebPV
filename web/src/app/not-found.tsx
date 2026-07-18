"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/site/language-switch";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 text-center">
      {/* soft accent glow behind the 404 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 320px at 50% 42%, rgba(99,102,241,0.14), transparent 70%)",
        }}
      />

      <div className="absolute right-5 top-5 sm:right-8 sm:top-6">
        <LanguageSwitch />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative"
      >
        <p className="bg-gradient-to-r from-indigo-300 via-cyan-200 to-violet-300 bg-clip-text text-8xl font-semibold tracking-tight text-transparent sm:text-9xl">
          404
        </p>
        <h1 className="mt-6 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {t.notFound.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
          {t.notFound.sub}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {t.notFound.home}
          </Link>
          <Link
            href="/labs"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-sm font-medium text-foreground backdrop-blur-md transition-colors hover:bg-white/10"
          >
            <FlaskConical className="h-4 w-4" />
            {t.notFound.labs}
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
