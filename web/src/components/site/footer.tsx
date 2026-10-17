"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Copy, Mail } from "lucide-react";
import { Reveal } from "./reveal";
import { ContactForm } from "./contact-form";
import { pillSecondary } from "./pill";
import { useLocale } from "@/lib/i18n";
import { CONTACT_EMAIL, PROFILES } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The close of every page: one large line, the contact form in the same
 * double-ringed card the rest of the site uses, and the plain ways to reach
 * Film underneath it for anyone who would rather not fill in a form.
 */
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
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
    } catch {
      // clipboard blocked (insecure context or denied): the mailto button still works
    }
  };

  return (
    <footer id="contact" className="scroll-mt-24 px-5 pt-20 pb-10 sm:px-8 sm:pt-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-[36px] leading-[1.08] font-medium tracking-[-0.03em] text-balance sm:text-[52px] lg:text-[60px]">
            {t.footer.title}
          </h2>
          <p className="text-muted-foreground mt-4 text-[17px] leading-relaxed">
            {t.footer.sub}
          </p>
        </Reveal>

        <Reveal className="mx-auto mt-12 max-w-2xl">
          <div className="bg-surface rounded-[36px] p-2">
            <div className="border-line bg-background rounded-[28px] border p-5 sm:p-8">
              <ContactForm />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <a href={`mailto:${CONTACT_EMAIL}`} className={cn(pillSecondary, "h-11 px-5 text-[14px]")}>
              <Mail aria-hidden className="h-4 w-4" />
              {CONTACT_EMAIL}
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className={cn(pillSecondary, "h-11 px-5 text-[14px]")}
            >
              {copied ? (
                <Check aria-hidden className="h-4 w-4" />
              ) : (
                <Copy aria-hidden className="h-4 w-4" />
              )}
              {copied ? t.form.copied : t.form.copyEmail}
            </button>
            {PROFILES.map((profile) => (
              <a
                key={profile.label}
                href={profile.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(pillSecondary, "group h-11 px-5 text-[14px]")}
              >
                {profile.label}
                <ArrowUpRight
                  aria-hidden
                  className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            ))}
          </div>
        </Reveal>

        <div className="border-line text-muted-foreground mt-20 flex flex-col items-center justify-between gap-3 border-t pt-6 text-[14px] sm:flex-row">
          <span>
            © {new Date().getFullYear()} Film. {t.footer.rights}
          </span>
          <span>{t.footer.builtWith}</span>
        </div>
      </div>
    </footer>
  );
}
