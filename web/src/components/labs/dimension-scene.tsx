"use client";

import {
  Environment,
  Float,
  Lightformer,
  OrbitControls,
  Sparkles,
} from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";

import { SceneCanvas } from "./scene-canvas";

/**
 * Real-time 3D hero for the "Dimension" lab: a chrome torus knot with
 * iridescent clearcoat, lit by a generative environment (no HDR download),
 * auto-rotating and draggable. Rendered client-only via next/dynamic.
 *
 * `spin` is off when the visitor asked for reduced motion: the knot then sits
 * still and lit, and dragging it still works. The scene is the product here,
 * so it stays on screen rather than being replaced by a flat image.
 */
export default function DimensionScene({ spin = true }: { spin?: boolean }) {
  return (
    <SceneCanvas
      camera={{ position: [0, 0, 11], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      className="touch-none"
    >
      <Float
        speed={spin ? 1.6 : 0}
        rotationIntensity={spin ? 0.9 : 0}
        floatIntensity={spin ? 1.1 : 0}
      >
        <mesh scale={0.85} position={[0, 0.9, 0]}>
          <torusKnotGeometry args={[1.55, 0.42, 260, 48]} />
          <meshPhysicalMaterial
            color="#f1f5f9"
            metalness={0.9}
            roughness={0.12}
            clearcoat={1}
            clearcoatRoughness={0.1}
            iridescence={0.9}
            iridescenceIOR={1.6}
          />
        </mesh>
      </Float>

      <Sparkles
        count={140}
        scale={12}
        size={2.2}
        speed={spin ? 0.35 : 0}
        color="#a5f3fc"
      />

      {/* generative studio lighting; chrome needs something to reflect */}
      <ambientLight intensity={0.4} />
      <Environment resolution={256}>
        <Lightformer intensity={7} position={[0, 6, -9]} scale={[24, 14, 1]} />
        <Lightformer intensity={5} position={[0, 2, 8]} scale={[16, 8, 1]} color="#e2e8f0" />
        <Lightformer
          intensity={4}
          position={[-6, 1, -1]}
          rotation-y={Math.PI / 2}
          scale={[24, 2, 1]}
          color="#f0abfc"
        />
        <Lightformer
          intensity={4}
          position={[6, -1, -1]}
          rotation-y={-Math.PI / 2}
          scale={[24, 2, 1]}
          color="#67e8f9"
        />
        <Lightformer intensity={3} position={[0, -6, 3]} scale={[20, 4, 1]} color="#c4b5fd" />
      </Environment>

      {/*
        Only the specular hits bloom. A low threshold would wash the whole
        knot into a glowing blob and lose the iridescence, which is the part
        worth looking at; at 0.85 it catches the edge where the chrome turns
        to face a lightformer, the way a real highlight blows out on camera.
      */}
      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.32}
          mipmapBlur
        />
      </EffectComposer>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={spin}
        autoRotateSpeed={0.9}
        enableDamping
        dampingFactor={0.08}
      />
    </SceneCanvas>
  );
}
