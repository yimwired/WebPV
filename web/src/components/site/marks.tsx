"use client";

import { useRef, type ReactNode } from "react";
import { useInView } from "framer-motion";

// Both marks wait until they are on screen and then hand over to CSS
// (`.sweep` and `.scribble` in globals.css). The attribute is set once and
// never removed, so scrolling back up does not replay them.
const inViewOptions = { once: true, margin: "0px 0px -12% 0px" } as const;

/** A key word whose colour sweeps across it once it scrolls into view. */
export function Sweep({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useInView(ref, inViewOptions);

  return (
    <span ref={ref} className="sweep" data-shown={shown ? "" : undefined}>
      {children}
    </span>
  );
}

/** A phrase with a hand-drawn line wiped on underneath it. */
export function Scribble({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useInView(ref, inViewOptions);

  return (
    <span
      ref={ref}
      className="scribble relative inline-block whitespace-nowrap"
      data-shown={shown ? "" : undefined}
    >
      {children}
      {/* One stroke out to the right, then a looser one back underneath it,
          the way a pen underlines twice without lifting. */}
      <svg
        aria-hidden
        viewBox="0 0 300 26"
        preserveAspectRatio="none"
        className="pointer-events-none absolute top-[92%] left-[-3%] h-[0.34em] w-[106%] overflow-visible"
      >
        <path
          d="M3 11C62 5 168 2 297 8C221 11 116 15 34 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
