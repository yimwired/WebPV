"use client";

import { useLayoutEffect, useState, type CSSProperties, type KeyboardEvent } from "react";

import { PlantView } from "./plant-view";
import { FIELD_MM } from "./stitches";
import type { useGarden } from "./use-garden";

type Garden = ReturnType<typeof useGarden>;

interface StageProps {
  garden: Garden;
  /** id of the line of key hints, read out with the field */
  hintsId: string;
}

/**
 * The embroidery field, drawn at the bag's real proportions. One em on screen
 * is whatever the fit says one em is on the fabric, so the font size is set in
 * container-width units: the whole design rescales with the window and nothing
 * has to be re-measured to do it.
 *
 * Typing goes into a real input laid over the field. It is invisible, but it is
 * the thing that has focus, so a phone raises its keyboard, a screen reader
 * reads the name, and Thai input works exactly as it does in any text box.
 */
export function Stage({ garden, hintsId }: StageProps) {
  const { text, sprouts, ghosts, layout, box, emMm, type, measure, textRef, endRef } = garden;
  const [focused, setFocused] = useState(false);

  useLayoutEffect(() => {
    measure();
  }, [measure, emMm]);

  // Centre the design's box, not the text: a vine that runs off to the left
  // would otherwise push the whole garden against the edge.
  const fieldWidthEm = FIELD_MM.width / emMm;
  const fieldHeightEm = FIELD_MM.height / emMm;
  const left = fieldWidthEm / 2 - (box.minX + box.maxX) / 2;
  const top = fieldHeightEm / 2 - (box.minY + box.maxY) / 2;

  const line: CSSProperties = {
    fontSize: `${(emMm / FIELD_MM.width) * 100}cqw`,
    transform: `translate(${left.toFixed(4)}em, ${top.toFixed(4)}em)`,
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      type("");
    }
  };

  const placed = (layer: "back" | "front") => (
    <>
      {sprouts.map((sprout) => {
        const x = layout?.x.get(sprout.id);
        if (!sprout.plant || x === undefined) return null;
        return (
          <PlantView
            key={`${layer}${sprout.id}`}
            plant={sprout.plant}
            x={x}
            layer={layer}
            dying={false}
            offset={sprout.offset}
          />
        );
      })}
      {ghosts.map((ghost) => (
        <PlantView key={`${layer}g${ghost.id}`} plant={ghost.plant} x={ghost.x} layer={layer} dying offset={0} />
      ))}
    </>
  );

  return (
    <div
      className="relative w-full overflow-hidden [container-type:inline-size]"
      style={{ aspectRatio: `${FIELD_MM.width} / ${FIELD_MM.height}` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 border border-dashed transition-colors"
        style={{ borderColor: focused ? "var(--hoop-muted)" : "var(--hoop-line)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-3 left-3 text-[11px] tracking-wide tabular-nums sm:top-4 sm:left-4 sm:text-xs"
        style={{ color: "var(--hoop-muted)" }}
      >
        พื้นที่ปัก {FIELD_MM.width / 10} × {FIELD_MM.height / 10} ซม.
      </span>

      <div className="absolute top-0 left-0 transition-transform duration-300 ease-out" style={line}>
        {placed("back")}
        <span
          ref={textRef}
          aria-hidden
          className="absolute left-0 leading-none whitespace-pre"
          style={{
            top: `${-(layout?.baseline ?? 0.8)}em`,
            fontFamily: "var(--font-hoop-latin), var(--font-hoop-thai), serif",
            color: "var(--hoop-ink)",
          }}
        >
          {text}
          <span ref={endRef} className="inline-block h-0 w-0" />
        </span>
        {placed("front")}
        {focused && layout ? (
          <span
            aria-hidden
            className="hoop-caret absolute"
            style={{
              left: `${layout.end + 0.03}em`,
              top: "-0.78em",
              width: "0.03em",
              height: "0.98em",
              background: "var(--hoop-ink)",
            }}
          />
        ) : null}
      </div>

      <input
        type="text"
        value={text}
        onChange={(event) => type(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="ชื่อที่จะปัก"
        aria-describedby={hintsId}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        maxLength={60}
        className="absolute inset-0 h-full w-full cursor-text text-[16px] opacity-0"
      />
    </div>
  );
}
