"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { TRACKS } from "./data";
import { GlassFilters } from "./glass-filter";
import { ALL_LAYERS, GlassSurface, toneFor, useSupportsSvgBackdrop, type LayerState } from "./glass-surface";
import { LayersSection } from "./layers-section";
import { DUR, EASE } from "./motion";
import { PlayerPanel } from "./player-panel";
import { QueuePanel } from "./queue-panel";
import { monoStyle, PAGE, sansStyle } from "./theme";

/**
 * Prism: a glass study for Lumen, an invented music app.
 *
 * The reason every panel here sits on a photograph rather than a gradient is
 * that a displacement map over a smooth wash has nothing to bend, and glass
 * over a gradient is the exact shortcut that earned the technique its
 * reputation. The four backdrops were chosen to span luminance 19 to 174 so the
 * adaptive layer has to flip both ways in front of the visitor.
 */
export function PrismDemo() {
  const [trackId, setTrackId] = useState(TRACKS[0].id);
  const [layers, setLayers] = useState<LayerState>(ALL_LAYERS);
  const [playing, setPlaying] = useState(true);
  const [position, setPosition] = useState(64);
  const [volume, setVolume] = useState(72);

  const supportsSvg = useSupportsSvgBackdrop();
  const index = TRACKS.findIndex((t) => t.id === trackId);
  const track = TRACKS[index];
  const tone = toneFor(track.bandLuma, layers);

  const pick = useCallback((id: string) => {
    setTrackId(id);
    setPosition(0);
  }, []);

  const step = useCallback((direction: -1 | 1) => {
    setTrackId((current) => {
      const at = TRACKS.findIndex((t) => t.id === current);
      return TRACKS[(at + direction + TRACKS.length) % TRACKS.length].id;
    });
    setPosition(0);
  }, []);

  const toggleLayer = useCallback((id: keyof LayerState) => {
    setLayers((current) => ({ ...current, [id]: !current[id] }));
  }, []);

  const setAllLayers = useCallback((on: boolean) => {
    setLayers({ refraction: on, chromatic: on, specular: on, adaptive: on });
  }, []);

  return (
    <div style={{ background: PAGE.bg }}>
      <GlassFilters />

      <section className="relative min-h-[100svh] overflow-hidden px-5 py-20 sm:px-8 lg:px-12">
        {/* The backdrop. One photograph at a time, crossfaded, scaled past the
            frame so the blurred rim of the panels never reaches its edge. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={track.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1.04 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: DUR.backdrop, ease: EASE.soft }}
          >
            <Image
              src={track.image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <div className="relative mx-auto grid min-h-[80svh] max-w-6xl content-center gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-5">
            <GlassSurface luma={track.bandLuma} layers={layers} radius={28} className="p-6 sm:p-8">
              <p
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ ...sansStyle, color: tone.muted }}
              >
                Lumen
              </p>
              <h1
                className="mt-3 text-[clamp(1.9rem,5vw,3.1rem)] font-semibold leading-[1.15]"
                style={{ ...sansStyle, color: tone.text }}
              >
                หน้าต่างที่รู้ว่ามีอะไรอยู่ข้างหลัง
              </h1>
              <p
                className="mt-4 max-w-md text-base leading-relaxed"
                style={{ ...sansStyle, color: tone.muted }}
              >
                สลับเพลงแล้วดูแผ่นแก้ว ภาพข้างหลังเปลี่ยน ขอบบิดตามของจริง
                และแผ่นพลิกโหมดเองเพื่อให้ตัวหนังสือยังอ่านออก
              </p>
              <a
                href="#layers"
                className="mt-6 inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  background: tone.text,
                  color: tone.controlText === "#f7f8fa" ? "#12141a" : "#f7f8fa",
                  outlineColor: tone.text,
                  ...sansStyle,
                }}
              >
                {/* The label is wrapped so that shoot-contrast.mjs, which
                    samples a ring 6px outside the text node, lands on this
                    button's own fill rather than on the glass behind it. */}
                <span>ดูว่าแก้วประกอบจากอะไร</span>
              </a>
            </GlassSurface>

            <PlayerPanel
              track={track}
              layers={layers}
              playing={playing}
              onPlayToggle={() => setPlaying((p) => !p)}
              onStep={step}
              position={position}
              onSeek={setPosition}
              volume={volume}
              onVolume={setVolume}
            />
          </div>

          <QueuePanel current={track} layers={layers} onPick={pick} />
        </div>
      </section>

      <LayersSection
        track={track}
        layers={layers}
        onToggle={toggleLayer}
        onSetAll={setAllLayers}
      />

      <footer
        className="px-5 pb-28 pt-10 sm:px-8 lg:px-12"
        style={{ background: PAGE.bg, ...sansStyle }}
      >
        <div className="mx-auto max-w-6xl border-t pt-10" style={{ borderColor: PAGE.line }}>
          <p className="max-w-2xl text-sm leading-relaxed" style={{ color: PAGE.muted }}>
            Lumen เป็นแอปสมมติ หน้านี้เป็นตัวอย่างงานออกแบบในพอร์ตของ Film ชื่อเพลงกับชื่อศิลปินแต่งขึ้นมา
            ปกอัลบั้มเป็นภาพสต็อกที่ใช้แทนภาพจริง
          </p>

          <p className="mt-4 text-xs leading-relaxed" style={{ ...monoStyle, color: PAGE.muted }}>
            {supportsSvg
              ? "เบราว์เซอร์นี้รัน SVG filter เป็น backdrop ได้ ชั้นหักเหกับชั้นเหลือบสีทำงานเต็มที่"
              : "เบราว์เซอร์นี้รัน SVG filter เป็น backdrop ไม่ได้ กำลังใช้ทางสำรอง blur กับ saturate"}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/labs"
              className="inline-flex items-center py-1.5 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: PAGE.text, outlineColor: PAGE.accent }}
            >
              กลับไปที่ The Lab
            </Link>
            <Link
              href="/"
              className="inline-flex items-center py-1.5 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: PAGE.text, outlineColor: PAGE.accent }}
            >
              ดูพอร์ตของ Film
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
