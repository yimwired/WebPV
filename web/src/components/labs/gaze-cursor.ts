"use client";

import { useEffect, useRef } from "react";

export interface ScrubState {
  /** 0..1 left to right across the viewport, after smoothing */
  progress: number;
  /** 0..1 top to bottom across the viewport, after smoothing */
  tilt: number;
  /**
   * `progress` quantised to `frames`. The rig ignores it and reads `progress`
   * directly, because vector art has no frames to land on — it is here so a
   * canvas or a <video> can be dropped in later without touching this file.
   */
  frame: number;
}

interface Options {
  /** how many frames the source asset is cut into */
  frames: number;
  /** fraction of the remaining distance covered per frame at 60fps */
  damping: number;
  /** seconds for one full sweep when there is no pointer to follow */
  loopSeconds: number;
  /** called once per animation frame while anything is still moving */
  onScrub: (state: ScrubState) => void;
}

const CENTRE = 0.5;

/** Below this on both axes the sweep is over and the loop can stop. */
const SETTLED = 0.0004;

/**
 * Maps the pointer across the viewport onto a 0..1 scrub position and eases
 * the subject towards it.
 *
 * Nothing here goes through React state. A scrub that re-rendered would run a
 * reconcile pass per frame to move one transform, so the loop hands the eased
 * value straight to `onScrub` and the caller writes it onto the DOM.
 *
 * There is no resize listener on purpose: the position is a fraction of
 * `innerWidth` read at the moment the pointer moves, so a window that changes
 * size between two moves is already accounted for by the next event.
 */
export function useCursorScrub({
  frames,
  damping,
  loopSeconds,
  onScrub,
}: Options) {
  // Kept in a ref so a caller can pass an inline arrow without restarting the
  // loop on every render.
  const onScrubRef = useRef(onScrub);
  useEffect(() => {
    onScrubRef.current = onScrub;
  });

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const target = { x: CENTRE, y: CENTRE };
    const eased = { x: CENTRE, y: CENTRE };

    let raf = 0;
    let lastTime = 0;
    let autoplay = false;
    let elapsed = 0;

    const emit = () => {
      onScrubRef.current({
        progress: eased.x,
        tilt: eased.y,
        frame: Math.min(frames - 1, Math.floor(eased.x * frames)),
      });
    };

    const frame = (time: number) => {
      // Seconds, clamped: a tab restored after a minute in the background gets
      // one ordinary step rather than a jump straight to the target.
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 1 / 30) : 1 / 60;
      lastTime = time;

      if (autoplay) {
        elapsed += delta;
        const phase = (elapsed / loopSeconds) * Math.PI * 2;
        target.x = CENTRE + Math.sin(phase) * 0.42;
        target.y = CENTRE + Math.sin(phase * 0.5) * 0.16;
      }

      // Raising the per-frame factor by the number of 60fps steps elapsed keeps
      // the travel time the same on a 144Hz screen as on a 60Hz one. A raw
      // `+= d * damping` would settle more than twice as fast there.
      const factor = 1 - Math.pow(1 - damping, delta * 60);
      const dx = target.x - eased.x;
      const dy = target.y - eased.y;
      eased.x += dx * factor;
      eased.y += dy * factor;

      const moving =
        autoplay || Math.abs(dx) > SETTLED || Math.abs(dy) > SETTLED;

      if (!moving) {
        // Land exactly on the target, or the subject stops a hair off centre
        // and the readout shows a frame it never quite reached.
        eased.x = target.x;
        eased.y = target.y;
      }

      emit();

      raf = moving ? requestAnimationFrame(frame) : 0;
    };

    const start = () => {
      if (raf || document.hidden) return;
      lastTime = 0;
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const handleMove = (event: PointerEvent) => {
      target.x = event.clientX / window.innerWidth;
      target.y = event.clientY / window.innerHeight;
      start();
    };

    // Leaving the window recentres the subject rather than freezing it looking
    // at the last edge the pointer crossed.
    const handleLeave = () => {
      target.x = CENTRE;
      target.y = CENTRE;
      start();
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const apply = () => {
      stop();
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", handleLeave);

      if (reduced.matches) {
        // One frame, held. The subject still exists, it just does not move.
        eased.x = target.x = CENTRE;
        eased.y = target.y = CENTRE;
        autoplay = false;
        emit();
        return;
      }

      autoplay = !finePointer.matches;

      if (autoplay) {
        // Touch has no hover to track, so the sweep plays itself.
        elapsed = 0;
        start();
        return;
      }

      window.addEventListener("pointermove", handleMove, { passive: true });
      document.addEventListener("pointerleave", handleLeave);
      emit();
    };

    apply();

    finePointer.addEventListener("change", apply);
    reduced.addEventListener("change", apply);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", handleLeave);
      finePointer.removeEventListener("change", apply);
      reduced.removeEventListener("change", apply);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [frames, damping, loopSeconds]);
}
