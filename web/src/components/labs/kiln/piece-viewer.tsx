"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Piece } from "./data";
import { DUR, EASE } from "./motion";
import { COLOR, MARKER, sansStyle, serifStyle, Z } from "./theme";

interface PieceViewerProps {
  piece: Piece;
}

/**
 * One piece, with its flaws marked on the photograph.
 *
 * This is the argument of the whole page. A handmade shop's real problem is
 * that every piece is different, which a catalogue usually hides behind one
 * flattering photograph; pointing at the marks instead turns the problem into
 * the reason to buy. So the markers are real coordinates on the real picture,
 * not a bulleted list under it.
 *
 * Each marker is a button with the flaw's name on it, so the information is
 * reachable without a mouse and without seeing the image at all. Opening one
 * closes the other: two callouts over a small photograph cover the thing they
 * are describing.
 */
export function PieceViewer({ piece }: PieceViewerProps) {
  const [openFlaw, setOpenFlaw] = useState<number | null>(null);
  const flaw = openFlaw === null ? null : piece.flaws[openFlaw];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden" style={{ background: COLOR.paperDeep }}>
        <Image
          src={piece.photo}
          alt={`${piece.name} หมายเลข ${piece.no}`}
          fill
          sizes="(max-width: 1024px) 92vw, 560px"
          className="object-cover"
          priority
        />

        {piece.flaws.map((item, i) => {
          const isOpen = openFlaw === i;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setOpenFlaw(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: MARKER.size,
                height: MARKER.size,
                background: MARKER.ring,
                outlineColor: MARKER.ring,
                zIndex: Z.marker,
              }}
            >
              <span className="sr-only">{item.name}</span>
              <span
                aria-hidden
                className="block rounded-full"
                style={{
                  width: isOpen ? 14 : 9,
                  height: isOpen ? 14 : 9,
                  background: MARKER.core,
                  transition: "width 160ms, height 160ms",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* The callout sits under the photograph rather than over it. Over it,
          the box covers the mark it is describing, which is the one thing the
          reader is trying to look at. */}
      <div className="min-h-[7.5rem] border-t px-1 pt-4" style={{ borderColor: COLOR.hair }}>
        <AnimatePresence mode="wait" initial={false}>
          {flaw ? (
            <motion.div
              key={flaw.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: DUR.fast, ease: EASE.soft }}
            >
              <p className="text-base font-medium" style={{ color: COLOR.ink, ...sansStyle }}>
                {flaw.name}
              </p>
              <p
                className="mt-1.5 text-sm leading-relaxed"
                style={{ color: COLOR.inkMuted, ...sansStyle }}
              >
                {flaw.why}
              </p>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.fast }}
              className="text-sm leading-relaxed"
              style={{ color: COLOR.inkMuted, ...sansStyle }}
            >
              จุดบนรูปคือตำหนิของใบนี้ กดดูได้ว่าแต่ละจุดเกิดจากอะไร
              <span className="mt-1 block" style={{ ...serifStyle, fontSize: "0.95rem" }}>
                {piece.flaws.length} จุดบนใบนี้
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
