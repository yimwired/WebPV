/**
 * Four colourways, named the way the Trellis palettes are, after Thai
 * materials. Each is a full set: the four plastics a cap can be cut from, the
 * glass of the artisan caps, the stage the ball floats over, and the light that
 * stage throws back onto it. The ball's layout never changes between them, so
 * switching colourway repaints the same caps rather than dealing new ones.
 *
 * Ink on the controls clears 4.5:1 on their ground in every colourway.
 */

export interface Plastic {
  body: string;
  legend: string;
  /** 0 is a mirror; PBT sits higher than glossy ABS */
  roughness: number;
}

export interface Colorway {
  id: string;
  /** what the swatch is called */
  name: string;
  /** main, dark, light and accent, in the slot order the layout deals them out */
  plastics: readonly [Plastic, Plastic, Plastic, Plastic];
  glass: { tint: string; glow: string };
  /** the ball the caps are mounted on, seen in the gaps between them */
  core: string;
  stage: {
    /** the backdrop at the top of the screen */
    top: string;
    /** the floor at the bottom of the screen */
    floor: string;
    /** the pool of light (or, on a pale stage, shadow) under the ball */
    pool: string;
    poolStrength: number;
    /** how strongly the floor mirrors the ball */
    reflection: number;
  };
  light: {
    key: string;
    /** thrown up from the floor */
    bounce: string;
    rim: string;
    /** ambient from above and from below */
    sky: string;
    ground: string;
  };
  /** the controls drawn over the canvas */
  chrome: { ground: string; ink: string; muted: string; line: string };
}

export const COLORWAYS: readonly Colorway[] = [
  {
    id: "lac",
    name: "ครั่ง",
    plastics: [
      { body: "#c8281b", legend: "#3a0904", roughness: 0.34 },
      { body: "#161011", legend: "#ecdccf", roughness: 0.3 },
      { body: "#f0e2d8", legend: "#7a1c12", roughness: 0.4 },
      { body: "#f4b21a", legend: "#4c2a00", roughness: 0.36 },
    ],
    glass: { tint: "#ffb2a6", glow: "#ff6a26" },
    core: "#0d0606",
    stage: { top: "#050202", floor: "#6e0b05", pool: "#d01b0c", poolStrength: 0.9, reflection: 0.55 },
    light: { key: "#fff2e8", bounce: "#ff2b14", rim: "#ff6450", sky: "#2b1714", ground: "#6a0d06" },
    chrome: { ground: "#120807", ink: "#f7ece6", muted: "#cfb0a9", line: "#4d2621" },
  },
  {
    id: "indigo",
    name: "คราม",
    plastics: [
      { body: "#2d418f", legend: "#e8ecf7", roughness: 0.34 },
      { body: "#0f1324", legend: "#aebae3", roughness: 0.3 },
      { body: "#eef0f5", legend: "#25356f", roughness: 0.4 },
      { body: "#ff7148", legend: "#3b1206", roughness: 0.36 },
    ],
    glass: { tint: "#a9c9ff", glow: "#5cb9ff" },
    core: "#05070e",
    stage: { top: "#020309", floor: "#0b1a4a", pool: "#2244b0", poolStrength: 0.85, reflection: 0.5 },
    light: { key: "#f2f5ff", bounce: "#2f56ff", rim: "#7092ff", sky: "#141a28", ground: "#0d1c50" },
    chrome: { ground: "#070a15", ink: "#eef1f9", muted: "#a9b3cc", line: "#28314d" },
  },
  {
    id: "celadon",
    name: "ศิลาดล",
    plastics: [
      { body: "#9fc1a6", legend: "#183024", roughness: 0.38 },
      { body: "#17281f", legend: "#d2e4cb", roughness: 0.3 },
      { body: "#ede6d3", legend: "#2b4535", roughness: 0.42 },
      { body: "#c99a3a", legend: "#2c1f04", roughness: 0.3 },
    ],
    glass: { tint: "#bdf2cf", glow: "#f2e27c" },
    core: "#050906",
    stage: { top: "#030504", floor: "#0f3523", pool: "#2f8455", poolStrength: 0.75, reflection: 0.5 },
    light: { key: "#fff8ea", bounce: "#43ad73", rim: "#97dcae", sky: "#141d17", ground: "#133621" },
    chrome: { ground: "#07100b", ink: "#eef4ec", muted: "#abbfaf", line: "#253b2d" },
  },
  {
    id: "mulberry",
    name: "กระดาษสา",
    plastics: [
      { body: "#f2eee6", legend: "#2a2623", roughness: 0.42 },
      { body: "#2b2927", legend: "#efe9df", roughness: 0.32 },
      { body: "#c9c2b6", legend: "#24211f", roughness: 0.4 },
      { body: "#ff5b1f", legend: "#fff5ec", roughness: 0.34 },
    ],
    glass: { tint: "#ffffff", glow: "#ff7a2e" },
    core: "#262321",
    stage: { top: "#f2eee7", floor: "#d9d2c6", pool: "#a59c8f", poolStrength: 0.6, reflection: 0.24 },
    // A softer rim than the dark sets: against a pale stage a white rim only burns the caps' edges out.
    light: { key: "#ffffff", bounce: "#efe7da", rim: "#cfc8bc", sky: "#f5f0e9", ground: "#d4cbbd" },
    chrome: { ground: "#f6f2eb", ink: "#1d1b19", muted: "#5b5650", line: "#cec6ba" },
  },
];

export function colorwayById(id: string | null | undefined): Colorway {
  return COLORWAYS.find((colorway) => colorway.id === id) ?? COLORWAYS[0];
}

/**
 * A colourway as the shaders take it: every colour in linear light, the
 * lights already multiplied up to their intensities. Flat arrays, so a change
 * of colourway can be blended one frame at a time without allocating.
 */
export interface ResolvedPalette {
  /** 4 × rgb */
  bodies: Float32Array;
  /** 4 × rgb */
  legends: Float32Array;
  /** 4 */
  roughness: Float32Array;
  glassTint: Float32Array;
  glassGlow: Float32Array;
  core: Float32Array;
  stageTop: Float32Array;
  stageFloor: Float32Array;
  pool: Float32Array;
  keyLight: Float32Array;
  fillLight: Float32Array;
  bounceLight: Float32Array;
  rimLight: Float32Array;
  sky: Float32Array;
  ground: Float32Array;
  /** poolStrength, reflection */
  stageMix: Float32Array;
}

/** Light intensities, in multiples of the colour each colourway names. */
const INTENSITY = { key: 3.6, fill: 0.6, bounce: 1.8, rim: 1.5, sky: 0.3, ground: 0.6 };

function srgbToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function linear(hex: string, scale = 1): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    srgbToLinear(((value >> 16) & 255) / 255) * scale,
    srgbToLinear(((value >> 8) & 255) / 255) * scale,
    srgbToLinear((value & 255) / 255) * scale,
  ];
}

export function resolvePalette(colorway: Colorway): ResolvedPalette {
  const { plastics, glass, stage, light } = colorway;
  return {
    bodies: new Float32Array(plastics.flatMap((plastic) => linear(plastic.body))),
    legends: new Float32Array(plastics.flatMap((plastic) => linear(plastic.legend))),
    roughness: new Float32Array(plastics.map((plastic) => plastic.roughness)),
    glassTint: new Float32Array(linear(glass.tint)),
    glassGlow: new Float32Array(linear(glass.glow)),
    core: new Float32Array(linear(colorway.core)),
    stageTop: new Float32Array(linear(stage.top)),
    stageFloor: new Float32Array(linear(stage.floor)),
    pool: new Float32Array(linear(stage.pool)),
    keyLight: new Float32Array(linear(light.key, INTENSITY.key)),
    fillLight: new Float32Array(linear(light.key, INTENSITY.fill)),
    bounceLight: new Float32Array(linear(light.bounce, INTENSITY.bounce)),
    rimLight: new Float32Array(linear(light.rim, INTENSITY.rim)),
    sky: new Float32Array(linear(light.sky, INTENSITY.sky)),
    ground: new Float32Array(linear(light.ground, INTENSITY.ground)),
    stageMix: new Float32Array([stage.poolStrength, stage.reflection]),
  };
}

export function clonePalette(palette: ResolvedPalette): ResolvedPalette {
  const copy = {} as Record<keyof ResolvedPalette, Float32Array>;
  for (const field of Object.keys(palette) as (keyof ResolvedPalette)[]) copy[field] = new Float32Array(palette[field]);
  return copy;
}

/** Writes the blend of `from` and `to` at `t` into `out`, field by field. */
export function mixPalettes(from: ResolvedPalette, to: ResolvedPalette, t: number, out: ResolvedPalette): void {
  for (const field of Object.keys(out) as (keyof ResolvedPalette)[]) {
    const a = from[field];
    const b = to[field];
    const target = out[field];
    for (let i = 0; i < target.length; i++) target[i] = a[i] + (b[i] - a[i]) * t;
  }
}
