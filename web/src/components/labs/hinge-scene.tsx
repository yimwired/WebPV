"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import {
  DoubleSide,
  ExtrudeGeometry,
  LinearFilter,
  Shape,
  SRGBColorSpace,
  Texture,
} from "three";

import { SceneCanvas } from "./scene-canvas";

// ─────────────────────────────────────────────────────────────
//  The device, in millimetres, as published.
//
//  Height is the dimension that does not change: the panel folds about a
//  vertical axis, so 117.8 is true both open and shut. Everything else is
//  derived from the published pair rather than typed twice, so the model
//  cannot drift from the spec sheet.
// ─────────────────────────────────────────────────────────────

/** World units per millimetre. The whole device is about 1.6 units across. */
const MM = 0.01;

const BODY_HEIGHT = 117.8;
const OPEN_WIDTH = 164.6;
const OPEN_DEPTH = 5.2;
const SHUT_DEPTH = 11.3;

/** One leaf is half the open width. The hinge makes up the difference. */
const LEAF_WIDTH = OPEN_WIDTH / 2;

/**
 * How far each leaf stands off the fold axis once it is shut.
 *
 * Shut, the two panels and the air between them measure 11.3 while the
 * panels themselves are 5.2 each, so the gap is 0.9 and each leaf stands
 * half of that plus half its own thickness away from the axis. Open, the
 * offset has to be zero or the inner display would carry a seam down the
 * middle, so it is driven by the fold rather than fixed: a real hinge of
 * this kind walks the leaves apart as it closes for exactly this reason.
 */
const SHUT_OFFSET = SHUT_DEPTH / 2 - OPEN_DEPTH / 2;

/** Inner display: 1878 x 2670 at 430 ppi, which lands in landscape when open. */
const INNER_SCREEN = { width: 157.7, height: 110.9 };

/** Outer display: 1398 x 2034 at 460 ppi, portrait, on the back of one leaf. */
const OUTER_SCREEN = { width: 77.2, height: 112.3 };

/** Radius of the two outer corners. The two that meet the hinge stay square. */
const CORNER = 9;

/** Lifted off the panel so the display never fights the body for the pixel. */
const SCREEN_LIFT = 0.12;

/**
 * One leaf of the body: rounded on the two outer corners, square on the two
 * at the hinge, and bevelled all round so the edge catches a highlight
 * instead of going to a hard black line.
 *
 * Drawn from the origin outwards along `side`, which puts the fold axis at
 * x = 0 and lets a leaf rotate about its own group with no offset arithmetic.
 */
function leafGeometry(side: 1 | -1) {
  const halfHeight = BODY_HEIGHT / 2;
  const outer = side * LEAF_WIDTH;
  const corner = side * CORNER;

  const shape = new Shape();
  shape.moveTo(0, -halfHeight);
  shape.lineTo(outer - corner, -halfHeight);
  shape.quadraticCurveTo(outer, -halfHeight, outer, -halfHeight + CORNER);
  shape.lineTo(outer, halfHeight - CORNER);
  shape.quadraticCurveTo(outer, halfHeight, outer - corner, halfHeight);
  shape.lineTo(0, halfHeight);
  shape.closePath();

  const bevel = 0.55;
  return (
    new ExtrudeGeometry(shape, {
      depth: OPEN_DEPTH - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 24,
    })
      .center()
      // The shape above is drawn in millimetres so it reads like the spec
      // sheet. Scaling once here is what puts it in world units, and skipping
      // it builds a device 164 units across with the camera inside it.
      .scale(MM, MM, MM)
  );
}

interface ScreenProps {
  texture: Texture | null;
  width: number;
  height: number;
  /** Which slice of the artwork this panel shows: 0 the left half, 0.5 the right. */
  offsetX?: number;
  repeatX?: number;
}

/**
 * A display: the artwork if there is one, otherwise the off state, which is a
 * near-black that still reads as glass rather than as a hole in the body.
 */
function Screen({
  texture,
  width,
  height,
  offsetX = 0,
  repeatX = 1,
}: ScreenProps) {
  const mapped = useMemo(() => {
    if (!texture) return null;

    // Each panel needs its own view of the same image, and offset/repeat live
    // on the texture rather than on the material, so the two halves have to be
    // separate texture objects sharing one uploaded bitmap.
    const clone = texture.clone();
    clone.needsUpdate = true;
    clone.colorSpace = SRGBColorSpace;
    clone.magFilter = LinearFilter;
    clone.minFilter = LinearFilter;
    clone.offset.set(offsetX, 0);
    clone.repeat.set(repeatX, 1);
    return clone;
  }, [texture, offsetX, repeatX]);

  useEffect(() => () => mapped?.dispose(), [mapped]);

  return (
    <mesh>
      <planeGeometry args={[width * MM, height * MM]} />
      {mapped ? (
        <meshBasicMaterial map={mapped} toneMapped={false} side={DoubleSide} />
      ) : (
        <meshPhysicalMaterial
          color="#08090b"
          roughness={0.22}
          metalness={0}
          clearcoat={0.55}
          clearcoatRoughness={0.16}
          envMapIntensity={0.18}
          side={DoubleSide}
        />
      )}
    </mesh>
  );
}

interface DeviceProps {
  /** 0 flat open, 1 shut. */
  fold: number;
  inner: Texture | null;
  outer: Texture | null;
  bodyColor: string;
}

function Device({ fold, inner, outer, bodyColor }: DeviceProps) {
  const left = useMemo(() => leafGeometry(-1), []);
  const right = useMemo(() => leafGeometry(1), []);

  useEffect(
    () => () => {
      left.dispose();
      right.dispose();
    },
    [left, right],
  );

  // Each leaf swings a quarter turn, so the pair closes through 180 degrees.
  const swing = (fold * Math.PI) / 2;
  const offset = SHUT_OFFSET * fold * MM;

  // The display sits half a body thickness up from the leaf's own centre.
  const faceZ = (OPEN_DEPTH / 2) * MM + SCREEN_LIFT * MM;
  const leafCentre = (LEAF_WIDTH / 2) * MM;

  return (
    // Both leaves swing, which is how the hinge really works but leaves the
    // shut device edge-on to a camera that was square to it when open. Turning
    // the whole body by half the fold keeps the face that matters pointed at
    // the lens: the inner display flat open, the outer display once it shuts.
    <group rotation={[0, (fold * Math.PI) / 2, 0]}>
      {/* left leaf: carries the outer display on its back */}
      <group position={[-offset, 0, 0]} rotation={[0, swing, 0]}>
        <mesh geometry={left} position={[-leafCentre, 0, 0]}>
          <meshPhysicalMaterial
            color={bodyColor}
            metalness={0.92}
            roughness={0.34}
            envMapIntensity={1.9}
            clearcoat={0.4}
            clearcoatRoughness={0.28}
          />
        </mesh>

        <group position={[-leafCentre, 0, faceZ]}>
          <Screen
            texture={inner}
            width={INNER_SCREEN.width / 2}
            height={INNER_SCREEN.height}
            offsetX={0}
            repeatX={0.5}
          />
        </group>

        <group position={[-leafCentre, 0, -faceZ]} rotation={[0, Math.PI, 0]}>
          <Screen
            texture={outer}
            width={OUTER_SCREEN.width}
            height={OUTER_SCREEN.height}
          />
        </group>
      </group>

      {/* right leaf */}
      <group position={[offset, 0, 0]} rotation={[0, -swing, 0]}>
        <mesh geometry={right} position={[leafCentre, 0, 0]}>
          <meshPhysicalMaterial
            color={bodyColor}
            metalness={0.92}
            roughness={0.34}
            envMapIntensity={1.9}
            clearcoat={0.4}
            clearcoatRoughness={0.28}
          />
        </mesh>

        <group position={[leafCentre, 0, faceZ]}>
          <Screen
            texture={inner}
            width={INNER_SCREEN.width / 2}
            height={INNER_SCREEN.height}
            offsetX={0.5}
            repeatX={0.5}
          />
        </group>
      </group>

      {/*
        The spine. Its radius is what the shut thickness asks for, which leaves
        it standing a fraction proud of a flat-open body. That is the real
        shape rather than an error, and it is where the 164.6 open and 84.1
        shut widths stop agreeing with each other.
      */}
      <mesh>
        <cylinderGeometry
          args={[
            (SHUT_DEPTH / 2) * MM,
            (SHUT_DEPTH / 2) * MM,
            BODY_HEIGHT * MM,
            48,
          ]}
        />
        <meshPhysicalMaterial
          color={bodyColor}
          metalness={0.92}
          roughness={0.5}
          envMapIntensity={1.6}
        />
      </mesh>
    </group>
  );
}

export type CaptureFn = (scale: number) => Promise<Blob | null>;

/**
 * Hands the page a function that renders one frame at a higher resolution and
 * reads it straight back, so an exported shot is the scene it was taken from
 * rather than a second renderer's idea of it.
 */
function CaptureRig({ onReady }: { onReady: (capture: CaptureFn) => void }) {
  const { gl, scene, camera, size } = useThree();

  useEffect(() => {
    onReady(async (scale) => {
      const previous = gl.getPixelRatio();
      gl.setPixelRatio(scale);
      gl.render(scene, camera);

      const blob = await new Promise<Blob | null>((resolve) =>
        gl.domElement.toBlob(resolve, "image/png"),
      );

      gl.setPixelRatio(previous);
      gl.render(scene, camera);
      return blob;
    });
  }, [gl, scene, camera, size, onReady]);

  return null;
}

export interface HingeSceneProps {
  fold: number;
  inner: Texture | null;
  outer: Texture | null;
  bodyColor: string;
  damping: boolean;
  onCaptureReady: (capture: CaptureFn) => void;
}

/**
 * The studio itself. Transparent canvas, so an exported shot drops onto
 * whatever the deck it is going into already uses, and lit like a product
 * still: one broad key overhead, a dark card each side to draw the titanium
 * edge, and a soft bounce from below.
 */
export default function HingeScene({
  fold,
  inner,
  outer,
  bodyColor,
  damping,
  onCaptureReady,
}: HingeSceneProps) {
  return (
    <SceneCanvas
      camera={{ position: [0, 0.55, 3.1], fov: 28 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      className="touch-none"
    >
      <Device fold={fold} inner={inner} outer={outer} bodyColor={bodyColor} />

      <ambientLight intensity={0.5} />
      <Environment resolution={256}>
        {/* key: the softbox overhead, where the highlights come from */}
        <Lightformer intensity={5} position={[0, 4, 2.5]} scale={[10, 6, 1]} />
        {/*
          A broad panel where the camera is. A metal body takes its whole
          appearance from what it reflects, so with only rim and edge light it
          renders as a black cutout: this is the source that puts a face on it.
        */}
        <Lightformer
          intensity={2.4}
          position={[-2.6, 1.4, 4.2]}
          rotation-y={0.5}
          scale={[3.5, 6, 1]}
        />
        {/* black cards either side: polished metal needs something dark to
            reflect or its edges disappear into the backdrop */}
        <Lightformer
          intensity={2.2}
          color="#1c1917"
          position={[-4, 0, 1]}
          rotation-y={Math.PI / 2}
          scale={[9, 5, 1]}
        />
        <Lightformer
          intensity={2.2}
          color="#26231f"
          position={[4, 0, 1]}
          rotation-y={-Math.PI / 2}
          scale={[9, 5, 1]}
        />
        {/* warm bounce from the table */}
        <Lightformer
          intensity={1.6}
          color="#f0e6da"
          position={[0, -3.2, 1.5]}
          scale={[8, 3, 1]}
        />
      </Environment>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping={damping}
        dampingFactor={0.08}
        rotateSpeed={0.65}
        minDistance={1.6}
        maxDistance={6}
      />

      <CaptureRig onReady={onCaptureReady} />
    </SceneCanvas>
  );
}
