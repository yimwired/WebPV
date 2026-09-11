"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValueEvent, type MotionValue } from "framer-motion";

/**
 * The unfold, scrubbed off a frame sequence rather than played.
 *
 * A `<video>` driven by `currentTime` is the obvious way to do this and it is
 * the wrong one: seeking to an arbitrary time stutters wherever the codec has
 * to walk back to a keyframe, and iOS Safari will not do it smoothly inline at
 * all. Decoded stills drawn to a canvas behave the same everywhere.
 *
 * The first frame is the same photograph as `folded-*.webp` and the last is the
 * same photograph as `lit-*.webp`, so the still layers on either side of this
 * one can cross-fade into it without anything appearing to move.
 */

export const UNFOLD_FRAMES = 48;

/** Frame sets, smallest first. The first one wide enough for the screen wins. */
const SETS = [
  { dir: "seq-620", width: 620, height: 352, maxDevicePx: 900 },
  { dir: "seq-1100", width: 1100, height: 624, maxDevicePx: Infinity },
] as const;

type FrameSet = (typeof SETS)[number];

const LARGEST = SETS[SETS.length - 1];

function pickSet(): FrameSet {
  if (typeof window === "undefined") return LARGEST;
  const devicePx = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  return SETS.find((set) => devicePx <= set.maxDevicePx) ?? LARGEST;
}

/** Mean colour of a rectangle of the probe, given in 0..1 coordinates. */
function average(
  data: Uint8ClampedArray,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): Patch {
  const left = Math.floor(x0 * PROBE.width);
  const right = Math.max(left + 1, Math.ceil(x1 * PROBE.width));
  const top = Math.floor(y0 * PROBE.height);
  const bottom = Math.max(top + 1, Math.ceil(y1 * PROBE.height));

  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const i = (y * PROBE.width + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
  }
  r = Math.round(r / n);
  g = Math.round(g / n);
  b = Math.round(b / n);

  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return {
    rgb: [r, g, b],
    luma: 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2],
  };
}

const frameUrl = (dir: string, index: number) =>
  `/lab-assets/unfold/${dir}/${String(index).padStart(2, "0")}.webp`;

/**
 * Resolution of the off-screen probe the frame is sampled through. Reading the
 * full 1100x624 surface would be 2.7 MB of pixel data per frame; this is 144
 * pixels and carries everything the page asks of it, which is how bright each
 * corner of the picture is.
 */
const PROBE = { width: 16, height: 9 };

/** Average colour of a region of the picture, 0..1 coordinates. */
export interface Patch {
  rgb: [number, number, number];
  /** relative luminance, for choosing ink that sits on top of it */
  luma: number;
}

export interface FrameSample {
  top: Patch;
  bottom: Patch;
  left: Patch;
  right: Patch;
}

export function UnfoldSequence({
  progress,
  className,
  position,
  onSample,
}: {
  /** 0 folded, 1 open and lit. Values outside the range are clamped. */
  progress: MotionValue<number>;
  className?: string;
  /** `object-position`, so the canvas crops the same way the stills do. */
  position?: MotionValue<string>;
  /**
   * How bright each quarter of the frame is, reported after every paint.
   *
   * The copy sits on the photograph, and the photograph goes from a white
   * studio to an unlit desk partway through. Which ink each block needs is
   * therefore a property of the picture under that block, not of the scroll
   * position: the clip's lights drop between frames 14 and 32, and any
   * hand-set timing for that stops being right the moment the clip changes.
   */
  onSample?: (sample: FrameSample) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const paint = useRef<(at: number) => void>(() => {});
  const queued = useRef(0);
  const sampleCallback = useRef(onSample);

  // Kept in a ref so a new callback identity never re-runs the loader and
  // re-downloads 48 frames; assigned in an effect because assigning during
  // render is not allowed.
  useEffect(() => {
    sampleCallback.current = onSample;
  }, [onSample]);

  useEffect(() => {
    // Chosen once, on mount. Re-picking on resize would re-download 48 files
    // because someone dragged a window wider.
    const set = pickSet();
    const sharp = canvas.current;
    if (sharp) {
      sharp.width = set.width;
      sharp.height = set.height;
    }

    const probe = document.createElement("canvas");
    probe.width = PROBE.width;
    probe.height = PROBE.height;
    const probeContext = probe.getContext("2d", { willReadFrequently: true });

    const frames: HTMLImageElement[] = [];
    let shown = -1;
    let wanted = 0;
    let cancelled = false;

    paint.current = (at: number) => {
      wanted = at;
      // `willReadFrequently` because every paint is followed by a one-pixel
      // read; without it the browser keeps the surface on the GPU and each
      // readback stalls.
      const context = canvas.current?.getContext("2d", {
        willReadFrequently: true,
      });
      if (!context) return;

      const target = Math.min(
        UNFOLD_FRAMES - 1,
        Math.max(0, Math.round(at * (UNFOLD_FRAMES - 1)))
      );
      // Hold the nearest frame that has actually arrived. Early in the load
      // this shows a slightly stale pose instead of a blank canvas.
      let index = target;
      while (index >= 0 && !frames[index]) index -= 1;
      if (index < 0 || index === shown) return;

      context.drawImage(frames[index], 0, 0, set.width, set.height);
      shown = index;

      if (probeContext && sampleCallback.current) {
        probeContext.drawImage(frames[index], 0, 0, PROBE.width, PROBE.height);
        const { data } = probeContext.getImageData(0, 0, PROBE.width, PROBE.height);
        sampleCallback.current({
          top: average(data, 0.2, 0.0, 0.8, 0.3),
          bottom: average(data, 0.2, 0.7, 0.8, 1.0),
          left: average(data, 0.0, 0.25, 0.4, 0.85),
          right: average(data, 0.6, 0.25, 1.0, 0.85),
        });
      }
    };

    // Sequential and in order, so the frames a viewer reaches first are the
    // frames that exist first. Firing all 48 at once lets the network finish
    // them in whatever order it likes.
    void (async () => {
      for (let i = 0; i < UNFOLD_FRAMES && !cancelled; i += 1) {
        const image = new Image();
        image.decoding = "async";
        image.src = frameUrl(set.dir, i);
        try {
          await image.decode();
        } catch {
          continue; // one missing frame should not stop the other 47
        }
        if (cancelled) return;
        frames[i] = image;
        if (i <= Math.round(wanted * (UNFOLD_FRAMES - 1))) paint.current(wanted);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useMotionValueEvent(progress, "change", (value) => {
    if (queued.current) cancelAnimationFrame(queued.current);
    queued.current = requestAnimationFrame(() => {
      queued.current = 0;
      paint.current(value);
    });
  });

  return (
    <motion.canvas
      ref={canvas}
      className={className}
      style={{ objectPosition: position }}
      width={LARGEST.width}
      height={LARGEST.height}
      aria-hidden
    />
  );
}
