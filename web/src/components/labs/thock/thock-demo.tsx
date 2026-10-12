"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { ColorwayPicker } from "./colorway-picker";
import { COLORWAYS, type Colorway } from "./colorways";
import { createThock, type ThockHandle } from "./engine";
import { KeySound } from "./sound";

declare global {
  interface Window {
    /** The checks read the ball through this, since a canvas has no DOM to query. */
    __thock?: ThockHandle;
  }
}

/**
 * Typed by the ball itself once its legends are printed, so the first thing a
 * visitor sees is what a key press does. There is no hint line to read: Film
 * had Trellis's taken off, and this one shows rather than tells.
 */
const OPENING = ["KeyT", "KeyH", "KeyO", "KeyC", "KeyK"];
const OPENING_DELAY = 450;
const OPENING_GAP = 170;

/** Keys that operate a focused control. Pressed there, they stay with the control. */
const CONTROL_KEYS = new Set(["Space", "Enter", "NumpadEnter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
const MODIFIER_CODES = new Set([
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
]);

/** The controls' face: the site's mono for Latin, the legends' Thai face for Thai. */
const CHROME_FONT = "var(--font-geist-mono), var(--font-thock-thai), ui-monospace, monospace";

const THOCK_CSS = `
html:has(.th-root), html:has(.th-root) body {
  overflow: hidden;
  overscroll-behavior: none;
}
.th-root[data-webgl="missing"] .th-fallback { display: grid; }
.th-root[data-webgl="missing"] .th-chrome { display: none; }
.th-chrome, .th-chrome * {
  transition-property: color, background-color, border-color, box-shadow, outline-color;
  transition-duration: .3s;
  transition-timing-function: ease;
}
`;

const pill =
  "pointer-events-auto inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";
const pillStyle: CSSProperties = {
  borderColor: "var(--th-line)",
  backgroundColor: "var(--th-ground)",
  color: "var(--th-ink)",
  outlineColor: "var(--th-ink)",
};

function chromeVars(colorway: Colorway): CSSProperties {
  const { ground, ink, muted, line } = colorway.chrome;
  return { "--th-ground": ground, "--th-ink": ink, "--th-muted": muted, "--th-line": line } as CSSProperties;
}

/**
 * Thock: a ball of keycaps that a real keyboard plays.
 *
 * Built from a reel Film sent of a WebGL keycap sphere, and laid out as that
 * page is: the ball is the whole screen. Drag it and it spins on, hover a cap
 * and it lifts, press one and a wave runs from it around the ball.
 *
 * What it does that the reel does not: the caps are one real keyboard, Latin
 * and Thai Kedmanee legends side by side, and a key pressed on the visitor's
 * own keyboard presses the copy of that key facing them, in either language,
 * since keys are matched by where they are and not by what they type. The
 * wave starts from that cap rather than from wherever the pointer was. It also
 * has four colourways and a synthesised key sound.
 */
export function ThockDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ThockHandle | null>(null);
  const sound = useRef<KeySound | null>(null);
  /** read by the press callback, which lives outside React */
  const soundOn = useRef(false);
  const [colorway, setColorway] = useState<Colorway>(COLORWAYS[0]);
  const [audible, setAudible] = useState(false);
  const hintsId = useId();

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    // next/font hands each face over as a CSS variable; the legends are painted
    // on a canvas, which needs the family names themselves.
    const style = getComputedStyle(root);
    const family = (variable: string) => `${style.getPropertyValue(variable).trim() || "system-ui"}, ui-sans-serif, sans-serif`;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timers: number[] = [];

    const handle = createThock(canvas, {
      colorway: COLORWAYS[0],
      fonts: { latin: family("--font-sans"), thai: family("--font-thock-thai") },
      reducedMotion: motion.matches,
      onPress: (press) => {
        if (soundOn.current) sound.current?.play(0.55 + 0.45 * Math.max(press.facing, 0));
      },
      onReady: () => {
        if (motion.matches) return;
        OPENING.forEach((code, i) => {
          timers.push(window.setTimeout(() => handle?.pressCode(code), OPENING_DELAY + i * OPENING_GAP));
        });
      },
    });
    if (!handle) {
      root.dataset.webgl = "missing";
      return;
    }
    engine.current = handle;
    window.__thock = handle;

    const followMotion = () => handle.setReducedMotion(motion.matches);
    motion.addEventListener("change", followMotion);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      motion.removeEventListener("change", followMotion);
      handle.dispose();
      engine.current = null;
      if (window.__thock === handle) delete window.__thock;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const handle = engine.current;
      if (!handle || event.repeat || event.isComposing) return;
      const target = event.target instanceof Element ? event.target : null;
      const onControl = target !== null && target !== document.body && target.closest("a, button, input, select, textarea, [tabindex]") !== null;
      if (onControl && CONTROL_KEYS.has(event.code)) return;
      // Shortcuts belong to the browser; a modifier pressed on its own still presses its cap.
      if ((event.ctrlKey || event.metaKey || event.altKey) && !MODIFIER_CODES.has(event.code)) return;
      if (!handle.pressCode(event.code)) return;
      // Typed on the page itself a key has no other job here, and a couple would
      // find one: Firefox opens its find bar on / and '. Tab and Escape keep theirs.
      if (!onControl && event.code !== "Tab" && event.code !== "Escape") event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => () => sound.current?.dispose(), []);

  const chooseColorway = (next: Colorway) => {
    setColorway(next);
    engine.current?.setColorway(next);
  };

  const toggleSound = async () => {
    if (audible) {
      soundOn.current = false;
      setAudible(false);
      return;
    }
    sound.current ??= new KeySound();
    const running = await sound.current.enable();
    soundOn.current = running;
    setAudible(running);
    // one press, so turning it on is heard at once
    if (running) sound.current.play(0.8);
  };

  return (
    <div
      ref={rootRef}
      className="th-root fixed inset-x-0 top-0 h-dvh overflow-hidden"
      style={{ ...chromeVars(colorway), backgroundColor: colorway.stage.top, fontFamily: CHROME_FONT }}
    >
      <style>{THOCK_CSS}</style>
      <h1 className="sr-only">Thock กดแป้นไหน ปุ่มนั้นบนลูกบอลก็ยุบ</h1>

      <canvas
        ref={canvasRef}
        role="img"
        aria-label="ลูกบอลจากคีย์แคปสองร้อยกว่าปุ่ม ตัวอักษรบนปุ่มมีทั้งอังกฤษและไทยแบบแป้นเกษมณี"
        aria-describedby={hintsId}
        className="absolute inset-0 h-full w-full cursor-grab touch-none select-none"
      />
      <p className="th-fallback absolute inset-0 hidden place-items-center p-8 text-center text-sm" style={{ color: "var(--th-ink)" }}>
        เบราว์เซอร์นี้เปิด WebGL2 ไม่ได้ ลูกบอลเลยไม่ขึ้น ลองเปิดใน Chrome, Edge, Firefox หรือ Safari รุ่นใหม่ดู
      </p>

      <div className="th-chrome pointer-events-none absolute inset-x-0 top-0 flex justify-end p-3 sm:p-5">
        <button type="button" className={pill} style={pillStyle} onClick={toggleSound} aria-pressed={audible}>
          {audible ? <Volume2 aria-hidden className="h-4 w-4" /> : <VolumeX aria-hidden className="h-4 w-4" />}
          เสียงปุ่ม
        </button>
      </div>

      <div className="th-chrome pointer-events-none absolute inset-x-0 bottom-[76px] flex justify-center px-3 sm:justify-end sm:px-5">
        <div className="pointer-events-auto">
          <ColorwayPicker value={colorway} onChange={chooseColorway} />
        </div>
      </div>

      <p id={hintsId} className="sr-only">
        ลากหมุนลูกบอลได้ ปล่อยแล้วลูกหมุนต่ออีกพัก คลิกปุ่มไหนก็ได้ หรือพิมพ์บนคีย์บอร์ดจริง ไทยหรืออังกฤษก็ได้
        ปุ่มเดียวกันบนลูกจะยุบ แล้วส่งคลื่นวิ่งรอบลูก
      </p>
    </div>
  );
}
