"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";

/**
 * Ceiling for the device pixel ratio. Retina phones report 3, and rendering a
 * lit metal scene at 3x costs roughly twice what 2x does for a difference
 * nobody can see at arm's length.
 */
const MAX_DPR = 2;

/** What the resolution falls back to once the GPU starts missing frames. */
const FLOOR_DPR = 1;

type Props = Omit<CanvasProps, "frameloop" | "dpr"> & {
  children: ReactNode;
  /**
   * Resolution ceiling for this scene. Lower it where the scene is textured
   * rather than shaded: past roughly one texel per pixel a generated map
   * stops adding detail and starts showing its own grid, so rendering it
   * larger costs frames and looks worse.
   */
  maxDpr?: number;
};

/**
 * A <Canvas> that only draws while somebody could actually be looking at it.
 *
 * Every lab scene used to run its render loop for as long as the page stayed
 * open: scrolled past, tab in the background, phone in a pocket. WebGL has no
 * equivalent of the browser throttling an off-screen animation, so that is a
 * GPU spinning at 60fps for nothing. Here the loop is gated on the canvas
 * being on screen *and* the tab being in front, and the resolution drops
 * itself when frames start arriving late.
 *
 * The observer watches the canvas element itself rather than a wrapper div, so
 * dropping this in place of <Canvas> does not change any layout.
 */
export function SceneCanvas({ children, onCreated, maxDpr: ceiling = MAX_DPR, ...canvasProps }: Props) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  // A ceiling, not a fixed value: passed to R3F as a [min, max] range so a
  // screen that reports 1 stays at 1. Handing it the scalar instead forces
  // every device to render at 2x, which is the opposite of the point.
  const [maxDpr, setMaxDpr] = useState(ceiling);

  // Start true so the first frame paints without waiting a tick for the
  // observer; it corrects itself immediately if the scene is below the fold.
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      // a little margin so the scene is already running by the time it
      // scrolls into view, instead of popping in mid-animation
      { rootMargin: "200px" },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvas]);

  useEffect(() => {
    const sync = () => setTabVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <Canvas
      frameloop={onScreen && tabVisible ? "always" : "never"}
      dpr={[1, maxDpr]}
      onCreated={(state) => {
        setCanvas(state.gl.domElement);
        onCreated?.(state);
      }}
      {...canvasProps}
    >
      {/*
        flipflops caps how many times the monitor is allowed to change its
        mind: after three swings it calls onFallback and stays there, which
        stops a borderline device oscillating between resolutions forever.
      */}
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setMaxDpr(FLOOR_DPR)}
        onIncline={() => setMaxDpr(ceiling)}
        onFallback={() => setMaxDpr(FLOOR_DPR)}
      />
      {children}
    </Canvas>
  );
}
