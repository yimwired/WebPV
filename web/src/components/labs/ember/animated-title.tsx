"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { DUR, EASE, HERO } from "./motion";

interface AnimatedTitleProps {
  /** one entry per visual line. Line breaks are a design decision, not a wrap */
  lines: string[];
  /** seconds before the first line starts */
  start?: number;
  /** gap between one line starting and the next */
  stagger?: number;
  /**
   * Slide each line up from behind a mask. Latin only: the mask has to sit
   * tight against the cap height to read as a reveal, and Thai puts vowels and
   * tone marks outside that box, so a masked Thai line loses its diacritics.
   */
  masked?: boolean;
  /** heading level. Kept to headings: this is a title, never a paragraph */
  as?: "h1" | "h2" | "h3";
  className?: string;
  style?: CSSProperties;
  /** per-line overrides, indexed the same as `lines` */
  lineStyle?: (index: number) => CSSProperties | undefined;
}

/**
 * The hero headline, revealed one line at a time.
 *
 * Plays on mount rather than on scroll: it is the first thing on the page, and
 * waiting for an intersection would mean a blank first frame on a phone where
 * the whole hero is already in view.
 */
export function AnimatedTitle({
  lines,
  start = HERO.titleStart,
  stagger = HERO.lineStagger,
  masked = false,
  as: Tag = "h1",
  className,
  style,
  lineStyle,
}: AnimatedTitleProps) {
  return (
    <Tag className={className} style={style}>
      {lines.map((line, i) => (
        <span
          key={line}
          className="block"
          style={{
            // A masked line clips to its own box, so it needs to be its own
            // formatting context. An unmasked one must not clip at all.
            overflow: masked ? "hidden" : undefined,
            paddingBottom: masked ? "0.06em" : undefined,
          }}
        >
          <motion.span
            className="block"
            style={lineStyle?.(i)}
            initial={{
              y: masked ? "108%" : 30,
              opacity: masked ? 1 : 0,
              rotate: masked ? 0 : 1.4,
            }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{
              duration: masked ? DUR.slow : DUR.base,
              ease: EASE.out,
              delay: start + i * stagger,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
