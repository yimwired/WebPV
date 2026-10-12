/**
 * Runs the ball on a canvas: owns the WebGL2 context, the render loop and the
 * pointer, and hands React a small handle to steer it with. Nothing in the
 * loop goes through React state; a drag across the screen re-renders no
 * components.
 *
 * The loop sleeps whenever nothing moves, which under reduced motion is most
 * of the time, and always while the tab is hidden.
 */

import { Ball } from "./ball";
import { frameCamera, project, rayThrough, type Camera } from "./camera";
import { clonePalette, mixPalettes, resolvePalette, type Colorway, type ResolvedPalette } from "./colorways";
import { CAP } from "./geometry";
import { KEYS, keyIndexForCode, type KeySpec } from "./keys";
import { BALL_RADIUS } from "./layout";
import { loadLegendFonts, paintLegends, type LegendFonts } from "./legends";
import { add, dot, mat3FromQuat, normalize, scale, type Quat, type Vec3 } from "./math";
import { BALL_EXTENT, FLOOR_Y, Renderer } from "./renderer";

/** Ceiling on device pixels per CSS pixel: past 2 a phone pays double for nothing visible. */
const MAX_DPR = 2;
/**
 * Renderers that run on the CPU. WebGL works on them, but nowhere near fast
 * enough for this scene at full quality, so they start at the bottom rung.
 */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;
/** A pointer that travels further than this, in CSS pixels, is dragging rather than pressing. */
const DRAG_THRESHOLD = 5;
/** A drag released after the pointer has been still this long, in ms, lets go without a flick. */
const STILL_RELEASE = 90;
const COLORWAY_MS = 650;
const LEGEND_FADE_MS = 400;

export interface Press {
  /** the key printed on the cap, or null for a blank or glass cap */
  key: KeySpec | null;
  cap: number;
  /** 1 for a cap facing the viewer squarely, below 0 for one on the far side */
  facing: number;
}

export interface ThockOptions {
  colorway: Colorway;
  fonts: LegendFonts;
  reducedMotion: boolean;
  onPress?: (press: Press) => void;
  /** called once the legends are printed on the caps */
  onReady?: () => void;
}

/** What the checks read back, since a canvas has no DOM to query. */
export interface ThockSnapshot {
  frames: number;
  running: boolean;
  dpr: number;
  reflections: boolean;
  colorway: string;
  legendsReady: boolean;
  orientation: Quat;
  spin: Vec3;
  hovered: number;
  capCount: number;
  lift: number[];
  waves: { origin: number; age: number }[];
}

export interface ThockHandle {
  setColorway(colorway: Colorway): void;
  setReducedMotion(reduce: boolean): void;
  /** Presses the cap for a physical key, by `KeyboardEvent.code`. False if the ball has no such key. */
  pressCode(code: string): boolean;
  inspect(): ThockSnapshot;
  /** Where a cap's top is on screen, in CSS pixels, and how squarely it faces the viewer. */
  locate(cap: number): { x: number; y: number; facing: number };
  /** A cap's centre as a unit vector in the ball's own frame, which turning the ball never changes. */
  direction(cap: number): Vec3;
  /** Every cap printed with the key a `KeyboardEvent.code` presses. */
  capsFor(code: string): number[];
  keyOf(cap: number): string | null;
  dispose(): void;
}

interface PointerTrack {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  lastTime: number;
  dragging: boolean;
  /** smoothed angular velocity of the drag, radians per second, world space */
  velocity: Vec3;
}

/** Returns null where WebGL2 is unavailable, so the page can say so instead. */
export function createThock(canvas: HTMLCanvasElement, options: ThockOptions): ThockHandle | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: true,
    depth: true,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const ball = new Ball();
  ball.setReducedMotion(options.reducedMotion);

  let renderer: Renderer;
  try {
    renderer = new Renderer(gl, ball.layout);
  } catch (error) {
    console.error(error);
    return null;
  }

  let colorway = options.colorway.id;
  const shown: ResolvedPalette = resolvePalette(options.colorway);
  let blendFrom = clonePalette(shown);
  let blendTo = clonePalette(shown);
  let blendStart = -1;

  let atlas: Uint8Array | null = null;
  let legendsAt = -1;
  let legendOpacity = 0;

  // On a CPU renderer the ball also stays still until it is touched: a loop
  // that never sleeps there leaves a slow machine nothing to do anything else with.
  const software = SOFTWARE_RENDERER.test(rendererName(gl));
  if (software) ball.setIdleTurn(false);
  let dpr = software ? 1 : Math.min(window.devicePixelRatio || 1, MAX_DPR);
  let reflections = !software;
  let camera: Camera = frameCamera(1, 1, BALL_EXTENT, FLOOR_Y);
  const orientation = new Float32Array(9);

  let frame = 0;
  let last = 0;
  let frames = 0;
  let slowSeconds = 0;
  let disposed = false;
  let contextLost = false;
  let pointer: PointerTrack | null = null;
  /** where a resting mouse is over the canvas, so the cap under it is found again as the ball turns beneath it */
  let mouseAt: [number, number] | null = null;

  function toEye(): Vec3 {
    return normalize(camera.eye);
  }

  function render() {
    mat3FromQuat(ball.orientation, orientation);
    renderer.draw({
      camera,
      orientation,
      lift: ball.lift,
      glow: ball.glow,
      tilt: ball.tilt,
      palette: shown,
      legendOpacity,
      reflections,
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    camera = frameCamera(width, height, BALL_EXTENT, FLOOR_Y);
    renderer.resize(canvas.width, canvas.height);
    // Drawn at once rather than on the next frame: a resized canvas is blank until it is.
    if (!contextLost) render();
    wake();
  }

  /**
   * Gives quality up once frames keep arriving late: resolution first, down to
   * one device pixel per CSS pixel, then the floor's reflection. Nothing is
   * ever given back, so a borderline device cannot see-saw between the two.
   */
  function degradeIfSlow(dt: number) {
    if (dpr <= 1 && !reflections) return;
    slowSeconds = dt > 1 / 40 ? slowSeconds + dt : Math.max(0, slowSeconds - dt / 2);
    if (slowSeconds < 2) return;
    slowSeconds = 0;
    if (dpr > 1) {
      dpr = Math.max(1, dpr - 0.5);
      resize();
    } else {
      reflections = false;
    }
  }

  function stepColorway(now: number): boolean {
    if (blendStart < 0) return false;
    const t = Math.min(1, (now - blendStart) / COLORWAY_MS);
    mixPalettes(blendFrom, blendTo, t * t * (3 - 2 * t), shown);
    if (t >= 1) blendStart = -1;
    return t < 1;
  }

  function tick(now: number) {
    frame = 0;
    if (disposed || contextLost) return;
    // Capped, so a stall (a tab switch, a long task) is not one huge step.
    const dt = last ? Math.min((now - last) / 1000, 1 / 10) : 1 / 60;
    last = now;

    if (mouseAt && !pointer) hover(capUnder(mouseAt[0], mouseAt[1]));
    let busy = ball.step(dt);
    busy = stepColorway(now) || busy;
    if (legendsAt >= 0 && legendOpacity < 1) {
      legendOpacity = Math.min(1, (now - legendsAt) / LEGEND_FADE_MS);
      busy = true;
    }
    render();
    frames++;
    degradeIfSlow(dt);
    if (busy) schedule();
  }

  function schedule() {
    if (!frame && !disposed && !contextLost && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (frame) return;
    last = 0;
    schedule();
  }

  function pressCap(cap: number) {
    ball.press(cap);
    const key = ball.layout.keyOf[cap];
    options.onPress?.({ key: key >= 0 ? KEYS[key] : null, cap, facing: dot(ball.capWorldDir(cap), toEye()) });
    wake();
  }

  /** Returns whether the hovered cap changed. */
  function hover(cap: number): boolean {
    if (ball.hovered === cap) return false;
    ball.hovered = cap;
    canvas.style.cursor = cap >= 0 ? "pointer" : "";
    return true;
  }

  function setHover(cap: number) {
    if (hover(cap)) wake();
  }

  function at(event: PointerEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  function capUnder(x: number, y: number) {
    return ball.capAt(camera.eye, rayThrough(camera, x, y));
  }

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    const [x, y] = at(event);
    pointer = { id: event.pointerId, x, y, startX: x, startY: y, lastTime: event.timeStamp, dragging: false, velocity: [0, 0, 0] };
  };

  const onPointerMove = (event: PointerEvent) => {
    const [x, y] = at(event);
    if (!pointer || event.pointerId !== pointer.id) {
      if (event.pointerType === "mouse") {
        mouseAt = [x, y];
        setHover(capUnder(x, y));
      }
      return;
    }
    if (!pointer.dragging && Math.hypot(x - pointer.startX, y - pointer.startY) > DRAG_THRESHOLD) {
      pointer.dragging = true;
      ball.beginDrag();
      setHover(-1);
      canvas.style.cursor = "grabbing";
    }
    if (pointer.dragging) {
      // Turn about the axis at right angles to the drag, by the angle that keeps
      // the surface under the pointer roughly under it: one ball radius on
      // screen is one radian.
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0) {
        const axis = normalize(add(scale(camera.right, dy), scale(camera.up, dx)));
        const angle = distance / camera.ballRadiusPx;
        ball.rotateBy(axis, angle);
        const seconds = Math.max((event.timeStamp - pointer.lastTime) / 1000, 1 / 240);
        const instant = scale(axis, angle / seconds);
        pointer.velocity = add(scale(pointer.velocity, 0.6), scale(instant, 0.4));
        pointer.lastTime = event.timeStamp;
        wake();
      }
    }
    pointer.x = x;
    pointer.y = y;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const [x, y] = at(event);
    if (pointer.dragging) {
      const still = event.timeStamp - pointer.lastTime > STILL_RELEASE;
      ball.endDrag(still ? [0, 0, 0] : pointer.velocity);
      canvas.style.cursor = "";
    } else {
      const cap = capUnder(x, y);
      if (cap >= 0) pressCap(cap);
    }
    pointer = null;
    if (event.pointerType === "mouse") {
      mouseAt = [x, y];
      setHover(capUnder(x, y));
    }
    wake();
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (pointer.dragging) ball.endDrag([0, 0, 0]);
    canvas.style.cursor = "";
    pointer = null;
    wake();
  };

  const onPointerLeave = () => {
    mouseAt = null;
    if (!pointer) setHover(-1);
  };

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      wake();
    }
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  // Everything on the GPU went with the context, so it is all made again from
  // what the CPU still has: the layout, the painted legends, the canvas size.
  const onContextRestored = () => {
    try {
      renderer = new Renderer(gl, ball.layout);
    } catch (error) {
      console.error(error);
      return;
    }
    contextLost = false;
    renderer.resize(canvas.width, canvas.height);
    if (atlas) renderer.uploadLegends(atlas);
    render();
    wake();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  document.addEventListener("visibilitychange", onVisibility);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  void loadLegendFonts(options.fonts).then(() => {
    if (disposed) return;
    atlas = paintLegends(options.fonts);
    if (!contextLost) renderer.uploadLegends(atlas);
    legendsAt = performance.now();
    wake();
    options.onReady?.();
  });

  return {
    setColorway(next) {
      if (next.id === colorway) return;
      colorway = next.id;
      blendFrom = clonePalette(shown);
      blendTo = resolvePalette(next);
      blendStart = performance.now();
      wake();
    },

    setReducedMotion(reduce) {
      ball.setReducedMotion(reduce);
      wake();
    },

    pressCode(code) {
      const key = keyIndexForCode(code);
      if (key < 0) return false;
      const cap = ball.facingCopy(key, toEye());
      if (cap < 0) return false;
      pressCap(cap);
      return true;
    },

    inspect: () => ({
      frames,
      running: frame !== 0,
      dpr,
      reflections,
      colorway,
      legendsReady: legendsAt >= 0,
      orientation: [...ball.orientation] as Quat,
      spin: [...ball.spin] as Vec3,
      hovered: ball.hovered,
      capCount: ball.count,
      lift: Array.from(ball.lift),
      waves: ball.activeWaves,
    }),

    locate(cap) {
      const dir = ball.capWorldDir(cap);
      const top = project(camera, scale(dir, BALL_RADIUS + CAP.height + ball.lift[cap]));
      return { x: top.x, y: top.y, facing: dot(dir, toEye()) };
    },

    direction: (cap) => ball.capDir(cap),

    capsFor: (code) => [...(ball.layout.capsOfKey[keyIndexForCode(code)] ?? [])],

    keyOf(cap) {
      const key = ball.layout.keyOf[cap];
      return key >= 0 ? KEYS[key].id : null;
    },

    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      document.removeEventListener("visibilitychange", onVisibility);
      if (!contextLost) renderer.dispose();
    },
  };
}

function rendererName(gl: WebGL2RenderingContext): string {
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const name: unknown = gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
  return typeof name === "string" ? name : "";
}
