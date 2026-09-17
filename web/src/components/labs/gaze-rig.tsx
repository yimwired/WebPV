"use client";

import { useImperativeHandle, useRef, type Ref } from "react";
import type { ScrubState } from "./gaze-cursor";

/**
 * The subject: a wireframe head, drawn as an orthographic sphere and turned by
 * the scrub position.
 *
 * It is real geometry rather than a flat drawing that gets skewed, because the
 * giveaway on a skewed drawing is the far side — on a turning sphere the
 * meridians bunch up towards the limb and the far eye narrows, and both of
 * those fall out of the projection for free.
 *
 * Every frame is written with `setAttribute`. This is a scrub: React's job is
 * to put the elements on the page once, not to reconcile a tree per frame.
 */

export interface GazeRigHandle {
  apply: (state: ScrubState) => void;
}

const RADIUS = 148;

/** Meridians, evenly spaced. One ellipse covers a full great circle. */
const MERIDIANS = [0, 1, 2, 3, 4, 5, 6].map((i) => (i * Math.PI) / 7);

/** Parallels, in radians of latitude. */
const PARALLELS = [-1, -0.62, -0.24, 0.24, 0.62, 1].map((v) => v * 1.1);

/** Where the eyes sit on the sphere: longitude out from the nose, latitude up. */
const EYES = [-0.38, 0.38].map((longitude) => ({ longitude, latitude: 0.16 }));

/** Turn, in radians, at the far left and far right of the viewport. */
const YAW_RANGE = 1.5;

/**
 * Looking very slightly down at the subject at rest. At exactly zero the
 * parallels project to straight lines, which is correct and reads as a mistake,
 * so the range is kept entirely on one side of it.
 */
const PITCH_CENTRE = -0.3;
const PITCH_RANGE = 0.42;

interface Point {
  x: number;
  y: number;
  /** towards the viewer; negative is round the back */
  z: number;
}

/** Orthographic projection of a point on the sphere after yaw then pitch. */
function project(
  longitude: number,
  latitude: number,
  yaw: number,
  pitch: number,
  radius: number
): Point {
  const x = radius * Math.cos(latitude) * Math.sin(longitude);
  const y = -radius * Math.sin(latitude);
  const z = radius * Math.cos(latitude) * Math.cos(longitude);

  const xr = x * Math.cos(yaw) + z * Math.sin(yaw);
  const zr = -x * Math.sin(yaw) + z * Math.cos(yaw);

  return {
    x: xr,
    y: y * Math.cos(pitch) - zr * Math.sin(pitch),
    z: y * Math.sin(pitch) + zr * Math.cos(pitch),
  };
}

const yawOf = (progress: number) => (progress - 0.5) * YAW_RANGE;
const pitchOf = (tilt: number) => PITCH_CENTRE + (tilt - 0.5) * PITCH_RANGE;

export function GazeRig({ ref }: { ref?: Ref<GazeRigHandle> }) {
  const meridianRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const parallelRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const eyeRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const pupilRefs = useRef<(SVGCircleElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    apply({ progress, tilt }) {
      const yaw = yawOf(progress);
      const pitch = pitchOf(tilt);

      MERIDIANS.forEach((longitude, i) => {
        // A great circle through the poles projects to an ellipse as wide as
        // the sine of its angle to the line of sight, and always a full radius
        // tall.
        const node = meridianRefs.current[i];
        node?.setAttribute(
          "rx",
          Math.abs(RADIUS * Math.sin(longitude + yaw)).toFixed(2)
        );
      });

      PARALLELS.forEach((latitude, i) => {
        const node = parallelRefs.current[i];
        if (!node) return;
        node.setAttribute(
          "cy",
          (-RADIUS * Math.sin(latitude) * Math.cos(pitch)).toFixed(2)
        );
        node.setAttribute(
          "ry",
          Math.abs(RADIUS * Math.cos(latitude) * Math.sin(pitch)).toFixed(2)
        );
      });

      EYES.forEach((eye, i) => {
        const node = eyeRefs.current[i];
        const pupil = pupilRefs.current[i];
        if (!node || !pupil) return;

        const point = project(eye.longitude, eye.latitude, yaw, pitch, RADIUS);
        // How square-on this eye is: 1 facing the viewer, 0 at the limb. It
        // both narrows the eye and fades it out as it goes round the back.
        const facing = Math.max(0, point.z / RADIUS);

        node.setAttribute("cx", point.x.toFixed(2));
        node.setAttribute("cy", point.y.toFixed(2));
        node.setAttribute("rx", (13 * facing).toFixed(2));
        node.setAttribute("opacity", Math.min(1, facing * 2.4).toFixed(3));

        // The pupil drifts a little further than the eye it sits in, which is
        // what makes the subject read as looking at the cursor rather than
        // merely turned towards it.
        pupil.setAttribute("cx", (point.x + (progress - 0.5) * 7 * facing).toFixed(2));
        pupil.setAttribute("cy", (point.y + (tilt - 0.5) * 5).toFixed(2));
        pupil.setAttribute("opacity", Math.min(1, facing * 2.4).toFixed(3));
      });
    },
  }), []);

  // Rendered at the resting position, by the same maths the loop uses, so the
  // markup the server sends is the frame the client would have drawn first.
  const yaw = yawOf(0.5);
  const pitch = pitchOf(0.5);

  return (
    <svg
      data-gaze="rig"
      viewBox="-200 -200 400 400"
      className="h-full w-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="gaze-halo">
          <stop offset="0%" stopColor="var(--gaze-accent)" stopOpacity="0.16" />
          <stop offset="70%" stopColor="var(--gaze-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle r={RADIUS * 1.45} fill="url(#gaze-halo)" />

      <g fill="none" stroke="var(--gaze-accent)" strokeWidth="1">
        {PARALLELS.map((latitude, i) => (
          <ellipse
            key={`parallel-${i}`}
            ref={(node) => {
              parallelRefs.current[i] = node;
            }}
            cx="0"
            cy={(-RADIUS * Math.sin(latitude) * Math.cos(pitch)).toFixed(2)}
            rx={(RADIUS * Math.cos(latitude)).toFixed(2)}
            ry={Math.abs(RADIUS * Math.cos(latitude) * Math.sin(pitch)).toFixed(2)}
            opacity="0.3"
          />
        ))}

        {MERIDIANS.map((longitude, i) => (
          <ellipse
            key={`meridian-${i}`}
            ref={(node) => {
              meridianRefs.current[i] = node;
            }}
            cx="0"
            cy="0"
            rx={Math.abs(RADIUS * Math.sin(longitude + yaw)).toFixed(2)}
            ry={RADIUS}
            opacity="0.3"
          />
        ))}

        <circle r={RADIUS} opacity="0.85" strokeWidth="1.5" />
      </g>

      <g>
        {EYES.map((eye, i) => {
          const point = project(eye.longitude, eye.latitude, yaw, pitch, RADIUS);
          const facing = Math.max(0, point.z / RADIUS);
          return (
            <g key={`eye-${i}`}>
              <ellipse
                ref={(node) => {
                  eyeRefs.current[i] = node;
                }}
                cx={point.x.toFixed(2)}
                cy={point.y.toFixed(2)}
                rx={(13 * facing).toFixed(2)}
                ry="13"
                fill="var(--gaze-accent)"
                opacity={Math.min(1, facing * 2.4).toFixed(3)}
              />
              <circle
                ref={(node) => {
                  pupilRefs.current[i] = node;
                }}
                cx={point.x.toFixed(2)}
                cy={point.y.toFixed(2)}
                r="4.5"
                fill="#07090a"
                opacity={Math.min(1, facing * 2.4).toFixed(3)}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
