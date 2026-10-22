"use client";

import { useRef, type ReactNode } from "react";
import { useInView } from "framer-motion";

/**
 * A key word that is gilded once it scrolls into view. The component only
 * watches for that moment and sets `data-shown`; `.sweep` in globals.css does
 * the rest. The attribute is set once and never removed, so scrolling back up
 * does not replay it.
 */
export function Sweep({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });

  return (
    <span ref={ref} className="sweep" data-shown={shown ? "" : undefined}>
      {children}
    </span>
  );
}
