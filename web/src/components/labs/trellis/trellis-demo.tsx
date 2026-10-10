"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { flushSync } from "react-dom";

import { buildSvg, download, embeddedFonts, fileName, sceneText, svgToPng, type SceneInput } from "./export";
import { fitDesign } from "./fit";
import { clustersOf } from "./glyph";
import { PalettePicker } from "./palette-picker";
import { PALETTES, paletteById, paletteVars, type Palette } from "./palettes";
import { markWindows, piecesFor, placedGlyphs } from "./scene";
import { readShared, shareLink } from "./share";
import { Stage } from "./stage";
import { TRELLIS_CSS } from "./trellis-css";
import { useGarden, type Mode } from "./use-garden";

/** What is growing when the page opens, with seeds picked so it opens well. */
const OPENING = { text: "Bloom", seeds: [246686, 974669, 948954, 842533, 936154] };

const MODES: { id: Mode; label: string }[] = [
  { id: "type", label: "พิมพ์" },
  { id: "poster", label: "โปสเตอร์" },
];

/** The controls' face: the site's mono for Latin, Anuphan for Thai. */
const CHROME_FONT = "var(--font-geist-mono), var(--font-trellis-ui), ui-monospace, monospace";

const pill = "inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";
const pillStyle: CSSProperties = { borderColor: "var(--tr-line)", color: "var(--tr-ink)", outlineColor: "var(--tr-ink)" };

const subscribeNever = () => () => {};

/**
 * Trellis: type a word and a garden grows out of its letters.
 *
 * Built from a reel of a web toy Film sent, and laid out the way it is: the
 * whole screen is the garden, and every control sits on top of it, a link to
 * share at the top left, Type and Poster at the top right, the palettes and the
 * exports along the bottom.
 *
 * What it does that the reel does not: the vines coil around the letters'
 * strokes, passing in front of one and behind the next, so the plants hold on
 * to the type instead of being laid over it; a pointer passing over a letter
 * shakes its plant, and pressing one grows it again; Thai is typed as readily
 * as Latin, with its marks kept clear; and a link rebuilds the same garden.
 */
export function TrellisDemo() {
  const [palette, setPalette] = useState<Palette>(PALETTES[0]);
  const [mode, setMode] = useState<Mode>("type");
  const garden = useGarden(OPENING, mode);
  const hintsId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // A shared link carries the text, its seeds, the palette and the mode. Read
  // as an external store so the first render matches the exported HTML, then
  // applied once, during render, before anything has grown.
  const search = useSyncExternalStore(subscribeNever, () => window.location.search, () => "");
  const [appliedSearch, setAppliedSearch] = useState("");
  if (search !== appliedSearch) {
    setAppliedSearch(search);
    const shared = readShared(search);
    if (shared.text !== undefined) garden.replace(shared.text, shared.seeds);
    if (shared.palette) setPalette(paletteById(shared.palette));
    if (shared.mode) setMode(shared.mode);
  }

  // On a phone the keyboard covers the bottom of the screen without resizing
  // anything fixed, so the page follows the visual viewport and the garden
  // refits above the keyboard. Not while pinch-zoomed: following the zoom
  // would undo it.
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = rootRef.current;
    if (!viewport || !root) return;
    const follow = () => {
      const zoomed = Math.abs(viewport.scale - 1) > 0.01;
      root.style.height = zoomed ? "" : `${viewport.height}px`;
      root.style.transform = zoomed ? "" : `translateY(${viewport.offsetTop}px)`;
    };
    follow();
    viewport.addEventListener("resize", follow);
    viewport.addEventListener("scroll", follow);
    return () => {
      viewport.removeEventListener("resize", follow);
      viewport.removeEventListener("scroll", follow);
    };
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Land and type, the way the reel opens with its caret already blinking: on a
  // device with a keyboard the field takes focus at once, and a key pressed
  // while a swatch or button has focus still reaches the garden. Space, Enter
  // and the arrows are left alone there, since those operate the control.
  const latest = useRef({ type: garden.type, text: garden.text });
  useEffect(() => {
    latest.current = { type: garden.type, text: garden.text };
  });
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      const input = inputRef.current;
      const active = document.activeElement;
      if (!input || active === input || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (active instanceof HTMLTextAreaElement || (active instanceof HTMLInputElement && active.type === "text")) return;
      if (event.key === "Backspace") {
        event.preventDefault();
        input.focus({ preventScroll: true });
        latest.current.type(clustersOf(latest.current.text).slice(0, -1).join(""));
      } else if (event.key.length === 1 && event.key !== " ") {
        input.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { sprouts, lines, layout, box, glyphOf, family } = garden;
  const fit = useMemo(() => (size && layout ? fitDesign(size, mode, layout, box) : null), [size, mode, layout, box]);
  const placed = useMemo(() => placedGlyphs(sprouts, layout, glyphOf), [sprouts, layout, glyphOf]);
  const pieces = useMemo(() => piecesFor(sprouts, layout, placed), [sprouts, layout, placed]);
  const marks = useMemo(() => markWindows(lines, layout, glyphOf), [lines, layout, glyphOf]);

  const counts = useMemo(
    () =>
      sprouts.reduce(
        (total, s) => ({ roses: total.roses + (s.plant?.roses.length ?? 0), leaves: total.leaves + (s.plant?.leaves.length ?? 0) }),
        { roses: 0, leaves: 0 },
      ),
    [sprouts],
  );
  const footer = {
    left: `กุหลาบ ${counts.roses} ดอก · ใบ ${counts.leaves} ใบ`,
    right: palette.credit ? `ชุดสี${palette.name} · ระบบสีไทยโทน` : `ชุดสี${palette.name}`,
  };

  // A new palette wipes in as a circle opening from its swatch, the way the
  // site's theme toggle does it (theme-toggle.tsx says why the origin is a
  // percentage and why it is scripted). Every pixel is either the old palette
  // or the new one, never a blend of the two, and the wipe moves two snapshots
  // rather than repainting the garden. Without view transitions, or under
  // reduced motion, the palette simply changes.
  const choosePalette = (next: Palette, swatch: DOMRect | undefined) => {
    const startViewTransition = document.startViewTransition?.bind(document);
    if (!startViewTransition || !swatch || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPalette(next);
      return;
    }
    const x = ((swatch.left + swatch.width / 2) / window.innerWidth) * 100;
    const y = ((swatch.top + swatch.height / 2) / window.innerHeight) * 100;
    const transition = startViewTransition(() => flushSync(() => setPalette(next)));
    transition.ready.then(
      () => {
        document.documentElement.animate(
          { clipPath: [`circle(0% at ${x}% ${y}%)`, `circle(150% at ${x}% ${y}%)`] },
          { duration: 600, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      },
      // A press on the next swatch before this one is ready skips it, which
      // rejects `ready`. The newer wipe is the one that should run.
      () => {},
    );
  };

  const announce = useCallback((message: string) => {
    setStatus(message);
    setTimeout(() => setStatus((current) => (current === message ? "" : current)), 2600);
  }, []);

  const copyLink = async () => {
    const link = shareLink(`${window.location.origin}${window.location.pathname}`, {
      text: garden.text,
      seeds: sprouts.map((s) => s.seed),
      palette: palette.id,
      mode,
    });
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      announce("คัดลอกลิงก์แล้ว ใครเปิดก็เห็นสวนเดียวกัน");
    } catch {
      announce("คัดลอกลิงก์ไม่ได้ ลองอีกครั้ง");
    }
  };

  const save = async (kind: "png" | "svg") => {
    if (!layout || !family || busy) return;
    setBusy(true);
    try {
      const scene: SceneInput = {
        mode,
        lines,
        layout,
        box,
        sprouts,
        pieces,
        marks,
        palette,
        family,
        captionFamily: rootRef.current ? getComputedStyle(rootRef.current).getPropertyValue("--font-trellis-ui").trim() : "sans-serif",
        footer: mode === "poster" ? footer : null,
      };
      const fonts = await embeddedFonts(`${family}, ${scene.captionFamily}`, sceneText(scene));
      const { svg, width, height } = buildSvg(scene, fonts);
      if (kind === "svg") download(new Blob([svg], { type: "image/svg+xml" }), fileName(garden.text, "svg"));
      else download(await svgToPng(svg, width, height), fileName(garden.text, "png"));
      announce(kind === "png" ? "บันทึกไฟล์ PNG แล้ว" : "บันทึกไฟล์ SVG แล้ว");
    } catch {
      announce("บันทึกไฟล์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const exportButtons = (
    <>
      <button type="button" className={pill} style={pillStyle} onClick={() => save("png")} aria-label="บันทึกเป็นไฟล์ PNG" disabled={busy}>
        PNG
      </button>
      <button type="button" className={pill} style={pillStyle} onClick={() => save("svg")} aria-label="บันทึกเป็นไฟล์ SVG" disabled={busy}>
        SVG
      </button>
    </>
  );

  const frame = mode === "poster" ? fit?.frame : null;

  return (
    <div
      ref={rootRef}
      className="tr-root fixed inset-x-0 top-0 h-dvh overflow-hidden"
      style={{ ...paletteVars(palette), fontFamily: CHROME_FONT } as CSSProperties}
    >
      <style>{TRELLIS_CSS}</style>
      <h1 className="sr-only">Trellis พิมพ์คำ แล้วดูกุหลาบงอกจากตัวอักษร</h1>

      {frame ? (
        <div
          aria-hidden
          data-poster-frame=""
          className="pointer-events-none absolute border"
          style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height, borderColor: "var(--tr-line)" }}
        >
          <div
            className="absolute inset-x-[10%] bottom-[3.2%] flex justify-between gap-4"
            style={{ fontSize: Math.max(11, frame.width * 0.022), color: "var(--tr-muted)", fontFamily: "var(--font-trellis-ui), sans-serif" }}
          >
            <span>{footer.left}</span>
            <span>{footer.right}</span>
          </div>
        </div>
      ) : null}

      <Stage
        garden={garden}
        fit={fit}
        pieces={pieces}
        marks={marks}
        hintsId={hintsId}
        inputRef={inputRef}
        stageRef={stageRef}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-5">
        <div className="pointer-events-auto flex gap-2">
          <button type="button" className={pill} style={pillStyle} onClick={copyLink}>
            {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
          </button>
          <div className="flex gap-2 sm:hidden">{exportButtons}</div>
        </div>
        <fieldset className="pointer-events-auto flex rounded-full border p-1" style={{ borderColor: "var(--tr-line)" }}>
          <legend className="sr-only">มุมมอง</legend>
          {MODES.map((option) => {
            const chosen = option.id === mode;
            return (
              <label
                key={option.id}
                className="flex h-7 cursor-pointer items-center rounded-full px-3 text-[13px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                style={{
                  background: chosen ? "var(--tr-ink)" : "transparent",
                  color: chosen ? "var(--tr-ground)" : "var(--tr-ink)",
                  outlineColor: "var(--tr-ink)",
                }}
              >
                <input
                  type="radio"
                  name="trellis-mode"
                  value={option.id}
                  checked={chosen}
                  onChange={() => setMode(option.id)}
                  className="sr-only"
                />
                {option.label}
              </label>
            );
          })}
        </fieldset>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[76px] flex justify-center px-3 sm:justify-end sm:px-5">
        <div className="pointer-events-auto flex flex-col items-center gap-1.5 sm:items-end">
          {palette.credit ? (
            <p className="text-[12px] leading-none" style={{ color: "var(--tr-muted)" }}>
              {palette.credit}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <PalettePicker value={palette} onChange={choosePalette} />
            <div className="hidden gap-2 sm:flex">{exportButtons}</div>
          </div>
        </div>
      </div>

      {/* Film took the hint line off the canvas: the blinking caret already says
          where to type. The keys are still read out with the field. */}
      <p id={hintsId} className="sr-only">
        {mode === "poster" ? "เว้นวรรคแล้วขึ้นบรรทัดใหม่" : "พิมพ์แล้วงอก"} Backspace แล้วเหี่ยว Enter ล้างสวน
        คลิกตัวอักษรให้งอกใหม่
      </p>
      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}
