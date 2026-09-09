"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

// A short lift, no blur. The blur-in reveal reads as decoration; this one
// just keeps the eye moving down the page.
const variants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  className,
  immediate = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /**
   * Skip the entrance for content that starts on screen.
   *
   * A reveal cannot run until the page has hydrated, so anything above the
   * fold sits at `opacity: 0` until then — and if it happens to be the largest
   * element, that is what the browser times the page by. Lighthouse scored
   * /labs at 5.1s for a card whose image had finished downloading inside two
   * seconds. Below the fold this costs nothing, because the visitor has to
   * scroll before they can see it either way.
   */
  immediate?: boolean;
}) {
  if (immediate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
