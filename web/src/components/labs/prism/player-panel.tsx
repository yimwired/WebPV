"use client";

import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import type { Track } from "./data";
import { GlassSurface, toneFor, type LayerState } from "./glass-surface";
import { monoStyle, sansStyle } from "./theme";

const mmss = (total: number) => {
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

interface PlayerPanelProps {
  track: Track;
  layers: LayerState;
  playing: boolean;
  onPlayToggle: () => void;
  onStep: (direction: -1 | 1) => void;
  position: number;
  onSeek: (seconds: number) => void;
  volume: number;
  onVolume: (value: number) => void;
}

/**
 * The player.
 *
 * Nothing here runs on a timer. The position is a range input the visitor
 * drags, which is honest about what a demo can know, keeps the control
 * operable from the keyboard for free, and means the page holds no frame loop
 * open for the whole visit just to move a bar.
 */
export function PlayerPanel({
  track,
  layers,
  playing,
  onPlayToggle,
  onStep,
  position,
  onSeek,
  volume,
  onVolume,
}: PlayerPanelProps) {
  const tone = toneFor(track.bandLuma, layers);

  return (
    <GlassSurface luma={track.bandLuma} layers={layers} radius={28} className="p-5 sm:p-6">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24">
          <Image
            src={track.image}
            alt={`ปกอัลบั้ม ${track.title}`}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1" style={sansStyle}>
          <p className="truncate text-lg font-semibold sm:text-xl" style={{ color: tone.text }}>
            {track.title}
          </p>
          <p className="truncate text-sm" style={{ color: tone.muted }}>
            {track.artist}
          </p>
          <p className="mt-1 text-xs" style={{ ...monoStyle, color: tone.muted }}>
            backdrop luma {track.bandLuma} / 255
          </p>
        </div>
      </div>

      <div className="mt-5">
        <input
          aria-label="ตำแหน่งในเพลง"
          type="range"
          min={0}
          max={track.seconds}
          step={1}
          value={position}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="h-6 w-full cursor-pointer"
          style={{ accentColor: tone.text }}
        />
        <div
          className="-mt-1 flex justify-between text-xs"
          style={{ ...monoStyle, color: tone.muted }}
        >
          <span>{mmss(position)}</span>
          <span>{track.length}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onStep(-1)}
          aria-label="เพลงก่อนหน้า"
          className="grid h-11 w-11 place-items-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: tone.control, color: tone.controlText, outlineColor: tone.text }}
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onPlayToggle}
          aria-label={playing ? "หยุดชั่วคราว" : "เล่น"}
          aria-pressed={playing}
          className="grid h-13 w-13 place-items-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: tone.text, color: tone.controlText === "#f7f8fa" ? "#12141a" : "#f7f8fa", outlineColor: tone.text }}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={() => onStep(1)}
          aria-label="เพลงถัดไป"
          className="grid h-11 w-11 place-items-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: tone.control, color: tone.controlText, outlineColor: tone.text }}
        >
          <SkipForward className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Volume2 className="h-4 w-4 shrink-0" style={{ color: tone.muted }} aria-hidden />
          <input
            aria-label="ระดับเสียง"
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(event) => onVolume(Number(event.target.value))}
            className="h-6 w-24 cursor-pointer sm:w-28"
            style={{ accentColor: tone.text }}
          />
        </div>
      </div>
    </GlassSurface>
  );
}
