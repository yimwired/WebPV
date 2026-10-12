"use client";

import { COLORWAYS, type Colorway } from "./colorways";

interface ColorwayPickerProps {
  value: Colorway;
  onChange: (next: Colorway) => void;
}

/**
 * The colourways as real radios in one pill, laid out like Trellis's palette
 * picker: an arrow key moves between them and each is announced by name. A
 * swatch is the set's main plastic with its accent at the centre, the two
 * colours a keycap set is known by.
 */
export function ColorwayPicker({ value, onChange }: ColorwayPickerProps) {
  return (
    <fieldset
      className="flex items-center gap-0.5 rounded-full border px-1.5 py-1"
      style={{ borderColor: "var(--th-line)", backgroundColor: "var(--th-ground)" }}
    >
      <legend className="sr-only">ชุดสี</legend>
      <span
        aria-hidden
        className="hidden pr-1.5 pl-2 text-[13px] whitespace-nowrap md:inline"
        style={{ color: "var(--th-muted)" }}
      >
        {value.name}
      </span>
      {COLORWAYS.map((colorway) => {
        const chosen = colorway.id === value.id;
        return (
          <label
            key={colorway.id}
            title={colorway.name}
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full transition-shadow has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1"
            style={{
              boxShadow: chosen ? "inset 0 0 0 1.5px var(--th-ink)" : undefined,
              outlineColor: "var(--th-ink)",
            }}
          >
            <input
              type="radio"
              name="thock-colorway"
              value={colorway.id}
              checked={chosen}
              onChange={() => onChange(colorway)}
              aria-label={colorway.name}
              className="sr-only"
            />
            <span
              aria-hidden
              className="grid h-[22px] w-[22px] place-items-center rounded-full"
              style={{ background: colorway.plastics[0].body, boxShadow: `inset 0 0 0 1px ${colorway.chrome.line}` }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorway.plastics[3].body }} />
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
