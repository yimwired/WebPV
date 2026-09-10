"use client";

import type { CSSProperties } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";

/**
 * The product this page sells, drawn in CSS as a side elevation.
 *
 * Everything is sized in `em` so one `font-size` on the stage scales the whole
 * object. A side elevation beats a fake 3/4 here: real depth would need six
 * faces per part, and a lamp photographed straight on is what the category's
 * own product shots look like anyway.
 *
 * ทุกขนาดเป็น em - stage คุม font-size ตัวเดียว ทั้งโคมก็ scale ตาม
 */

/** Geometry, in em. The closed silhouette has to fit inside the base. */
export const LAMP = {
  baseW: 26,
  baseH: 2.1,
  /** hinge sits this far in from the base's left edge */
  hingeX: 3.4,
  armL: 17,
  armT: 1.4,
  headL: 13,
  headT: 2.5,
  /** how far the arm swings up, in degrees, from folded to working */
  openAngle: 72,
} as const;

/**
 * The drawing is the ruler. Every millimetre quoted anywhere on the page is
 * derived from the geometry above at this scale, so the spec sheet cannot end
 * up describing a different lamp from the one on screen.
 */
export const MM_PER_EM = 12.3;

const rad = (deg: number) => (deg * Math.PI) / 180;

export const DIMENSIONS = {
  /** end to end with the arm folded down, which is also the base's length */
  folded: Math.round(LAMP.baseW * MM_PER_EM),
  /** how high the hinge end of the head sits once the arm is up */
  openHeight: Math.round(
    (LAMP.baseH + LAMP.armL * Math.sin(rad(LAMP.openAngle))) * MM_PER_EM
  ),
  thickness: Math.round((LAMP.baseH + LAMP.armT + LAMP.headT) * MM_PER_EM * 0.4),
} as const;

/**
 * The head folds back along the arm when closed and points slightly downward
 * when open, the way a jackknife lamp actually behaves. Returns the head's CSS
 * rotation *relative to the arm*, so the world angle is `-angle + headSpin`.
 */
function headSpin(angle: number) {
  return 180 - 90 * (angle / LAMP.openAngle);
}

/** Where the light lands on the desk, measured from the base's left edge. */
function poolOffset(angle: number) {
  const headWorld = -angle + headSpin(angle);
  return (
    LAMP.hingeX +
    LAMP.armL * Math.cos(rad(angle)) +
    (LAMP.headL / 2) * Math.cos(rad(headWorld))
  );
}

/**
 * Colour of the emitted light. Measured whites, not guesses: these are the
 * usual sRGB renderings of black-body temperatures, so the 2700K end reads
 * amber and the 5000K end reads paper-white.
 */
const KELVIN_STOPS: ReadonlyArray<readonly [number, [number, number, number]]> =
  [
    [2700, [255, 166, 87]],
    [3500, [255, 196, 137]],
    [4300, [255, 219, 186]],
    [5000, [255, 236, 224]],
  ];

export function kelvinToRgb(kelvin: number): string {
  const k = Math.min(5000, Math.max(2700, kelvin));
  for (let i = 0; i < KELVIN_STOPS.length - 1; i += 1) {
    const [k0, c0] = KELVIN_STOPS[i];
    const [k1, c1] = KELVIN_STOPS[i + 1];
    if (k <= k1) {
      const t = (k - k0) / (k1 - k0);
      const mix = c0.map((v, j) => Math.round(v + (c1[j] - v) * t));
      return `rgb(${mix[0]} ${mix[1]} ${mix[2]})`;
    }
  }
  return "rgb(255 236 224)";
}

/** Anodised aluminium: a hard highlight near the top, a soft one underneath. */
const SHELL_LIGHT =
  "linear-gradient(180deg,#f2f0ec 0%,#dcd8d1 34%,#b3aea4 62%,#98938a 82%,#cbc7c0 100%)";
const SHELL_DARK =
  "linear-gradient(180deg,#4a4640 0%,#332f2a 38%,#211e1a 66%,#3b3731 100%)";
const SHELL_ROUND =
  "radial-gradient(circle at 34% 28%, #f2efea, #b7b2a8 58%, #7a756c)";

interface LampProps {
  /** 0 folded, LAMP.openAngle working. Drives every moving part. */
  angle: MotionValue<number>;
  /** 0 off, 1 at full output */
  lit: MotionValue<number>;
  /** 0 lit room, 1 dark room. Dims the metal so the LED reads as the source. */
  ambient: MotionValue<number>;
  /** 0 rendered, 1 technical outline */
  blueprint: MotionValue<number>;
  /** emitted colour, as a CSS colour string */
  light: string;
}

export function UnfoldLamp({
  angle,
  lit,
  ambient,
  blueprint,
  light,
}: LampProps) {
  const armRotate = useTransform(angle, (a) => `rotate(${-a}deg)`);
  const headRotate = useTransform(angle, (a) => `rotate(${headSpin(a)}deg)`);
  const poolLeft = useTransform(angle, (a) => `${poolOffset(a)}em`);

  // A closed lamp throws no usable pool, so the desk stays clean until the
  // head has actually cleared the base.
  const poolOpacity = useTransform([lit, angle], ([l, a]: number[]) =>
    l * Math.min(1, Math.max(0, (a - 24) / 30))
  );
  const metalFilter = useTransform(ambient, (a) => `brightness(${1 - a * 0.62})`);
  const beamOpacity = useTransform([lit, blueprint], ([l, b]: number[]) =>
    l * 0.32 * (1 - b)
  );
  const shellOpacity = useTransform(blueprint, [0, 1], [1, 0]);
  const outlineOpacity = blueprint;

  return (
    <div
      className="relative"
      style={{ width: `${LAMP.baseW}em`, height: `${LAMP.armL + 6}em` }}
    >
      {/* the desk the lamp stands on: contact shadow first, then the pool of
          light, so the light washes the shadow out rather than sitting on it */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
        style={{
          bottom: "-0.5em",
          width: `${LAMP.baseW * 1.06}em`,
          height: "1.5em",
          background:
            "radial-gradient(closest-side, rgb(0 0 0 / 0.34), transparent 78%)",
          filter: "blur(0.22em)",
        }}
      />
      <motion.div
        aria-hidden
        className="absolute rounded-[50%]"
        style={{
          left: poolLeft,
          bottom: "-1.4em",
          width: "22em",
          height: "3.4em",
          marginLeft: "-11em",
          opacity: poolOpacity,
          background: `radial-gradient(closest-side, ${light}, transparent 72%)`,
          filter: "blur(0.5em)",
          mixBlendMode: "screen",
        }}
      />

      <motion.div
        className="absolute inset-x-0 bottom-0"
        style={{ filter: metalFilter }}
      >
        {/* base */}
        <Part
          className="absolute bottom-0 left-0"
          style={{ width: `${LAMP.baseW}em`, height: `${LAMP.baseH}em` }}
          shellOpacity={shellOpacity}
          outlineOpacity={outlineOpacity}
        />

        {/* arm, hinged on the base's top face */}
        <motion.div
          data-lamp="arm"
          className="absolute origin-left"
          style={{
            left: `${LAMP.hingeX}em`,
            bottom: `${LAMP.baseH + LAMP.armT / 2}em`,
            width: `${LAMP.armL}em`,
            height: `${LAMP.armT}em`,
            marginBottom: `${-LAMP.armT / 2}em`,
            transform: armRotate,
          }}
        >
          <Part
            className="absolute inset-0"
            shellOpacity={shellOpacity}
            outlineOpacity={outlineOpacity}
          />

          {/* hinge collar, the one place the object admits it moves */}
          <Part
            className="absolute"
            round
            style={{
              left: `${-LAMP.armT * 0.55}em`,
              top: "50%",
              width: `${LAMP.armT * 1.5}em`,
              height: `${LAMP.armT * 1.5}em`,
              marginTop: `${-LAMP.armT * 0.75}em`,
            }}
            shellOpacity={shellOpacity}
            outlineOpacity={outlineOpacity}
          />

          {/* head, carried on the far end of the arm */}
          <motion.div
            className="absolute origin-left"
            style={{
              left: `${LAMP.armL}em`,
              top: "50%",
              width: `${LAMP.headL}em`,
              height: `${LAMP.headT}em`,
              marginTop: `${-LAMP.headT / 2 - LAMP.armT * 0.85}em`,
              transform: headRotate,
            }}
          >
            <Part
              className="absolute inset-0"
              dark
              shellOpacity={shellOpacity}
              outlineOpacity={outlineOpacity}
            />

            {/* the LED aperture, on the head's underside */}
            <motion.div
              aria-hidden
              data-lamp="led"
              className="absolute rounded-full"
              style={{
                left: "1.1em",
                right: "0.8em",
                bottom: "0.16em",
                height: "0.42em",
                background: light,
                opacity: lit,
                boxShadow: `0 0 1.6em 0.3em ${light}, 0 0 4em 1em ${light}`,
              }}
            />

            {/* the beam, clipped to a cone and fading out before it lands */}
            <motion.div
              aria-hidden
              className="absolute"
              style={{
                left: "-2.5em",
                right: "-2.5em",
                top: "100%",
                height: "16em",
                opacity: beamOpacity,
                background: `linear-gradient(180deg, ${light}, transparent 78%)`,
                clipPath: "polygon(24% 0%, 76% 0%, 100% 100%, 0% 100%)",
                // the clip leaves two hard edges; feathering them is what
                // separates a cone of light from a grey quadrilateral
                maskImage:
                  "linear-gradient(90deg, transparent, #000 26%, #000 74%, transparent)",
                filter: "blur(0.75em)",
                mixBlendMode: "screen",
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * One machined part. The rendered shell and the technical outline are stacked
 * and cross-faded, so blueprint mode is the same geometry rather than a
 * second drawing that can drift out of sync with the first.
 */
function Part({
  className,
  style,
  dark = false,
  round = false,
  shellOpacity,
  outlineOpacity,
}: {
  className?: string;
  style?: CSSProperties;
  dark?: boolean;
  /** shaded as a sphere rather than a cylinder */
  round?: boolean;
  shellOpacity: MotionValue<number>;
  outlineOpacity: MotionValue<number>;
}) {
  return (
    <div aria-hidden className={className} style={style}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: round ? SHELL_ROUND : dark ? SHELL_DARK : SHELL_LIGHT,
          opacity: shellOpacity,
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: "rgb(255 255 255 / 0.72)",
          opacity: outlineOpacity,
        }}
      />
    </div>
  );
}
