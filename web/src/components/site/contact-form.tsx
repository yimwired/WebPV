"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { useLocale } from "@/lib/i18n";

// Not a secret: Formspree ids are visible in the form endpoint either way.
// Keeping the default here means a fresh clone or preview deploy has a working
// form without any env setup; set NEXT_PUBLIC_FORMSPREE_ID to point elsewhere.
const FORM_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || "xdenayky";

type Status = "idle" | "sending" | "sent" | "error";

const fieldClass =
  "w-full rounded-md border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40";

/**
 * Posts straight to Formspree, so the site stays static and keyless.
 * Without a form id configured the whole component is skipped and the footer
 * falls back to its mailto button.
 */
export function ContactForm() {
  const { t } = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  if (!FORM_ID) return null;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");

    try {
      const res = await fetch(`https://formspree.io/f/${FORM_ID}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-3 sm:max-w-lg">
      {/* bots fill hidden fields; people never see this one */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="spec">
            {t.form.name}
          </span>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            placeholder={t.form.namePlaceholder}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="spec">
            {t.form.email}
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder={t.form.emailPlaceholder}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="spec">
          {t.form.message}
        </span>
        <textarea
          name="message"
          required
          rows={4}
          placeholder={t.form.messagePlaceholder}
          className={`${fieldClass} resize-y`}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="bg-foreground text-background inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "sent" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {status === "sending" ? t.form.sending : t.form.send}
        </button>

        <p
          aria-live="polite"
          className={`text-sm ${
            status === "error" ? "text-red-400" : "text-muted-foreground"
          }`}
        >
          {status === "sent" && t.form.success}
          {status === "error" && t.form.error}
        </p>
      </div>
    </form>
  );
}
