/**
 * A garden as a link. A plant is a pure function of its letter and its seed,
 * so the text, one seed per character, the palette and the mode are all it
 * takes to grow the same garden on another screen.
 */

import type { Mode } from "./use-garden";

export interface Shared {
  text: string;
  seeds: number[];
  palette: string;
  mode: Mode;
}

export function shareLink(base: string, shared: Shared): string {
  const params = new URLSearchParams();
  params.set("t", shared.text);
  params.set("s", shared.seeds.map((seed) => seed.toString(36)).join("."));
  params.set("p", shared.palette);
  if (shared.mode === "poster") params.set("m", "poster");
  return `${base}?${params.toString()}`;
}

/** Whatever a link carries; anything missing or malformed is left out. */
export function readShared(search: string): Partial<Shared> {
  const params = new URLSearchParams(search);
  const shared: Partial<Shared> = {};
  const text = params.get("t");
  if (text !== null) shared.text = text.slice(0, 200);
  const seeds = params.get("s");
  if (seeds) {
    const parsed = seeds.split(".").map((part) => parseInt(part, 36));
    if (parsed.every((seed) => Number.isFinite(seed) && seed >= 0)) shared.seeds = parsed;
  }
  const palette = params.get("p");
  if (palette) shared.palette = palette;
  if (params.get("m") === "poster") shared.mode = "poster";
  return shared;
}
