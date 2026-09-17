"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import { Download, ImageUp, RotateCcw, X } from "lucide-react";

import type { CaptureFn } from "./hinge-scene";

const HingeScene = dynamic(() => import("./hinge-scene"), {
  ssr: false,
  loading: () => null,
});

/**
 * Pixel dimensions of the two panels, which are also the aspect every upload
 * is fitted to. Artwork is redrawn at this size rather than stretched onto
 * the mesh, so a screenshot of any shape lands on the display uncropped in
 * the dimension that matters and centred in the other.
 */
const PANELS = {
  inner: { width: 2670, height: 1878, label: "Inner", ratio: "2670 x 1878" },
  outer: { width: 1398, height: 2034, label: "Outer", ratio: "1398 x 2034" },
} as const;

type PanelId = keyof typeof PANELS;

const FINISHES = [
  { id: "graphite", name: "Graphite", color: "#4b4f55" },
  { id: "chalk", name: "Chalk", color: "#d8d6d1" },
  { id: "bronze", name: "Bronze", color: "#8a6a49" },
] as const;

/**
 * What an export comes out as. The three fixed frames are the sizes the shot
 * is actually going into - a vertical post, a square tile, a slide - so the
 * file needs no crop after it is saved. "Frame" keeps whatever shape the
 * canvas happens to be and just renders it larger.
 */
const FRAMES = [
  { id: "frame", name: "Frame", note: "the shape on screen, 3x" },
  {
    id: "vertical",
    name: "9:16",
    width: 1080,
    height: 1920,
    note: "1080 x 1920",
  },
  { id: "square", name: "1:1", width: 1440, height: 1440, note: "1440 x 1440" },
  { id: "wide", name: "16:9", width: 1920, height: 1080, note: "1920 x 1080" },
] as const;

type FrameId = (typeof FRAMES)[number]["id"];

/** Enough to stop a video file or a RAW dump being decoded into memory. */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * Redraws an uploaded image at the panel's own pixel size, covering it: the
 * artwork fills the display and whatever does not fit is trimmed evenly from
 * both sides, which is what a mockup wants. Returns a texture the scene owns.
 */
async function textureForPanel(
  file: File,
  panel: PanelId,
): Promise<CanvasTexture> {
  const { width, height } = PANELS[panel];
  const bitmap = await createImageBitmap(file);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas unavailable");

  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const drawWidth = bitmap.width * scale;
  const drawHeight = bitmap.height * scale;
  context.drawImage(
    bitmap,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  bitmap.close();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

interface DropZoneProps {
  panel: PanelId;
  hasArtwork: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}

/** One upload slot: click to browse, or drop a file anywhere on the tile. */
function DropZone({ panel, hasArtwork, onFile, onClear }: DropZoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const { label, ratio } = PANELS[panel];

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files);
      }}
      className={`relative rounded-lg border border-dashed p-3 transition-colors ${
        over
          ? "border-amber-300/70 bg-amber-300/5"
          : "border-white/15 bg-white/[0.02]"
      }`}
    >
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex w-full items-center gap-2.5 text-left"
      >
        <ImageUp className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
        <span className="min-w-0">
          <span className="block text-sm text-neutral-200">
            {label} display
            {hasArtwork ? " · loaded" : ""}
          </span>
          <span className="block font-mono text-[11px] text-neutral-500">
            {ratio}
          </span>
        </span>
      </button>

      {hasArtwork && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Remove the ${label.toLowerCase()} display artwork`}
          className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          take(event.target.files);
          // so choosing the same file twice in a row still fires a change
          event.target.value = "";
        }}
      />
    </div>
  );
}

/**
 * Hinge: a mockup studio for a folding phone, built to the published
 * dimensions. Artwork is decoded, drawn and rendered entirely in the page,
 * so nothing a visitor loads ever leaves their machine.
 */
export function HingeDemo() {
  const reduced = useReducedMotion();

  const [fold, setFold] = useState(0.22);
  const [finish, setFinish] = useState<string>(FINISHES[0].id);
  const [artwork, setArtwork] = useState<Record<PanelId, Texture | null>>({
    inner: null,
    outer: null,
  });
  const [frame, setFrame] = useState<FrameId>("vertical");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stage = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const capture = useRef<CaptureFn | null>(null);
  const onCaptureReady = useCallback((fn: CaptureFn) => {
    capture.current = fn;
  }, []);

  // A texture is released where it is replaced, in the state updater below.
  // Doing it in an effect keyed on the artwork instead disposes the surviving
  // panel every time the other one changes: loading the outer display would
  // free the inner display's texture while it was still on screen. The last
  // pair does not need freeing by hand — the canvas goes with the page, and
  // the GPU allocation goes with the canvas.

  // The stage is measured rather than sized in CSS: `container-type: size`
  // reports zero on a phone, where the column takes its height from a
  // min-height rather than from a parent that has one, and a canvas of zero
  // never renders at all.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const loadPanel = async (panel: PanelId, file: File) => {
    if (!file.type.startsWith("image/")) {
      setProblem("That is not an image file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setProblem("That image is over 25 MB. Export a smaller one first.");
      return;
    }

    try {
      const texture = await textureForPanel(file, panel);
      setArtwork((current) => {
        current[panel]?.dispose();
        return { ...current, [panel]: texture };
      });
      setProblem(null);
    } catch {
      setProblem("That image could not be decoded.");
    }
  };

  const clearPanel = (panel: PanelId) => {
    setArtwork((current) => {
      current[panel]?.dispose();
      return { ...current, [panel]: null };
    });
  };

  const save = async () => {
    if (!capture.current) {
      setProblem("The scene is still starting up. Try again in a moment.");
      return;
    }

    setSaving(true);
    try {
      const chosen = FRAMES.find((f) => f.id === frame) ?? FRAMES[0];
      const box = stage.current
        ?.querySelector("canvas")
        ?.getBoundingClientRect();
      const width =
        "width" in chosen ? chosen.width : Math.round((box?.width ?? 1280) * 3);
      const height =
        "height" in chosen
          ? chosen.height
          : Math.round((box?.height ?? 720) * 3);

      const blob = await capture.current(width, height);
      if (!blob) {
        setProblem("The renderer returned nothing. Try again.");
        return;
      }

      // The anchor has to be in the document and the object URL has to outlive
      // the click: a detached link is ignored by some browsers, and revoking
      // the URL on the next line cancels the download before it starts.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hinge-${frame}-${Date.now()}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      setProblem(null);
    } finally {
      setSaving(false);
    }
  };

  const body = FINISHES.find((f) => f.id === finish) ?? FINISHES[0];
  const degrees = Math.round(180 - fold * 180);

  // Only the fixed frames crop; "Frame" is whatever shape the canvas already is.
  const chosenFrame = FRAMES.find((f) => f.id === frame) ?? FRAMES[0];
  const cropFrame = "width" in chosenFrame ? chosenFrame : null;

  // Letterboxed inside the stage: as wide as it goes without getting taller.
  const stageBox = (() => {
    if (!cropFrame || stageSize.width === 0) return null;
    const ratio = cropFrame.width / cropFrame.height;
    const width = Math.min(stageSize.width, stageSize.height * ratio);
    return { width, height: width / ratio };
  })();

  return (
    <main className="relative min-h-dvh overflow-hidden bg-neutral-950 text-neutral-100">
      {/* the set: a pool of light the device sits in, not a gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 8%, #1b1c1f 0%, #101113 45%, #0a0a0b 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh max-w-7xl flex-col gap-6 px-5 pt-8 pb-28 lg:flex-row lg:items-stretch lg:gap-10 lg:px-8">
        <div className="flex w-full flex-col lg:max-w-xs">
          <header>
            <p className="font-mono text-[11px] tracking-[0.2em] text-amber-300/80 uppercase">
              Mockup studio
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight">Hinge</h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Put a design on a folding phone, find the angle, take the shot.
              Built to the published dimensions: 117.8 by 164.6 by 5.2 open,
              11.3 thick shut. Your artwork is decoded and rendered here in the
              page and never uploaded anywhere.
            </p>
          </header>

          <div className="mt-7 space-y-5">
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="fold" className="text-sm text-neutral-300">
                  Fold
                </label>
                <output
                  htmlFor="fold"
                  className="font-mono text-xs text-neutral-500"
                >
                  {degrees}&deg;
                </output>
              </div>
              <input
                id="fold"
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={fold}
                onChange={(event) => setFold(Number(event.target.value))}
                className="mt-2 w-full accent-amber-300"
              />
            </div>

            <fieldset>
              <legend className="text-sm text-neutral-300">Finish</legend>
              <div className="mt-2 flex gap-2">
                {FINISHES.map((option) => {
                  const active = option.id === finish;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFinish(option.id)}
                      aria-pressed={active}
                      className={`flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                        active
                          ? "border-amber-300/60 bg-amber-300/10 text-white"
                          : "border-white/12 text-neutral-400 hover:border-white/25 hover:text-neutral-200"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20"
                        style={{ background: option.color }}
                      />
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm text-neutral-300">Export frame</legend>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {FRAMES.map((option) => {
                  const active = option.id === frame;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFrame(option.id)}
                      aria-pressed={active}
                      title={option.note}
                      className={`rounded-lg border px-1 py-2 text-xs transition-colors ${
                        active
                          ? "border-amber-300/60 bg-amber-300/10 text-white"
                          : "border-white/12 text-neutral-400 hover:border-white/25 hover:text-neutral-200"
                      }`}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-neutral-500">
                {(FRAMES.find((f) => f.id === frame) ?? FRAMES[0]).note}
              </p>
            </fieldset>

            <div className="space-y-2.5">
              {(Object.keys(PANELS) as PanelId[]).map((panel) => (
                <DropZone
                  key={panel}
                  panel={panel}
                  hasArtwork={Boolean(artwork[panel])}
                  onFile={(file) => void loadPanel(panel, file)}
                  onClear={() => clearPanel(panel)}
                />
              ))}
            </div>

            {problem && (
              <p role="status" className="text-xs text-red-300">
                {problem}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-medium text-neutral-950 transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Download className="h-4 w-4" aria-hidden />
                {saving ? "Rendering" : "Export PNG"}
              </button>
              <button
                type="button"
                onClick={() => setFold(0.22)}
                aria-label="Reset the fold angle"
                className="grid h-[42px] w-[42px] place-items-center rounded-lg border border-white/12 text-neutral-400 transition-colors hover:border-white/25 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-neutral-500">
              The stage is the frame: what you see is the file, on a transparent
              background, so the shot drops straight onto whatever it is going
              into. Drag the device to turn it. An unofficial study: this is not
              any manufacturer&rsquo;s artwork or branding.
            </p>
          </div>
        </div>

        {/*
          The canvas fills its container by percentage, and a percentage height
          against an auto-height parent resolves to zero: without the absolute
          layer here the scene renders at the 350x150 a canvas defaults to.
        */}
        {/*
          The canvas is given the shape of the export, so what is on screen is
          the file: no crop overlay to reconcile, and no reframing at capture
          time that could disagree with the preview. Sizing is container query
          units rather than a measured width in state, which is what "contain"
          means in one line: as wide as the stage, but never taller than it.
        */}
        <div ref={stage} className="relative min-h-[60vh] flex-1 lg:min-h-0">
          <div className="absolute inset-0 grid place-items-center">
            <div
              // The export is transparent, so without an outline the frame
              // has no visible edge against the page behind it.
              className={`relative overflow-hidden ${
                stageBox ? "rounded-sm outline outline-1 outline-white/12" : ""
              }`}
              style={
                stageBox
                  ? { width: stageBox.width, height: stageBox.height }
                  : { width: "100%", height: "100%" }
              }
            >
              <HingeScene
                fold={fold}
                inner={artwork.inner}
                outer={artwork.outer}
                bodyColor={body.color}
                damping={!reduced}
                onCaptureReady={onCaptureReady}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
