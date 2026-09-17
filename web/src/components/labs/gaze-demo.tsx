"use client";

import { useCallback, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { useCursorScrub, type ScrubState } from "./gaze-cursor";
import { GazeRig, type GazeRigHandle } from "./gaze-rig";

/**
 * Gaze: a studio page whose subject tracks the cursor.
 *
 * The scrub position is computed once per frame and handed to three consumers
 * imperatively — the rig, the frame counter and the progress bar. None of them
 * is React state, so a full sweep of the viewport re-renders nothing.
 */

/** Frames the subject would be cut into if it were footage rather than vectors. */
const FRAMES = 96;

/** Fraction of the remaining distance covered per frame at 60fps. */
const DAMPING = 0.12;

/** Seconds per sweep when the page plays itself. */
const LOOP_SECONDS = 7;

const STEPS = [
  {
    index: "01",
    title: "Cut",
    body: "The footage is exported as a numbered sequence, not an mp4. A browser seeking inside a compressed video has to decode from the last keyframe every time the cursor moves, which is what makes most attempts at this stutter.",
  },
  {
    index: "02",
    title: "Map",
    body: "Cursor position becomes a fraction of the viewport, and that fraction becomes a frame index. One number drives the whole page, so the same input can move a sphere, a sprite or a video without changing anything upstream.",
  },
  {
    index: "03",
    title: "Ease",
    body: "Each frame moves a fixed share of the distance still to travel, corrected for refresh rate so a 144Hz screen is not twice as quick. When the distance runs out the loop stops instead of idling.",
  },
];

export function GazeDemo() {
  const rigRef = useRef<GazeRigHandle>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lastFrame = useRef(-1);

  const handleScrub = useCallback((state: ScrubState) => {
    rigRef.current?.apply(state);

    if (barRef.current) {
      barRef.current.style.transform = `scaleX(${state.progress.toFixed(4)})`;
    }

    // The counter only has 96 values, so it is written when it actually
    // changes rather than on every frame of the easing.
    if (state.frame !== lastFrame.current && frameRef.current) {
      lastFrame.current = state.frame;
      frameRef.current.textContent = String(state.frame).padStart(3, "0");
    }
  }, []);

  useCursorScrub({
    frames: FRAMES,
    damping: DAMPING,
    loopSeconds: LOOP_SECONDS,
    onScrub: handleScrub,
  });

  return (
    <div
      className="min-h-dvh bg-[#07090a] pb-28 text-[#f4f6f3] antialiased [--gaze-accent:#c6f24e]"
      style={{ colorScheme: "dark" }}
    >
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07090a]/92 backdrop-saturate-150">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a
            href="#top"
            className="inline-flex h-11 items-center font-mono text-sm font-semibold tracking-[0.3em] text-[var(--gaze-accent)]"
          >
            GAZE
          </a>

          <div className="flex items-center gap-6">
            <a
              href="#how"
              className="hidden h-11 items-center font-mono text-xs tracking-[0.18em] text-[#9aa29b] transition-colors hover:text-[#f4f6f3] sm:inline-flex"
            >
              HOW IT WORKS
            </a>
            <a
              href="#contact"
              className="group inline-flex items-center gap-1.5 border border-white/20 px-4 py-2 font-mono text-xs tracking-[0.18em] transition-colors hover:border-[var(--gaze-accent)] hover:text-[var(--gaze-accent)]"
            >
              START
              <ArrowUpRight
                className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="relative mx-auto max-w-6xl px-5 pt-10 pb-20 sm:px-8 sm:pt-16 lg:pt-24">
          <div className="relative overflow-hidden lg:grid lg:grid-cols-12 lg:items-center lg:gap-4 lg:overflow-visible">
            {/*
              The copy leads in the markup so a phone reads the headline before
              it meets the subject, and on wide screens it sits over the rig's
              left edge instead — the overlap the brief asks for, held apart by
              z-index rather than source order. It is not a blend mode:
              difference would flip the headline to near-black every time a
              bright meridian passed under it, so the copy keeps its own colour
              and the rig is held back behind a scrim.
            */}
            <div className="relative z-10 lg:col-span-7 lg:col-start-1 lg:row-start-1">
              <div
                className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10 hidden lg:block"
                style={{
                  background:
                    "radial-gradient(60% 55% at 35% 50%, #07090a 55%, transparent 100%)",
                }}
                aria-hidden="true"
              />

              <p className="font-mono text-xs tracking-[0.28em] text-[var(--gaze-accent)]">
                INTERACTIVE DIRECTION
              </p>

              <h1 className="mt-6 text-balance text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                The page looks back at you.
              </h1>

              <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-[#9aa29b] sm:text-lg">
                A studio for sites that answer the person reading them. Move the
                cursor anywhere on this page: the frame printed below is the one
                a video would have seeked to, and the subject is already on its
                way there.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a
                  href="#contact"
                  className="group relative inline-flex items-center gap-2 overflow-hidden bg-[var(--gaze-accent)] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#07090a] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Start a project
                  <ArrowUpRight
                    className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </a>

                <a
                  href="#how"
                  className="inline-flex items-center gap-2 border border-white/20 px-6 py-3.5 text-sm tracking-wide text-[#f4f6f3] transition-colors hover:border-white/50"
                >
                  See how it works
                </a>
              </div>
            </div>
            <div className="pointer-events-none absolute top-0 -right-[18%] z-0 w-[82vw] opacity-55 lg:relative lg:inset-auto lg:w-auto lg:opacity-100 lg:col-span-6 lg:col-start-7 lg:row-start-1">
              <div className="relative mx-auto aspect-square w-full lg:max-w-[min(62vh,520px)]">
                <GazeRig ref={rigRef} />
              </div>
            </div>
          </div>

          {/* Readout. The same numbers a scrub of real footage would print. */}
          <div className="mt-14 flex items-center gap-5 border-t border-white/10 pt-5 font-mono text-xs tracking-[0.18em] text-[#9aa29b]">
            <span className="whitespace-nowrap">
              FRAME{" "}
              <span
                ref={frameRef}
                data-gaze="frame"
                className="text-[var(--gaze-accent)]"
              >
                048
              </span>
              <span className="text-[#838c85]"> / {FRAMES}</span>
            </span>

            <div className="h-px flex-1 bg-white/12">
              <div
                ref={barRef}
                data-gaze="bar"
                className="h-px origin-left bg-[var(--gaze-accent)]"
                style={{ transform: "scaleX(0.5)" }}
              />
            </div>

            <span className="hidden whitespace-nowrap sm:block">
              LERP {DAMPING}
            </span>
          </div>
        </section>

        <section
          id="how"
          className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8"
        >
          <h2 className="max-w-xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Three parts, and only one of them is the animation.
          </h2>

          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step) => (
              <div key={step.index} className="border-t border-white/12 pt-5">
                <p className="font-mono text-xs tracking-[0.22em] text-[var(--gaze-accent)]">
                  {step.index}
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#9aa29b]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="contact"
          className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-8 sm:px-8"
        >
          <div className="flex flex-col gap-6 border border-white/12 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Got footage and nowhere to put it?
              </h2>
              <p className="mt-2 text-sm text-[#9aa29b]">
                Send the clip. You get a frame count and a build estimate back.
              </p>
            </div>

            <a
              href="mailto:yimwired@gmail.com"
              className="group inline-flex shrink-0 items-center gap-2 bg-[var(--gaze-accent)] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#07090a] transition-transform duration-200 hover:-translate-y-0.5"
            >
              yimwired@gmail.com
              <ArrowUpRight
                className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
