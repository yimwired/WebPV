"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { TerminalShell, type Line } from "./terminal-shell";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

// ─────────────────────────────────────────────────────────────
//  Terminal: the page a developer tool needs.
//
//  Signal already covers the instrument register - a face you read. This is
//  the other half of the same audience and the opposite interaction: a prompt
//  you type into. The whole argument of the page is that you can try the tool
//  before installing it, so the terminal has to actually answer.
//
//  Amber phosphor rather than green, which Signal has, and which every
//  terminal mockup reaches for first.
// ─────────────────────────────────────────────────────────────

const GREETING: Line[] = [
  { kind: "muted", text: "ridge 2.4.0 · connected to demo workspace" },
  { kind: "output", text: "Nothing here is installed. This is the real CLI, running on a sandbox." },
  { kind: "muted", text: "" },
  { kind: "muted", text: "type `help`, or try `deploy`" },
];

export function TerminalDemo() {
  const reduced = useReducedMotion();

  return (
    <main className="min-h-dvh bg-[#0c0906] font-mono text-[#e8d5b5] selection:bg-[#ffb000]/25">
      {/* ── header ── */}
      <header className="mx-auto max-w-6xl px-5 pt-12 pb-7 sm:px-8 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <p className="text-[11px] tracking-[0.36em] text-[#ffb000] uppercase">
            ridge · deploy tooling
          </p>
          {/* Static, like every other h1 on this site: an entrance has to wait
              for hydration, and this is the largest thing above the fold. */}
          <h1 className="mt-5 max-w-2xl font-sans text-4xl leading-[1.08] font-semibold tracking-tight text-white text-balance sm:text-5xl">
            Try it before you install it.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#b39468]">
            The prompt below is the tool, not a recording of it. Type a command
            and it answers; press up for history, tab to complete. `open
            pricing` will take you somewhere real.
          </p>
        </motion.div>
      </header>

      {/* ── the terminal ── */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease }}
          className="relative overflow-hidden rounded-lg border border-[#3a2b18] bg-[#120d08] shadow-[0_0_60px_-30px_rgba(255,176,0,0.45)]"
        >
          {/* window bar: a terminal is a window, and the title carries the
              working directory the way a real one does */}
          <div className="flex items-center gap-3 border-b border-[#3a2b18] px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-[#4a3a22]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#4a3a22]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#4a3a22]" />
            </span>
            <span className="text-[11px] tracking-wider text-[#a8752b]">
              ~/work/storefront — ridge
            </span>
          </div>

          <div className="relative h-[22rem] sm:h-[26rem]">
            <TerminalShell animate={!reduced} greeting={GREETING} />

            {/*
              Scanlines and glow, drawn over the text and inert to the pointer.
              Two layers rather than one: the horizontal lines are what a CRT
              mask looks like, the pooled glow at the top is the tube's own
              light. Kept faint enough that the type stays at full contrast -
              a scanline that eats legibility is a costume, not a reference.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.18)_0px,rgba(0,0,0,0.18)_1px,transparent_1px,transparent_3px)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(255,176,0,0.07),transparent_60%)]"
            />
          </div>
        </motion.div>

        <p className="mt-4 text-xs text-[#b39468]">
          {reduced
            ? "Motion reduced · staged output prints at once"
            : "Everything above runs in your browser. No account, nothing installed."}
        </p>
      </section>

      {/* ── what it is ── */}
      <section className="border-t border-[#241a10]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="max-w-xl font-sans text-2xl font-semibold tracking-tight text-white text-balance sm:text-3xl">
            A developer will type before they read.
          </h2>

          <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-3">
            {[
              {
                head: "The prompt is the demo",
                body: "Commands parse, history walks with the arrow keys, tab completes, and unknown input gets a real error. A page that plays a recording of a terminal gets found out by exactly the audience it is aimed at.",
              },
              {
                head: "Latency is content",
                body: "`deploy` prints its steps at the pace the tool would report them, because the interesting claim is 11 seconds, not that a deploy exists. Under reduced motion the same steps arrive at once.",
              },
              {
                head: "It goes somewhere",
                body: "`open pricing` navigates the site. The terminal is the navigation for people who would rather type than scroll, which on this audience is most of them.",
              },
            ].map((block) => (
              <div key={block.head}>
                <h3 className="font-sans text-sm font-semibold tracking-tight text-white">
                  {block.head}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#b39468]">{block.body}</p>
              </div>
            ))}
          </div>

          {/* install block: the one thing a dev tool page must not bury */}
          <div className="mt-14 overflow-hidden rounded-lg border border-[#3a2b18] bg-[#120d08]">
            <div className="border-b border-[#3a2b18] px-5 py-2.5 text-[11px] tracking-[0.2em] text-[#a8752b] uppercase">
              install
            </div>
            <div className="px-5 py-5 text-sm">
              <div className="text-[#ffb000]">
                <span className="text-[#8ce563]">$ </span>
                npm i -g ridge
              </div>
              <div className="mt-2 text-[#b39468]">
                or `brew install ridge` · 4.1 MB · no daemon, no account
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-start gap-5 rounded-lg border border-[#3a2b18] bg-[#120d08] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h3 className="font-sans text-xl font-semibold tracking-tight text-white text-balance sm:text-2xl">
                Selling to people who read the docs first?
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#b39468]">
                Swap the commands for yours and the page still works the way
                this one does. Suits CLIs, infrastructure, APIs and anything
                bought by the person who will run it.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2.5">
              <Link
                href="/pricing"
                className="rounded bg-[#ffb000] px-6 py-3 text-xs font-semibold tracking-[0.15em] text-[#1a1206] uppercase transition-colors hover:bg-[#ffc233]"
              >
                See prices
              </Link>
              <Link
                href="/#contact"
                className="rounded border border-[#4a3a22] px-6 py-3 text-xs font-semibold tracking-[0.15em] text-[#e8d5b5] uppercase transition-colors hover:border-[#ffb000] hover:text-[#ffb000]"
              >
                Ask for a quote
              </Link>
            </div>
          </div>

          {/* room under the floating lab switcher */}
          <p className="mt-14 pb-16 text-xs leading-relaxed text-[#b39468]">
            A fictional tool, built as a style study. The product, its version
            and the release numbers are invented; the shell is real and runs in
            your browser.
          </p>
        </div>
      </section>
    </main>
  );
}
