"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { PIECES, type Piece } from "./data";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { PieceViewer } from "./piece-viewer";
import { COLOR, sansStyle, serifStyle } from "./theme";

interface PiecesSectionProps {
  piece: Piece;
  onPick: (id: string) => void;
}

const baht = (n: number) => n.toLocaleString("th-TH");

export function PiecesSection({ piece, onPick }: PiecesSectionProps) {
  return (
    <section
      id="pieces"
      className="scroll-mt-16 px-5 py-24 sm:px-8 lg:px-12"
      style={{ background: COLOR.paper }}
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          variants={stagger(0.1)}
          className="max-w-xl"
        >
          <motion.h2
            variants={reveal}
            transition={revealTransition}
            className="text-[clamp(1.7rem,4.5vw,2.6rem)] leading-snug"
            style={{ color: COLOR.ink, ...serifStyle }}
          >
            สี่ใบที่เหลืออยู่ในเตารอบนี้
          </motion.h2>
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="mt-4 text-base leading-relaxed"
            style={{ color: COLOR.inkMuted, ...sansStyle }}
          >
            รูปที่เห็นคือใบที่จะได้ ไม่ใช่รูปตัวอย่าง กดที่จุดบนรูปเพื่อดูว่าใบนั้นมีตำหนิอะไร
            และตำหนินั้นเกิดจากอะไร
          </motion.p>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <motion.div
            initial="hidden"
            whileInView="shown"
            viewport={ONCE}
            variants={reveal}
            transition={revealTransition}
          >
            {/* keyed on the piece so switching remounts it and the open flaw
                resets. The alternative is an effect that clears the state when
                the prop changes, which this project's lint rules reject and
                which is the worse version anyway: the index it holds belongs
                to the old piece and means nothing on the new one. */}
            <PieceViewer key={piece.id} piece={piece} />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="shown"
            viewport={ONCE}
            variants={stagger(0.06)}
            style={sansStyle}
          >
            <motion.div variants={reveal} transition={revealTransition}>
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: COLOR.clay }}>
                หมายเลข {piece.no}
              </p>
              <h3 className="mt-2 text-3xl" style={{ color: COLOR.ink, ...serifStyle }}>
                {piece.name}
              </h3>
              <p className="mt-2 text-2xl" style={{ color: COLOR.ink, ...serifStyle }}>
                {baht(piece.price)} บาท
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: COLOR.inkMuted }}>
                {piece.use}
              </p>
            </motion.div>

            <motion.dl
              variants={reveal}
              transition={revealTransition}
              className="mt-7 space-y-3 border-t pt-6 text-sm"
              style={{ borderColor: COLOR.hair }}
            >
              {[
                ["ดิน", piece.clay],
                ["เคลือบ", piece.glaze],
                ["ขนาด", piece.size],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4">
                  <dt className="w-16 shrink-0" style={{ color: COLOR.inkMuted }}>
                    {label}
                  </dt>
                  <dd style={{ color: COLOR.ink }}>{value}</dd>
                </div>
              ))}
            </motion.dl>

            {/* The other three, as a row of thumbnails. A grid of four large
                cards would make this a shop; the point here is one piece at a
                time, with the rest waiting quietly. */}
            <motion.div variants={reveal} transition={revealTransition} className="mt-8">
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: COLOR.inkMuted }}>
                ใบอื่นในรอบนี้
              </p>
              <ul className="mt-3 flex gap-3">
                {PIECES.map((other) => {
                  const active = other.id === piece.id;
                  return (
                    <li key={other.id}>
                      <button
                        type="button"
                        onClick={() => onPick(other.id)}
                        aria-current={active ? "true" : undefined}
                        className="block h-16 w-16 overflow-hidden transition-opacity duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 sm:h-20 sm:w-20"
                        style={{
                          opacity: active ? 1 : 0.55,
                          outline: active ? `1px solid ${COLOR.clay}` : undefined,
                          outlineOffset: active ? 3 : undefined,
                          outlineColor: COLOR.clay,
                        }}
                      >
                        <span className="sr-only">{other.name}</span>
                        <span className="relative block h-full w-full">
                          <Image
                            src={other.photo}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
