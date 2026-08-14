"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { Group } from "three";

export interface Finish {
  id: string;
  name: string;
  /** base colour of the metal */
  color: string;
  roughness: number;
}

/** The three golds, in the order they sit on the band. */
export const FINISHES: Finish[] = [
  { id: "rose", name: "Rose gold", color: "#d8a48c", roughness: 0.16 },
  { id: "white", name: "White gold", color: "#dcdcdf", roughness: 0.11 },
  { id: "yellow", name: "Yellow gold", color: "#d3a54e", roughness: 0.18 },
];

/**
 * A torus lies in the XY plane, so the bands stack along Z, which is the
 * ring's own axis. Each one leans a little off that axis, which is what
 * makes three separate bands read as one interlaced object.
 */
const BANDS = [
  { offset: -0.125, lean: [0.09, 0.05] },
  { offset: 0, lean: [-0.02, -0.07] },
  { offset: 0.125, lean: [-0.1, 0.06] },
] as const;

function Trine({ finishes, spin }: { finishes: Finish[]; spin: boolean }) {
  const band = useRef<Group>(null);

  // turns about its own axis, the way a ring spins on a finger
  useFrame((_, delta) => {
    if (spin && band.current) band.current.rotation.z += delta * 0.3;
  });

  return (
    // pose: tipped back and rolled, so the bands read as ellipses rather
    // than as circles seen flat on
    <group rotation={[0.62, 0.2, -0.42]}>
      <group ref={band}>
        {BANDS.map((b, i) => {
          const finish = finishes[i % finishes.length];
          return (
            <mesh
              key={i}
              position={[0, 0, b.offset]}
              rotation={[b.lean[0], b.lean[1], 0]}
            >
              <torusGeometry args={[1, 0.115, 48, 220]} />
              <meshPhysicalMaterial
                color={finish.color}
                metalness={1}
                roughness={finish.roughness}
                clearcoat={0.6}
                clearcoatRoughness={0.2}
                envMapIntensity={1.5}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/**
 * The ring that sits between the fingers in the Trine hero. Transparent
 * canvas, so the photograph behind it shows through, lit like a jewellery
 * still: one broad key, a dark card on each side to draw the metal's edge,
 * and a soft fill from below.
 */
export default function TrineScene({
  finishes = FINISHES,
  spin = true,
}: {
  finishes?: Finish[];
  spin?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8.4], fov: 30 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      className="touch-none"
    >
      <Trine finishes={finishes} spin={spin} />

      <ambientLight intensity={0.55} />
      <Environment resolution={256}>
        {/* key: the softbox above, the one the highlights come from */}
        <Lightformer intensity={6} position={[0, 5, 2]} scale={[14, 8, 1]} />
        {/* black cards either side: on a white set, metal needs something
            dark to reflect or it disappears into the backdrop */}
        <Lightformer
          intensity={2.4}
          color="#1c1917"
          position={[-5, 0, 1]}
          rotation-y={Math.PI / 2}
          scale={[12, 6, 1]}
        />
        <Lightformer
          intensity={2.4}
          color="#292524"
          position={[5, 0, 1]}
          rotation-y={-Math.PI / 2}
          scale={[12, 6, 1]}
        />
        {/* warm bounce from the table */}
        <Lightformer
          intensity={2}
          color="#f5e6d3"
          position={[0, -4, 2]}
          scale={[10, 4, 1]}
        />
      </Environment>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.09}
        rotateSpeed={0.7}
      />
    </Canvas>
  );
}
