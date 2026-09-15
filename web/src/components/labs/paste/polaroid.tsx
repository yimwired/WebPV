"use client";

import Image from "next/image";
import type { Snapshot } from "./data";
import { COLOR, handStyle, TAPE, Z } from "./theme";

interface PolaroidProps {
  snap: Snapshot;
  /** rendered width in px at desktop. The border scales off it */
  size?: number;
  priority?: boolean;
}

/**
 * One instant photo, taped down at an angle.
 *
 * Three details separate this from a rotated card with a shadow, and all three
 * are cheap:
 *
 * - the border is not even. An instant photo has a deep chin below the frame,
 *   and getting that wrong is the single most obvious tell.
 * - the tape sits *over* the photo's corner, not behind it, and is
 *   semi-transparent so the paper underneath shows through it.
 * - the shadow is short and tight. Tape holds a photo flat against the page;
 *   a long soft shadow says it is floating, which is a different style.
 *
 * The tilt comes from the data rather than a random value, because a layout
 * that reshuffles on every render cannot be screenshotted or reviewed.
 */
export function Polaroid({ snap, size = 260, priority = false }: PolaroidProps) {
  const pad = Math.round(size * 0.045);

  return (
    <figure
      className="relative"
      style={{
        width: size,
        transform: `rotate(${snap.tilt}deg)`,
        background: COLOR.card,
        padding: pad,
        // room for one line of hand, with margin. A caption that wraps to two
        // spills past the chin and over the photograph, which is what the
        // longest of these did before it was cut back.
        paddingBottom: Math.round(pad * 3.9),
        boxShadow: "0 3px 10px rgba(28, 43, 63, 0.16)",
        zIndex: Z.photo,
      }}
    >
      <div className="relative aspect-square w-full overflow-hidden" style={{ background: COLOR.kraft }}>
        <Image
          src={snap.src}
          alt=""
          fill
          priority={priority}
          sizes={`${size}px`}
          className="object-cover"
        />
      </div>

      <figcaption
        className="absolute inset-x-0 bottom-0 px-3 pb-2 text-center text-[15px] leading-tight"
        style={{ color: COLOR.ink, ...handStyle }}
      >
        {snap.caption}
      </figcaption>

      {/* The tape. Over the corner, angled against the photo's own angle, so
          the two rotations read as two separate objects. */}
      <span
        aria-hidden
        className="absolute"
        style={{
          top: -12,
          left: "50%",
          width: Math.round(size * 0.42),
          height: 26,
          marginLeft: Math.round(size * -0.21),
          background: TAPE[snap.tape],
          opacity: 0.85,
          transform: `rotate(${snap.tilt * -2.2}deg)`,
          boxShadow: "0 1px 2px rgba(28, 43, 63, 0.12)",
          zIndex: Z.tape,
        }}
      />
    </figure>
  );
}
