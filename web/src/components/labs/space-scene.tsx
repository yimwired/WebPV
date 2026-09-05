"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  SRGBColorSpace,
  Vector3,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type Texture,
} from "three";

import { SceneCanvas } from "./scene-canvas";

// ─────────────────────────────────────────────────────────────
//  The planet on the horizon of the Deep Space lab.
//
//  It began as one div with a radial gradient, which is why it read as a lit
//  disc: a gradient has no terminator, so the light sat dead centre and the
//  eye got no cue about which way the star was.
//
//  The ground, the weather and the city lights are NASA imagery, which is
//  public domain. Everything that makes it behave like a body rather than a
//  photograph wrapped on a ball is here: the atmosphere knows where the star
//  is, the night side only lights up once the sun has left it, the water is
//  the only part that glints, and the cloud deck turns at its own rate.
//
//  Sources, all NASA Visible Earth:
//    day     Blue Marble, land surface, shallow water and shaded topography
//    clouds  cloud cover composite
//    night   Earth at night, city lights
// ─────────────────────────────────────────────────────────────

const TEXTURES = {
  day: "/planet/earth-day.webp",
  clouds: "/planet/earth-clouds.webp",
  night: "/planet/earth-night.webp",
};

/** One rotation of the planet, in seconds. Slow enough to notice only if you wait. */
const DAY_LENGTH = 90;

/**
 * Where the star sits, and the one place it is written down: the light, the
 * atmosphere shader and the night-side mask all have to agree or the globe
 * lights one way and glows another.
 *
 * The camera never moves and carries no rotation, so this direction is the
 * same in view space as in world space and the shaders can take it as a
 * constant. Move the camera and it would have to be recomputed per frame.
 */
const SUN = new Vector3(-6.6, 2.2, 1.1).normalize();

// ── water mask ───────────────────────────────────────────────────────────

/** Roughness written into the mask: 0 is a mirror, 255 is chalk. */
const WATER_ROUGHNESS = 22;
const LAND_ROUGHNESS = 236;

/**
 * A roughness map, read off the daylight image.
 *
 * NASA publishes a water mask too, but the ocean is already the one thing in
 * the colour map that is unmistakable, so deriving it saves a request. The
 * map only feeds a highlight, so half size is plenty.
 *
 * It earns its place because shading a whole globe at one roughness is the
 * loudest tell that a sphere is painted: real water throws the star back at
 * you and ground does not.
 */
function waterMask(day: Texture): CanvasTexture {
  const width = 512;
  const height = 256;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(day.image as CanvasImageSource, 0, 0, width, height);

  const frame = ctx.getImageData(0, 0, width, height);
  const { data } = frame;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Ocean here is blue-dominant and dark. Brightness alone would call the
    // ice caps water, and hue alone would call the shallows land.
    const blueLead = b - Math.max(r, g);
    const wet = blueLead > 12 && b < 150;

    data[i] = data[i + 1] = data[i + 2] = wet ? WATER_ROUGHNESS : LAND_ROUGHNESS;
    data[i + 3] = 255;
  }

  ctx.putImageData(frame, 0, 0);
  return new CanvasTexture(canvas);
}

// ── atmosphere ───────────────────────────────────────────────────────────

/**
 * The halo. A slightly larger sphere drawn from the inside, fading in where
 * the surface turns away from the camera, which is the cheap standard way to
 * fake air scattering and the thing that most sells "sphere" over "disc".
 */
const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uWarm;
  uniform vec3 uSun;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec3 normal = normalize(vNormal);
    float rim = 1.0 - abs(dot(normal, normalize(vView)));
    // pow tightens the band to the edge instead of hazing the whole disc
    float edge = pow(rim, 3.2);

    // Air only glows where the star reaches it. An even ring all the way
    // round is the giveaway that the halo is a drawn outline rather than
    // atmosphere, so the night limb has to fall away to nothing.
    float sun = dot(normal, normalize(uSun));
    float daylight = smoothstep(-0.45, 0.35, sun);

    // Along the terminator the light is crossing the most air, so it arrives
    // warm. That thin copper band is what sunrise looks like from orbit, and
    // the eye reads it as depth.
    float grazing = 1.0 - smoothstep(0.0, 0.55, abs(sun));
    vec3 tint = mix(uColor, uWarm, grazing * 0.75);

    float glow = edge * daylight * uIntensity;
    gl_FragColor = vec4(tint * glow, glow);
  }
`;

/**
 * Confines the city lights to the night side.
 *
 * An emissive map is unconditional: left alone, every city burns through the
 * daylight image as well, which reads as a decal rather than a planet. The
 * standard material has no property for this, so the emissive term is scaled
 * by how far the fragment has turned away from the star. `normal` is in view
 * space and is already computed by the time the emissive chunk runs.
 */
function confineLightsToNightSide(material: MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSun = { value: SUN };

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uSun;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance *= smoothstep(-0.02, -0.34, dot(normalize(normal), normalize(uSun)));`,
      );
  };
  material.needsUpdate = true;
}

// ── scene ────────────────────────────────────────────────────────────────

function Planet({ spin }: { spin: boolean }) {
  const body = useRef<Group>(null);
  const clouds = useRef<Mesh>(null);

  // The colour space is set in the loader callback rather than after the fact:
  // useTexture hands back objects from a shared cache, so mutating them during
  // render is mutating something another component may already be using.
  const [day, cloud, night] = useTexture(
    [TEXTURES.day, TEXTURES.clouds, TEXTURES.night],
    (loaded) => {
      // useTexture does not know which maps carry colour and which carry data
      const maps = Array.isArray(loaded) ? loaded : [loaded];
      maps[0].colorSpace = SRGBColorSpace;
      maps[2].colorSpace = SRGBColorSpace;
    },
  );

  const gloss = useMemo(() => waterMask(day), [day]);

  useFrame((_, delta) => {
    if (!spin) return;
    const turn = (delta / DAY_LENGTH) * Math.PI * 2;
    if (body.current) body.current.rotation.y += turn;
    // weather runs ahead of the ground, so the two layers separate over time
    if (clouds.current) clouds.current.rotation.y += turn * 1.35;
  });

  return (
    // tilted, so the pole is visible and the planet is not a face-on circle
    <group rotation={[0.34, 0, 0.19]}>
      <group ref={body}>
        <mesh>
          <sphereGeometry args={[2, 96, 96]} />
          <meshStandardMaterial
            map={day}
            roughnessMap={gloss}
            emissiveMap={night}
            emissive="#ffc98a"
            emissiveIntensity={1.6}
            roughness={1}
            metalness={0}
            onUpdate={confineLightsToNightSide}
          />
        </mesh>
      </group>

      <mesh ref={clouds}>
        <sphereGeometry args={[2.035, 64, 64]} />
        <meshStandardMaterial
          alphaMap={cloud}
          color="#eef6ff"
          transparent
          opacity={0.62}
          depthWrite={false}
          roughness={1}
        />
      </mesh>

      <mesh scale={1.14}>
        <sphereGeometry args={[2, 48, 48]} />
        <shaderMaterial
          vertexShader={ATMOSPHERE_VERTEX}
          fragmentShader={ATMOSPHERE_FRAGMENT}
          uniforms={{
            uColor: { value: new Color("#5fd8f2") },
            uWarm: { value: new Color("#ffb37a") },
            uSun: { value: SUN.clone() },
            uIntensity: { value: 1.55 },
          }}
          side={BackSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * The planet, framed so it sits low: the camera looks at a body that is
 * mostly below the fold, the way it was composed as a horizon.
 *
 * `spin` is false when the visitor asked for reduced motion. The planet is
 * still lit and still a sphere; it simply holds its position.
 */
export default function SpaceScene({ spin = true }: { spin?: boolean }) {
  return (
    <SceneCanvas
      camera={{ position: [0, 0, 6.4], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      className="touch-none"
    >
      {/* The star sits well round to the side rather than over the camera's
          shoulder. Behind the viewer it lights the whole visible face evenly,
          which is the flat bullseye the gradient had; from here the shadow
          line falls across the disc and the sphere reads as one. */}
      <directionalLight position={SUN.toArray()} intensity={3.2} color="#fff4e6" />
      {/* barely there, so the night side keeps its shape without going grey */}
      <ambientLight intensity={0.05} color="#2b6f88" />

      <Suspense fallback={null}>
        <Planet spin={spin} />
      </Suspense>
    </SceneCanvas>
  );
}
