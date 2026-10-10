/**
 * The garden as a file. Built from the same plants, crossings and mark
 * windows the stage draws, placed by the same fit at the file's own size: a
 * 16:9 title card from Type, the 4:5 sheet from Poster.
 *
 * The SVG carries its fonts inside it, only the faces its characters use, so
 * the letters are the right letters wherever it is opened. The PNG is that SVG
 * drawn onto a canvas, which is also why making one needs nothing the page has
 * not already loaded.
 */

import { fitDesign } from "./fit";
import type { Palette } from "./palettes";
import type { Bounds } from "./plant";
import type { MarkWindow } from "./scene";
import type { Layout, Mode, Sprout } from "./use-garden";
import type { Piece } from "./weave";

export const EXPORT_SIZE = {
  type: { width: 1920, height: 1080 },
  poster: { width: 1080, height: 1350 },
} as const;

export interface SceneInput {
  mode: Mode;
  lines: Sprout[][];
  layout: Layout;
  box: Bounds;
  sprouts: Sprout[];
  pieces: Map<number, Piece[]>;
  marks: MarkWindow[];
  palette: Palette;
  /** the display face's computed font-family stack */
  family: string;
  /** the poster caption's, a sans so its figures read as figures */
  captionFamily: string;
  footer: { left: string; right: string } | null;
}

const px = (value: number) => Math.round(value * 100) / 100;
const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function sceneText(input: SceneInput): string {
  return input.lines.map((line) => line.map((s) => s.text).join("")).join("") + (input.footer ? input.footer.left + input.footer.right : "");
}

export function buildSvg(input: SceneInput, fontCss: string) {
  const size = EXPORT_SIZE[input.mode];
  const fit = fitDesign(size, input.mode, input.layout, input.box, false);
  const c = input.palette.colors;
  const em = fit.fontPx;
  const design = `translate(${px(fit.originX)} ${px(fit.originY)}) scale(${px(em)})`;
  const font = `font-family="${escape(input.family)}" font-size="${px(em)}"`;
  const lineText = (l: number) => escape(input.lines[l].map((s) => s.text).join(""));
  const placed = input.sprouts.flatMap((sprout) => {
    const at = input.layout.at.get(sprout.id);
    return sprout.plant && at ? [{ sprout, plant: sprout.plant, at }] : [];
  });

  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">`,
    `<style>${fontCss}</style>`,
    `<rect width="100%" height="100%" fill="${c.ground}"/>`,
  );

  // Stems, behind the letters.
  out.push(`<g transform="${design}" fill="none" stroke="${c.vine}" stroke-linecap="round" stroke-linejoin="round">`);
  for (const { plant, at } of placed) {
    out.push(`<g transform="translate(${at.x} ${at.y})">`);
    for (const vine of plant.vines) {
      out.push(`<path d="${vine.d}" stroke-width="0.022"/>`);
      if (vine.thorns) out.push(`<path d="${vine.thorns}" stroke-width="0.011"/>`);
    }
    out.push(`</g>`);
  }
  out.push(`</g>`);

  // The letters.
  input.layout.lines.forEach((line, l) => {
    out.push(
      `<text x="${px(fit.originX + line.x * em)}" y="${px(fit.originY + line.y * em)}" ${font} fill="${c.ink}" xml:space="preserve">${lineText(l)}</text>`,
    );
  });

  // Everything in front of them.
  out.push(`<g transform="${design}" stroke-linecap="round" stroke-linejoin="round">`);
  for (const { sprout, plant, at } of placed) {
    out.push(`<g transform="translate(${at.x} ${at.y})">`);
    for (const piece of input.pieces.get(sprout.id) ?? []) {
      out.push(`<path d="${piece.d}" fill="none" stroke="${c.vine}" stroke-width="0.022"/>`);
    }
    for (const leaf of plant.leaves) {
      out.push(
        `<g transform="translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})"><path d="${leaf.d}" fill="${c.vine}"/><path d="${leaf.rib}" fill="none" stroke="${c.ground}" stroke-width="0.0065"/></g>`,
      );
    }
    for (const bud of plant.buds) {
      out.push(
        `<path transform="translate(${bud.x} ${bud.y})" d="${bud.d}" fill="${c.rose}" stroke="${c.ground}" stroke-width="0.018" paint-order="stroke"/>`,
      );
    }
    for (const rose of plant.roses) {
      out.push(
        `<g transform="translate(${rose.x} ${rose.y})"><path d="${rose.d}" fill="${c.rose}" stroke="${c.ground}" stroke-width="0.018" paint-order="stroke"/>${
          rose.detail ? `<path d="${rose.detail}" fill="none" stroke="${c.roseLine}" stroke-width="0.009"/>` : ""
        }</g>`,
      );
    }
    out.push(`</g>`);
  }
  out.push(`</g>`);

  // Marks again, on top of everything, edged in the ground colour.
  if (input.marks.length) {
    out.push(`<defs>`);
    input.marks.forEach((w, i) => {
      out.push(
        `<clipPath id="m${i}"><rect x="${px(fit.originX + w.x * em)}" y="${px(fit.originY + w.y * em)}" width="${px(w.width * em)}" height="${px(w.height * em)}"/></clipPath>`,
      );
    });
    out.push(`</defs>`);
    input.marks.forEach((w, i) => {
      const line = input.layout.lines[w.line];
      out.push(
        `<text clip-path="url(#m${i})" x="${px(fit.originX + line.x * em)}" y="${px(fit.originY + line.y * em)}" ${font} fill="${c.ink}" stroke="${c.ground}" stroke-width="${px(em * 0.024)}" stroke-linejoin="round" paint-order="stroke" xml:space="preserve">${lineText(w.line)}</text>`,
      );
    });
  }

  if (input.footer) {
    const y = size.height * 0.95;
    const caption = `font-family="${escape(input.captionFamily)}" font-size="${px(size.width * 0.022)}" fill="${c.muted}"`;
    out.push(`<text x="${px(size.width * 0.1)}" y="${px(y)}" ${caption}>${escape(input.footer.left)}</text>`);
    out.push(`<text x="${px(size.width * 0.9)}" y="${px(y)}" text-anchor="end" ${caption}>${escape(input.footer.right)}</text>`);
  }

  out.push(`</svg>`);
  return { svg: out.join(""), ...size };
}

/**
 * @font-face rules for the faces in a font stack, with the files inlined, and
 * only those whose unicode-range covers a character that is actually used.
 */
export async function embeddedFonts(stack: string, text: string): Promise<string> {
  const wanted = new Set(stack.split(",").map((name) => name.trim().replace(/^["']|["']$/g, "")));
  const used = new Set(Array.from(text, (ch) => ch.codePointAt(0) ?? 0));
  const faces: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = rule.style.getPropertyValue("font-family").trim().replace(/^["']|["']$/g, "");
      if (!wanted.has(family)) continue;
      const range = rule.style.getPropertyValue("unicode-range");
      if (range && !covers(range, used)) continue;
      const url = /url\((["']?)([^"')]+)\1\)/.exec(rule.style.getPropertyValue("src"))?.[2];
      if (!url) continue;
      const data = await dataUrl(new URL(url, sheet.href ?? location.href).href);
      const weight = rule.style.getPropertyValue("font-weight") || "400";
      const style = rule.style.getPropertyValue("font-style") || "normal";
      faces.push(
        `@font-face{font-family:"${family}";src:url(${data});font-weight:${weight};font-style:${style};${range ? `unicode-range:${range};` : ""}}`,
      );
    }
  }
  return faces.join("");
}

function covers(range: string, used: Set<number>): boolean {
  for (const part of range.split(",")) {
    const match = /U\+([0-9A-F?]+)(?:-([0-9A-F]+))?/i.exec(part.trim());
    if (!match) continue;
    const wild = match[1].includes("?");
    const low = parseInt(wild ? match[1].replace(/\?/g, "0") : match[1], 16);
    const high = wild ? parseInt(match[1].replace(/\?/g, "F"), 16) : match[2] ? parseInt(match[2], 16) : low;
    for (const point of used) if (point >= low && point <= high) return true;
  }
  return false;
}

async function dataUrl(href: string): Promise<string> {
  const blob = await (await fetch(href)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Draws the SVG onto a canvas at `scale` and encodes it. */
export async function svgToPng(svg: string, width: number, height: number, scale = 2): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The SVG could not be drawn"));
      image.src = url;
    });
    // An SVG image can report loaded before its inlined fonts are ready to
    // paint; decode() waits for them in the browsers that would otherwise
    // draw the first frame in a fallback face.
    await image.decode().catch(() => undefined);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** A file name from the text, safe on every system the file might land on. */
export function fileName(text: string, extension: string): string {
  const stem = text.trim().replace(/[\\/:*?"<>|\s]+/g, "-").slice(0, 32) || "garden";
  return `trellis-${stem}.${extension}`;
}
