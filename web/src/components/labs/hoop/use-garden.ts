"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { clustersOf, measureGlyph } from "./glyph";
import { growPlant, plantMaterial, seedFor, LATIN_CLEARANCE, type Bounds, type Clearance, type Plant } from "./plant";
import { FIELD_MM, quote, type Material, type Quote } from "./stitches";

/** One typed character and what grew out of it. */
export interface Sprout {
  id: number;
  text: string;
  /** null for a space, or until the fonts have loaded */
  plant: Plant | null;
  /** ms, so a name filled in at once grows left to right */
  offset: number;
}

/** A sprout that was deleted and is withering where it stood. */
export interface Ghost {
  id: number;
  plant: Plant;
  x: number;
}

export interface LineLayout {
  /** em from the start of the line, per sprout id */
  x: Map<number, number>;
  /** where the caret goes */
  end: number;
  /** distance from the top of the text box down to its baseline */
  baseline: number;
}

/**
 * Letter sizes the shop sews, as the font size on the fabric. Fixed per order,
 * the way a real one is: the letters do not grow when a name gets shorter, so
 * deleting a character always takes stitches off the count rather than adding
 * them by scaling everything up.
 */
export const SIZES = [
  { id: "large", label: "ใหญ่", emMm: 36 },
  { id: "medium", label: "กลาง", emMm: 28 },
  { id: "small", label: "เล็ก", emMm: 21 },
] as const;

export type Size = (typeof SIZES)[number];

/** Room the text needs above and below the baseline before anything is measured. */
const TEXT_TOP = -0.95;
const TEXT_BOTTOM = 0.3;
/** Kept clear inside the field on every side, as a fraction of it. */
const MARGIN = 0.05;

const WITHER_MS = 600;
const STAGGER_MS = 110;

let nextId = 0;
const newSprout = (text: string, offset = 0): Sprout => ({ id: nextId++, text, plant: null, offset });

/** The ink of a whole line, so a flower grown for one letter keeps off the marks of all of them. */
function clearanceOf(clusters: string[], family: string): Clearance {
  let ascent = -LATIN_CLEARANCE.top;
  let descent = LATIN_CLEARANCE.bottom;
  for (const cluster of clusters) {
    const glyph = measureGlyph(cluster, family);
    ascent = Math.max(ascent, glyph.ascent + 0.04);
    descent = Math.max(descent, glyph.descent + 0.04);
  }
  return { top: -ascent, bottom: descent };
}

function grow(sprout: Sprout, index: number, family: string, band: Clearance): Sprout {
  if (sprout.plant || sprout.text.trim() === "") return sprout;
  const { advance } = measureGlyph(sprout.text, family);
  return { ...sprout, plant: growPlant(seedFor(sprout.text, sprout.id), advance, index, band) };
}

/**
 * The box the whole design occupies, in em with the origin at the start of the
 * baseline. Uses the laid-out positions when it has them and the canvas
 * advances when it does not, which is the case for a keystroke not yet rendered.
 */
function designBox(sprouts: Sprout[], family: string | null, layout: LineLayout | null): Bounds {
  const box = { minX: 0, minY: TEXT_TOP, maxX: 0, maxY: TEXT_BOTTOM };
  let cursor = 0;
  for (const sprout of sprouts) {
    const x = layout?.x.get(sprout.id) ?? cursor;
    const advance = family ? measureGlyph(sprout.text, family).advance : 0.5;
    box.maxX = Math.max(box.maxX, x + advance);
    if (sprout.plant) {
      const b = sprout.plant.bounds;
      box.minX = Math.min(box.minX, x + b.minX);
      box.maxX = Math.max(box.maxX, x + b.maxX);
      box.minY = Math.min(box.minY, b.minY);
      box.maxY = Math.max(box.maxY, b.maxY);
    }
    cursor = x + advance;
  }
  return box;
}

/** Whether a design box, at a given letter size, fits inside the field. */
export function fitsField(box: Bounds, emMm: number): boolean {
  return (
    (box.maxX - box.minX) * emMm <= FIELD_MM.width * (1 - 2 * MARGIN) &&
    (box.maxY - box.minY) * emMm <= FIELD_MM.height * (1 - 2 * MARGIN)
  );
}

export function useGarden(initial: string) {
  const [sprouts, setSprouts] = useState<Sprout[]>(() =>
    clustersOf(initial).map((text, i) => newSprout(text, i * STAGGER_MS)),
  );
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [family, setFamily] = useState<string | null>(null);
  const [layout, setLayout] = useState<LineLayout | null>(null);
  const [size, setSize] = useState<Size>(SIZES[0]);
  const [tooLong, setTooLong] = useState(false);

  const textRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<HTMLSpanElement>(null);

  // Nothing can be measured or grown until the display faces have arrived: the
  // canvas would measure the fallback serif and every plant would sit wrong.
  useEffect(() => {
    const text = textRef.current;
    if (!text) return;
    const stack = getComputedStyle(text).fontFamily;
    let cancelled = false;
    document.fonts
      .load(`400 100px ${stack}`, "กข้ัAag")
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
    setSprouts((current) => {
      const band = clearanceOf(current.map((s) => s.text), family);
      return current.map((s, i) => grow(s, i, family, band));
    });
  }

  const text = useMemo(() => sprouts.map((s) => s.text).join(""), [sprouts]);
  const box = useMemo(() => designBox(sprouts, family, layout), [sprouts, family, layout]);

  const wither = useCallback(
    (removed: Sprout[]) => {
      const dying = removed.flatMap((s) =>
        s.plant ? [{ id: s.id, plant: s.plant, x: layout?.x.get(s.id) ?? 0 }] : [],
      );
      if (dying.length) setGhosts((current) => [...current, ...dying]);
    },
    [layout],
  );

  /** Diff the new value against the old by common prefix and suffix, so only
   *  the characters that actually changed grow or wither, wherever the caret is. */
  const type = useCallback(
    (value: string) => {
      const next = clustersOf(value);
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
      const band = family ? clearanceOf(next, family) : LATIN_CLEARANCE;
      const added = next.slice(head, next.length - tail).map((cluster, k) => {
        const sprout = newSprout(cluster);
        return family ? grow(sprout, head + k, family, band) : sprout;
      });
      const candidate = [...sprouts.slice(0, head), ...added, ...sprouts.slice(sprouts.length - tail)];

      // Refuse a keystroke the field cannot hold at this size, rather than
      // accept it and quote something that cannot be sewn. Once full, the field
      // stays full until something is deleted or the size changes: a narrower
      // letter typed after a refused one would otherwise slip in and leave a
      // name with a hole in it.
      const insertingIntoFull = tooLong && removed.length === 0;
      if (added.length > 0 && (insertingIntoFull || !fitsField(designBox(candidate, family, null), size.emMm))) {
        setTooLong(true);
        return;
      }
      setTooLong(false);
      wither(removed);
      setSprouts(candidate);
    },
    [sprouts, family, size, tooLong, wither],
  );

  /** Replace the whole name, growing it left to right, at the largest size that holds it. */
  const replace = useCallback(
    (value: string) => {
      const clusters = clustersOf(value);
      const band = family ? clearanceOf(clusters, family) : LATIN_CLEARANCE;
      const fresh = clusters.map((cluster, i) => {
        const sprout = newSprout(cluster, i * STAGGER_MS);
        return family ? grow(sprout, i, family, band) : sprout;
      });
      const box = designBox(fresh, family, null);
      const fitting = SIZES.find((s) => fitsField(box, s.emMm));
      if (!fitting) {
        setTooLong(true);
        return;
      }
      wither(sprouts);
      setSprouts(fresh);
      setSize((current) => (fitsField(box, current.emMm) ? current : fitting));
      setTooLong(false);
    },
    [sprouts, family, wither],
  );

  /** Pick a letter size; one the current design cannot fit is refused. */
  const resize = useCallback(
    (next: Size) => {
      if (!fitsField(box, next.emMm)) return;
      setSize(next);
      setTooLong(false);
    },
    [box],
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
    const textEl = textRef.current;
    const endEl = endRef.current;
    const node = textEl?.firstChild;
    if (!textEl || !endEl) return;

    const origin = textEl.getBoundingClientRect();
    const fontPx = parseFloat(getComputedStyle(textEl).fontSize) || 1;
    const x = new Map<number, number>();

    if (node && node.nodeType === Node.TEXT_NODE) {
      const range = document.createRange();
      let offset = 0;
      for (const sprout of sprouts) {
        range.setStart(node, offset);
        range.setEnd(node, offset + sprout.text.length);
        x.set(sprout.id, round((range.getBoundingClientRect().left - origin.left) / fontPx));
        offset += sprout.text.length;
      }
    }

    const end = endEl.getBoundingClientRect();
    const next: LineLayout = {
      x,
      end: round((end.left - origin.left) / fontPx),
      baseline: round((end.top - origin.top) / fontPx),
    };
    setLayout((current) => (current && sameLayout(current, next) ? current : next));
  }, [sprouts]);

  const material = useMemo<Material | null>(() => {
    if (!family) return null;
    const total: Material = { letterPerimeter: 0, vineLength: 0, leafArea: 0, roseArea: 0, detailLength: 0 };
    for (const sprout of sprouts) {
      total.letterPerimeter += measureGlyph(sprout.text, family).perimeter;
      if (!sprout.plant) continue;
      const part = plantMaterial(sprout.plant);
      total.vineLength += part.vineLength;
      total.leafArea += part.leafArea;
      total.roseArea += part.roseArea;
      total.detailLength += part.detailLength;
    }
    return total;
  }, [sprouts, family]);

  const estimate = useMemo<Quote | null>(() => {
    if (!material) return null;
    const anyPlant = sprouts.some((s) => s.plant);
    const anyRose = sprouts.some((s) => (s.plant?.roses.length ?? 0) + (s.plant?.buds.length ?? 0) > 0);
    const anyPetal = sprouts.some((s) => (s.plant?.roses.length ?? 0) > 0);
    const colours = (text.trim() ? 1 : 0) + (anyPlant ? 1 : 0) + (anyRose ? 1 : 0) + (anyPetal ? 1 : 0);
    return quote(material, size.emMm, colours);
  }, [material, size, sprouts, text]);

  /** Top of the highest mark to the bottom of the lowest descender, on the fabric. */
  const inkMm = useMemo(() => {
    if (!family || !text.trim()) return 0;
    let ascent = 0;
    let descent = 0;
    for (const sprout of sprouts) {
      const glyph = measureGlyph(sprout.text, family);
      ascent = Math.max(ascent, glyph.ascent);
      descent = Math.max(descent, glyph.descent);
    }
    return (ascent + descent) * size.emMm;
  }, [sprouts, family, text, size]);

  return {
    text,
    sprouts,
    ghosts,
    layout,
    box,
    size,
    emMm: size.emMm,
    inkMm,
    estimate,
    ready: family !== null,
    tooLong,
    type,
    replace,
    resize,
    measure,
    textRef,
    endRef,
  };
}

const round = (value: number) => Math.round(value * 10000) / 10000;

/**
 * Positions are compared with a tolerance because they feed the design box: a
 * re-measure that differs by a hinting rounding would recentre the line, measure
 * again and never settle.
 */
const TOLERANCE = 0.003;
const near = (a: number, b: number) => Math.abs(a - b) < TOLERANCE;

function sameLayout(a: LineLayout, b: LineLayout): boolean {
  if (!near(a.end, b.end) || !near(a.baseline, b.baseline) || a.x.size !== b.x.size) return false;
  for (const [id, x] of b.x) {
    const previous = a.x.get(id);
    if (previous === undefined || !near(previous, x)) return false;
  }
  return true;
}
