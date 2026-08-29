"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  RepeatWrapping,
  SRGBColorSpace,
  type Group,
  type Mesh,
} from "three";

import { SceneCanvas } from "./scene-canvas";

// ─────────────────────────────────────────────────────────────
//  The planet on the horizon of the Deep Space lab.
//
//  It used to be one div with a radial gradient, which is why it read as a
//  lit disc rather than a sphere: a gradient has no terminator, so the light
//  sat dead centre and the eye got no cue about which way the star was.
//
//  Everything here is generated in the browser at load: the continents, the
//  bump, the city lights and the clouds are fractal noise painted onto
//  canvases and uploaded as textures. No image ships with the page, which is
//  the same trade the Contour lab makes for its labels.
// ─────────────────────────────────────────────────────────────

/**
 * Texture size. The coastline ramp below is measured in elevation, so the
 * finer the grid the less ground a texel covers and the less the blend has
 * to smear to hide the step. Octave counts are trimmed to pay for it.
 */
const TEX_W = 1024;
const TEX_H = 512;

/** Above this the surface is land rather than water. */
const SEA_LEVEL = 0.5;

/** Latitude, as a fraction from the equator, where ice starts to take hold. */
const ICE_LATITUDE = 0.74;

// ── noise ────────────────────────────────────────────────────────────────
//  Sampled in 3D against the point on the sphere rather than in UV space:
//  a 2D field would seam where the map wraps and smear at the poles.

/**
 * Deterministic hash so the same world is generated on every visit.
 *
 * Every step goes through Math.imul. Written as plain `*`, the products run
 * past 2^53 and lose their low bits, which leaves neighbouring lattice points
 * correlated: the noise then builds out of visible rectangles, and the
 * coastlines come out looking chipped rather than drawn.
 */
function hash(x: number, y: number, z: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/**
 * Quintic fade. Cubic smoothstep leaves a discontinuity in the second
 * derivative at every lattice line, which shows up as faint creases running
 * along the axes once the field is lit.
 */
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Continuous 0..1 ramp across [edge0, edge1]. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * The twelve edges of a cube, the standard Perlin gradient set: evenly spread
 * directions, and every dot product reduces to two adds.
 */
const GRADIENTS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

function dotGradient(
  ix: number, iy: number, iz: number,
  dx: number, dy: number, dz: number,
): number {
  const g = GRADIENTS[Math.floor(hash(ix, iy, iz) * 12) % 12];
  return g[0] * dx + g[1] * dy + g[2] * dz;
}

/**
 * Gradient noise, not value noise.
 *
 * Value noise interpolates a random number per lattice point, so its level
 * sets follow the cubes they were sampled from: threshold it into land and
 * sea and the coastlines come out as staircases running along the axes.
 * Gradient noise interpolates random *directions* instead, which puts the
 * zero crossings at angles the lattice never suggested.
 */
function noise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const dx = x - xi;
  const dy = y - yi;
  const dz = z - zi;
  const u = fade(dx);
  const v = fade(dy);
  const w = fade(dz);

  const n000 = dotGradient(xi, yi, zi, dx, dy, dz);
  const n100 = dotGradient(xi + 1, yi, zi, dx - 1, dy, dz);
  const n010 = dotGradient(xi, yi + 1, zi, dx, dy - 1, dz);
  const n110 = dotGradient(xi + 1, yi + 1, zi, dx - 1, dy - 1, dz);
  const n001 = dotGradient(xi, yi, zi + 1, dx, dy, dz - 1);
  const n101 = dotGradient(xi + 1, yi, zi + 1, dx - 1, dy, dz - 1);
  const n011 = dotGradient(xi, yi + 1, zi + 1, dx, dy - 1, dz - 1);
  const n111 = dotGradient(xi + 1, yi + 1, zi + 1, dx - 1, dy - 1, dz - 1);

  const value = lerp(
    lerp(lerp(n000, n100, u), lerp(n010, n110, u), v),
    lerp(lerp(n001, n101, u), lerp(n011, n111, u), v),
    w,
  );
  // roughly [-1, 1] to [0, 1]
  return value * 0.5 + 0.5;
}

function fbm(x: number, y: number, z: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;

  for (let i = 0; i < octaves; i += 1) {
    value += noise(x * frequency, y * frequency, z * frequency) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2.07; // off an exact double so octaves do not line up
  }
  return value / total;
}

// ── texture building ─────────────────────────────────────────────────────

interface Grid {
  /** unit-sphere coordinates per texel, flattened */
  xs: Float32Array;
  ys: Float32Array;
  zs: Float32Array;
}

/**
 * Sphere coordinates for every texel of an equirectangular map.
 *
 * The trig runs once per row and once per column rather than once per texel:
 * at this size that is 1,152 sin/cos calls instead of nearly 600,000.
 */
function sphereGrid(width: number, height: number): Grid {
  const xs = new Float32Array(width * height);
  const ys = new Float32Array(width * height);
  const zs = new Float32Array(width * height);

  const sinLon = new Float32Array(width);
  const cosLon = new Float32Array(width);
  for (let x = 0; x < width; x += 1) {
    const lon = (x / width) * Math.PI * 2;
    sinLon[x] = Math.sin(lon);
    cosLon[x] = Math.cos(lon);
  }

  for (let y = 0; y < height; y += 1) {
    const lat = (y / height - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const row = y * width;

    for (let x = 0; x < width; x += 1) {
      const i = row + x;
      xs[i] = cosLat * cosLon[x];
      ys[i] = sinLat;
      zs[i] = cosLat * sinLon[x];
    }
  }

  return { xs, ys, zs };
}

function textureFrom(data: ImageData, srgb: boolean): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  canvas.getContext("2d")!.putImageData(data, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  if (srgb) texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Palette, sampled between by elevation. Cyan family, to sit in this lab. */
const DEEP = new Color("#04222e");
const SHALLOW = new Color("#0e6f86");
const SHORE = new Color("#16846f");
const LOWLAND = new Color("#14493f");
const HIGHLAND = new Color("#3d6152");
const ICE = new Color("#dbf3fb");

function buildSurface(grid: Grid) {
  const surface = new ImageData(TEX_W, TEX_H);
  const lights = new ImageData(TEX_W, TEX_H);

  const colour = new Color();
  const ground = new Color();

  for (let i = 0; i < TEX_W * TEX_H; i += 1) {
    const x = grid.xs[i];
    const y = grid.ys[i];
    const z = grid.zs[i];

    // Two scales: the continents, and a finer field that breaks up their
    // coastlines so they do not read as blobs.
    const base = fbm(x * 2.6, y * 2.6, z * 2.6, 5);
    const detail = fbm(x * 13.1 + 11, y * 13.1 + 11, z * 13.1 + 11, 3);
    const elevation = base * 0.8 + detail * 0.2;

    const latitude = Math.abs(y);
    // ragged, so the ice line is not a drawn circle
    const iceEdge = ICE_LATITUDE + (detail - 0.5) * 0.12;

    // Every boundary here is a ramp rather than a branch. A hard `if` on sea
    // level makes neighbouring texels jump straight from water to land, and
    // at this texture size that staircase is plainly visible on the sphere:
    // the coastline reads as pixel steps however good the noise underneath
    // it is. Blending across a narrow band costs nothing and the texel grid
    // stops being findable.
    const land = smoothstep(SEA_LEVEL - 0.035, SEA_LEVEL + 0.035, elevation);

    // water: deeper the further below sea level
    colour.copy(DEEP).lerp(SHALLOW, smoothstep(SEA_LEVEL - 0.16, SEA_LEVEL, elevation));

    if (land > 0) {
      const height = (elevation - SEA_LEVEL) / (1 - SEA_LEVEL);
      ground.copy(SHORE).lerp(LOWLAND, smoothstep(0.02, 0.34, height));
      ground.lerp(HIGHLAND, smoothstep(0.3, 0.72, height));
      colour.lerp(ground, land);
    }

    const ice = smoothstep(iceEdge - 0.05, iceEdge + 0.03, latitude);
    if (ice > 0) colour.lerp(ICE, ice);

    const p = i * 4;
    surface.data[p] = colour.r * 255;
    surface.data[p + 1] = colour.g * 255;
    surface.data[p + 2] = colour.b * 255;
    surface.data[p + 3] = 255;

    // Settlements: low ground, off the ice, and sparse. The threshold is
    // high on purpose, so the night side reads as scattered points of life
    // rather than an evenly lit grid.
    const habitable = land * (1 - ice) * (1 - smoothstep(0.1, 0.2, elevation - SEA_LEVEL));
    const density = noise(x * 34 + 5, y * 34 + 5, z * 34 + 5);
    const lit = habitable * smoothstep(0.78, 0.9, density);
    lights.data[p] = 255 * lit;
    lights.data[p + 1] = 205 * lit;
    lights.data[p + 2] = 140 * lit;
    lights.data[p + 3] = 255;
  }

  return {
    surface: textureFrom(surface, true),
    lights: textureFrom(lights, true),
  };
}

function buildClouds(grid: Grid) {
  const clouds = new ImageData(TEX_W, TEX_H);

  for (let i = 0; i < TEX_W * TEX_H; i += 1) {
    const x = grid.xs[i];
    const y = grid.ys[i];
    const z = grid.zs[i];

    // Stretched along longitude, the way weather bands actually sit. The
    // threshold is high: thin cover lets the ground stay the subject, and a
    // planet under total overcast is just a white ball again.
    const density = fbm(x * 5.6 + 41, y * 11.5 + 41, z * 5.6 + 41, 4);
    const cover = smoothstep(0.52, 0.68, density);

    const p = i * 4;
    clouds.data[p] = clouds.data[p + 1] = clouds.data[p + 2] = 255;
    clouds.data[p + 3] = cover * 190;
  }

  return textureFrom(clouds, true);
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
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
    // pow tightens the band to the edge instead of hazing the whole disc
    float glow = pow(rim, 3.2) * uIntensity;
    gl_FragColor = vec4(uColor * glow, glow);
  }
`;

// ── scene ────────────────────────────────────────────────────────────────

/** One rotation of the planet, in seconds. Slow enough to notice only if you wait. */
const DAY_LENGTH = 90;

function Planet({ spin }: { spin: boolean }) {
  const body = useRef<Group>(null);
  const clouds = useRef<Mesh>(null);

  const textures = useMemo(() => {
    const grid = sphereGrid(TEX_W, TEX_H);
    return { ...buildSurface(grid), clouds: buildClouds(grid) };
  }, []);

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
          {/* No bumpMap. It is tempting on a planet, but three derives the
              normal from screen-space derivatives of the height texture, and
              at roughly one texel per pixel those derivatives are noise: the
              land broke into flat facets while the ocean, which had no relief
              to sample, stayed smooth. The terminator carries the form. */}
          <meshStandardMaterial
            map={textures.surface}
            emissiveMap={textures.lights}
            emissive="#ffb066"
            emissiveIntensity={1.5}
            roughness={0.86}
            metalness={0}
          />
        </mesh>
      </group>

      <mesh ref={clouds}>
        <sphereGeometry args={[2.035, 64, 64]} />
        <meshStandardMaterial
          alphaMap={textures.clouds}
          color="#dff4ff"
          transparent
          opacity={0.34}
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
            uIntensity: { value: 1.25 },
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
      /*
        The surface map is 1024 across for the whole globe, so a hemisphere
        gets about 512 texels. Rendered at 2x on a retina screen the sphere is
        some 1,400 device pixels wide and each texel covers nearly three of
        them: the map runs out of detail and its own grid becomes the texture.
        Holding the ceiling near one texel per pixel keeps the surface reading
        as ground, and costs a phone less than half the pixels to draw.
      */
      maxDpr={1.35}
    >
      {/* The star sits well round to the side rather than over the camera's
          shoulder. Behind the viewer it lights the whole visible face evenly,
          which is the flat bullseye the gradient had; from here the shadow
          line falls across the disc and the sphere reads as one. */}
      <directionalLight position={[-6.6, 2.2, 1.1]} intensity={3.4} color="#eaf6ff" />
      {/* barely there, so the night side keeps its shape without going grey */}
      <ambientLight intensity={0.05} color="#2b6f88" />

      <Planet spin={spin} />
    </SceneCanvas>
  );
}
