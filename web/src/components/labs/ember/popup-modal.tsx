"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Phone, X } from "lucide-react";
import { MODAL } from "./motion";
import { COLOR, FONT, Z } from "./theme";

export interface ModalPayload {
  /** identifies the content, so switching cards remounts the panel */
  key: string;
  eyebrow: string;
  title: string;
  latin?: string;
  price?: string;
  photo?: string;
  lead: string;
  facts: { label: string; value: string }[];
  list?: { heading: string; items: string[] };
  note?: string;
  action?: { label: string; href: string };
  /**
   * Offset in pixels from the centre of the viewport to the centre of the card
   * that opened this. The panel starts there and grows into place, so the
   * dialog reads as the card enlarging rather than as a new thing arriving.
   */
  from: { x: number; y: number };
}

/**
 * Where the dialog should grow from, given the element that was clicked.
 * Returns the offset from the centre of the viewport to the centre of that
 * element, which is exactly what the panel has to start at to sit on top of it.
 */
export function originFrom(el: HTMLElement): ModalPayload["from"] {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - window.innerWidth / 2,
    y: rect.top + rect.height / 2 - window.innerHeight / 2,
  };
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input",
  "select",
  "textarea",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

interface PopupModalProps {
  payload: ModalPayload | null;
  onClose: () => void;
}

/**
 * The dialog behind every card on this page.
 *
 * Four things it has to get right, and all four are easy to leave out: Escape
 * closes it, a click on the backdrop closes it, the page underneath does not
 * scroll while it is open, and focus moves into the panel and comes back to
 * the card afterwards.
 */
export function PopupModal({ payload, onClose }: PopupModalProps) {
  const open = payload !== null;
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Escape, and focus moved into the panel then handed back on close.
  useEffect(() => {
    if (!open) return;

    returnTo.current = document.activeElement as HTMLElement | null;
    // The panel itself takes focus rather than the close button: a screen
    // reader should reach the heading before it reaches "close".
    panelRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      // Tab must not walk out into the page behind the dialog.
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const restore = returnTo.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      restore?.focus();
    };
  }, [open, onClose]);

  // Freeze the page behind the dialog. The scrollbar's width is replaced with
  // padding, otherwise the whole layout jumps sideways as it disappears.
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [open]);

  const onBackdrop = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // mousedown rather than click: a drag that starts inside the panel and
      // ends on the backdrop is a text selection, not a dismissal.
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {payload && (
        <motion.div
          key="ember-modal"
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
          style={{ zIndex: Z.modal }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MODAL.backdrop}
          onMouseDown={onBackdrop}
        >
          {/* pointer-events-none matters: without it this sheet, not the
              container, is what a click on the backdrop lands on, and the
              dismiss test on `event.target === event.currentTarget` never
              fires. The blur is decoration and should not take the click. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 backdrop-blur-md"
            style={{ background: "rgba(21, 12, 10, 0.62)" }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative max-h-[86vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.5)] outline-none"
            style={{ background: COLOR.cream, fontFamily: FONT.thai }}
            initial={{
              opacity: 0,
              scale: MODAL.fromScale,
              x: payload.from.x,
              y: payload.from.y,
            }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{
              opacity: 0,
              scale: MODAL.fromScale,
              x: payload.from.x,
              y: payload.from.y,
              // Dismissing is faster than opening. Opening is the reveal and
              // can take its time; on the way out the panel is in the way.
              transition: MODAL.panelOut,
            }}
            transition={MODAL.panelIn}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: COLOR.char,
                color: COLOR.onChar,
                outlineColor: COLOR.ember,
              }}
            >
              <X className="h-5 w-5" />
            </button>

            {payload.photo && (
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-3xl">
                <Image
                  src={payload.photo}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 512px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="space-y-5 p-6 sm:p-8">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.18em]"
                  style={{ color: COLOR.flameDeep }}
                >
                  {payload.eyebrow}
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 pr-12">
                  <h2
                    id={titleId}
                    className="text-3xl font-extrabold"
                    style={{ color: COLOR.ink }}
                  >
                    {payload.title}
                  </h2>
                  {payload.latin && (
                    <span
                      className="text-xl"
                      style={{ fontFamily: FONT.display, color: COLOR.inkMuted }}
                    >
                      {payload.latin}
                    </span>
                  )}
                </div>
                {payload.price && (
                  <p
                    className="mt-1 text-2xl font-bold"
                    style={{ color: COLOR.flameDeep }}
                  >
                    {payload.price}
                  </p>
                )}
              </div>

              <p
                className="text-[15px] leading-relaxed"
                style={{ color: COLOR.inkMuted }}
              >
                {payload.lead}
              </p>

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {payload.facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-2xl px-4 py-3"
                    style={{ background: COLOR.creamDeep }}
                  >
                    <dt
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: COLOR.inkMuted }}
                    >
                      {fact.label}
                    </dt>
                    <dd
                      className="mt-0.5 text-sm font-semibold"
                      style={{ color: COLOR.ink }}
                    >
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {payload.list && (
                <div>
                  <h3
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: COLOR.ink }}
                  >
                    {payload.list.heading}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {payload.list.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2.5 text-[15px]"
                        style={{ color: COLOR.ink }}
                      >
                        <Check
                          className="mt-1 h-4 w-4 shrink-0"
                          style={{ color: COLOR.flameDeep }}
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {payload.note && (
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: COLOR.inkMuted }}
                >
                  {payload.note}
                </p>
              )}

              {payload.action && (
                <a
                  href={payload.action.href}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-bold transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: COLOR.flame,
                    color: COLOR.cream,
                    outlineColor: COLOR.char,
                  }}
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  {payload.action.label}
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
