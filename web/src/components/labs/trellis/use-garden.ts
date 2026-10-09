"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { clustersOf, measureGlyph, type Glyph } from "./glyph";
import { growPlant, seedFor, type Bounds, type Plant } from "./plant";

/** One typed character and what grew out of it. */
export interface Sprout {
  id: number;
  text: string;
  /** chosen when the character is typed; the plant is a pure function of it and the letter */
  seed: number;
  /** null for a space, or until the fonts have loaded */
  plant: Plant | null;
  /** ms, so a word put in at once grows left to right */
  offset: number;
}

/** A sprout that was deleted and is withering where it stood. */
export interface Ghost {
  id: number;
  plant: Plant;
  x: number;
  y: number;
}

/** Type sets one line; Poster stacks the words, one per line. */
export type Mode = "type" | "poster";

export interface Placement {
  x: number;
  y: number;
}

export interface Layout {
  /** em, each sprout's origin on its baseline */
  at: Map<number, Placement>;
  /** where the caret stands */
  caret: Placement;
  /** each line's left edge, baseline and width */
  lines: { x: number; y: number; width: number }[];
  /** em from the top of a line's text box down to its baseline */
  baseline: number;
}

/** Baseline to baseline in Poster, em. Close enough that one word's garden grows into the next. */
const POSTER_LEADING = 1.18;
/** Above this many characters the input stops taking more. */
const MAX_CLUSTERS = 36;

const WITHER_MS = 600;
const STAGGER_MS = 90;

let nextId = 0;
const randomSeed = () => Math.floor(Math.random() * 0x7fffffff);
const newSprout = (text: string, seed: number, offset = 0): Sprout => ({ id: nextId++, text, seed, plant: null, offset });

function grow(sprout: Sprout, index: number, family: string): Sprout {
  if (sprout.plant || sprout.text.trim() === "") return sprout;
  const glyph = measureGlyph(sprout.text, family);
  return { ...sprout, plant: growPlant(seedFor(sprout.text, sprout.seed), glyph, index) };
}

/** Which sprouts sit on which line. Poster breaks at every space and drops it. */
export function linesOf(sprouts: Sprout[], mode: Mode): Sprout[][] {
  if (mode === "type") return [sprouts];
  const lines: Sprout[][] = [[]];
  for (const sprout of sprouts) {
    if (sprout.text.trim() === "") {
      if (lines[lines.length - 1].length > 0) lines.push([]);
      continue;
    }
    lines[lines.length - 1].push(sprout);
  }
  if (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop();
  return lines;
}

export interface Initial {
  text: string;
  seeds?: number[];
}

export function useGarden(initial: Initial, mode: Mode) {
  const [sprouts, setSprouts] = useState<Sprout[]>(() =>
    clustersOf(initial.text).map((text, i) => newSprout(text, initial.seeds?.[i] ?? i, i * STAGGER_MS)),
  );
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [family, setFamily] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);

  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const endRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const probeRef = useRef<HTMLDivElement>(null);

  // Nothing can be measured or grown until the display faces have arrived: the
  // canvas would measure the fallback serif and every plant would sit wrong.
  // A face that fails to arrive at all is not waited for. The page then draws
  // the fallback, the canvas measures the same fallback, and the garden still
  // grows, where an unhandled failure here would leave it bare for good.
  useEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const stack = getComputedStyle(probe).fontFamily;
    let cancelled = false;
    document.fonts
      .load(`400 100px ${stack}`, "กข้ัAag")
      .catch(() => [])
      .then(() => document.fonts.ready)
      .then(() => {
        if (!cancelled) setFamily(stack);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sprouts typed or set before the fonts loaded get their plants now. Adjusted
  // during render, keyed on the font, rather than in an effect, so the garden
  // and the text it grows from never paint a frame apart.
  const [grownFor, setGrownFor] = useState<string | null>(null);
  if (family && grownFor !== family) {
    setGrownFor(family);
    setSprouts((current) => current.map((s, i) => grow(s, i, family)));
  }

  const text = useMemo(() => sprouts.map((s) => s.text).join(""), [sprouts]);
  const lines = useMemo(() => linesOf(sprouts, mode), [sprouts, mode]);

  const glyphOf = useCallback((sprout: Sprout): Glyph | null => (family ? measureGlyph(sprout.text, family) : null), [family]);

  const wither = useCallback(
    (removed: Sprout[]) => {
      const dying = removed.flatMap((s) => {
        const at = layout?.at.get(s.id);
        return s.plant && at ? [{ id: s.id, plant: s.plant, x: at.x, y: at.y }] : [];
      });
      if (dying.length) setGhosts((current) => [...current, ...dying]);
    },
    [layout],
  );

  /** Diff the new value against the old by common prefix and suffix, so only
   *  the characters that actually changed grow or wither. */
  const type = useCallback(
    (value: string) => {
      const next = clustersOf(value).slice(0, MAX_CLUSTERS);
      let head = 0;
      while (head < sprouts.length && head < next.length && sprouts[head].text === next[head]) head++;
      let tail = 0;
      while (
        tail < sprouts.length - head &&
        tail < next.length - head &&
        sprouts[sprouts.length - 1 - tail].text === next[next.length - 1 - tail]
      ) {
        tail++;
      }
      const removed = sprouts.slice(head, sprouts.length - tail);
      const added = next.slice(head, next.length - tail).map((cluster, k) => {
        const sprout = newSprout(cluster, randomSeed());
        return family ? grow(sprout, head + k, family) : sprout;
      });
      if (removed.length === 0 && added.length === 0) return;
      wither(removed);
      setSprouts([...sprouts.slice(0, head), ...added, ...sprouts.slice(sprouts.length - tail)]);
    },
    [sprouts, family, wither],
  );

  /** Put in a whole text at once, growing it left to right; a shared link brings its own seeds. */
  const replace = useCallback(
    (value: string, seeds?: number[]) => {
      const fresh = clustersOf(value)
        .slice(0, MAX_CLUSTERS)
        .map((cluster, i) => {
          const sprout = newSprout(cluster, seeds?.[i] ?? randomSeed(), i * STAGGER_MS);
          return family ? grow(sprout, i, family) : sprout;
        });
      wither(sprouts);
      setSprouts(fresh);
    },
    [sprouts, family, wither],
  );

  /** Grow a letter again from a new seed: the old plant withers where it stood. */
  const regrow = useCallback(
    (id: number) => {
      const index = sprouts.findIndex((s) => s.id === id);
      if (index < 0 || !sprouts[index].plant) return;
      const old = sprouts[index];
      const sprout = newSprout(old.text, randomSeed());
      wither([old]);
      setSprouts(sprouts.map((s, i) => (i === index ? (family ? grow(sprout, index, family) : sprout) : s)));
    },
    [sprouts, family, wither],
  );

  // Withered plants leave the DOM once their animation has played.
  useEffect(() => {
    if (ghosts.length === 0) return;
    const ids = new Set(ghosts.map((g) => g.id));
    const timer = setTimeout(() => setGhosts((current) => current.filter((g) => !ids.has(g.id))), WITHER_MS);
    return () => clearTimeout(timer);
  }, [ghosts]);

  /** Read where each character landed. Called by the stage after layout. */
  const measure = useCallback(() => {
    const at = new Map<number, Placement>();
    const measured: { width: number; baseline: number; offsets: [number, number][] }[] = [];

    lines.forEach((line, l) => {
      const span = lineRefs.current[l];
      const end = endRefs.current[l];
      if (!span || !end) return;
      const origin = span.getBoundingClientRect();
      const fontPx = parseFloat(getComputedStyle(span).fontSize) || 1;
      const node = span.firstChild;
      const offsets: [number, number][] = [];
      if (node && node.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        let offset = 0;
        for (const sprout of line) {
          range.setStart(node, offset);
          range.setEnd(node, offset + sprout.text.length);
          offsets.push([sprout.id, round((range.getBoundingClientRect().left - origin.left) / fontPx)]);
          offset += sprout.text.length;
        }
      }
      const marker = end.getBoundingClientRect();
      measured.push({
        width: round((marker.left - origin.left) / fontPx),
        baseline: round((marker.top - origin.top) / fontPx),
        offsets,
      });
    });
    if (measured.length !== lines.length) return;

    const widest = Math.max(0, ...measured.map((m) => m.width));
    const placedLines = measured.map((m, l) => ({
      x: mode === "poster" ? round((widest - m.width) / 2) : 0,
      y: l * (mode === "poster" ? POSTER_LEADING : 0),
      width: m.width,
    }));
    measured.forEach((m, l) => {
      for (const [id, x] of m.offsets) at.set(id, { x: placedLines[l].x + x, y: placedLines[l].y });
    });
    const lastLine = placedLines[placedLines.length - 1];
    const next: Layout = {
      at,
      caret: { x: lastLine ? lastLine.x + lastLine.width : 0, y: lastLine ? lastLine.y : 0 },
      lines: placedLines,
      baseline: measured[0]?.baseline ?? 0.8,
    };
    setLayout((current) => (current && sameLayout(current, next) ? current : next));
  }, [lines, mode]);

  /** The box the whole design occupies, em, origin at the first baseline's start. */
  const box = useMemo<Bounds>(() => {
    const result = { minX: 0, minY: -0.75, maxX: 0, maxY: 0.25 };
    if (!layout) return result;
    for (const line of layout.lines) {
      result.minX = Math.min(result.minX, line.x);
      result.maxX = Math.max(result.maxX, line.x + line.width);
      result.minY = Math.min(result.minY, line.y - 0.75);
      result.maxY = Math.max(result.maxY, line.y + 0.25);
    }
    for (const sprout of sprouts) {
      const at = layout.at.get(sprout.id);
      if (!sprout.plant || !at) continue;
      const b = sprout.plant.bounds;
      result.minX = Math.min(result.minX, at.x + b.minX);
      result.maxX = Math.max(result.maxX, at.x + b.maxX);
      result.minY = Math.min(result.minY, at.y + b.minY);
      result.maxY = Math.max(result.maxY, at.y + b.maxY);
    }
    return result;
  }, [layout, sprouts]);

  return {
    text,
    sprouts,
    ghosts,
    lines,
    layout,
    box,
    /** the display face's font-family stack, once it has loaded */
    family,
    ready: family !== null,
    glyphOf,
    type,
    replace,
    regrow,
    measure,
    lineRefs,
    endRefs,
    probeRef,
  };
}

export type Garden = ReturnType<typeof useGarden>;

const round = (value: number) => Math.round(value * 10000) / 10000;

/**
 * Positions are compared with a tolerance: a re-measure that differs by a
 * hinting rounding would otherwise re-render, measure again and never settle.
 */
const TOLERANCE = 0.003;
const near = (a: number, b: number) => Math.abs(a - b) < TOLERANCE;

function sameLayout(a: Layout, b: Layout): boolean {
  if (!near(a.caret.x, b.caret.x) || !near(a.caret.y, b.caret.y) || !near(a.baseline, b.baseline)) return false;
  if (a.at.size !== b.at.size) return false;
  if (a.lines.length !== b.lines.length) return false;
  for (let i = 0; i < a.lines.length; i++) {
    if (!near(a.lines[i].x, b.lines[i].x) || !near(a.lines[i].width, b.lines[i].width)) return false;
  }
  for (const [id, p] of b.at) {
    const q = a.at.get(id);
    if (!q || !near(p.x, q.x) || !near(p.y, q.y)) return false;
  }
  return true;
}
