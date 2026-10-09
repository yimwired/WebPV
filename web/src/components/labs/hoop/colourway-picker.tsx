"use client";

import { COLOURWAYS, type Colourway } from "./colourways";

interface ColourwayPickerProps {
  value: Colourway;
  onChange: (next: Colourway) => void;
}

/**
 * Real radios, so an arrow key moves between colourways and the choice is
 * announced. The reel this comes from offers ten unlabelled dots; each swatch
 * here says what it is, and the chosen one names the bag.
 */
export function ColourwayPicker({ value, onChange }: ColourwayPickerProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2.5 text-[13px]" style={{ color: "var(--hoop-muted)" }}>
        สีถุงกับด้าย · <span style={{ color: "var(--hoop-ink)" }}>{value.fabric}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {COLOURWAYS.map((colourway) => {
          const chosen = colourway.id === value.id;
          const c = colourway.colors;
          return (
            <label
              key={colourway.id}
              className="relative flex min-h-11 cursor-pointer items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-[13px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
              style={{
                borderColor: chosen ? "var(--hoop-ink)" : "var(--hoop-line)",
                background: chosen ? "var(--hoop-panel)" : "transparent",
                outlineColor: "var(--hoop-ink)",
              }}
            >
              <input
                type="radio"
                name="colourway"
                value={colourway.id}
                checked={chosen}
                onChange={() => onChange(colourway)}
                className="sr-only"
              />
              {/* the bag as the ring, the rose thread as the centre, as on a thread card */}
              <span
                aria-hidden
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
                style={{ background: c.fabric, boxShadow: `inset 0 0 0 1px ${c.line}` }}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: c.rose, boxShadow: `3px 3px 0 -1px ${c.vine}` }} />
              </span>
              {colourway.name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
