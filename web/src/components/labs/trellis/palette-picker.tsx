"use client";

import { PALETTES, type Palette } from "./palettes";

interface PalettePickerProps {
  value: Palette;
  onChange: (next: Palette) => void;
}

/**
 * Ten swatches in one pill, the way the reel lays them out: the ground as the
 * ring, the rose as the dot. Unlike the reel's, they are real radios, so an
 * arrow key moves between them and the choice is announced by name, and the
 * chosen one's name is written beside them.
 */
export function PalettePicker({ value, onChange }: PalettePickerProps) {
  return (
    <fieldset
      className="flex items-center gap-0.5 rounded-full border px-1.5 py-1"
      style={{ borderColor: "var(--tr-line)" }}
    >
      <legend className="sr-only">ชุดสี</legend>
      <span aria-hidden className="hidden pr-1.5 pl-2 text-[13px] whitespace-nowrap md:inline" style={{ color: "var(--tr-muted)" }}>
        {value.name}
      </span>
      {PALETTES.map((palette) => {
        const chosen = palette.id === value.id;
        const c = palette.colors;
        return (
          <label
            key={palette.id}
            title={palette.name}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full transition-shadow has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1"
            style={{
              boxShadow: chosen ? "inset 0 0 0 1.5px var(--tr-ink)" : undefined,
              outlineColor: "var(--tr-ink)",
            }}
          >
            <input
              type="radio"
              name="trellis-palette"
              value={palette.id}
              checked={chosen}
              onChange={() => onChange(palette)}
              aria-label={palette.name}
              className="sr-only"
            />
            <span
              aria-hidden
              className="grid h-[22px] w-[22px] place-items-center rounded-full"
              style={{ background: c.ground, boxShadow: `inset 0 0 0 1px ${c.line}` }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.rose }} />
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
