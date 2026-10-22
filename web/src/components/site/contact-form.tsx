"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, CircleCheck, Loader2, Send, X } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Not a secret: Formspree ids are visible in the form endpoint either way.
// Keeping the default here means a fresh clone or preview deploy has a working
// form without any env setup; set NEXT_PUBLIC_FORMSPREE_ID to point elsewhere.
const FORM_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || "xdenayky";

type Status = "idle" | "sending" | "sent" | "error";
type FieldName = "name" | "email" | "message";
type FieldError = "missing" | "shape";
type FieldErrors = Partial<Record<FieldName, FieldError>>;

/** Document order, which is also the order focus goes to the first problem. */
const FIELDS: FieldName[] = ["name", "email", "message"];

// Deliberately loose: something, an @, something, a dot, something. The
// browser's own check is no stricter, and a real typo is caught by the reply
// bouncing, not by a pattern.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkField(name: FieldName, value: string): FieldError | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "missing";
  if (name === "email" && !EMAIL_SHAPE.test(trimmed)) return "shape";
  return undefined;
}

const isField = (name: string): name is FieldName =>
  (FIELDS as string[]).includes(name);

// The toast is portalled to <body>, which exists only in the browser. Read
// through useSyncExternalStore so the server and the first client render agree.
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(subscribe, () => true, () => false);

// border-line-control, not border-line: --surface sits only 1.1:1 off the page,
// so the border is the only thing marking where the field is. WCAG 1.4.11 wants
// 3:1 for that. A field with a problem swaps that border for --destructive.
const fieldClass =
  "w-full rounded-[14px] border border-line-control bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:ring-destructive/30";

const labelClass = "text-[13px] font-medium";

/** What is wrong with a field, on a chip of warm glass right under it. */
function FieldMessage({ id, children }: { id: string; children: ReactNode }) {
  return (
    <motion.p
      id={id}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="glass glass-warn text-destructive flex w-fit max-w-full items-center gap-1.5 rounded-full py-1.5 ps-2 pe-3 text-[13px] leading-snug font-medium"
    >
      <AlertCircle aria-hidden className="h-4 w-4 shrink-0" />
      {children}
    </motion.p>
  );
}

/**
 * Posts straight to Formspree, so the site stays static and keyless.
 * Without a form id configured the whole component is skipped and the footer
 * falls back to its mailto button.
 *
 * The browser's own validation is switched off (`noValidate`): its bubble
 * cannot be styled and reads as the operating system talking, not the site.
 * The checks run on submit, then live on each field that has a problem, so a
 * message disappears as soon as it is answered and never shows up before the
 * first attempt to send.
 */
export function ContactForm() {
  const { t } = useLocale();
  const isClient = useIsClient();
  const idPrefix = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [toast, setToast] = useState<"sent" | "error" | null>(null);
  const fields = useRef<Partial<Record<FieldName, HTMLInputElement | HTMLTextAreaElement>>>({});

  // A success can go once it has been read; a failure stays a little longer,
  // since it asks the visitor to do something else.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast === "sent" ? 7000 : 12000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!FORM_ID) return null;

  const ids = Object.fromEntries(
    FIELDS.map((name) => [name, `${idPrefix}-${name}`]),
  ) as Record<FieldName, string>;

  const messageFor = (name: FieldName): string | undefined => {
    const error = errors[name];
    if (!error) return undefined;
    if (name === "email" && error === "shape") return t.form.errors.emailShape;
    return t.form.errors[name];
  };

  // Field props shared by all three: the problem, if any, is announced with
  // the field because it is wired up as part of the field's description.
  const fieldProps = (name: FieldName) => ({
    id: ids[name],
    name,
    required: true,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${ids[name]}-error` : undefined,
  });

  const onInput = (event: FormEvent<HTMLFormElement>) => {
    if (!attempted) return;
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!isField(target.name)) return;
    const name = target.name;
    const error = checkField(name, target.value);
    setErrors((previous) =>
      previous[name] === error ? previous : { ...previous, [name]: error },
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const found: FieldErrors = {};
    for (const name of FIELDS) {
      const error = checkField(name, String(data.get(name) ?? ""));
      if (error) found[name] = error;
    }
    setAttempted(true);
    setErrors(found);

    const firstProblem = FIELDS.find((name) => found[name]);
    if (firstProblem) {
      fields.current[firstProblem]?.focus();
      return;
    }

    setToast(null);
    setStatus("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${FORM_ID}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      form.reset();
      setAttempted(false);
      setStatus("sent");
      setToast("sent");
    } catch {
      setStatus("error");
      setToast("error");
    }
  };

  const nameMessage = messageFor("name");
  const emailMessage = messageFor("email");
  const bodyMessage = messageFor("message");

  return (
    <form noValidate onSubmit={onSubmit} onInput={onInput} className="grid gap-4">
      {/* bots fill hidden fields; people never see this one */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <label htmlFor={ids.name} className={labelClass}>
            {t.form.name}
          </label>
          <input
            {...fieldProps("name")}
            ref={(node) => {
              fields.current.name = node ?? undefined;
            }}
            type="text"
            autoComplete="name"
            placeholder={t.form.namePlaceholder}
            className={fieldClass}
          />
          <AnimatePresence initial={false}>
            {nameMessage && (
              <FieldMessage id={`${ids.name}-error`}>{nameMessage}</FieldMessage>
            )}
          </AnimatePresence>
        </div>
        <div className="grid content-start gap-1.5">
          <label htmlFor={ids.email} className={labelClass}>
            {t.form.email}
          </label>
          <input
            {...fieldProps("email")}
            ref={(node) => {
              fields.current.email = node ?? undefined;
            }}
            type="email"
            autoComplete="email"
            placeholder={t.form.emailPlaceholder}
            className={fieldClass}
          />
          <AnimatePresence initial={false}>
            {emailMessage && (
              <FieldMessage id={`${ids.email}-error`}>{emailMessage}</FieldMessage>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={ids.message} className={labelClass}>
          {t.form.message}
        </label>
        <textarea
          {...fieldProps("message")}
          ref={(node) => {
            fields.current.message = node ?? undefined;
          }}
          rows={4}
          placeholder={t.form.messagePlaceholder}
          className={`${fieldClass} resize-y`}
        />
        <AnimatePresence initial={false}>
          {bodyMessage && (
            <FieldMessage id={`${ids.message}-error`}>{bodyMessage}</FieldMessage>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="bg-foreground text-background inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
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

        {/* What screen readers hear. It is in the page from the first render,
            which is what makes a live region announce reliably; the glass
            toast below is the same news for the eye. */}
        <p aria-live="polite" className="sr-only">
          {status === "sent" && t.form.success}
          {status === "error" && t.form.error}
        </p>
      </div>

      {isClient &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4 sm:bottom-6">
            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "glass glass-dense text-foreground pointer-events-auto flex w-full max-w-[440px] items-center gap-3 rounded-[20px] py-2.5 ps-4 pe-2 text-[14px] leading-snug",
                    "font-site",
                  )}
                >
                  {toast === "sent" ? (
                    <CircleCheck aria-hidden className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle aria-hidden className="text-destructive h-5 w-5 shrink-0" />
                  )}
                  <p className="flex-1">{toast === "sent" ? t.form.success : t.form.error}</p>
                  <button
                    type="button"
                    onClick={() => setToast(null)}
                    aria-label={t.form.dismiss}
                    className="text-foreground/80 hover:text-foreground hover:bg-foreground/[0.07] grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors"
                  >
                    <X aria-hidden className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </form>
  );
}
