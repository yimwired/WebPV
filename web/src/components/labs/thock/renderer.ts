/**
 * Draws the ball with WebGL2 and nothing else: no scene graph, no library.
 *
 * A frame is three passes. The ball is drawn flipped through the floor into a
 * half-resolution target and blurred, which is the glossy floor's reflection;
 * the stage (backdrop, floor, the pool of light under the ball) is drawn over
 * the whole screen with that reflection laid into it; then the ball itself:
 * the dark core, every plastic cap in one instanced draw, and the glass caps
 * last, sorted far to near, back faces before front faces.
 */

import { project, type Camera } from "./camera";
import type { ResolvedPalette } from "./colorways";
import { buildKeycap, buildSphere, CAP, type Mesh } from "./geometry";
import { BALL_RADIUS, type BallLayout } from "./layout";
import { ARTISAN_LAYER, LEGEND_LAYERS, LEGEND_TILE } from "./legends";
import {
  BLUR_FRAGMENT,
  CAP_FRAGMENT,
  CAP_VERTEX,
  CORE_FRAGMENT,
  CORE_VERTEX,
  FULLSCREEN_VERTEX,
  GLASS_FRAGMENT,
  STAGE_FRAGMENT,
} from "./shaders";

/** The floor, a little way under the lowest a cap can rise to. */
export const FLOOR_Y = -(BALL_RADIUS + CAP.height + 0.7);
/** The ball's furthest extent, for framing: the tops of the caps plus a crest. */
export const BALL_EXTENT = BALL_RADIUS + CAP.height + 0.35;

const CORE_RADIUS = BALL_RADIUS + 0.04;
/** How quickly the reflection fades with height above the floor, per unit. */
const REFLECTION_FALLOFF = 0.16;
/** The reflection's share of the screen's resolution: it is blurred anyway. */
const REFLECTION_SCALE = 0.5;
/** Texels between blur taps, in the two rounds of blurring. */
const BLUR_SPREAD = [1.2, 2.6];
const EXPOSURE = 1;

/**
 * Floats per instance. A plastic cap's dir, east and look never change; its
 * motion (lift, glow, then the tilt's xyz) goes in a buffer of its own that is
 * rewritten every frame. Glass caps are re-sorted every frame, so all of theirs
 * travels together.
 */
const PLASTIC_STRIDE = 9;
const MOTION_STRIDE = 5;
const GLASS_STRIDE = 14;

interface Program {
  program: WebGLProgram;
  uniform: (name: string) => WebGLUniformLocation | null;
}

interface Target {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  depth: WebGLRenderbuffer | null;
  width: number;
  height: number;
}

interface MeshBuffers {
  vertices: WebGLBuffer;
  indices: WebGLBuffer;
  count: number;
}

export interface DrawInput {
  camera: Camera;
  /** the ball's orientation as a column-major 3×3 */
  orientation: Float32Array;
  /** per cap, in layout order */
  lift: Float32Array;
  glow: Float32Array;
  /** per cap, xyz: a rotation vector in the ball's frame */
  tilt: Float32Array;
  palette: ResolvedPalette;
  /** 0 until the legends are painted, then up to 1 */
  legendOpacity: number;
  /** whether the floor mirrors the ball: the first thing given up when frames run late */
  reflections: boolean;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader did not compile: ${log}`);
  }
  return shader;
}

function link(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): Program {
  const program = gl.createProgram();
  if (!program) throw new Error("createProgram failed");
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(`Program did not link: ${gl.getProgramInfoLog(program)}`);
  }
  const locations = new Map<string, WebGLUniformLocation | null>();
  return {
    program,
    uniform: (name) => {
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
      return locations.get(name) ?? null;
    },
  };
}

export class Renderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly capProgram: Program;
  private readonly glassProgram: Program;
  private readonly coreProgram: Program;
  private readonly stageProgram: Program;
  private readonly blurProgram: Program;

  private readonly keycap: MeshBuffers;
  private readonly sphere: MeshBuffers;
  private readonly plasticVao: WebGLVertexArrayObject;
  private readonly glassVao: WebGLVertexArrayObject;
  private readonly coreVao: WebGLVertexArrayObject;
  private readonly emptyVao: WebGLVertexArrayObject;

  /** cap indices of the plastic caps and of the glass ones, in instance order */
  private readonly plasticCaps: Int32Array;
  private readonly glassCaps: Int32Array;
  private readonly layout: BallLayout;
  private readonly motion: Float32Array;
  private readonly motionBuffer: WebGLBuffer;
  private readonly glassData: Float32Array;
  private readonly glassBuffer: WebGLBuffer;
  private readonly glassDepth: Float32Array;

  private readonly legends: WebGLTexture;
  private readonly blank: WebGLTexture;
  private reflection: Target | null = null;
  private scratch: Target | null = null;
  private width = 1;
  private height = 1;

  // scratch for the per-frame uniforms, so a frame allocates nothing
  private readonly envTop = new Float32Array(3);
  private readonly envBottom = new Float32Array(3);

  constructor(gl: WebGL2RenderingContext, layout: BallLayout) {
    this.gl = gl;
    this.layout = layout;

    this.capProgram = link(gl, CAP_VERTEX, CAP_FRAGMENT);
    this.glassProgram = link(gl, CAP_VERTEX, GLASS_FRAGMENT);
    this.coreProgram = link(gl, CORE_VERTEX, CORE_FRAGMENT);
    this.stageProgram = link(gl, FULLSCREEN_VERTEX, STAGE_FRAGMENT);
    this.blurProgram = link(gl, FULLSCREEN_VERTEX, BLUR_FRAGMENT);

    this.keycap = this.uploadMesh(buildKeycap());
    this.sphere = this.uploadMesh(buildSphere());

    const plastic: number[] = [];
    const glass: number[] = [];
    for (let cap = 0; cap < layout.count; cap++) (layout.artisanOf[cap] >= 0 ? glass : plastic).push(cap);
    this.plasticCaps = Int32Array.from(plastic);
    this.glassCaps = Int32Array.from(glass);

    const instances = new Float32Array(plastic.length * PLASTIC_STRIDE);
    plastic.forEach((cap, i) => {
      instances.set(layout.dirs.subarray(cap * 3, cap * 3 + 3), i * PLASTIC_STRIDE);
      instances.set(layout.easts.subarray(cap * 3, cap * 3 + 3), i * PLASTIC_STRIDE + 3);
      instances.set([layout.keyOf[cap], layout.slotOf[cap], -1], i * PLASTIC_STRIDE + 6);
    });
    const instanceBuffer = this.createBuffer(instances, gl.STATIC_DRAW);

    this.motion = new Float32Array(plastic.length * MOTION_STRIDE);
    this.motionBuffer = this.createBuffer(this.motion, gl.DYNAMIC_DRAW);
    this.glassData = new Float32Array(glass.length * GLASS_STRIDE);
    this.glassBuffer = this.createBuffer(this.glassData, gl.DYNAMIC_DRAW);
    this.glassDepth = new Float32Array(layout.count);

    this.plasticVao = this.createVao(() => {
      this.bindMesh(this.keycap);
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      this.instanceAttribute(2, 3, PLASTIC_STRIDE, 0);
      this.instanceAttribute(3, 3, PLASTIC_STRIDE, 3);
      this.instanceAttribute(4, 3, PLASTIC_STRIDE, 6);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.motionBuffer);
      this.instanceAttribute(5, 2, MOTION_STRIDE, 0);
      this.instanceAttribute(6, 3, MOTION_STRIDE, 2);
    });
    this.glassVao = this.createVao(() => {
      this.bindMesh(this.keycap);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.glassBuffer);
      this.instanceAttribute(2, 3, GLASS_STRIDE, 0);
      this.instanceAttribute(3, 3, GLASS_STRIDE, 3);
      this.instanceAttribute(4, 3, GLASS_STRIDE, 6);
      this.instanceAttribute(5, 2, GLASS_STRIDE, 9);
      this.instanceAttribute(6, 3, GLASS_STRIDE, 11);
    });
    this.coreVao = this.createVao(() => this.bindMesh(this.sphere));
    this.emptyVao = this.createVao(() => {});

    this.legends = this.createLegendTexture();
    this.blank = this.createTexture(1, 1);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  /** Fills the legend layers, from `paintLegends`. */
  uploadLegends(atlas: Uint8Array) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.legends);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, LEGEND_TILE, LEGEND_TILE, LEGEND_LAYERS, gl.RED, gl.UNSIGNED_BYTE, atlas);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  }

  /** Sizes the reflection targets to a canvas of `width` × `height` device pixels. */
  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.deleteTarget(this.reflection);
    this.deleteTarget(this.scratch);
    const w = Math.max(1, Math.round(this.width * REFLECTION_SCALE));
    const h = Math.max(1, Math.round(this.height * REFLECTION_SCALE));
    this.reflection = this.createTarget(w, h, true);
    this.scratch = this.createTarget(w, h, false);
  }

  draw(input: DrawInput) {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    this.packInstances(input);

    const { palette } = input;
    for (let i = 0; i < 3; i++) {
      this.envTop[i] = palette.stageTop[i] * 1.2 + palette.sky[i] * 0.5;
      const pool = palette.stageMix[0];
      this.envBottom[i] = (palette.stageFloor[i] * (1 - pool) + palette.pool[i] * pool) * 1.15;
    }

    if (input.reflections && this.reflection && this.scratch) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.reflection.framebuffer);
      gl.viewport(0, 0, this.reflection.width, this.reflection.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // Flipping y turns every triangle's winding around.
      gl.frontFace(gl.CW);
      this.drawBall(input, true);
      gl.frontFace(gl.CCW);
      for (const spread of BLUR_SPREAD) {
        this.blur(this.reflection, this.scratch, spread, 0);
        this.blur(this.scratch, this.reflection, 0, spread);
      }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    this.drawStage(input);
    this.drawBall(input, false);
  }

  dispose() {
    const gl = this.gl;
    for (const program of [this.capProgram, this.glassProgram, this.coreProgram, this.stageProgram, this.blurProgram]) {
      gl.deleteProgram(program.program);
    }
    for (const mesh of [this.keycap, this.sphere]) {
      gl.deleteBuffer(mesh.vertices);
      gl.deleteBuffer(mesh.indices);
    }
    for (const vao of [this.plasticVao, this.glassVao, this.coreVao, this.emptyVao]) gl.deleteVertexArray(vao);
    gl.deleteBuffer(this.motionBuffer);
    gl.deleteBuffer(this.glassBuffer);
    gl.deleteTexture(this.legends);
    gl.deleteTexture(this.blank);
    this.deleteTarget(this.reflection);
    this.deleteTarget(this.scratch);
  }

  /** Lifts and glows into the plastic caps' buffer; glass caps sorted far to near into theirs. */
  private packInstances({ lift, glow, tilt, orientation, camera }: DrawInput) {
    const gl = this.gl;
    this.plasticCaps.forEach((cap, i) => {
      const at = i * MOTION_STRIDE;
      this.motion[at] = lift[cap];
      this.motion[at + 1] = glow[cap];
      this.motion.set(tilt.subarray(cap * 3, cap * 3 + 3), at + 2);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, this.motionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.motion);

    const { dirs, easts, artisanOf } = this.layout;
    const [ex, ey, ez] = camera.eye;
    for (const cap of this.glassCaps) {
      const x = dirs[cap * 3], y = dirs[cap * 3 + 1], z = dirs[cap * 3 + 2];
      const wx = (orientation[0] * x + orientation[3] * y + orientation[6] * z) * BALL_RADIUS;
      const wy = (orientation[1] * x + orientation[4] * y + orientation[7] * z) * BALL_RADIUS;
      const wz = (orientation[2] * x + orientation[5] * y + orientation[8] * z) * BALL_RADIUS;
      this.glassDepth[cap] = (wx - ex) ** 2 + (wy - ey) ** 2 + (wz - ez) ** 2;
    }
    const order = Array.from(this.glassCaps).sort((a, b) => this.glassDepth[b] - this.glassDepth[a]);
    order.forEach((cap, i) => {
      const at = i * GLASS_STRIDE;
      this.glassData.set(dirs.subarray(cap * 3, cap * 3 + 3), at);
      this.glassData.set(easts.subarray(cap * 3, cap * 3 + 3), at + 3);
      this.glassData[at + 6] = -1;
      this.glassData[at + 7] = 0;
      this.glassData[at + 8] = ARTISAN_LAYER + artisanOf[cap];
      this.glassData[at + 9] = lift[cap];
      this.glassData[at + 10] = glow[cap];
      this.glassData.set(tilt.subarray(cap * 3, cap * 3 + 3), at + 11);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glassBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.glassData);
  }

  private drawStage({ camera, palette, reflections }: DrawInput) {
    const gl = this.gl;
    const { uniform } = this.stageProgram;
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(this.stageProgram.program);

    // The pool sits on the floor under the ball, as wide as the ball and squashed by the low camera.
    const under = project(camera, [0, FLOOR_Y, 0]);
    const radius = camera.ballRadiusPx;
    gl.uniform4f(
      uniform("uPoolShape"),
      under.x / camera.width,
      1 - under.y / camera.height - (radius * 0.35) / camera.height,
      (radius * 1.6) / camera.width,
      (radius * 0.8) / camera.height,
    );
    gl.uniform3fv(uniform("uTop"), palette.stageTop);
    gl.uniform3fv(uniform("uFloor"), palette.stageFloor);
    gl.uniform3fv(uniform("uPool"), palette.pool);
    gl.uniform1f(uniform("uPoolStrength"), palette.stageMix[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, reflections && this.reflection ? this.reflection.texture : this.blank);
    gl.uniform1i(uniform("uReflectionMap"), 1);

    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthMask(true);
  }

  private drawBall(input: DrawInput, mirrored: boolean) {
    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    const core = this.coreProgram;
    gl.useProgram(core.program);
    this.setShared(core, input, mirrored);
    gl.uniform1f(core.uniform("uCoreRadius"), CORE_RADIUS);
    gl.uniform3fv(core.uniform("uCore"), input.palette.core);
    gl.bindVertexArray(this.coreVao);
    gl.drawElements(gl.TRIANGLES, this.sphere.count, gl.UNSIGNED_SHORT, 0);

    const caps = this.capProgram;
    gl.useProgram(caps.program);
    this.setShared(caps, input, mirrored);
    this.setCapShape(caps, input);
    gl.uniform3fv(caps.uniform("uBody"), input.palette.bodies);
    gl.uniform3fv(caps.uniform("uInk"), input.palette.legends);
    gl.uniform1fv(caps.uniform("uRoughness"), input.palette.roughness);
    gl.uniform1f(caps.uniform("uLegendOpacity"), input.legendOpacity);
    gl.bindVertexArray(this.plasticVao);
    gl.drawElementsInstanced(gl.TRIANGLES, this.keycap.count, gl.UNSIGNED_SHORT, 0, this.plasticCaps.length);

    if (this.glassCaps.length === 0) return;
    const glass = this.glassProgram;
    gl.useProgram(glass.program);
    this.setShared(glass, input, mirrored);
    this.setCapShape(glass, input);
    gl.uniform3fv(glass.uniform("uGlassTint"), input.palette.glassTint);
    gl.uniform3fv(glass.uniform("uGlassGlow"), input.palette.glassGlow);
    gl.bindVertexArray(this.glassVao);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    // The far wall of each cap, then the near one, so the inside reads through the front.
    gl.cullFace(gl.FRONT);
    gl.drawElementsInstanced(gl.TRIANGLES, this.keycap.count, gl.UNSIGNED_SHORT, 0, this.glassCaps.length);
    gl.cullFace(gl.BACK);
    gl.drawElementsInstanced(gl.TRIANGLES, this.keycap.count, gl.UNSIGNED_SHORT, 0, this.glassCaps.length);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  /** Uniforms every 3D program shares: the camera, the lights and the floor. */
  private setShared({ uniform }: Program, { camera, palette }: DrawInput, mirrored: boolean) {
    const gl = this.gl;
    gl.uniformMatrix4fv(uniform("uViewProj"), false, camera.viewProj);
    gl.uniform3fv(uniform("uEye"), mirrored ? camera.mirroredEye : camera.eye);
    gl.uniform3fv(uniform("uKeyLight"), palette.keyLight);
    gl.uniform3fv(uniform("uFillLight"), palette.fillLight);
    gl.uniform3fv(uniform("uBounceLight"), palette.bounceLight);
    gl.uniform3fv(uniform("uRimLight"), palette.rimLight);
    gl.uniform3fv(uniform("uSky"), palette.sky);
    gl.uniform3fv(uniform("uGround"), palette.ground);
    gl.uniform3fv(uniform("uEnvTop"), this.envTop);
    gl.uniform3fv(uniform("uEnvBottom"), this.envBottom);
    gl.uniform1f(uniform("uExposure"), EXPOSURE);
    gl.uniform1f(uniform("uMirror"), mirrored ? 1 : 0);
    gl.uniform1f(uniform("uFloorY"), FLOOR_Y);
    gl.uniform1f(uniform("uReflection"), palette.stageMix[1]);
    gl.uniform1f(uniform("uReflectionFalloff"), REFLECTION_FALLOFF);
  }

  private setCapShape({ uniform }: Program, input: DrawInput) {
    const gl = this.gl;
    gl.uniformMatrix3fv(uniform("uBall"), false, input.orientation);
    gl.uniform1f(uniform("uRadius"), BALL_RADIUS);
    gl.uniform1f(uniform("uTopHalf"), CAP.topHalf);
    gl.uniform1f(uniform("uCapHeight"), CAP.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.legends);
    gl.uniform1i(uniform("uLegends"), 0);
  }

  private blur(source: Target, destination: Target, dx: number, dy: number) {
    const gl = this.gl;
    const { uniform } = this.blurProgram;
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, destination.width, destination.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.useProgram(this.blurProgram.program);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform1i(uniform("uSource"), 1);
    gl.uniform2f(uniform("uStep"), dx / source.width, dy / source.height);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private uploadMesh(mesh: Mesh): MeshBuffers {
    const gl = this.gl;
    const vertices = this.createBuffer(mesh.vertices, gl.STATIC_DRAW);
    const indices = gl.createBuffer();
    if (!indices) throw new Error("createBuffer failed");
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return { vertices, indices, count: mesh.indices.length };
  }

  private bindMesh(mesh: MeshBuffers) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
  }

  /** A per-instance attribute: `size` floats at float `offset` in a `stride`-float record. */
  private instanceAttribute(location: number, size: number, stride: number, offset: number) {
    const gl = this.gl;
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride * 4, offset * 4);
    gl.vertexAttribDivisor(location, 1);
  }

  private createVao(setup: () => void): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    if (!vao) throw new Error("createVertexArray failed");
    gl.bindVertexArray(vao);
    setup();
    gl.bindVertexArray(null);
    return vao;
  }

  private createBuffer(data: Float32Array, usage: number): WebGLBuffer {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("createBuffer failed");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    return buffer;
  }

  private createLegendTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("createTexture failed");
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    const levels = Math.log2(LEGEND_TILE) + 1;
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.R8, LEGEND_TILE, LEGEND_TILE, LEGEND_LAYERS);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Most caps are seen at an angle; without anisotropy their legends blur long before they shrink.
    const anisotropy = gl.getExtension("EXT_texture_filter_anisotropic");
    if (anisotropy) {
      const max = gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
      gl.texParameterf(gl.TEXTURE_2D_ARRAY, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
    }
    return texture;
  }

  private createTexture(width: number, height: number): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("createTexture failed");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  private createTarget(width: number, height: number, withDepth: boolean): Target {
    const gl = this.gl;
    const texture = this.createTexture(width, height);
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) throw new Error("createFramebuffer failed");
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    let depth: WebGLRenderbuffer | null = null;
    if (withDepth) {
      depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { framebuffer, texture, depth, width, height };
  }

  private deleteTarget(target: Target | null) {
    if (!target) return;
    const gl = this.gl;
    gl.deleteFramebuffer(target.framebuffer);
    gl.deleteTexture(target.texture);
    if (target.depth) gl.deleteRenderbuffer(target.depth);
  }
}
