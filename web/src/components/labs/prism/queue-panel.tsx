"use client";

import Image from "next/image";
import { AudioLines } from "lucide-react";
import { TRACKS, type Track } from "./data";
import { GlassSurface, toneFor, type LayerState } from "./glass-surface";
import { monoStyle, sansStyle } from "./theme";

interface QueuePanelProps {
  current: Track;
  layers: LayerState;
  onPick: (id: string) => void;
}

/**
 * The queue, and the second way to change what is behind the glass.
 *
 * Each row prints the luminance of its own backdrop, because the number is the
 * point of the set: picking a row swaps the photograph under every panel on the
 * page, and the reading is what decides which way the sheets flip.
 */
export function QueuePanel({ current, layers, onPick }: QueuePanelProps) {
  const tone = toneFor(current.bandLuma, layers);

  return (
    <GlassSurface luma={current.bandLuma} layers={layers} radius={28} className="p-5 sm:p-6">
      <h2
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ ...sansStyle, color: tone.muted }}
      >
        คิวเพลง
      </h2>

      <ul className="mt-3 -mx-2">
        {TRACKS.map((track) => {
          const active = track.id === current.id;
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => onPick(track.id)}
                aria-current={active ? "true" : undefined}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  background: active ? tone.control : "transparent",
                  outlineColor: tone.text,
                  ...sansStyle,
                }}
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={track.image}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-sm font-semibold"
                    style={{ color: tone.text }}
                  >
                    {track.title}
                  </span>
                  <span className="block truncate text-xs" style={{ color: tone.muted }}>
                    {track.artist}
                  </span>
                </span>

                <span
                  className="shrink-0 text-xs tabular-nums"
                  style={{ ...monoStyle, color: tone.muted }}
                >
                  {active ? (
                    <AudioLines className="h-4 w-4" style={{ color: tone.text }} aria-label="กำลังเล่น" />
                  ) : (
                    track.bandLuma
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 px-2 text-xs leading-relaxed" style={{ ...sansStyle, color: tone.muted }}>
        ตัวเลขข้างเพลงคือความสว่างเฉลี่ยของภาพตรงที่แผ่นทับ 0 ถึง 255 เกิน 118 เมื่อไหร่แผ่นจะพลิกเป็นโหมดเข้ม
      </p>
    </GlassSurface>
  );
}
