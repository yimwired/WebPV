"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";

import type { Fit } from "./fit";
import { PlantView } from "./plant-view";
import type { MarkWindow } from "./scene";
import type { Garden } from "./use-garden";
import type { Piece } from "./weave";

/** The display face, Latin first so Thai falls through to the Thai face. */
const TEXT_FONT = "var(--font-trellis-latin), var(--font-trellis-thai), serif";

interface StageProps {
  garden: Garden;
  fit: Fit | null;
  pieces: Map<number, Piece[]>;
  marks: MarkWindow[];
  /** id of the line of key hints, read out with the field */
  hintsId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
}

/**
 * The garden, full screen. One em is whatever the fit says it is in pixels,
 * and everything inside is laid out in em, so a new fit rescales the lot
 * without anything being measured again.
 *
 * Typing goes into a real input laid over the whole stage. It is invisible, but
 * it is the thing that has focus, so a phone raises its keyboard, a screen
 * reader reads the text, and Thai input works exactly as it does in any text box.
 */
export function Stage({ garden, fit, pieces, marks, hintsId, inputRef, stageRef }: StageProps) {
  const { text, sprouts, ghosts, lines, layout, glyphOf, type, regrow, measure, lineRefs, endRefs, probeRef } = garden;
  const [focused, setFocused] = useState(false);
  const [rustle, setRustle] = useState<Map<number, "a" | "b">>(() => new Map());
  const hovered = useRef<number | null>(null);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  /** The letter under a point on the screen, if it has a plant. */
  const letterAt = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage || !fit || !layout) return null;
      const rect = stage.getBoundingClientRect();
      const x = (clientX - rect.left - fit.originX) / fit.fontPx;
      const y = (clientY - rect.top - fit.originY) / fit.fontPx;
      for (const sprout of sprouts) {
        const at = layout.at.get(sprout.id);
        const glyph = glyphOf(sprout);
        if (!at || !glyph || !sprout.plant) continue;
        const inside =
          x >= at.x + glyph.left - 0.03 &&
          x <= at.x + glyph.right + 0.03 &&
          y >= at.y + glyph.top - 0.05 &&
          y <= at.y + glyph.bottom + 0.05;
        if (inside) return sprout.id;
      }
      return null;
    },
    [stageRef, fit, layout, sprouts, glyphOf],
  );

  // A mouse passing over a letter shakes its plant, once per letter entered.
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const id = letterAt(event.clientX, event.clientY);
    if (id === hovered.current) return;
    hovered.current = id;
    if (id === null) return;
    setRustle((current) => new Map(current).set(id, current.get(id) === "a" ? "b" : "a"));
  };

  // A press on a letter grows it again from a new seed. The press also lands on
  // the field underneath, so it focuses for typing at the same time.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const id = letterAt(event.clientX, event.clientY);
    if (id !== null) regrow(id);
  };

  // Typing only ever happens at the end, which is where the caret is drawn.
  const keepCaretAtEnd = () => {
    const input = inputRef.current;
    if (!input) return;
    const end = input.value.length;
    if (input.selectionStart !== end || input.selectionEnd !== end) input.setSelectionRange(end, end);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      type("");
    }
  };

  const design: CSSProperties = {
    fontFamily: TEXT_FONT,
    fontSize: fit ? `${fit.fontPx}px` : "100px",
    transform: fit ? `translate(${fit.originX}px, ${fit.originY}px)` : undefined,
    opacity: fit && garden.ready ? 1 : 0,
  };
  const baseline = layout?.baseline ?? 0.8;

  const plants = (layer: "back" | "front") => (
    <>
      {sprouts.map((sprout) => {
        const at = layout?.at.get(sprout.id);
        if (!sprout.plant || !at) return null;
        return (
          <PlantView
            key={`${layer}${sprout.id}`}
            plant={sprout.plant}
            x={at.x}
            y={at.y}
            layer={layer}
            pieces={layer === "front" ? pieces.get(sprout.id) : undefined}
            dying={false}
            offset={sprout.offset}
            rustle={rustle.get(sprout.id)}
          />
        );
      })}
      {ghosts.map((ghost) => (
        <PlantView key={`${layer}g${ghost.id}`} plant={ghost.plant} x={ghost.x} y={ghost.y} layer={layer} dying offset={0} />
      ))}
    </>
  );

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 overflow-hidden"
      onPointerMove={onPointerMove}
      onClick={onClick}
    >
      <div ref={probeRef} className="pointer-events-none absolute top-0 left-0 transition-opacity duration-500" style={design}>
        {plants("back")}
        {lines.map((line, l) => (
          <span
            key={l}
            ref={(el) => {
              lineRefs.current[l] = el;
            }}
            aria-hidden
            data-line={l}
            className="absolute leading-none whitespace-pre"
            style={{ left: `${layout?.lines[l]?.x ?? 0}em`, top: `${(layout?.lines[l]?.y ?? 0) - baseline}em` }}
          >
            {line.map((s) => s.text).join("")}
            <span
              ref={(el) => {
                endRefs.current[l] = el;
              }}
              className="inline-block h-0 w-0"
            />
          </span>
        ))}
        {plants("front")}
        {marks.map((w) => {
          const line = layout?.lines[w.line];
          if (!line) return null;
          return (
            <div
              key={w.key}
              aria-hidden
              data-marks=""
              className="absolute overflow-hidden"
              style={{ left: `${w.x}em`, top: `${w.y}em`, width: `${w.width}em`, height: `${w.height}em` }}
            >
              <span
                className="tr-marks absolute leading-none whitespace-pre"
                style={{ left: `${line.x - w.x}em`, top: `${line.y - baseline - w.y}em` }}
              >
                {lines[w.line].map((s) => s.text).join("")}
              </span>
            </div>
          );
        })}
        {focused && layout ? (
          <span
            aria-hidden
            className="tr-caret absolute"
            style={{
              left: `${layout.caret.x + 0.04}em`,
              top: `${layout.caret.y - 0.74}em`,
              width: "0.025em",
              height: "0.94em",
              background: "var(--tr-ink)",
            }}
          />
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(event) => type(event.target.value)}
        onKeyDown={onKeyDown}
        onSelect={keepCaretAtEnd}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="ข้อความที่จะปลูก"
        aria-describedby={hintsId}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        className="absolute inset-0 h-full w-full cursor-text text-[16px] opacity-0"
      />
    </div>
  );
}
