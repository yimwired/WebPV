"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { COLOR, FONT, Z } from "./theme";

/**
 * Everything behind the hero copy: two blurred colour fields, a bed of embers
 * along the bottom edge, an outline wordmark and two stickers.
 *
 * One scroll subscription drives all of it. Each layer is pulled at a different
 * rate, which is what separates them in depth, and every layer moves on
 * `transform` alone so the parallax never triggers layout.
 */
export function FloatingLayer() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Furthest back moves least, nearest moves most: the ordering is the effect.
  const blobY = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const wordmarkY = useTransform(scrollYProgress, [0, 1], ["0%", "48%"]);
  const emberY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const stickerY = useTransform(scrollYProgress, [0, 1], ["0%", "-70%"]);
  const emberFade = useTransform(scrollYProgress, [0, 0.8], [0.55, 0.15]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Colour fields. Blurred fills rather than a gradient so the two
          centres stay distinct instead of averaging into one wash. */}
      <motion.div
        style={{ y: blobY, zIndex: Z.wash }}
        className="absolute inset-0"
      >
        <div
          className="absolute -left-[18%] top-[-10%] h-[62vh] w-[62vh] rounded-full blur-[90px]"
          style={{ background: COLOR.flame, opacity: 0.16 }}
        />
        <div
          className="absolute -right-[12%] top-[22%] h-[48vh] w-[48vh] rounded-full blur-[90px]"
          style={{ background: COLOR.ember, opacity: 0.22 }}
        />
      </motion.div>

      {/* The outline wordmark. Big enough to read as texture, faint enough
          that the headline in front of it still wins.

          Drawn as SVG rather than HTML with `-webkit-text-stroke`, because a
          transparent fill makes it text with no measurable contrast: the audit
          sweep reads it as 1:1 and cannot tell decoration from a real heading.
          As a stroked <text> the marks carry their own colour and the element
          stops pretending to be copy. */}
      <motion.svg
        viewBox="0 0 1000 210"
        preserveAspectRatio="xMidYMid meet"
        style={{ y: wordmarkY, zIndex: Z.floating, opacity: 0.15 }}
        className="absolute inset-x-0 top-[50%] w-full select-none"
      >
        <text
          x="500"
          y="170"
          textAnchor="middle"
          style={{
            fontFamily: FONT.display,
            fontSize: 200,
            fill: "none",
            stroke: COLOR.flame,
            strokeWidth: 3,
            color: COLOR.flameDeep,
          }}
        >
          TAODANG
        </text>
      </motion.svg>

      {/* A bed of charcoal along the bottom edge, faded out at the top so the
          photograph never draws a line across the page. */}
      <motion.div
        style={{ y: emberY, opacity: emberFade, zIndex: Z.ember }}
        className="absolute inset-x-0 bottom-[-12%] h-[46%]"
      >
        <div
          className="relative h-full w-full"
          style={{
            maskImage: "linear-gradient(to top, black 12%, transparent 88%)",
            WebkitMaskImage: "linear-gradient(to top, black 12%, transparent 88%)",
          }}
        >
          <Image
            src="/lab-demos/ember/embers.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </motion.div>

      {/* One sticker, under the photograph rather than behind its corner: this
          layer sits below the content, so anything placed against the picture
          comes out as a shape half hidden by it.

          It does not turn. The genre's spinning badge sets its words around the
          circle; a disc of straight text rotating past the reader is unreadable
          at every angle but one, and the gallery card catches it at one of the
          others. Tilted and still says sticker just as well. */}
      <motion.div style={{ y: stickerY, zIndex: Z.floating }} className="absolute inset-0">
        <div
          className="absolute right-4 top-[72%] hidden h-24 w-24 -rotate-[10deg] place-items-center rounded-full text-center text-[11px] font-bold leading-tight lg:grid"
          style={{ background: COLOR.flame, color: COLOR.onFlame, fontFamily: FONT.thai }}
        >
          เติม
          <br />
          ไม่อั้น
        </div>
      </motion.div>
    </div>
  );
}
