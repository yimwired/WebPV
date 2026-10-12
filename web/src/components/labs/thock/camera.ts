/**
 * The camera: framed from the ball's size and the screen's shape, so the ball
 * fills most of a phone's width and a little over half a desktop's height,
 * with room under it for the floor to show its reflection.
 */

import { add, cross, multiply4, normalize, perspective, scale, sub, viewMatrix, type Vec3 } from "./math";

const FOV_Y = (28 * Math.PI) / 180;
/** How far above the ball's equator the camera looks down from. */
const ELEVATION = (8 * Math.PI) / 180;
/** Share of the screen's height, and of its width, the ball may fill. */
const HEIGHT_SHARE = 0.56;
const WIDTH_SHARE = 0.84;

export interface Camera {
  eye: Vec3;
  /** the eye flipped through the floor: the reflection is shaded from here */
  mirroredEye: Vec3;
  right: Vec3;
  up: Vec3;
  forward: Vec3;
  viewProj: Float32Array;
  /** the screen, in CSS pixels */
  width: number;
  height: number;
  tanHalfY: number;
  /** the ball's radius on screen, in CSS pixels */
  ballRadiusPx: number;
}

export function frameCamera(width: number, height: number, ballRadius: number, floorY: number): Camera {
  const aspect = width / height;
  const tanHalfY = Math.tan(FOV_Y / 2);
  const distance = Math.max(ballRadius / (tanHalfY * HEIGHT_SHARE), ballRadius / (tanHalfY * aspect * WIDTH_SHARE));

  // Aimed below the ball's centre, so the ball sits high and the floor shows under it.
  const target: Vec3 = [0, -ballRadius * 0.32, 0];
  const eye: Vec3 = [0, target[1] + Math.sin(ELEVATION) * distance, Math.cos(ELEVATION) * distance];
  const forward = normalize(sub(target, eye));
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);

  const view = viewMatrix(eye, right, up, scale(forward, -1));
  const projection = perspective(FOV_Y, aspect, distance * 0.3, distance * 3);

  return {
    eye,
    mirroredEye: [eye[0], 2 * floorY - eye[1], eye[2]],
    right,
    up,
    forward,
    viewProj: multiply4(projection, view),
    width,
    height,
    tanHalfY,
    ballRadiusPx: (ballRadius / distance / tanHalfY) * (height / 2),
  };
}

/** The ray from the eye through a point on the screen, in CSS pixels from the top left. */
export function rayThrough(camera: Camera, x: number, y: number): Vec3 {
  const ndcX = (x / camera.width) * 2 - 1;
  const ndcY = 1 - (y / camera.height) * 2;
  const aspect = camera.width / camera.height;
  return normalize(
    add(
      camera.forward,
      add(scale(camera.right, ndcX * camera.tanHalfY * aspect), scale(camera.up, ndcY * camera.tanHalfY)),
    ),
  );
}

/** Where a world point lands on the screen, in CSS pixels, and how far it is from the eye. */
export function project(camera: Camera, point: Vec3): { x: number; y: number; depth: number } {
  const m = camera.viewProj;
  const [px, py, pz] = point;
  const x = m[0] * px + m[4] * py + m[8] * pz + m[12];
  const y = m[1] * px + m[5] * py + m[9] * pz + m[13];
  const w = m[3] * px + m[7] * py + m[11] * pz + m[15];
  return {
    x: (x / w * 0.5 + 0.5) * camera.width,
    y: (0.5 - y / w * 0.5) * camera.height,
    depth: w,
  };
}
