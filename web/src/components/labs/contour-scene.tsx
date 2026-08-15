"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import {
  CanvasTexture,
  Group,
  LatheGeometry,
  MathUtils,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  type Mesh,
} from "three";

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
  /** camera pull-back that frames this pack without cropping the cap */
  distance: number;
  /** sugar in grams for the whole pack, at the published 10.6 g / 100 ml */
  sugarG: number;
}

export const PACKS: Pack[] = [
  {
    id: "can",
    name: "Standard can",
    volume: "325 ml",
    heightMm: 122,
    distance: 4.6,
    sugarG: 34,
  },
  {
    id: "bottle",
    name: "Contour bottle",
    volume: "510 ml",
    heightMm: 216,
    distance: 6.9,
    sugarG: 54,
  },
  {
    id: "magnum",
    name: "Sharing bottle",
    volume: "1.25 L",
    heightMm: 315,
    distance: 9.6,
    sugarG: 132,
  },
];

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
 * neck: that stays at 28 mm so the cap matches. Splitting the profile at the
 * shoulder is what lets the body grow while the finish stays put.
 */
const MAGNUM_PROFILE = BOTTLE_PROFILE.map(([r, y], i) => {
  const belowShoulder = i < 13;
  return belowShoulder
    ? ([r * 1.38, y * 1.52] as const)
    : ([r, y - 216 + 315] as const);
});

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

  // A wrap texture repeats at the seam, so the panel is drawn twice, half a
  // turn apart, and the pack reads from whichever side you spin it to. Only
  // about two thirds of a panel faces the camera at once, so nothing may run
  // wider than that or neighbouring copies collide in view.
  const panel = width / 2;
  const safe = panel * 0.48;

  for (const left of [0, panel]) {
    ctx.save();
    ctx.translate(left, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ribbon(ctx, panel, height * 0.78, height * 0.1);

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
  texture.anisotropy = 8;
  // A cylinder starts its wrap at the point facing the camera, which is where
  // the join between the two panels falls. Shifting a quarter turn puts a
  // whole wordmark there instead of the gap between two of them.
  texture.wrapS = RepeatWrapping;
  texture.offset.x = 0.25;
  return texture;
}

function useLabels(scriptFamily: string) {
  const [labels, setLabels] = useState<Record<string, CanvasTexture> | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    // The wordmark is only right once the script face is actually resident;
    // painting earlier silently falls back to a system cursive.
    const paint = () => {
      if (cancelled) return;
      const next: Record<string, CanvasTexture> = {};
      for (const pack of PACKS) {
        const tex = paintLabel(2048, 1024, scriptFamily, pack.volume);
        if (tex) next[pack.id] = tex;
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
      if (labels) for (const tex of Object.values(labels)) tex.dispose();
    };
  }, [labels]);

  return labels;
}

// ── packs ────────────────────────────────────────────────────

const ALUMINIUM = {
  color: "#e9edf2",
  metalness: 1,
  roughness: 0.24,
} as const;

function Can({ label }: { label: CanvasTexture | null }) {
  const base = useMemo(() => lathe(CAN_BASE), []);
  const top = useMemo(() => lathe(CAN_TOP), []);
  useEffect(() => () => void (base.dispose(), top.dispose()), [base, top]);

  return (
    <group position={[0, -61 * MM, 0]}>
      <mesh geometry={base}>
        <meshStandardMaterial {...ALUMINIUM} />
      </mesh>

      <mesh position={[0, 54 * MM, 0]}>
        <cylinderGeometry args={[33 * MM, 33 * MM, 105 * MM, 96, 1, true]} />
        <meshStandardMaterial
          map={label}
          color={label ? "#ffffff" : BRAND_RED}
          metalness={0.55}
          roughness={0.36}
        />
      </mesh>

      <mesh geometry={top} position={[0, 106.5 * MM, 0]}>
        <meshStandardMaterial {...ALUMINIUM} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Bottle({
  label,
  pack,
}: {
  label: CanvasTexture | null;
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
  useEffect(
    () => () => void (shell.dispose(), drink.dispose(), cap.dispose()),
    [shell, drink, cap]
  );

  return (
    <group position={[0, (-height / 2) * MM, 0]}>
      {/* the clear PET shell, kept cheap: no transmission pass, just a low
          opacity skin with a hard specular so the edges catch the key */}
      <mesh geometry={shell}>
        <meshPhysicalMaterial
          color="#e8f0f2"
          transparent
          opacity={0.22}
          roughness={0.08}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* The drink: opaque, and deliberately dulled against the environment.
          Left reflective it picks up the red set and turns pink, which is the
          one colour a cola cannot be. It stops at the real fill line, so the
          shoulder and neck stay clear plastic. */}
      <mesh geometry={drink} scale={[0.97, 1, 0.97]}>
        <meshPhysicalMaterial
          color="#280a04"
          roughness={0.18}
          metalness={0}
          clearcoat={0.5}
          envMapIntensity={0.55}
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
        <meshStandardMaterial
          map={label}
          color={label ? "#ffffff" : BRAND_RED}
          roughness={0.44}
          metalness={0.05}
        />
      </mesh>

      <mesh geometry={cap} position={[0, (height - 16.6) * MM, 0]}>
        <meshStandardMaterial color={BRAND_RED} roughness={0.42} />
      </mesh>
    </group>
  );
}

// ── staging ──────────────────────────────────────────────────

/**
 * All three packs stay mounted and the inactive ones collapse to nothing.
 * Swapping by scale rather than by mounting keeps the change instant, since
 * a lathe rebuilt mid-transition is a visible hitch on a phone.
 */
function Stage({
  active,
  spin,
  compact,
  labels,
}: {
  active: number;
  spin: boolean;
  compact: boolean;
  labels: Record<string, CanvasTexture> | null;
}) {
  const groups = useRef<(Group | null)[]>([]);
  const stage = useRef<Group>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    PACKS.forEach((pack, i) => {
      const group = groups.current[i];
      if (!group) return;

      const isActive = i === active;
      group.scale.setScalar(MathUtils.damp(group.scale.x, isActive ? 1 : 0, 9, dt));
      group.visible = group.scale.x > 0.012;

      if (!spin) {
        group.rotation.y = 0;
        return;
      }

      if (isActive) {
        // A pack on stage has to keep its face to camera, so instead of
        // turning it rocks either side of front. Damping toward that is also
        // what swings an incoming pack round into place.
        group.rotation.y = MathUtils.damp(
          group.rotation.y,
          Math.sin(t * 0.4) * 0.3,
          2.4,
          dt
        );
      } else {
        // the outgoing pack keeps turning as it leaves, wrapped so it is
        // never more than half a turn from front when it is called back
        let spun = group.rotation.y + delta * 1.6;
        if (spun > Math.PI) spun -= Math.PI * 2;
        group.rotation.y = spun;
      }
    });

    // ease the camera back for the taller packs instead of shrinking them,
    // which is what keeps the size difference legible between formats
    const distance = PACKS[active].distance * (compact ? 1.75 : 1);
    state.camera.position.z = MathUtils.damp(
      state.camera.position.z,
      distance,
      4,
      dt
    );
    state.camera.updateProjectionMatrix();

    // On a phone the copy has the top of the screen to itself, so the pack
    // drops into the gap below it. Offsetting by a share of what the camera
    // can see keeps that gap the same on every pack, however far back it is.
    if (stage.current) {
      const visible =
        2 * state.camera.position.z * Math.tan((FOV / 2) * MathUtils.DEG2RAD);
      stage.current.position.y = MathUtils.damp(
        stage.current.position.y,
        compact ? -visible * 0.12 : 0,
        4,
        dt
      );
    }
  });

  return (
    <group ref={stage}>
      {PACKS.map((pack, i) => (
        <group
          key={pack.id}
          ref={(el) => {
            groups.current[i] = el;
          }}
          scale={i === 0 ? 1 : 0}
        >
          {pack.id === "can" ? (
            <Can label={labels?.can ?? null} />
          ) : (
            <Bottle
              label={labels?.[pack.id] ?? null}
              pack={pack.id as "bottle" | "magnum"}
            />
          )}
        </group>
      ))}

      <ContactShadows
        position={[0, -1.75, 0]}
        opacity={0.5}
        scale={9}
        blur={2.6}
        far={3}
        resolution={512}
        color="#450205"
      />
    </group>
  );
}

/** Slow drift on the key light, so a still page never looks frozen. */
function Key() {
  const light = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (light.current) {
      light.current.position.x = Math.sin(clock.elapsedTime * 0.18) * 2.4;
    }
  });
  return (
    <Lightformer
      ref={light}
      intensity={5}
      position={[0, 4, 3]}
      scale={[9, 7, 1]}
    />
  );
}

export default function ContourScene({
  active,
  spin,
  compact,
  scriptFamily,
}: {
  active: number;
  spin: boolean;
  /** phone layout: the pack sits smaller and lower, under the copy */
  compact: boolean;
  scriptFamily: string;
}) {
  const labels = useLabels(scriptFamily);

  return (
    <Canvas
      camera={{ position: [0, 0, PACKS[0].distance], fov: FOV }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      className="touch-none"
    >
      <Stage active={active} spin={spin} compact={compact} labels={labels} />

      <ambientLight intensity={0.5} />
      <Environment resolution={256}>
        <Key />
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
    </Canvas>
  );
}
