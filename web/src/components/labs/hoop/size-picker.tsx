"use client";

import type { Bounds } from "./plant";
import { fitsField, SIZES, type Size } from "./use-garden";

interface SizePickerProps {
  value: Size;
  box: Bounds;
  /** ink height of the current name per em, so each option can say what it means for this name */
  inkEm: number;
  onChange: (next: Size) => void;
}

/**
 * Letter size, in the unit a customer actually has in mind: how tall this name
 * comes out, top of its highest mark to the bottom of its lowest tail. A size
 * the design cannot fit is shown and disabled, with the reason, rather than
 * left out, so it is clear why it cannot be picked.
 */
export function SizePicker({ value, box, inkEm, onChange }: SizePickerProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2.5 text-[13px]" style={{ color: "var(--hoop-muted)" }}>
        ขนาดตัวอักษร
      </legend>
      <div className="flex flex-wrap gap-2">
        {SIZES.map((size) => {
          const chosen = size.id === value.id;
          const fits = fitsField(box, size.emMm);
          return (
            <label
              key={size.id}
              className="relative flex min-h-11 items-center gap-2 rounded-full border px-4 text-[13px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
              style={{
                borderColor: chosen ? "var(--hoop-ink)" : "var(--hoop-line)",
                background: chosen ? "var(--hoop-panel)" : "transparent",
                outlineColor: "var(--hoop-ink)",
                cursor: fits ? "pointer" : "not-allowed",
                color: fits ? "var(--hoop-ink)" : "var(--hoop-muted)",
              }}
            >
              <input
                type="radio"
                name="letter-size"
                value={size.id}
                checked={chosen}
                disabled={!fits}
                onChange={() => onChange(size)}
                className="sr-only"
              />
              {size.label}
              <span className="tabular-nums" style={{ color: "var(--hoop-muted)" }}>
                {fits ? `สูง ${Math.round(inkEm * size.emMm)} มม.` : "ล้นพื้นที่ปัก"}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
