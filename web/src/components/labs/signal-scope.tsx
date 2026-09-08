"use client";

import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
//  The oscilloscope in the Signal lab.
//
//  Everything on the readout is computed from the same buffer the trace is
//  drawn from: peak-to-peak, RMS and frequency are measured off the samples,
//  not printed from the constants that generated them. That is the whole point
//  of the page - an instrument that displays numbers it did not measure is a
//  picture of an instrument.
//
//  No WebGL. A scope trace is a thin bright line on a grid, which is what a 2D
//  context is already good at; a shader would cost a dependency and give a
//  softer line.
// ─────────────────────────────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  unit: string;
  /** what one division is worth on the vertical axis, in `unit` */
  perDivision: number;
  /** fundamental, in Hz */
  frequency: number;
  /** amplitude in `unit`, zero to peak */
  amplitude: number;
  /** 0..1, how much broadband noise rides on top */
  noise: number;
  /** relative strength of the 2nd and 3rd harmonic, 0..1 each */
  harmonics: [number, number];
  /** a short line about what this sensor is actually watching */
  about: string;
}

export interface Reading {
  peakToPeak: number;
  rms: number;
  frequency: number;
  unit: string;
}

/** Horizontal divisions across the screen, as on a real scope face. */
const DIVISIONS_X = 10;
const DIVISIONS_Y = 8;

/** Samples held in the ring buffer. One screen's worth at any timebase. */
const SAMPLES = 1024;

/**
 * Signal at time t, in the channel's own unit.
 *
 * Deterministic apart from the noise term: the same t always gives the same
 * fundamental, so a paused trace is the trace that was running.
 */
function sample(channel: Channel, t: number): number {
  const w = 2 * Math.PI * channel.frequency * t;
  const [second, third] = channel.harmonics;

  const wave =
    Math.sin(w) + second * Math.sin(2 * w) + third * Math.sin(3 * w + 0.6);

  // Noise is drawn per sample rather than shaped, because that is what
  // broadband noise is; anything smoother reads as a second signal.
  const noise = channel.noise * (Math.random() * 2 - 1);

  return channel.amplitude * (wave + noise);
}

/**
 * Where the trace should start so the waveform sits still.
 *
 * A real scope holds the picture steady by starting each sweep at the same
 * point on the wave — the trigger. Without it the trace slides sideways at
 * the difference between the sweep rate and the signal, which is the single
 * most obvious tell that a "scope" is an animation.
 */
function triggerOffset(channel: Channel, now: number): number {
  const period = 1 / channel.frequency;
  return now - (now % period);
}

interface ScopeProps {
  channel: Channel;
  /** seconds across the full width */
  timebase: number;
  /** false under prefers-reduced-motion: one frame, then still */
  running: boolean;
  /**
   * Called with fresh measurements a few times a second. Must be stable - it
   * is a dependency of the render loop, so a new identity on every parent
   * render would tear the loop down and rebuild it four times a second.
   */
  onReading: (reading: Reading) => void;
}

export function SignalScope({ channel, timebase, running, onReading }: ScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    const buffer = new Float32Array(SAMPLES);

    /** Wall clock in seconds, so the signal keeps its own time. */
    const started = performance.now() / 1000;

    let lastReport = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const fill = (now: number) => {
      const start = triggerOffset(channel, now);
      for (let i = 0; i < SAMPLES; i++) {
        buffer[i] = sample(channel, start + (i / SAMPLES) * timebase);
      }
    };

    const measure = (): Reading => {
      let min = Infinity;
      let max = -Infinity;
      let sumSquares = 0;

      for (let i = 0; i < SAMPLES; i++) {
        const v = buffer[i];
        if (v < min) min = v;
        if (v > max) max = v;
        sumSquares += v * v;
      }

      // Hysteresis, the way a scope's trigger works, and the reason this needs
      // a second pass: a plain zero crossing counts every wobble the noise puts
      // across the axis, which read 10 kHz off a 48 Hz signal. The level has to
      // be crossed downward before an upward crossing counts again.
      const band = (max - min) * 0.1;
      let crossings = 0;
      let firstCrossing = -1;
      let lastCrossing = -1;
      let armed = false;

      for (let i = 0; i < SAMPLES; i++) {
        const v = buffer[i];
        if (v < -band) {
          armed = true;
        } else if (armed && v > band) {
          armed = false;
          if (firstCrossing < 0) firstCrossing = i;
          lastCrossing = i;
          crossings++;
        }
      }

      // Frequency from the span between the first and last crossing rather than
      // from the count: the partial cycles at each end of the window would
      // otherwise bias it, and badly at slow timebases.
      const cycles = crossings - 1;
      const span = ((lastCrossing - firstCrossing) / SAMPLES) * timebase;
      const frequency = cycles > 0 && span > 0 ? cycles / span : 0;

      return {
        peakToPeak: max - min,
        rms: Math.sqrt(sumSquares / SAMPLES),
        frequency,
        unit: channel.unit,
      };
    };

    const drawGrid = () => {
      ctx.strokeStyle = "rgba(120, 200, 160, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < DIVISIONS_X; i++) {
        const x = Math.round((width / DIVISIONS_X) * i) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let i = 1; i < DIVISIONS_Y; i++) {
        const y = Math.round((height / DIVISIONS_Y) * i) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // The centre lines are brighter, and carry the tick marks a real face has
      ctx.strokeStyle = "rgba(120, 200, 160, 0.3)";
      ctx.beginPath();
      ctx.moveTo(0, Math.round(height / 2) + 0.5);
      ctx.lineTo(width, Math.round(height / 2) + 0.5);
      ctx.moveTo(Math.round(width / 2) + 0.5, 0);
      ctx.lineTo(Math.round(width / 2) + 0.5, height);
      ctx.stroke();
    };

    const drawTrace = () => {
      const midY = height / 2;
      const pixelsPerUnit = height / DIVISIONS_Y / channel.perDivision;

      ctx.beginPath();
      for (let i = 0; i < SAMPLES; i++) {
        const x = (i / (SAMPLES - 1)) * width;
        const y = midY - buffer[i] * pixelsPerUnit;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Phosphor: a wide, dim pass under a narrow, bright one. Cheaper than a
      // blur filter and closer to how a real tube actually looks, since the
      // glow follows the line rather than the whole frame.
      ctx.strokeStyle = "rgba(92, 240, 138, 0.18)";
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.strokeStyle = "#5cf08a";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    };

    const paint = (now: number) => {
      fill(now);
      ctx.clearRect(0, 0, width, height);
      drawGrid();
      drawTrace();
    };

    const frame = (time: number) => {
      paint(performance.now() / 1000 - started);

      // Four readings a second. Faster and the digits flicker too much to read,
      // which is exactly what a real instrument damps its display for.
      if (time - lastReport > 250) {
        lastReport = time;
        onReading(measure());
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => (document.hidden ? stop() : running && start());

    // The scope is one section of a long page: no reason to run it while it is
    // scrolled out of view.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!running) return;
        if (entry.isIntersecting) start();
        else stop();
      },
      { rootMargin: "120px" },
    );

    resize();
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (running) {
      start();
    } else {
      // One frame, measured once, then nothing moves.
      paint(0);
      onReading(measure());
    }

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [channel, timebase, running, onReading]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      role="img"
      aria-label={`Oscilloscope trace for ${channel.name}. The measured values are listed beside it.`}
    />
  );
}
