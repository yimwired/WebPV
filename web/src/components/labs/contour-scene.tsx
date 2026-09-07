"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import {
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  MathUtils,
  Path,
  RepeatWrapping,
  SRGBColorSpace,
  Shape,
  Vector2,
  type Mesh,
} from "three";

import { SceneCanvas } from "./scene-canvas";

// ─────────────────────────────────────────────────────────────
//  An unofficial concept. Every asset here is generated: the
//  packages are lathed from published pack dimensions and the
//  labels are painted onto a canvas at runtime, so the demo
//  ships without a single downloaded brand file.
// ─────────────────────────────────────────────────────────────

/** Scene units are decimetres: 1 unit = 100 mm, which keeps the packs near 1. */
const MM = 0.01;

export const BRAND_RED = "#f40009";

/** Vertical field of view. Shared, because the stage offset is derived from it. */
const FOV = 32;

export interface Pack {
  id: "can" | "bottle" | "magnum";
  name: string;
  /** what the label and the readout call it */
  volume: string;
  /** overall height in mm, used for the true-scale silhouettes in the UI */
  heightMm: number;
}

export const PACKS: Pack[] = [
  { id: "can", name: "Standard can", volume: "325 ml", heightMm: 122 },
  { id: "bottle", name: "Contour bottle", volume: "510 ml", heightMm: 216 },
  { id: "magnum", name: "Sharing bottle", volume: "1.25 L", heightMm: 315 },
];

/** Where each act starts and ends as a share of the page scroll. */
export const ACTS = {
  family: [0, 0.3],
  focus: [0.3, 0.56],
  detail: [0.56, 0.8],
  lineup: [0.8, 1],
} as const;

// ── geometry ─────────────────────────────────────────────────

type Profile = readonly (readonly [number, number])[];

/** Lathe a profile given as [radius, height] pairs in millimetres. */
function lathe(profile: Profile, segments = 96) {
  return new LatheGeometry(
    profile.map(([r, y]) => new Vector2(r * MM, y * MM)),
    segments
  );
}

/**
 * Cut a profile off at `fillY` and cap it flat. Scaling the whole bottle down
 * instead would give the drink its own neck and shoulder, which then show
 * through the clear plastic as a small bottle floating inside the big one.
 */
function truncate(profile: Profile, fillY: number): Profile {
  const kept = profile.filter(([, y]) => y < fillY);
  const next = profile[kept.length];
  const last = kept[kept.length - 1];

  const span = next[1] - last[1];
  const t = span === 0 ? 0 : (fillY - last[1]) / span;
  const radius = last[0] + (next[0] - last[0]) * t;

  return [...kept, [radius, fillY], [0, fillY]];
}

/**
 * The 202-end sleek can: straight wall, a domed base that sits on its rim,
 * and the shoulder that necks in to the lid.
 */
const CAN_BASE = [
  [0, 7],
  [12, 6.4],
  [22, 4.6],
  [28, 2.2],
  [31, 0.8],
  [32.6, 1.6],
  [33, 4],
] as const;

const CAN_TOP = [
  [33, 0],
  [32.6, 2.4],
  [30.6, 6.4],
  [28, 10],
  [26.6, 12.4],
  [26.6, 13.6],
  [25.2, 13.2],
  [24.8, 11.4],
  [18, 10.6],
  [8, 10.4],
  [0, 10.3],
] as const;

/**
 * The PET contour: a petaloid base, the waist that gives the silhouette its
 * name, then a 28 mm neck finish. Both bottles share that neck, because in
 * real life they share the cap.
 */
const BOTTLE_PROFILE = [
  [0, 5],
  [14, 3],
  [26, 0.5],
  [31, 3],
  [33, 10],
  [33.5, 26],
  [32, 46],
  [29, 66],
  [28.4, 80],
  [30.5, 98],
  [32.5, 118],
  [32, 138],
  [29.5, 155],
  [24.5, 172],
  [18, 186],
  [14.5, 195],
  [13.4, 201],
  [13.4, 205],
  [15, 207],
  [13.4, 209],
  [13.4, 214],
  [12.2, 216],
  [0, 216],
] as const;

/**
 * The sharing bottle is the same tooling family scaled out, except for the
 * neck: that stays at 28 mm so the cap matches. The body is the 510's, blown
 * wider and taller, and only the shoulder is drawn by hand: scaling that too
 * left a cone, because the wider body has much further to come in and needs
 * the extra height to do it over.
 */
const MAGNUM_BODY = BOTTLE_PROFILE.slice(0, 13).map(
  ([r, y]) => [r * 1.38, y * 1.52] as const
);

const MAGNUM_SHOULDER = [
  [39.6, 248],
  [37.4, 258],
  [34, 267],
  [29.6, 275],
  [24.4, 282],
  [19.4, 288],
  [15.6, 293],
] as const;

/** identical to the 510's finish, which is the whole point of it */
const MAGNUM_NECK = [
  [13.4, 300],
  [13.4, 304],
  [15, 306],
  [13.4, 308],
  [13.4, 313],
  [12.2, 315],
  [0, 315],
] as const;

const MAGNUM_PROFILE = [
  ...MAGNUM_BODY,
  ...MAGNUM_SHOULDER,
  ...MAGNUM_NECK,
] as const;

const CAP_PROFILE = [
  [0, 0],
  [15, 0],
  [15.4, 1.4],
  [15.4, 15],
  [14, 16.6],
  [0, 16.6],
] as const;

// ── labels ───────────────────────────────────────────────────

/** Set text at whatever size makes it exactly `target` px wide. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  target: number,
  font: (size: number) => string
) {
  const probe = 200;
  ctx.font = font(probe);
  const measured = ctx.measureText(text).width;
  ctx.font = font((probe * target) / measured);
}

/**
 * The white wave: one band, drawn as a top edge out and a bottom edge back.
 * Both edges start and end at the same height, which is what lets the band
 * run unbroken around the pack instead of stepping at the wrap seam.
 */
function ribbon(ctx: CanvasRenderingContext2D, w: number, y: number, h: number) {
  const rise = h * 1.15;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.bezierCurveTo(w * 0.28, y - rise, w * 0.72, y + rise, w, y);
  ctx.lineTo(w, y + h);
  ctx.bezierCurveTo(w * 0.72, y + rise + h, w * 0.28, y - rise + h, 0, y + h);
  ctx.closePath();
  ctx.fill();
}

/** Nutrition per 100 ml, as published for Original Taste. */
const PANEL_ROWS: [string, string][] = [
  ["Energy", "42 kcal"],
  ["Sugars", "10.6 g"],
  ["Sodium", "10 mg"],
];

/**
 * The back of the sleeve: the small print a real pack is legally obliged to
 * carry. It exists so that turning the pack around reveals something.
 */
function paintBack(
  ctx: CanvasRenderingContext2D,
  panel: number,
  height: number,
  scriptFamily: string
) {
  const mid = panel / 2;

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  fitText(
    ctx,
    "Coca-Cola",
    panel * 0.26,
    (size) => `${size}px ${scriptFamily}, cursive`
  );
  ctx.fillText("Coca-Cola", mid, height * 0.14);

  ctx.letterSpacing = `${Math.round(height * 0.014)}px`;
  fitText(
    ctx,
    "NUTRITION PER 100 ML",
    panel * 0.34,
    (size) => `600 ${size}px system-ui, sans-serif`
  );
  ctx.fillText("NUTRITION PER 100 ML", mid, height * 0.27);
  ctx.letterSpacing = "0px";

  const rowSize = Math.round(height * 0.042);
  const left = mid - panel * 0.21;
  const right = mid + panel * 0.21;
  ctx.font = `500 ${rowSize}px system-ui, sans-serif`;

  PANEL_ROWS.forEach(([label, value], i) => {
    const y = height * (0.37 + i * 0.075);

    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = Math.max(1, height * 0.002);
    ctx.beginPath();
    ctx.moveTo(left, y + rowSize * 0.85);
    ctx.lineTo(right, y + rowSize * 0.85);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.textAlign = "left";
    ctx.fillText(label, left, y);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(value, right, y);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  fitText(
    ctx,
    "CARBONATED WATER, SUGAR, COLOUR 150D,",
    panel * 0.42,
    (size) => `400 ${size}px system-ui, sans-serif`
  );
  ctx.fillText("CARBONATED WATER, SUGAR, COLOUR 150D,", mid, height * 0.63);
  ctx.fillText("ACID 338, FLAVOURING, CAFFEINE.", mid, height * 0.685);
}

/**
 * Paint the wrap label. Nothing is traced from the real artwork: this is the
 * red field, a script wordmark set in a free face, and the white wave, drawn
 * with the same construction anyone would use from a written brief.
 */
function paintLabel(
  width: number,
  height: number,
  scriptFamily: string,
  volume: string
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = BRAND_RED;
  ctx.fillRect(0, 0, width, height);

  // A wrap texture repeats at the seam, so the sleeve is two panels: the face
  // that sells and the back that informs. Turning the pack has to be worth
  // doing, and two identical panels would make a half turn look like no turn.
  const panel = width / 2;
  const safe = panel * 0.48;

  for (const left of [0, panel]) {
    ctx.save();
    ctx.translate(left, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // the wave runs across both panels and meets itself at the seam
    ctx.fillStyle = "#ffffff";
    ribbon(ctx, panel, height * 0.78, height * 0.1);

    if (left === 0) {
      fitText(
        ctx,
        "Coca-Cola",
        safe,
        (size) => `${size}px ${scriptFamily}, cursive`
      );
      ctx.fillText("Coca-Cola", panel / 2, height * 0.4);

      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.letterSpacing = `${Math.round(height * 0.02)}px`;
      fitText(
        ctx,
        "ORIGINAL TASTE",
        safe * 0.62,
        (size) => `600 ${size}px system-ui, sans-serif`
      );
      ctx.fillText("ORIGINAL TASTE", panel / 2, height * 0.585);
    } else {
      paintBack(ctx, panel, height, scriptFamily);
    }

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.letterSpacing = "0px";
    fitText(
      ctx,
      volume,
      safe * 0.2,
      (size) => `500 ${size}px system-ui, sans-serif`
    );
    ctx.fillText(volume, panel / 2, height * 0.93);

    ctx.restore();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 16;
  // A cylinder starts its wrap at the point facing the camera, which is where
  // the join between the two panels falls. Shifting a quarter turn puts a
  // whole wordmark there instead of the gap between two of them.
  texture.wrapS = RepeatWrapping;
  texture.offset.x = 0.25;

  return { texture, metalness: metalnessMaskFrom(canvas) };
}

/**
 * Turn a painted label into the map that says which parts of it are metal.
 *
 * On a real can the red is a translucent ink over bare aluminium, so the metal
 * underneath is still what reflects. The white wordmark and ribbon are opaque
 * ink sitting on top: they are not metal, and rendering them as if they were
 * turns every letter into a mirror that picks up the red cards around the
 * scene and goes almost black. Reading the mask back off the finished label
 * keeps it in sync with the artwork for free — anything close to white becomes
 * non-metal, everything else stays metal.
 */
function metalnessMaskFrom(source: HTMLCanvasElement) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const isInk = data[i] > 210 && data[i + 1] > 190 && data[i + 2] > 190;
    const v = isInk ? 20 : 235;
    data[i] = data[i + 1] = data[i + 2] = v;
  }
  ctx.putImageData(image, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.wrapS = RepeatWrapping;
  texture.offset.x = 0.25;
  return texture;
}

/** The colour map plus the metal/ink mask derived from it. */
export interface PackLabel {
  texture: CanvasTexture;
  metalness: CanvasTexture | null;
}

function useLabels(scriptFamily: string) {
  const [labels, setLabels] = useState<Record<string, PackLabel> | null>(null);

  useEffect(() => {
    let cancelled = false;

    // The wordmark is only right once the script face is actually resident;
    // painting earlier silently falls back to a system cursive.
    const paint = () => {
      if (cancelled) return;
      const next: Record<string, PackLabel> = {};
      for (const pack of PACKS) {
        const painted = paintLabel(2048, 1024, scriptFamily, pack.volume);
        if (painted) next[pack.id] = painted;
      }
      setLabels(next);
    };

    document.fonts
      .load(`400 200px ${scriptFamily}`)
      .then(() => document.fonts.ready)
      .then(paint)
      .catch(paint);

    return () => {
      cancelled = true;
    };
  }, [scriptFamily]);

  useEffect(() => {
    return () => {
      if (labels)
        for (const label of Object.values(labels)) {
          label.texture.dispose();
          label.metalness?.dispose();
        }
    };
  }, [labels]);

  return labels;
}

// ── packs ────────────────────────────────────────────────────

/** How far the beads stand off the metal. Shared so it is not re-allocated. */
const CONDENSATION_RELIEF = new Vector2(0.45, 0.45);

const ALUMINIUM = {
  color: "#e9edf2",
  metalness: 1,
  roughness: 0.24,
} as const;

/**
 * A faint noise map used as a roughness map on every pack.
 *
 * Real aluminium is never uniformly polished — handling, the drawing process
 * and the print itself all leave the surface varying slightly. A constant
 * roughness gives one perfect highlight that slides across the barrel, which
 * is the single strongest tell that a render is a render. Breaking it up by a
 * few percent is enough to make the highlight read as a surface.
 */
function useSurfaceNoise() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Seeded rather than Math.random: the grain is identical on every render
    // and every visitor, which makes the finish a decision instead of an
    // accident — and keeps this pure enough to run inside useMemo.
    let seed = 0x9e3779b9;
    const next = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const image = ctx.createImageData(size, size);
    for (let i = 0; i < image.data.length; i += 4) {
      // mid grey ± a little: the map multiplies the material roughness, so
      // staying near the middle keeps the finish the material asked for
      const v = 150 + next() * 40;
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(6, 12);
    texture.anisotropy = 16;
    return texture;
  }, []);
}

/**
 * Condensation on a cold can, as a normal map plus the roughness map that goes
 * with it.
 *
 * The page already claims this pack chills in two minutes and that aluminium
 * pulls heat faster than PET. A cold can in a warm room is wet, so a dry one
 * quietly contradicts the copy next to it — this is the detail that makes the
 * claim look observed rather than written.
 *
 * Droplets are beads of water sitting on the metal: they bulge (normal) and
 * they are smoother than the print around them (roughness). Density rises down
 * the pack because beads run together and settle, and a few of them are drawn
 * as short streaks for the same reason.
 */
function buildCondensation() {
  if (typeof document === "undefined") return null;
  const size = 1024;

  const normalCanvas = document.createElement("canvas");
  const roughCanvas = document.createElement("canvas");
  normalCanvas.width = size;
  normalCanvas.height = size;
  roughCanvas.width = size;
  roughCanvas.height = size;
  const normalCtx = normalCanvas.getContext("2d");
  const roughCtx = roughCanvas.getContext("2d");
  if (!normalCtx || !roughCtx) return null;

  // flat surface: straight up in tangent space, and the base finish
  normalCtx.fillStyle = "rgb(128,128,255)";
  normalCtx.fillRect(0, 0, size, size);
  roughCtx.fillStyle = "rgb(165,165,165)";
  roughCtx.fillRect(0, 0, size, size);

  // A hash of the index rather than a running seed: no state to carry, so
  // the layout is reproducible and nothing is reassigned after render.
  const rand = (n: number) => {
    let t = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35);
    return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
  };

  /** One bead: a dome in the normal map, a polished spot in the roughness. */
  const bead = (cx: number, cy: number, r: number, stretch: number) => {
    const image = normalCtx.getImageData(
      Math.max(0, cx - r),
      Math.max(0, cy - r * stretch),
      r * 2,
      r * stretch * 2
    );
    const { data, width, height } = image;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const dx = (x - width / 2) / (width / 2);
        const dy = (y - height / 2) / (height / 2);
        const d = Math.hypot(dx, dy);
        if (d > 1) continue;
        // hemisphere normal, softened at the rim so beads do not read as discs
        const falloff = Math.min(1, (1 - d) * 3);
        const nz = Math.sqrt(Math.max(0, 1 - d * d));
        const i = (y * width + x) * 4;
        data[i] = Math.round((dx * falloff * 0.5 + 0.5) * 255);
        data[i + 1] = Math.round((-dy * falloff * 0.5 + 0.5) * 255);
        data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      }
    }
    normalCtx.putImageData(
      image,
      Math.max(0, cx - r),
      Math.max(0, cy - r * stretch)
    );

    const gloss = roughCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gloss.addColorStop(0, "rgba(40,40,40,0.9)");
    gloss.addColorStop(0.7, "rgba(90,90,90,0.5)");
    gloss.addColorStop(1, "rgba(165,165,165,0)");
    roughCtx.fillStyle = gloss;
    roughCtx.save();
    roughCtx.translate(cx, cy);
    roughCtx.scale(1, stretch);
    roughCtx.beginPath();
    roughCtx.arc(0, 0, r, 0, Math.PI * 2);
    roughCtx.fill();
    roughCtx.restore();
  };

  for (let i = 0; i < 1400; i += 1) {
    const x = rand(i * 5) * size;
    // bias downwards: beads run together and collect toward the base
    const y = size * Math.pow(rand(i * 5 + 1), 0.7);
    const r = 2 + rand(i * 5 + 2) * 6;
    // one in eight has run, so it is longer than it is wide
    const stretch =
      rand(i * 5 + 3) > 0.87 ? 1.8 + rand(i * 5 + 4) * 2.4 : 1;
    bead(x, y, r, stretch);
  }

  const normalMap = new CanvasTexture(normalCanvas);
  const roughnessMap = new CanvasTexture(roughCanvas);
  for (const tex of [normalMap, roughnessMap]) {
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(2, 1.2);
    tex.anisotropy = 16;
  }
  // a normal map carries vectors, not colour: leaving it in sRGB would bend
  // every one of them
  return { normalMap, roughnessMap };
}

function useCondensation() {
  return useMemo(() => buildCondensation(), []);
}

/**
 * The vertical ribs moulded into a bottle closure, as a roughness map.
 *
 * A cap is the one part of the pack a hand actually grips, so it is ribbed on
 * every bottle ever made. Rendered smooth it reads as a red plastic cylinder
 * sitting on top of the bottle rather than as a cap. Ribs as geometry would
 * cost a few hundred triangles each; as a roughness stripe they cost one small
 * canvas and survive being seen from any distance this scene uses.
 */
function useKnurlTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const width = 256;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = 4;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    for (let x = 0; x < width; x += 1) {
      // a soft square wave: ribs, not a picket fence
      const wave = (Math.sin((x / width) * Math.PI * 2 * 48) + 1) / 2;
      const v = Math.round(90 + wave * 120);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, 0, 1, 4);
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.anisotropy = 16;
    return texture;
  }, []);
}

/**
 * The stay-on tab.
 *
 * The lid is the part of a can everyone has looked at from 20cm away, so a
 * blank disc there is the detail that gives the whole render away no matter
 * how good the barrel is. Built to the real ring-pull: a 22mm blade with a
 * finger hole, lying flat, held down by a 3mm rivet, with the score line it
 * levers open drawn around it.
 */
function PullTab() {
  const geometry = useMemo(() => {
    const length = 22 * MM;
    const width = 11 * MM;
    const shape = new Shape();
    // a capsule: two straight sides closed by half-circle ends
    const r = width / 2;
    shape.absarc(-length / 2 + r, 0, r, Math.PI / 2, -Math.PI / 2, true);
    shape.lineTo(length / 2 - r, -r);
    shape.absarc(length / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, true);
    shape.closePath();

    // the finger hole sits in the rear half, away from the rivet
    const hole = new Path();
    hole.absarc(-3.5 * MM, 0, 3.4 * MM, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geo = new ExtrudeGeometry(shape, {
      depth: 0.4 * MM,
      bevelEnabled: true,
      bevelSize: 0.15 * MM,
      bevelThickness: 0.15 * MM,
      bevelSegments: 2,
      curveSegments: 24,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group position={[0, 117.4 * MM, 0]}>
      <mesh geometry={geometry} position={[2 * MM, 0, 0]}>
        <meshStandardMaterial color="#cdd3da" metalness={1} roughness={0.32} />
      </mesh>

      {/* rivet: the dimple the tab pivots on */}
      <mesh position={[6.5 * MM, 0.5 * MM, 0]}>
        <cylinderGeometry args={[1.6 * MM, 1.6 * MM, 1.1 * MM, 20]} />
        <meshStandardMaterial color="#b9c0c8" metalness={1} roughness={0.26} />
      </mesh>

      {/* score line: the pressed groove the tab opens along */}
      <mesh position={[-1 * MM, 0.05 * MM, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.6 * MM, 10.1 * MM, 40]} />
        <meshStandardMaterial color="#9aa2ab" metalness={1} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Can({ label }: { label: PackLabel | null }) {
  const base = useMemo(() => lathe(CAN_BASE), []);
  const top = useMemo(() => lathe(CAN_TOP), []);
  const noise = useSurfaceNoise();
  const wet = useCondensation();
  useEffect(() => () => void (base.dispose(), top.dispose()), [base, top]);
  useEffect(
    () => () => {
      wet?.normalMap.dispose();
      wet?.roughnessMap.dispose();
    },
    [wet]
  );

  return (
    <group position={[0, -61 * MM, 0]}>
      <mesh geometry={base}>
        <meshStandardMaterial
          {...ALUMINIUM}
          roughnessMap={wet?.roughnessMap ?? noise}
          normalMap={wet?.normalMap ?? null}
        />
      </mesh>

      <mesh position={[0, 54 * MM, 0]}>
        <cylinderGeometry args={[33 * MM, 33 * MM, 105 * MM, 96, 1, true]} />
        {/*
          The printed sleeve is ink laid straight onto the aluminium, so the
          metal is still what reflects: nearly full metalness, and the tint
          comes from the label map rather than from a dielectric base. Halfway
          values here are what make a can read as a plastic bottle wrap.
        */}
        <meshStandardMaterial
          map={label?.texture ?? null}
          metalnessMap={label?.metalness ?? null}
          roughnessMap={wet?.roughnessMap ?? noise}
          normalMap={wet?.normalMap ?? null}
          normalScale={CONDENSATION_RELIEF}
          color={label ? "#ffffff" : BRAND_RED}
          metalness={0.92}
          roughness={0.3}
        />
      </mesh>

      <mesh geometry={top} position={[0, 106.5 * MM, 0]}>
        <meshStandardMaterial
          {...ALUMINIUM}
          roughnessMap={noise}
          roughness={0.3}
        />
      </mesh>

      <PullTab />
    </group>
  );
}

function Bottle({
  label,
  pack,
}: {
  label: PackLabel | null;
  pack: "bottle" | "magnum";
}) {
  const magnum = pack === "magnum";
  const profile = magnum ? MAGNUM_PROFILE : BOTTLE_PROFILE;

  // A wrap label is a straight sleeve: it touches at the widest point and
  // bridges the waist, so its radius is the body's maximum, not its average.
  const { height, fill, bandRadius, bandHeight, bandCentre } = magnum
    ? { height: 315, fill: 250, bandRadius: 46.4, bandHeight: 122, bandCentre: 128 }
    : { height: 216, fill: 168, bandRadius: 32.6, bandHeight: 84, bandCentre: 88 };

  const shell = useMemo(() => lathe(profile), [profile]);
  const drink = useMemo(() => lathe(truncate(profile, fill)), [profile, fill]);
  const cap = useMemo(() => lathe(CAP_PROFILE, 48), []);
  const knurl = useKnurlTexture();
  useEffect(
    () => () => void (shell.dispose(), drink.dispose(), cap.dispose()),
    [shell, drink, cap]
  );

  return (
    <group position={[0, (-height / 2) * MM, 0]}>
      {/*
        The PET shell, now refracting rather than faked with opacity.

        A transparent skin can only ever darken what is behind it; it cannot
        bend it. That missing refraction is why the old shell read as tinted
        glass film and the drink inside read as a solid brown lump — the eye
        gets no cue that there is a wall with thickness between the two.

        Held to a budget: 192px render target, 4 samples, and `backside` off.
        Backside doubles the pass to trace the far wall as well, which on a
        pack this size buys a difference nobody sees at scroll speed.
      */}
      <mesh geometry={shell}>
        <MeshTransmissionMaterial
          transmission={1}
          // 0.28 was thick enough for the attenuation to stack up through the
          // shoulder and settle as a grey wedge above the fill line. PET walls
          // are a third of a millimetre; the number only has to be enough to
          // bend the edge.
          thickness={0.1}
          ior={1.57}
          roughness={0.06}
          chromaticAberration={0.015}
          // Any blur here smears what the neck refracts into a grey wedge:
          // there is no liquid above the fill line, so that part of the shell
          // is showing the background through two curved walls and needs to
          // stay legible to read as glass rather than as a defect.
          anisotropicBlur={0}
          distortion={0}
          temporalDistortion={0}
          backside={false}
          resolution={384}
          samples={6}
          side={DoubleSide}
          color="#f2f8f9"
          attenuationColor="#eaf2f3"
          attenuationDistance={12}
        />
      </mesh>

      {/* The drink. Reads as liquid now that the shell refracts it, so it can
          take the environment back: at 0.55 it was a matte solid. Still kept
          off full reflectivity — a cola that picks up the red set turns pink,
          which is the one colour it cannot be. It stops at the real fill line,
          so the shoulder and neck stay clear plastic. */}
      <mesh geometry={drink} scale={[0.97, 1, 0.97]}>
        <meshPhysicalMaterial
          color="#3a1006"
          roughness={0.12}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={0.9}
        />
      </mesh>

      <mesh position={[0, bandCentre * MM, 0]}>
        <cylinderGeometry
          args={[
            bandRadius * MM,
            bandRadius * MM,
            bandHeight * MM,
            96,
            1,
            true,
          ]}
        />
        {/* Printed film wrapped round PET: a dielectric all over, unlike the
            can where the ink sits straight on metal. */}
        <meshStandardMaterial
          map={label?.texture ?? null}
          color={label ? "#ffffff" : BRAND_RED}
          roughness={0.44}
          metalness={0.05}
        />
      </mesh>

      <mesh geometry={cap} position={[0, (height - 16.6) * MM, 0]}>
        <meshStandardMaterial
          color={BRAND_RED}
          roughness={0.42}
          roughnessMap={knurl}
        />
      </mesh>
    </group>
  );
}

// ── staging ──────────────────────────────────────────────────

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Rises over [inA, inB] and falls over [outA, outB]. One act's share of the page. */
function band(p: number, inA: number, inB: number, outA: number, outB: number) {
  return smoothstep(inA, inB, p) * (1 - smoothstep(outA, outB, p));
}

interface Pose {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

const HERO_HEIGHT = 1.48;
const FOCUS_HEIGHT = 2.9;
/** One factor for every pack, so the last act is the only true-scale view. */
const LINEUP_SCALE = 0.72;

/** Where a pack rests in the family arc, by its distance from the chosen one. */
const ARC: Pose[] = [
  { position: [0, 0, 0.7], rotation: [0.05, 0, 0], scale: 1 },
  { position: [2.05, 0.06, -0.5], rotation: [0.06, -0.5, -0.22], scale: 0.88 },
  { position: [-2.05, 0.06, -0.5], rotation: [0.06, 0.5, 0.22], scale: 0.88 },
];

/** The receding diagonal of the closing shot, in pack order. */
const LINEUP: Pose[] = [
  { position: [-1.5, -0.5, 0.9], rotation: [0.1, 0.35, -0.28], scale: 1 },
  { position: [0.05, -0.2, 0], rotation: [0.1, 0.15, -0.28], scale: 1 },
  { position: [1.62, 0.16, -0.9], rotation: [0.1, -0.05, -0.28], scale: 1 },
];

/**
 * The four poses a pack can be in, given which pack is currently chosen.
 * Everything the scroll does to the scene is described here and then blended,
 * so an act is a set of numbers rather than a branch in the frame loop.
 */
function poses(index: number, active: number, compact: boolean): Pose[] {
  const height = PACKS[index].heightMm * MM;
  const chosen = index === active;
  const spread = compact ? 0.62 : 1;

  const arc = ARC[(index - active + PACKS.length) % PACKS.length];
  const line = LINEUP[index];

  // offstage: the packs not being talked about leave rather than shrink in place
  const away: Pose = {
    position: [index < active ? -5 : 5, 0, -2],
    rotation: [0, 0, 0],
    scale: 0,
  };

  const focus: Pose = {
    position: [compact ? 0 : 0.5, compact ? -0.15 : -0.05, 0],
    rotation: [0.05, 0.15, -0.13],
    scale: (FOCUS_HEIGHT * (compact ? 0.6 : 1)) / height,
  };

  const detail: Pose = {
    position: [compact ? 0 : 0.3, compact ? -0.2 : -0.1, 0.3],
    rotation: [0.04, Math.PI + 0.2, -0.1],
    scale: (FOCUS_HEIGHT * (compact ? 0.55 : 0.92)) / height,
  };

  return [
    {
      position: [arc.position[0] * spread, arc.position[1], arc.position[2]],
      rotation: arc.rotation,
      scale: (HERO_HEIGHT / height) * arc.scale,
    },
    chosen ? focus : away,
    chosen ? detail : away,
    {
      position: [line.position[0] * spread, line.position[1], line.position[2]],
      rotation: line.rotation,
      scale: LINEUP_SCALE,
    },
  ];
}

/** Camera distance for each act, in the same order as `poses`. */
const CAMERA = [6.4, 4.6, 4.3, 6.8];

/**
 * How far the camera rides above the set, per act. The two family shots carry
 * a centred headline, so they push the packs down out from under it; the two
 * close acts keep their copy at the edges and need no offset.
 */
const CAMERA_Y = [0.44, 0, 0, 0.3];

function PackModel({
  index,
  label,
  weights,
  active,
  compact,
  float,
}: {
  index: number;
  label: PackLabel | null;
  weights: RefObject<number[]>;
  active: number;
  compact: boolean;
  float: boolean;
}) {
  const group = useRef<Group>(null);
  const pack = PACKS[index];

  useFrame((state, delta) => {
    const group_ = group.current;
    if (!group_) return;

    const dt = Math.min(delta, 0.05);
    const w = weights.current;
    const list = poses(index, active, compact);

    let x = 0;
    let y = 0;
    let z = 0;
    let rx = 0;
    let ry = 0;
    let rz = 0;
    let scale = 0;

    for (let i = 0; i < list.length; i++) {
      const pose = list[i];
      x += pose.position[0] * w[i];
      y += pose.position[1] * w[i];
      z += pose.position[2] * w[i];
      rx += pose.rotation[0] * w[i];
      ry += pose.rotation[1] * w[i];
      rz += pose.rotation[2] * w[i];
      scale += pose.scale * w[i];
    }

    // a slow bob, offset per pack so the group never pulses in unison
    const bob = float ? Math.sin(state.clock.elapsedTime * 0.5 + index * 2) * 0.045 : 0;

    group_.position.x = MathUtils.damp(group_.position.x, x, 5, dt);
    group_.position.y = MathUtils.damp(group_.position.y, y + bob, 5, dt);
    group_.position.z = MathUtils.damp(group_.position.z, z, 5, dt);
    group_.rotation.x = MathUtils.damp(group_.rotation.x, rx, 5, dt);
    group_.rotation.y = MathUtils.damp(group_.rotation.y, ry, 5, dt);
    group_.rotation.z = MathUtils.damp(group_.rotation.z, rz, 5, dt);
    group_.scale.setScalar(MathUtils.damp(group_.scale.x, scale, 6, dt));
    group_.visible = group_.scale.x > 0.012;
  });

  return (
    <group ref={group} scale={0.001}>
      {pack.id === "can" ? (
        <Can label={label} />
      ) : (
        <Bottle label={label} pack={pack.id as "bottle" | "magnum"} />
      )}
    </group>
  );
}

/** A soft disc of light, used as the pedestal the family arc rests on. */
function useGlowTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.45, "rgba(255,190,190,0.35)");
    gradient.addColorStop(1, "rgba(255,120,120,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
}

/**
 * A backdrop that exists inside the scene, not behind the canvas.
 *
 * The page paints its ground in CSS and leaves the canvas transparent, which
 * is cheap and looks right — until something refracts. `transmission` samples
 * the rendered *scene*, so above the fill line, where the bottle is hollow and
 * nothing in the scene sits behind it, the shell was refracting empty buffer
 * and returning it as a grey wedge across the shoulder.
 *
 * One unlit plane far enough back to stay out of every camera move fixes it:
 * now the neck refracts the same sweep the CSS is painting, which is what the
 * eye expects a clear bottle to do. Painted to match the CSS stops rather than
 * replacing them, so the two agree wherever they meet.
 */
function Backdrop() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // the same sweep the CSS paints, so the two agree where they overlap
    const sweep = ctx.createLinearGradient(0, 0, 0, size);
    sweep.addColorStop(0, "#f6cdb9");
    sweep.addColorStop(0.32, "#d1857a");
    sweep.addColorStop(0.66, "#8a3038");
    sweep.addColorStop(1, "#3b1418");
    ctx.fillStyle = sweep;
    ctx.fillRect(0, 0, size, size);

    // Fade the edges out. Opaque to the frame edge this plane covers the floor
    // band and the vignette the page paints in CSS. Solid only where a pack can
    // actually be in front of it, it gives the refraction something to read and
    // leaves the CSS ground to carry everything else.
    ctx.globalCompositeOperation = "destination-in";
    const mask = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.12,
      size / 2,
      size / 2,
      size * 0.52
    );
    mask.addColorStop(0, "rgba(0,0,0,1)");
    mask.addColorStop(0.62, "rgba(0,0,0,0.92)");
    mask.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, size, size);

    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;

  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[18, 12]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Pedestal({ weights }: { weights: RefObject<number[]> }) {
  const glow = useGlowTexture();
  const above = useRef<Mesh>(null);
  const below = useRef<Mesh>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // only the family arc is staged on a plinth; the rest of the page floats
    const target = weights.current[0];
    for (const ref of [above, below]) {
      const material = ref.current?.material as
        | { opacity: number }
        | undefined;
      if (material) {
        material.opacity = MathUtils.damp(material.opacity, target, 6, dt);
      }
    }
  });

  if (!glow) return null;

  return (
    <group position={[0, 0, 0.7]}>
      <mesh ref={below} position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 48]} />
        <meshBasicMaterial
          map={glow}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={above} position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.85, 48]} />
        <meshBasicMaterial
          map={glow}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Turns one scroll value into the weights every other part of the scene reads.
 * Acts overlap on purpose: a pack is midway between two poses for the whole
 * crossfade, which is what makes the page feel filmed rather than stepped.
 */
function Director({
  progress,
  weights,
  compact,
}: {
  progress: RefObject<number>;
  weights: RefObject<number[]>;
  compact: boolean;
}) {
  useFrame((state, delta) => {
    const p = progress.current;

    const raw = [
      band(p, -1, 0, 0.2, 0.36),
      band(p, 0.24, 0.4, 0.5, 0.62),
      band(p, 0.54, 0.66, 0.74, 0.84),
      band(p, 0.78, 0.9, 2, 3),
    ];
    const total = raw.reduce((sum, v) => sum + v, 0) || 1;
    // The scene owns this ref and every part reads it without re-rendering.
    // Four numbers in state would re-render the whole thing sixty times a second.
    // eslint-disable-next-line react-hooks/immutability -- written per frame by design
    for (let i = 0; i < raw.length; i++) weights.current[i] = raw[i] / total;

    let distance = 0;
    let lift = 0;
    for (let i = 0; i < CAMERA.length; i++) {
      distance += CAMERA[i] * weights.current[i];
      lift += CAMERA_Y[i] * weights.current[i];
    }
    if (compact) distance *= 1.5;

    const dt = Math.min(delta, 0.05);
    state.camera.position.z = MathUtils.damp(
      state.camera.position.z,
      distance,
      5,
      dt
    );

    // on a phone the copy owns the top of the screen, so the set drops further
    const visible = 2 * distance * Math.tan((FOV / 2) * MathUtils.DEG2RAD);
    state.camera.position.y = MathUtils.damp(
      state.camera.position.y,
      lift + (compact ? visible * 0.16 : 0),
      5,
      dt
    );
    state.camera.lookAt(0, state.camera.position.y, 0);
  });

  return null;
}

export default function ContourScene({
  progress,
  active,
  compact,
  float,
  scriptFamily,
}: {
  /** page scroll, 0 to 1, written every frame without re-rendering React */
  progress: RefObject<number>;
  active: number;
  /** phone layout: the set sits smaller and lower, under the copy */
  compact: boolean;
  /** idle bob, off when the visitor asked for reduced motion */
  float: boolean;
  scriptFamily: string;
}) {
  const labels = useLabels(scriptFamily);
  const weights = useRef<number[]>([1, 0, 0, 0]);

  return (
    <SceneCanvas
      camera={{ position: [0, 0, CAMERA[0]], fov: FOV }}
      gl={{ antialias: true, alpha: true }}
      className="touch-none"
    >
      <Director progress={progress} weights={weights} compact={compact} />

      {PACKS.map((pack, i) => (
        <PackModel
          key={pack.id}
          index={i}
          label={labels?.[pack.id] ?? null}
          weights={weights}
          active={active}
          compact={compact}
          float={float}
        />
      ))}

      <Backdrop />

      <Pedestal weights={weights} />

      {/*
        The one thing that was missing everywhere: weight.
        Nothing here touched a surface, so every pack read as a cut-out pasted
        over a gradient no matter how good its material was. A soft contact
        shadow under the group gives the scene a floor, and the floor is what
        makes the arrangement read as staged rather than as three objects
        floating at arbitrary heights. Kept blurry and cheap — it is doing a
        compositional job, not a physical one.
      */}
      <ContactShadows
        position={[0, -0.86, 0]}
        scale={5.5}
        far={1.8}
        blur={2.6}
        opacity={0.7}
        resolution={256}
        color="#140102"
      />

      {/* Low on purpose. Ambient light lifts the shadow side of a metal pack
          uniformly, which flattens exactly the reflections the light cards
          above are there to create. */}
      <ambientLight intensity={0.28} />
      {/* 256 is too coarse for metal: the light cards arrive on the barrel as
          soft blobs instead of edges, and an edgeless highlight is what a
          plastic surface looks like. */}
      <Environment resolution={512}>
        {/* The key. Held down from 5: the neck-in curves the shoulder straight
            back at this card, and at full strength that whole band clipped to
            flat white with no form left in it. */}
        <Lightformer intensity={3.4} position={[0, 4, 3]} scale={[9, 7, 1]} />
        {/* dark cards either side: red aluminium needs something to reflect
            or the barrel of the can flattens out */}
        <Lightformer
          intensity={2.6}
          color="#2b0406"
          position={[-4.5, 0, 2]}
          rotation-y={Math.PI / 2}
          scale={[10, 8, 1]}
        />
        <Lightformer
          intensity={2.6}
          color="#3a0508"
          position={[4.5, 0, 2]}
          rotation-y={-Math.PI / 2}
          scale={[10, 8, 1]}
        />
        {/* two hard strips for the long vertical highlights down the pack */}
        <Lightformer
          intensity={9}
          color="#fff4f2"
          position={[-1.6, 0, 3.4]}
          scale={[0.35, 6, 1]}
        />
        <Lightformer
          intensity={6}
          color="#ffd9d2"
          position={[1.7, 0.4, 3]}
          scale={[0.25, 5, 1]}
        />
        <Lightformer
          intensity={2.2}
          color="#ff6b6b"
          position={[0, -3.4, 1.6]}
          scale={[7, 3, 1]}
        />
      </Environment>
    </SceneCanvas>
  );
}
