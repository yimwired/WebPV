"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Copy, Mail } from "lucide-react";
import { Reveal } from "./reveal";
import { ContactForm } from "./contact-form";
import { useLocale } from "@/lib/i18n";

const EMAIL = "yimwired@gmail.com";

const socials = [
  // add YouTube / X here when the channels are ready
  { label: "GitHub", href: "https://github.com/yimwired" },
];

export function Footer() {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
    } catch {
      // clipboard blocked (insecure context or denied): the mailto button still works
    }
  };

  return (
    <footer
      id="contact"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32"
    >
      <Reveal className="border-line border-t pt-12">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t.footer.title}
        </h2>
        <p className="text-muted-foreground mt-4 max-w-md">{t.footer.sub}</p>

        <ContactForm />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={`mailto:${EMAIL}`}
            className="border-line-strong text-foreground/90 hover:border-foreground/40 hover:text-foreground group inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 text-sm font-medium transition-colors"
          >
            <Mail className="h-4 w-4" />
            {EMAIL}
          </a>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyEmail}
              className="border-line-strong text-foreground/80 hover:border-foreground/40 hover:text-foreground inline-flex h-11 items-center gap-1.5 rounded-md border px-5 text-sm transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? t.form.copied : t.form.copyEmail}
            </button>
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="border-line-strong text-foreground/80 hover:border-foreground/40 hover:text-foreground group inline-flex h-11 items-center gap-1.5 rounded-md border px-5 text-sm transition-colors"
              >
                {s.label}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="border-line text-muted-foreground mt-16 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm sm:flex-row">
        <span>
          © {new Date().getFullYear()} Film. {t.footer.rights}
        </span>
        <span>{t.footer.builtWith}</span>
      </div>
    </footer>
  );
}
