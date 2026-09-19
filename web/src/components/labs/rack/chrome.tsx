"use client";

import type { ReactNode } from "react";

/**
 * The window furniture this page is built out of.
 *
 * Y2K on the web was not a colour palette, it was an operating system: every
 * page pretended to be an application, and the frame around the content did as
 * much of the talking as the content did. So the sections here are windows with
 * title bars, and the controls are the raised bevels of a desktop from 2001,
 * drawn with hard box-shadows rather than the soft ones a site would use now.
 *
 * The bevels are two inset shadows, light from the top-left and dark from the
 * bottom-right, which is how every widget of that era was drawn before border
 * images existed. Pressing one swaps the two, so the control physically sinks.
 */

/** Light, face, shade: the three tones every bevel is cut from. */
const STEEL = {
  light: "#ffffff",
  face: "#d6d9e2",
  shade: "#7c8296",
  edge: "#31344a",
} as const;

export const raised = {
  background: STEEL.face,
  boxShadow: `inset 1.5px 1.5px 0 ${STEEL.light}, inset -1.5px -1.5px 0 ${STEEL.shade}, 0 0 0 1px ${STEEL.edge}`,
};

export const sunken = {
  background: "#eef0f6",
  boxShadow: `inset 1.5px 1.5px 0 ${STEEL.shade}, inset -1.5px -1.5px 0 ${STEEL.light}, 0 0 0 1px ${STEEL.edge}`,
};

interface WindowProps {
  title: string;
  /** shown greyed at the right of the title bar, like a status */
  status?: string;
  children: ReactNode;
  className?: string;
  /** the hot title bar, for the one window that is the point of the page */
  accent?: boolean;
}

export function Win98({
  title,
  status,
  children,
  className,
  accent = false,
}: WindowProps) {
  return (
    <section className={className} style={raised}>
      {/*
        Both bars run left to right from dark to light, and the title sits on
        them in white: the light end is what has to carry it. The hot bar
        opened on #ff2d94 and the cool one closed on #8d93e0, which put the
        title at 3.5:1 and the status text at 2.2:1. Same two ramps, light ends
        taken down until white clears 4.5 across the whole width.
      */}
      <header
        className="flex items-center gap-2 px-2 py-1.5"
        style={{
          background: accent
            ? "linear-gradient(90deg, #d4156f 0%, #a51bd0 60%, #4b19b8 100%)"
            : "linear-gradient(90deg, #2b2f80 0%, #454ca8 70%, #5f66c4 100%)",
        }}
      >
        <span
          aria-hidden
          className="h-3.5 w-3.5 shrink-0"
          style={{
            background: accent ? "#ffe14d" : "#7ef0ff",
            boxShadow: `inset 1px 1px 0 rgba(255,255,255,0.8), 0 0 0 1px ${STEEL.edge}`,
          }}
        />
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold tracking-wide text-white">
          {title}
        </h2>
        {status && (
          <span className="hidden font-mono text-[11px] text-white sm:block">
            {status}
          </span>
        )}
        <span aria-hidden className="flex gap-1">
          {["–", "□", "×"].map((glyph) => (
            <span
              key={glyph}
              className="grid h-4 w-4 place-items-center text-[10px] leading-none text-neutral-900"
              style={raised}
            >
              {glyph}
            </span>
          ))}
        </span>
      </header>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

/**
 * Chrome type: the mirrored metal wordmark that was on every other page in
 * 2001. Built from two stacked copies rather than a gradient on one, because
 * the effect needs a hard horizon line across the middle of the letterforms
 * and a background-clip gradient cannot put one there.
 */
export function ChromeText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <span
        aria-hidden
        className="absolute inset-0 translate-y-[2px] select-none"
        style={{
          WebkitTextStroke: "2px #1b1b2e",
          color: "#1b1b2e",
        }}
      >
        {children}
      </span>
      <span
        className="relative"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #f7fbff 0%, #b9c6de 46%, #4b5f86 50%, #8fa4c6 54%, #f2f6ff 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {children}
      </span>
    </span>
  );
}

/** A four-point sparkle, the era's full stop. */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 0c.7 6.4 4.9 10.6 12 12-7.1 1.4-11.3 5.6-12 12-.7-6.4-4.9-10.6-12-12C7.1 10.6 11.3 6.4 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
