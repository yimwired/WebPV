"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, FileCode2, Folder, Lock } from "lucide-react";
import { labBySlug } from "@/lib/labs";
import { labCardSrc } from "@/lib/lab-images";
import { lighthouse } from "@/lib/lighthouse";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Sweep } from "./marks";

const ease = [0.22, 1, 0.36, 1] as const;
// Top and bottom only: side margins cut a phone's screen down to its middle,
// and the ticks by the tickets' left edge never entered it.
const once = { once: true, margin: "-80px 0px" } as const;

/** Three of the demos as browser windows, fanned like cards in a hand. */
function DesignArt() {
  const frames = [
    { slug: "longtail", rotate: -7, x: "-34%", y: 26 },
    { slug: "slab", rotate: 6, x: "34%", y: 22 },
    { slug: "counter", rotate: 0, x: "0%", y: 0 },
  ];

  return (
    <div className="absolute inset-0 grid place-items-center">
      {frames.map((frame, i) => {
        const lab = labBySlug(frame.slug);
        return (
          <motion.div
            key={frame.slug}
            initial={{ opacity: 0, x: "0%", y: 40, rotate: 0 }}
            whileInView={{ opacity: 1, x: frame.x, y: frame.y, rotate: frame.rotate }}
            viewport={once}
            transition={{ duration: 0.8, ease, delay: 0.1 + i * 0.1 }}
            className="bg-card shadow-float absolute w-[min(62%,340px)] overflow-hidden rounded-[12px]"
          >
            <div className="border-line flex items-center gap-1.5 border-b px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-[#ff6159]" />
              <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
              <span className="h-2 w-2 rounded-full bg-[#28c941]" />
            </div>
            <div
              className="aspect-[16/10] bg-cover bg-top"
              style={{
                backgroundColor: lab.preview.to,
                backgroundImage: `url(${labCardSrc(lab.slug)})`,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

/** An address bar, then the site's own Lighthouse scores as rings. */
function LiveArt() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const copy = t.platform.cells.live;
  const scores = [
    { label: copy.scores.performance, value: lighthouse.lowest.performance },
    { label: copy.scores.accessibility, value: lighthouse.lowest.accessibility },
    { label: copy.scores.bestPractices, value: lighthouse.lowest.bestPractices },
    { label: copy.scores.seo, value: lighthouse.lowest.seo },
  ];

  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-6 px-6 sm:px-8">
      <div className="bg-card flex h-11 items-center gap-2 rounded-full px-4 text-[14px] shadow-sm">
        <Lock className="h-3.5 w-3.5 text-emerald-700" />
        <span>yourshop.co.th</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {scores.map((score, i) => {
          // Lighthouse's own colours: green from 90, orange from 50.
          const good = score.value >= 90;
          return (
            <div key={score.label} className="flex flex-col items-center text-center">
              <div className="relative h-14 w-14">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className={good ? "stroke-emerald-200" : "stroke-amber-200"} />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className={good ? "stroke-emerald-600" : "stroke-amber-600"}
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: score.value / 100 }}
                    viewport={once}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 1, ease, delay: 0.2 + i * 0.1 }
                    }
                  />
                </svg>
                <span
                  className={cn(
                    "absolute inset-0 grid place-items-center text-[15px] font-medium tabular-nums",
                    good ? "text-emerald-800" : "text-amber-800",
                  )}
                >
                  {score.value}
                </span>
              </div>
              <span className="mt-2 text-[12px] leading-tight">{score.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-muted-foreground text-center text-[12px]">
        {copy.caption.replace("{routes}", String(lighthouse.routes))}
      </p>
    </div>
  );
}

/** The repository card a client ends up holding. */
function YoursArt() {
  const { t } = useLocale();
  const copy = t.platform.cells.yours;
  const files = [
    { name: "app", icon: Folder },
    { name: "public", icon: Folder },
    { name: "package.json", icon: FileCode2 },
  ];

  return (
    <div className="absolute inset-0 grid grid-cols-[minmax(0,1fr)] place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={once}
        transition={{ duration: 0.7, ease, delay: 0.1 }}
        className="bg-card shadow-float w-full max-w-[300px] rounded-[18px] p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[15px] font-medium">
            <Folder className="text-muted-foreground h-4 w-4" />
            your-shop
          </span>
          <span className="text-muted-foreground flex items-center gap-1.5 text-[12px]">
            {copy.owner}
            <span className="border-brand/50 text-brand rounded-full border px-2 py-0.5 font-medium">
              {copy.you}
            </span>
          </span>
        </div>
        <ul className="border-line divide-line mt-3 divide-y rounded-[12px] border text-[13px]">
          {files.map((file) => (
            <li key={file.name} className="flex items-center gap-2 px-3 py-2">
              <file.icon className="text-muted-foreground h-3.5 w-3.5" />
              {file.name}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

/** Three fix requests ticked off one after another. */
function FixesArt() {
  const { t } = useLocale();
  const copy = t.platform.cells.fixes;

  // minmax(0, 1fr): an auto track would size to the longest ticket and push
  // the "Fixed" chips off the panel on a phone.
  return (
    <div className="absolute inset-0 grid grid-cols-[minmax(0,1fr)] place-items-center px-6">
      <ul className="w-full max-w-[460px] space-y-2.5">
        {copy.tickets.map((ticket, i) => (
          <motion.li
            key={ticket}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={once}
            transition={{ duration: 0.5, ease, delay: 0.1 + i * 0.15 }}
            className="bg-card flex items-center gap-3 rounded-[14px] px-4 py-3 text-[14px] shadow-sm"
          >
            <motion.span
              initial={{ scale: 0.3, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={once}
              transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.6 + i * 0.2 }}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </motion.span>
            <span className="min-w-0 flex-1 truncate">{ticket}</span>
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-medium text-emerald-800">
              {copy.fixed}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function Cell({
  art,
  paper,
  title,
  body,
  className,
}: {
  art: ReactNode;
  /** the sheet the illustration is drawn on, always light whatever the theme */
  paper: string;
  title: { mark: string; rest: string };
  body: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Illustration only: everything it shows is said in the text below.
          `paper` brings the light tokens back inside this dark section, so the
          interface drawn on the sheet keeps its own contrast. */}
      <div
        aria-hidden
        className="paper blueprint text-foreground relative h-[260px] overflow-hidden rounded-[28px] sm:h-[300px]"
        style={{ backgroundColor: paper }}
      >
        {art}
      </div>
      <h3 className="mt-6 text-[24px] leading-[1.2] font-medium tracking-[-0.02em] sm:text-[28px]">
        <Sweep>{title.mark}</Sweep>
        {title.rest}
      </h3>
      <p className="text-muted-foreground mt-2.5 max-w-lg text-[16px] leading-relaxed text-pretty">
        {body}
      </p>
    </div>
  );
}

/**
 * What a client gets besides the design: four drawings on drafting paper, set
 * on the deep blue, each with a small working-looking piece of interface. A
 * bento rather than a zigzag, since the card above already alternates picture
 * and text. The four papers stay in the ivory and pale blue family, so the
 * section reads as one set of plans rather than four colours.
 */
export function Platform() {
  const { t } = useLocale();
  const cells = t.platform.cells;

  return (
    <section
      data-nav-tone="dark"
      aria-labelledby="platform-title"
      className="dark bg-background text-foreground px-5 pt-24 pb-28 sm:px-8 sm:pt-32 sm:pb-36"
    >
      <h2
        id="platform-title"
        className="mx-auto max-w-3xl text-center text-[32px] leading-[1.15] font-medium tracking-[-0.025em] text-balance sm:text-[46px] lg:text-[52px]"
      >
        {t.platform.title}
      </h2>

      <div className="mx-auto mt-14 grid max-w-[1180px] gap-x-6 gap-y-14 sm:mt-20 lg:grid-cols-3">
        <Cell
          className="lg:col-span-2"
          art={<DesignArt />}
          paper="oklch(0.982 0.003 95)"
          title={cells.design.title}
          body={cells.design.body}
        />
        <Cell
          art={<LiveArt />}
          paper="oklch(0.935 0.02 255)"
          title={cells.live.title}
          body={cells.live.body
            .replace("{performance}", String(lighthouse.lowest.performance))
            .replace("{accessibility}", String(lighthouse.lowest.accessibility))}
        />
        <Cell
          art={<YoursArt />}
          paper="oklch(0.955 0.022 85)"
          title={cells.yours.title}
          body={cells.yours.body}
        />
        <Cell
          className="lg:col-span-2"
          art={<FixesArt />}
          paper="oklch(0.95 0.012 258)"
          title={cells.fixes.title}
          body={cells.fixes.body}
        />
      </div>
    </section>
  );
}
