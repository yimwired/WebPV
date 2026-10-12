/**
 * The two meshes the scene is made of: one keycap, drawn a couple of hundred
 * times, and the ball the caps are mounted on.
 *
 * The cap is lathed from a profile (the wall, the rounded top edge, then the
 * dish) swept around a rounded square, so every ring of vertices is the same
 * rounded square at a different size and height. It has no underside: the
 * base always sits on the ball.
 */

import { cross, normalize, scale, sub, type Vec3 } from "./math";

export interface Mesh {
  /** xyz position then xyz normal, per vertex */
  vertices: Float32Array;
  indices: Uint16Array;
}

/** Cap dimensions, in units of the cap's base width. */
export const CAP = {
  baseHalf: 0.5,
  /** half-width of the top face, where the dish begins */
  topHalf: 0.375,
  height: 0.66,
  /** radius of the rounded edge between the wall and the top */
  edgeRadius: 0.08,
  /** plan-view corner radius, as a fraction of the half-width at that height */
  cornerRatio: 0.22,
  /** how far the middle of the top sits below its rim */
  dishDepth: 0.035,
} as const;

const POINTS_PER_CORNER = 6;
const EDGE_STEPS = 5;
const DISH_STEPS = 6;

/** A rounded square of half-width 1, going around once. */
function outline(): [number, number][] {
  const inner = 1 - CAP.cornerRatio;
  const centres: [number, number][] = [
    [inner, inner],
    [-inner, inner],
    [-inner, -inner],
    [inner, -inner],
  ];
  const points: [number, number][] = [];
  centres.forEach(([cx, cz], corner) => {
    for (let i = 0; i < POINTS_PER_CORNER; i++) {
      const angle = (corner + i / (POINTS_PER_CORNER - 1)) * (Math.PI / 2);
      points.push([cx + CAP.cornerRatio * Math.cos(angle), cz + CAP.cornerRatio * Math.sin(angle)]);
    }
  });
  return points;
}

/**
 * Each ring as [half-width, height], from the base up the wall and over the
 * edge, then the rings of the top face, whose heights `dish` sets per vertex.
 */
function profile(): { rings: [number, number][]; firstDishRing: number } {
  const { baseHalf, topHalf, height, edgeRadius } = CAP;
  const rings: [number, number][] = [
    [baseHalf, 0],
    [topHalf + edgeRadius, height - edgeRadius],
  ];
  for (let i = 1; i <= EDGE_STEPS; i++) {
    const angle = (i / EDGE_STEPS) * (Math.PI / 2);
    rings.push([topHalf + edgeRadius * Math.cos(angle), height - edgeRadius + edgeRadius * Math.sin(angle)]);
  }
  const firstDishRing = rings.length;
  for (let i = 1; i <= DISH_STEPS; i++) rings.push([topHalf * (1 - i / DISH_STEPS), height]);
  return { rings, firstDishRing };
}

/**
 * The top face is a spherical dish cut into a flat top, as on a real DSA
 * cap: concave inside the circle the top face's edges touch, flat in its
 * corners. Height and normal both come from the true distance to the centre.
 * Deriving them from the rounded-square rings instead makes a shallow square
 * pyramid, and a glossy cap shows it as an X in its reflection.
 */
function dish(x: number, z: number): { y: number; normal: Vec3 } {
  const { topHalf, height, dishDepth } = CAP;
  const r2 = (x * x + z * z) / (topHalf * topHalf);
  if (r2 >= 1) return { y: height, normal: [0, 1, 0] };
  const slope = (2 * dishDepth) / (topHalf * topHalf);
  return { y: height - dishDepth * (1 - r2), normal: normalize([-slope * x, 1, -slope * z]) };
}

export function buildKeycap(): Mesh {
  const around = outline();
  const { rings, firstDishRing } = profile();
  const columns = around.length;
  const positions: Vec3[] = [];
  rings.forEach(([half, y], ring) => {
    for (const [ox, oz] of around) {
      const x = ox * half;
      const z = oz * half;
      positions.push([x, ring >= firstDishRing ? dish(x, z).y : y, z]);
    }
  });
  const at = (ring: number, column: number) => positions[ring * columns + ((column + columns) % columns)];

  // Normals from the grid itself: the cross product of the two directions the
  // surface runs in at each vertex. Exact enough at this density, and it keeps
  // the rounded edge and the dish smooth without describing either twice.
  const last = rings.length - 1;
  const gridNormal = (ring: number, column: number) =>
    cross(
      sub(at(ring, column + 1), at(ring, column - 1)),
      sub(at(Math.min(ring + 1, last), column), at(Math.max(ring - 1, 0), column)),
    );
  // The outline's winding decides which way those crosses face. The grid runs
  // one way all over, so one sign fits every vertex: whichever makes a point
  // on the wall face away from the cap's axis.
  const probe = gridNormal(1, 0);
  const wall = at(1, 0);
  const sign = probe[0] * wall[0] + probe[2] * wall[2] < 0 ? -1 : 1;

  const normals: Vec3[] = [];
  for (let ring = 0; ring <= last; ring++) {
    for (let column = 0; column < columns; column++) {
      const position = at(ring, column);
      if (ring >= firstDishRing) normals.push(dish(position[0], position[2]).normal);
      else normals.push(normalize(scale(gridNormal(ring, column), sign)));
    }
  }

  const indices: number[] = [];
  for (let ring = 0; ring < last; ring++) {
    for (let column = 0; column < columns; column++) {
      const a = ring * columns + column;
      const b = ring * columns + ((column + 1) % columns);
      const c = (ring + 1) * columns + column;
      const d = (ring + 1) * columns + ((column + 1) % columns);
      indices.push(a, b, d, a, d, c);
    }
  }
  orientOutward(positions, normals, indices);

  return { vertices: interleave(positions, normals), indices: new Uint16Array(indices) };
}

/** The ball under the caps: a plain latitude-longitude sphere of radius 1. */
export function buildSphere(segments = 48, rings = 32): Mesh {
  const positions: Vec3[] = [];
  for (let ring = 0; ring <= rings; ring++) {
    const latitude = (ring / rings) * Math.PI - Math.PI / 2;
    for (let segment = 0; segment <= segments; segment++) {
      const longitude = (segment / segments) * Math.PI * 2;
      positions.push([
        Math.cos(latitude) * Math.sin(longitude),
        Math.sin(latitude),
        Math.cos(latitude) * Math.cos(longitude),
      ]);
    }
  }
  const indices: number[] = [];
  const stride = segments + 1;
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const a = ring * stride + segment;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  orientOutward(positions, positions, indices);
  return { vertices: interleave(positions, positions), indices: new Uint16Array(indices) };
}

/**
 * Flips every triangle if the first one that is not degenerate winds against
 * its normal. WebGL culls clockwise triangles by default, so a mesh wound the
 * other way would draw only its inside.
 */
function orientOutward(positions: Vec3[], normals: Vec3[], indices: number[]) {
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [positions[indices[i]], positions[indices[i + 1]], positions[indices[i + 2]]];
    const face = cross(sub(b, a), sub(c, a));
    const n = normals[indices[i]];
    const agreement = face[0] * n[0] + face[1] * n[1] + face[2] * n[2];
    if (Math.abs(agreement) < 1e-9) continue;
    if (agreement < 0) {
      for (let j = 0; j < indices.length; j += 3) {
        const swap = indices[j + 1];
        indices[j + 1] = indices[j + 2];
        indices[j + 2] = swap;
      }
    }
    return;
  }
}

function interleave(positions: Vec3[], normals: Vec3[]): Float32Array {
  const out = new Float32Array(positions.length * 6);
  positions.forEach((position, i) => {
    out.set(position, i * 6);
    out.set(normals[i], i * 6 + 3);
  });
  return out;
}
