"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { AdditiveBlending, Color, FrontSide, type Group, type Mesh } from "three";

import { SceneCanvas } from "./scene-canvas";

// ─────────────────────────────────────────────────────────────
//  The object in the Nebula hero.
//
//  It was a stack of divs: a radial gradient for the body, a blurred white
//  ellipse for the highlight, and two bordered circles squashed with
//  rotateX to suggest orbits. That reads as a sticker of a planet, because
//  the highlight never moves, the rings never pass behind anything, and the
//  moon slides along a flat path in front of it all.
//
//  This is not a planet. Deep Space already has one, and a second would say
//  the same thing twice. It is a core inside a smoked shell: the shell
//  brightens where it turns away from the camera, the way glass gathers
//  light at a grazing angle, and the rings are real geometry that occludes
//  and is occluded as it turns.
// ─────────────────────────────────────────────────────────────

/** Seconds per revolution, slowest first. Nothing here should look hurried. */
const CORE_SPIN = 42;
const RING_SPIN = 26;
const SATELLITE_ORBIT = 15;

/**
 * The shell. Brightest where the surface turns edge-on and nearly clear when
 * facing the camera, so the core reads as something seen through a skin
 * rather than painted on one.
 */
const SHELL_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const SHELL_FRAGMENT = /* glsl */ `
  uniform vec3 uInner;
  uniform vec3 uEdge;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float grazing = 1.0 - facing;

    // Two terms: a broad wash that keeps the shell from vanishing where it
    // faces us, and a tight rim that only appears at the silhouette.
    float wash = pow(grazing, 1.6) * 0.35;
    float rim = pow(grazing, 5.0);

    vec3 tint = mix(uInner, uEdge, rim);
    float alpha = (wash + rim) * uIntensity;

    gl_FragColor = vec4(tint * alpha, alpha);
  }
`;

function Orb({ spin }: { spin: boolean }) {
  const core = useRef<Mesh>(null);
  const rings = useRef<Group>(null);
  const satellite = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!spin) return;
    if (core.current) core.current.rotation.y += (delta / CORE_SPIN) * Math.PI * 2;
    if (rings.current) rings.current.rotation.z += (delta / RING_SPIN) * Math.PI * 2;
    if (satellite.current) satellite.current.rotation.y -= (delta / SATELLITE_ORBIT) * Math.PI * 2;
  });

  return (
    // tipped, so the rings read as ellipses seen in perspective rather than
    // as circles drawn flat on the page
    <group rotation={[0.42, 0, 0.28]}>
      <mesh ref={core}>
        <icosahedronGeometry args={[1, 6]} />
        <meshPhysicalMaterial
          color="#2a1152"
          roughness={0.34}
          metalness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.3}
          emissive="#5b21b6"
          emissiveIntensity={0.55}
        />
      </mesh>

      {/* Detail 6, not 4: at this size a coarser sphere shows its facets on
          the silhouette, and the outline is the only part of a shell anyone
          looks at. Sitting close to the core keeps the gap from reading as a
          dark band around the object. */}
      <mesh scale={1.075}>
        <icosahedronGeometry args={[1, 6]} />
        <shaderMaterial
          vertexShader={SHELL_VERTEX}
          fragmentShader={SHELL_FRAGMENT}
          uniforms={{
            uInner: { value: new Color("#7c3aed") },
            uEdge: { value: new Color("#f0abfc") },
            uIntensity: { value: 1.35 },
          }}
          side={FrontSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Real rings, on their own axis. Being geometry rather than a border
          is the whole point: each one passes behind the core for half its
          turn, which a squashed circle in front of a gradient never does. */}
      <group ref={rings} rotation={[Math.PI / 2.35, 0, 0]}>
        <mesh>
          <torusGeometry args={[1.66, 0.012, 10, 240]} />
          <meshStandardMaterial
            color="#f5d0fe"
            roughness={0.3}
            metalness={0.8}
            emissive="#d946ef"
            emissiveIntensity={0.55}
          />
        </mesh>
        <mesh rotation={[0.16, 0.1, 0]} scale={1.13}>
          <torusGeometry args={[1.66, 0.008, 10, 240]} />
          <meshStandardMaterial
            color="#ddd6fe"
            roughness={0.35}
            metalness={0.7}
            emissive="#8b5cf6"
            emissiveIntensity={0.45}
          />
        </mesh>
      </group>

      {/* The satellite is parented to a turning group, so it goes round the
          object in three dimensions and disappears behind it. */}
      <group ref={satellite} rotation={[0.3, 0, 0]}>
        <mesh position={[1.78, 0.22, 0]}>
          <icosahedronGeometry args={[0.085, 3]} />
          <meshStandardMaterial
            color="#fdf4ff"
            emissive="#e879f9"
            emissiveIntensity={1.6}
            roughness={0.4}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * `spin` is false when the visitor asked for reduced motion: the object holds
 * still, lit and complete, rather than being swapped for a flat stand-in.
 */
export default function NebulaScene({ spin = true }: { spin?: boolean }) {
  return (
    <SceneCanvas
      camera={{ position: [0, 0, 5.1], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      className="touch-none"
    >
      <ambientLight intensity={0.22} color="#c4b5fd" />
      <directionalLight position={[-3, 2.4, 3]} intensity={1.4} color="#f5d0fe" />

      {/* Generated studio, no HDR to download. The rings are metal and metal
          shows nothing but what is around it, so without these they would
          read as flat violet wire. */}
      <Environment resolution={128}>
        {/* A long softbox, not a ring: a ring form reflects as a doughnut on a
            glossy sphere, which reads as a smudge rather than a light source. */}
        <Lightformer
          intensity={4.2}
          position={[-1.9, 3.1, 2.6]}
          rotation={[-0.5, 0, 0.5]}
          scale={[7, 1.6, 1]}
          color="#c084fc"
        />
        <Lightformer
          intensity={3.4}
          position={[-5, 0, 1]}
          rotation-y={Math.PI / 2}
          scale={[10, 5, 1]}
          color="#f0abfc"
        />
        <Lightformer
          intensity={2.6}
          position={[5, -1, 1]}
          rotation-y={-Math.PI / 2}
          scale={[10, 5, 1]}
          color="#38bdf8"
        />
        <Lightformer intensity={2} position={[0, -4, 2]} scale={[8, 3, 1]} color="#4c1d95" />
      </Environment>

      <Orb spin={spin} />
    </SceneCanvas>
  );
}
