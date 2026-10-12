/**
 * GLSL for the ball, WebGL2 only.
 *
 * Lighting is a small studio: a soft key from the upper left, a weak fill from
 * the right, the floor's colour thrown back up from below, and a rim from
 * behind that separates the ball from the dark backdrop. Surfaces reflect a
 * matching environment (dark above, the floor's glow below, the key's softbox),
 * so a glossy cap shows the stage it is standing on.
 *
 * Everything is lit in linear light and mapped to the screen with the Khronos
 * PBR Neutral tone mapper, which keeps a saturated plastic its own hue where a
 * filmic curve would push red caps toward orange.
 *
 * The reflection in the floor is the same geometry flipped through the floor
 * plane, but shaded where it really is (with the eye flipped instead), so the
 * floor shows the underside of the ball, lit by the floor, as a mirror would.
 */

const VERSION = "#version 300 es\n";

/** Light directions, unit length, in world space: the camera looks down -z. */
const LIGHT_DIRECTIONS = /* glsl */ `
const vec3 KEY_DIR = vec3(-0.46176, 0.69263, 0.55411);
const vec3 FILL_DIR = vec3(0.87323, 0.15410, 0.46230);
const vec3 BOUNCE_DIR = vec3(0.0, -0.98894, 0.14834);
const vec3 RIM_DIR = vec3(0.29778, 0.44666, -0.84370);
`;

const ENCODE = /* glsl */ `
vec3 encodeSrgb(vec3 linear) {
  vec3 c = clamp(linear, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
`;

/** Tone mapping, encoding and the floor reflection's fade, for everything drawn in 3D. */
const OUTPUT = /* glsl */ `
${ENCODE}
uniform float uExposure;
uniform float uMirror;
uniform float uFloorY;
uniform float uReflection;
uniform float uReflectionFalloff;

// Khronos PBR Neutral
vec3 toneMap(vec3 color) {
  const float startCompression = 0.76;
  const float desaturation = 0.15;
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;
  const float d = 1.0 - startCompression;
  float newPeak = 1.0 - d * d / (peak + d - startCompression);
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
  return mix(color, vec3(newPeak), g);
}

// Premultiplied, so the reflection pass can be blurred and laid over the floor.
vec4 finish(vec3 color, float coverage, float worldY) {
  vec3 mapped = encodeSrgb(toneMap(color * uExposure));
  if (uMirror > 0.5) {
    float fade = uReflection * exp(-max(worldY - uFloorY, 0.0) * uReflectionFalloff);
    return vec4(mapped * fade, coverage * fade);
  }
  return vec4(mapped, coverage);
}
`;

const LIGHTING = /* glsl */ `
${LIGHT_DIRECTIONS}
const float PI = 3.14159265;

uniform vec3 uEye;
uniform vec3 uKeyLight;
uniform vec3 uFillLight;
uniform vec3 uBounceLight;
uniform vec3 uRimLight;
uniform vec3 uSky;
uniform vec3 uGround;
uniform vec3 uEnvTop;
uniform vec3 uEnvBottom;

float distributionGGX(float NoH, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float d = NoH * NoH * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

float visibilitySmith(float NoV, float NoL, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float gv = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
  float gl = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
  return 0.5 / max(gv + gl, 1e-5);
}

vec3 fresnel(float cosTheta, float roughness) {
  vec3 f0 = vec3(0.04);
  return f0 + (max(vec3(1.0 - roughness), f0) - f0) * pow(1.0 - cosTheta, 5.0);
}

vec3 specular(vec3 N, vec3 V, vec3 L, vec3 radiance, float roughness) {
  vec3 H = normalize(V + L);
  float NoL = max(dot(N, L), 0.0);
  float NoV = max(dot(N, V), 1e-4);
  float NoH = max(dot(N, H), 0.0);
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(V, H), 0.0), 5.0);
  return radiance * F * distributionGGX(NoH, roughness) * visibilitySmith(NoV, NoL, roughness) * NoL;
}

// Wrapped diffuse: a broad source lights past the terminator, the way a large
// softbox does, so the caps' shoulders roll off instead of cutting to black.
vec3 diffuse(vec3 N, vec3 L, vec3 radiance, vec3 albedo, float wrap) {
  float lit = clamp((dot(N, L) + wrap) / (1.0 + wrap), 0.0, 1.0);
  return radiance * albedo / PI * lit;
}

vec3 environment(vec3 R, float roughness) {
  vec3 stage = mix(uEnvBottom, uEnvTop, smoothstep(-0.55, 0.35, R.y));
  float spread = mix(90.0, 5.0, roughness);
  float softbox = pow(max(dot(R, KEY_DIR), 0.0), spread) * (spread + 2.0) / 30.0;
  return stage + uKeyLight * softbox * 0.3;
}

vec3 shade(vec3 albedo, vec3 N, vec3 V, float roughness, float occlusion) {
  vec3 direct =
      diffuse(N, KEY_DIR, uKeyLight, albedo, 0.3) + specular(N, V, KEY_DIR, uKeyLight, roughness)
    + diffuse(N, FILL_DIR, uFillLight, albedo, 0.5) + specular(N, V, FILL_DIR, uFillLight, roughness)
    + diffuse(N, BOUNCE_DIR, uBounceLight, albedo, 0.45) + specular(N, V, BOUNCE_DIR, uBounceLight, roughness)
    + diffuse(N, RIM_DIR, uRimLight, albedo, 0.1) + specular(N, V, RIM_DIR, uRimLight, roughness);
  float NoV = clamp(dot(N, V), 0.0, 1.0);
  vec3 F = fresnel(NoV, roughness);
  vec3 ambient = albedo * mix(uGround, uSky, N.y * 0.5 + 0.5) * (1.0 - F);
  vec3 reflection = environment(reflect(-V, N), roughness) * F;
  return (direct + ambient) * occlusion + reflection * mix(occlusion, 1.0, 0.5);
}
`;

export const CAP_VERTEX = VERSION + /* glsl */ `
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aDir;
layout(location = 3) in vec3 aEast;
// x: legend layer, or -1 for none; y: colour slot; z: the glass cap's object layer, or -1
layout(location = 4) in vec3 aLook;
// x: lift off the ball; y: glow
layout(location = 5) in vec2 aMotion;
// how a passing wave tips the cap: axis times angle, in the ball's frame
layout(location = 6) in vec3 aTilt;

uniform mat4 uViewProj;
uniform mat3 uBall;
uniform float uRadius;
uniform float uMirror;
uniform float uFloorY;
uniform vec3 uEye;

out vec3 vWorld;
out vec3 vNormal;
out vec3 vLocal;
out vec3 vLocalNormal;
out vec3 vViewLocal;
flat out vec3 vLook;
flat out vec2 vMotion;

// Rodrigues' rotation of v by the rotation vector r.
vec3 tipped(vec3 v, vec3 r) {
  float angle = length(r);
  if (angle < 1e-5) return v;
  vec3 k = r / angle;
  float c = cos(angle);
  return v * c + cross(k, v) * sin(angle) + k * dot(k, v) * (1.0 - c);
}

void main() {
  // The cap tips about the middle of its base, which stays on the ball.
  vec3 east = tipped(aEast, aTilt);
  vec3 up = tipped(aDir, aTilt);
  mat3 basis = mat3(east, up, cross(east, up));
  mat3 toWorld = uBall * basis;
  vec3 world = uBall * (basis * aPosition + aDir * (uRadius + aMotion.x));
  vWorld = world;
  vNormal = toWorld * aNormal;
  vLocal = aPosition;
  vLocalNormal = aNormal;
  // toWorld is a rotation, so its transpose takes the eye into the cap's frame
  vViewLocal = transpose(toWorld) * (uEye - world);
  vLook = aLook;
  vMotion = aMotion;
  vec3 drawn = world;
  if (uMirror > 0.5) drawn.y = 2.0 * uFloorY - world.y;
  gl_Position = uViewProj * vec4(drawn, 1.0);
}
`;

export const CAP_FRAGMENT = VERSION + /* glsl */ `
precision highp float;
precision highp sampler2DArray;

in vec3 vWorld;
in vec3 vNormal;
in vec3 vLocal;
in vec3 vLocalNormal;
in vec3 vViewLocal;
flat in vec3 vLook;
flat in vec2 vMotion;

uniform sampler2DArray uLegends;
uniform float uLegendOpacity;
uniform vec3 uBody[4];
uniform vec3 uInk[4];
uniform float uRoughness[4];
uniform float uTopHalf;
uniform float uCapHeight;

${LIGHTING}
${OUTPUT}

out vec4 outColor;

void main() {
  int slot = int(vLook.y + 0.5);
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uEye - vWorld);

  // Printed on the top face only: the mask fades out where the dish turns into
  // the edge. Sampled whether or not the cap has a legend, since a texture
  // fetch inside a branch that differs between neighbouring pixels has no
  // reliable mip level.
  vec2 uv = vLocal.xz / (2.0 * uTopHalf) + 0.5;
  float onTop = smoothstep(0.9, 0.97, vLocalNormal.y);
  float printed = step(0.0, vLook.x) * onTop * uLegendOpacity;
  float legend = texture(uLegends, vec3(uv, max(vLook.x, 0.0))).r * printed;
  vec3 albedo = mix(uBody[slot], uInk[slot], legend);

  // The neighbours crowd a wall toward its base and keep the light off it; a
  // cap lifted clear of them gets that light back.
  float wall = 1.0 - smoothstep(0.35, 0.85, vLocalNormal.y);
  float exposed = clamp(vLocal.y / uCapHeight + vMotion.x * 1.4, 0.0, 1.0);
  float occlusion = mix(1.0, mix(0.16, 1.0, smoothstep(0.0, 0.85, exposed)), wall);

  vec3 color = shade(albedo, N, V, uRoughness[slot], occlusion);
  color += uBody[slot] * vMotion.y;
  outColor = finish(color, 1.0, vWorld.y);
}
`;

export const GLASS_FRAGMENT = VERSION + /* glsl */ `
precision highp float;
precision highp sampler2DArray;

in vec3 vWorld;
in vec3 vNormal;
in vec3 vLocal;
in vec3 vLocalNormal;
in vec3 vViewLocal;
flat in vec3 vLook;
flat in vec2 vMotion;

uniform sampler2DArray uLegends;
uniform vec3 uGlassTint;
uniform vec3 uGlassGlow;
uniform float uTopHalf;
uniform float uCapHeight;

${LIGHTING}
${OUTPUT}

out vec4 outColor;

void main() {
  vec3 N = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 V = normalize(uEye - vWorld);
  float NoV = clamp(abs(dot(N, V)), 0.0, 1.0);
  float edge = 0.04 + 0.96 * pow(1.0 - NoV, 5.0);

  // Clear resin: nearly see-through face on, denser toward the silhouette, and
  // lit through rather than on, so the side away from the key still glows a little.
  float coverage = 0.16 + 0.64 * edge;
  float scatter = clamp((dot(N, KEY_DIR) + 0.5) / 1.5, 0.0, 1.0);
  vec3 color = uGlassTint * coverage * (uKeyLight * 0.1 * scatter + mix(uGround, uSky, N.y * 0.5 + 0.5) * 1.6);
  color += specular(N, V, KEY_DIR, uKeyLight, 0.08)
         + specular(N, V, FILL_DIR, uFillLight, 0.12)
         + specular(N, V, RIM_DIR, uRimLight, 0.1);
  color += environment(reflect(-V, N), 0.05) * edge;

  // The object cast inside sits on a plane partway down the cap. Following the
  // view ray to that plane, rather than printing on the surface, is what makes
  // it hang inside the glass and shift against the rim as the ball turns. Only
  // the near side shows it, or it would be seen twice.
  vec3 toEye = normalize(vViewLocal);
  float plane = uCapHeight * 0.4;
  vec2 inner = vLocal.xz - toEye.xz * ((vLocal.y - plane) / max(toEye.y, 0.05));
  vec2 uv = inner / (2.0 * uTopHalf) + 0.5;
  vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  float seen = (gl_FrontFacing ? 1.0 : 0.0) * step(0.05, toEye.y) * step(plane, vLocal.y);
  float object = texture(uLegends, vec3(uv, vLook.z)).r * inside.x * inside.y * seen;
  color += uGlassGlow * object * 2.4;
  coverage = max(coverage, object * 0.92);
  // the object's light, caught in the resin around it
  color += mix(uGlassGlow, uGlassTint, 0.5) * (1.0 - smoothstep(0.0, 0.42, length(inner))) * 0.3 * seen;
  color += uGlassGlow * vMotion.y * 0.8;
  outColor = finish(color, coverage, vWorld.y);
}
`;

export const CORE_VERTEX = VERSION + /* glsl */ `
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

uniform mat4 uViewProj;
uniform float uCoreRadius;
uniform float uMirror;
uniform float uFloorY;

out vec3 vWorld;
out vec3 vNormal;

void main() {
  vec3 world = aPosition * uCoreRadius;
  vWorld = world;
  vNormal = aNormal;
  vec3 drawn = world;
  if (uMirror > 0.5) drawn.y = 2.0 * uFloorY - world.y;
  gl_Position = uViewProj * vec4(drawn, 1.0);
}
`;

export const CORE_FRAGMENT = VERSION + /* glsl */ `
precision highp float;

in vec3 vWorld;
in vec3 vNormal;

uniform vec3 uCore;

${LIGHTING}
${OUTPUT}

out vec4 outColor;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uEye - vWorld);
  outColor = finish(shade(uCore, N, V, 0.42, 0.55), 1.0, vWorld.y);
}
`;

/** One triangle that covers the screen, with no vertex buffer at all. */
export const FULLSCREEN_VERTEX = VERSION + /* glsl */ `
out vec2 vUv;

void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = corner;
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const STAGE_FRAGMENT = VERSION + /* glsl */ `
precision highp float;

in vec2 vUv;

uniform vec3 uTop;
uniform vec3 uFloor;
uniform vec3 uPool;
uniform float uPoolStrength;
// the pool of light under the ball: centre, then radii, all in screen uv
uniform vec4 uPoolShape;
uniform sampler2D uReflectionMap;

${ENCODE}

out vec4 outColor;

// Interleaved gradient noise: a dark gradient eight bits deep bands without it.
float dither(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec3 color = mix(uFloor, uTop, smoothstep(0.0, 0.55, vUv.y));
  vec2 d = (vUv - uPoolShape.xy) / uPoolShape.zw;
  color = mix(color, uPool, exp(-dot(d, d)) * uPoolStrength);
  vec3 encoded = encodeSrgb(color);
  vec4 mirror = texture(uReflectionMap, vUv);
  encoded = encoded * (1.0 - mirror.a) + mirror.rgb;
  encoded += (dither(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(encoded, 1.0);
}
`;

/** A 9-tap Gaussian in five fetches, leaning on bilinear filtering for the pairs. */
export const BLUR_FRAGMENT = VERSION + /* glsl */ `
precision highp float;

in vec2 vUv;

uniform sampler2D uSource;
uniform vec2 uStep;

out vec4 outColor;

void main() {
  vec4 sum = texture(uSource, vUv) * 0.2270270270;
  sum += (texture(uSource, vUv + uStep * 1.3846153846) + texture(uSource, vUv - uStep * 1.3846153846)) * 0.3162162162;
  sum += (texture(uSource, vUv + uStep * 3.2307692308) + texture(uSource, vUv - uStep * 3.2307692308)) * 0.0702702703;
  outColor = sum;
}
`;
