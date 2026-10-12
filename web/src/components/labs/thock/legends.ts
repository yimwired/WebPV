/**
 * The printing on the caps, painted in the browser rather than shipped as
 * images: one layer per key, then one per object cast into the glass caps.
 * Each layer is coverage only, in a single channel, so the shader can print it
 * in whatever colour the cap's plastic calls for and a colourway change never
 * repaints anything here.
 *
 * Character keys carry the Latin top left and the Thai bottom right, as keys
 * sold in Thailand do. Everything else is one centred icon or word.
 */

import { KEYS, type IconName, type KeySpec } from "./keys";
import { ARTISAN_DESIGNS } from "./layout";

export const LEGEND_TILE = 128;
/** The first layer holding a glass cap's object; key legends sit below it. */
export const ARTISAN_LAYER = KEYS.length;
export const LEGEND_LAYERS = KEYS.length + ARTISAN_DESIGNS;

/** CSS font-family lists, as next/font hands them over. */
export interface LegendFonts {
  latin: string;
  thai: string;
}

/** Space left between a corner legend and the edge of the cap's top face. */
const MARGIN = LEGEND_TILE * 0.13;

/** Icons drawn on a 24-unit grid, stroked. */
const ICONS: Record<IconName, string> = {
  "arrow-up": "M12 19V5M5.5 11.5 12 5l6.5 6.5",
  "arrow-down": "M12 5v14M5.5 12.5 12 19l6.5-6.5",
  "arrow-left": "M19 12H5M11.5 5.5 5 12l6.5 6.5",
  "arrow-right": "M5 12h14M12.5 5.5 19 12l-6.5 6.5",
  shift: "M12 3.5 3.5 12H8v7.5h8V12h4.5Z",
  enter: "M19 5v6a3 3 0 0 1-3 3H5M9.5 9.5 5 14l4.5 4.5",
  backspace: "M21 6H9.5L4 12l5.5 6H21ZM12.5 9.5l5 5M17.5 9.5l-5 5",
  tab: "M4 12h13M12 7l5 5-5 5M20 6v12",
  caps: "M12 3.5 4.5 11h4v5h7v-5h4ZM8.5 20h7",
  // the looped square of the command key, after lucide's (ISC)
  command: "M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3",
  option: "M3 6h5l8 12h5M14 6h7",
  space: "M4 13v4h16v-4",
};

/**
 * Thai vowels and tone marks that stack on a consonant print on a dotted
 * circle, the convention on Thai keycaps; alone they would float with nothing
 * to sit on.
 */
const COMBINING = /[ัิ-ฺ็-๎]/;

type Anchor = "top-left" | "bottom-right" | "centre";

/**
 * Places text by its measured ink rather than its font box, so a Latin capital
 * and a Thai mark both sit exactly in the corner they are given.
 */
function drawText(ctx: CanvasRenderingContext2D, text: string, font: string, anchor: Anchor) {
  ctx.font = font;
  const ink = ctx.measureText(text);
  const width = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight;
  const height = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent;
  let left: number;
  let top: number;
  if (anchor === "top-left") {
    left = MARGIN;
    top = MARGIN;
  } else if (anchor === "bottom-right") {
    left = LEGEND_TILE - MARGIN - width;
    top = LEGEND_TILE - MARGIN - height;
  } else {
    left = (LEGEND_TILE - width) / 2;
    top = (LEGEND_TILE - height) / 2;
  }
  ctx.fillText(text, left + ink.actualBoundingBoxLeft, top + ink.actualBoundingBoxAscent);
}

function drawIcon(ctx: CanvasRenderingContext2D, icon: IconName) {
  const size = LEGEND_TILE * 0.56;
  const unit = size / 24;
  ctx.save();
  ctx.translate((LEGEND_TILE - size) / 2, (LEGEND_TILE - size) / 2);
  ctx.scale(unit, unit);
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(ICONS[icon]));
  ctx.restore();
}

function drawKey(ctx: CanvasRenderingContext2D, key: KeySpec, fonts: LegendFonts) {
  if (key.icon) {
    drawIcon(ctx, key.icon);
    return;
  }
  if (!key.latin) return;
  if (!key.thai) {
    drawText(ctx, key.latin, `600 ${LEGEND_TILE * 0.3}px ${fonts.latin}`, "centre");
    return;
  }
  drawText(ctx, key.latin, `600 ${LEGEND_TILE * 0.42}px ${fonts.latin}`, "top-left");
  const thai = COMBINING.test(key.thai) ? `◌${key.thai}` : key.thai;
  drawText(ctx, thai, `500 ${LEGEND_TILE * 0.38}px ${fonts.thai}`, "bottom-right");
}

/** The objects cast into the glass caps: a flower, a star, a heart and a bolt. */
function drawArtisan(ctx: CanvasRenderingContext2D, design: number) {
  const centre = LEGEND_TILE / 2;
  const size = LEGEND_TILE * 0.62;
  ctx.save();
  ctx.translate(centre, centre);
  ctx.beginPath();
  switch (design % ARTISAN_DESIGNS) {
    case 0: {
      const reach = size * 0.24;
      const length = size * 0.2;
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal / 5) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * reach;
        const y = Math.sin(angle) * reach;
        // start each petal where its ellipse starts, so no stray edge joins them
        ctx.moveTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        ctx.ellipse(x, y, length, size * 0.13, angle, 0, Math.PI * 2);
      }
      ctx.moveTo(size * 0.12, 0);
      ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
      break;
    }
    case 1: {
      for (let point = 0; point < 10; point++) {
        const radius = point % 2 === 0 ? size * 0.5 : size * 0.21;
        const angle = (point / 10) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      break;
    }
    case 2: {
      const s = size / 24;
      ctx.translate(-12 * s, -12 * s);
      ctx.scale(s, s);
      ctx.moveTo(12, 20.5);
      ctx.bezierCurveTo(5, 15.5, 2.5, 12, 2.5, 8.5);
      ctx.bezierCurveTo(2.5, 5.5, 4.8, 3.5, 7.3, 3.5);
      ctx.bezierCurveTo(9.3, 3.5, 11, 4.6, 12, 6.4);
      ctx.bezierCurveTo(13, 4.6, 14.7, 3.5, 16.7, 3.5);
      ctx.bezierCurveTo(19.2, 3.5, 21.5, 5.5, 21.5, 8.5);
      ctx.bezierCurveTo(21.5, 12, 19, 15.5, 12, 20.5);
      ctx.closePath();
      break;
    }
    default: {
      const s = size / 24;
      ctx.translate(-12 * s, -12 * s);
      ctx.scale(s, s);
      ctx.moveTo(13.5, 2);
      ctx.lineTo(4, 13.5);
      ctx.lineTo(11, 13.5);
      ctx.lineTo(9.5, 22);
      ctx.lineTo(20, 9.5);
      ctx.lineTo(13, 9.5);
      ctx.closePath();
    }
  }
  ctx.fill();
  ctx.restore();
}

/**
 * Waits for the two legend faces, or gives up after `timeoutMs`. A face that
 * fails to load leaves its fallback, which still prints every legend, so this
 * never rejects.
 */
export async function loadLegendFonts(fonts: LegendFonts, timeoutMs = 2500): Promise<void> {
  if (!("fonts" in document)) return;
  const loads = Promise.all([
    document.fonts.load(`600 48px ${fonts.latin}`, "QWERTY123"),
    // Asking with Thai text is what fetches the Thai subset at all: next/font
    // splits each face into unicode ranges and loads only the ones a page uses.
    document.fonts.load(`500 48px ${fonts.thai}`, "ฟหกด◌ุ"),
  ]).then(
    () => undefined,
    () => undefined,
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  await Promise.race([loads, timeout]);
}

/** Every layer, one byte of coverage per texel, in layer order. */
export function paintLegends(fonts: LegendFonts): Uint8Array {
  const tile = LEGEND_TILE;
  const atlas = new Uint8Array(tile * tile * LEGEND_LAYERS);
  const canvas = document.createElement("canvas");
  canvas.width = tile;
  canvas.height = tile;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return atlas;

  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const paint = (layer: number, draw: () => void) => {
    ctx.clearRect(0, 0, tile, tile);
    draw();
    const pixels = ctx.getImageData(0, 0, tile, tile).data;
    const offset = layer * tile * tile;
    for (let i = 0; i < tile * tile; i++) atlas[offset + i] = pixels[i * 4 + 3];
  };

  KEYS.forEach((key, layer) => paint(layer, () => drawKey(ctx, key, fonts)));
  for (let design = 0; design < ARTISAN_DESIGNS; design++) {
    paint(ARTISAN_LAYER + design, () => drawArtisan(ctx, design));
  }
  return atlas;
}
