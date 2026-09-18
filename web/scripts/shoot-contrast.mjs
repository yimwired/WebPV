// Measure text contrast against what is actually painted behind it. Half of
// The Lab draws its backgrounds on canvas or in a gradient, so the DOM's
// backgroundColor is not the colour the text sits on. Screenshot the element's
// box, load it into a second page's canvas, and read the pixels.
import { chromium } from "playwright";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const ROUTE = process.env.ROUTE || "/labs/contour";

// Defaults to desktop, where most of the labs put their hardest text. Pages
// that only overlap text and artwork at one width take WIDTH/HEIGHT.
const WIDTH = Number(process.env.WIDTH) || 1440;
const HEIGHT = Number(process.env.HEIGHT) || 900;

// Pinned, like shoot-audit, because the site picks its language off
// navigator.language: on a Thai machine this measured the Thai site while the
// audit measured the English one, so the two disagreed about the same element
// and neither said which language it had been looking at. LOCALE=th-TH to
// measure the other one on purpose.
const LOCALE = process.env.LOCALE || "en-US";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  locale: LOCALE,
});
const page = await ctx.newPage();
const reader = await ctx.newPage();
await reader.goto("about:blank");

await page.goto(BASE + ROUTE, { waitUntil: "load" });
// WebGL scenes paint after load; measuring before they do gives every element
// the base page colour as its plate.
await page.waitForTimeout(4000);

/**
 * Wait until the scroll-driven opacities stop moving.
 *
 * A fixed wait is not enough on the heavy pages. `/labs/contour` drives four
 * acts and two grounds off scroll progress while a WebGL scene renders every
 * frame, so a frame can land well after a 900ms pause: the act wrapper still
 * read fully opaque from the previous step while the ground behind it had
 * already changed, and the same run reported 3, then 0, then 2 failures.
 * Watching every inline opacity until three frames agree costs a few frames on
 * a still page and makes the moving ones repeatable.
 */
const settle = async (target, frames = 60) => {
  await target.evaluate(async (limit) => {
    const snapshot = () =>
      [...document.querySelectorAll("[style*='opacity']")]
        .map((el) => getComputedStyle(el).opacity)
        .join(",");
    let last = snapshot();
    let stable = 0;
    for (let i = 0; i < limit && stable < 3; i += 1) {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const now = snapshot();
      stable = now === last ? stable + 1 : 0;
      last = now;
    }
  }, frames);
};

// Walk the page in viewport-sized steps so scroll-driven acts settle before
// their text is measured.
const results = [];
const height = await page.evaluate(() => document.body.scrollHeight);
const STEP = Number(process.env.STEP ?? 400);

for (let y = 0; y < height; y += STEP) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(900);
  await settle(page);

  const candidates = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length || !el.textContent?.trim()) continue;
      const r = el.getBoundingClientRect();
      // The lab switcher is fixed over the bottom ~66px of every demo, and it
      // is part of The Lab rather than part of the page being measured. Text
      // underneath it was being sampled against the switcher's near-black pill,
      // which produced a different set of failures on every scroll step: at
      // STEP 260 ten, at 400 five, at 550 three, never the same elements. Each
      // one is measured properly on another pass, when it is not behind the bar.
      const SWITCHER = 84;
      if (
        r.width < 4 ||
        r.height < 4 ||
        r.top < 0 ||
        r.bottom > window.innerHeight - SWITCHER
      )
        continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden") continue;

      // Scroll-driven acts crossfade. Mid-fade the text is half-transparent
      // over the *outgoing* act's backdrop, which is neither what the visitor
      // reads nor what the author chose. Measure each act at full strength.
      let effective = 1;
      for (let n = el; n; n = n.parentElement) effective *= +getComputedStyle(n).opacity;
      if (effective < 0.95) continue;
      out.push({
        text: el.textContent.trim().slice(0, 34),
        color: cs.color,
        size: parseFloat(cs.fontSize),
        weight: cs.fontWeight,
        // The element's own box plus two pixels. The reader used to sample a
        // 6px ring *outside* the box instead, which only works when the plate
        // is larger than the text. On a pill, a badge or a button it is not:
        // the ring landed on the page behind the control, and the navbar CTA
        // and the active language label both reported 1.01:1 when they are
        // ~19:1. Two pixels is enough to give a tiny box some plate to count
        // without letting the page behind a small control outvote its fill.
        rect: {
          x: Math.max(0, r.x - 2),
          y: Math.max(0, r.y - 2),
          width: Math.min(r.width + 4, 600),
          height: r.height + 4,
        },
      });
    }
    return out;
  });

  const fresh = candidates.filter((c) => !results.some((r) => r.text === c.text));
  if (!fresh.length) continue;

  /**
   * One frame for the whole step, cropped per element in the reader.
   *
   * This used to take a screenshot per candidate, and on a page whose ground
   * crossfades between acts that meant each element was measured against a
   * different frame from the one whose opacity it was gated on. `/labs/contour`
   * reported 3, then 0, then 2 failures across three identical runs, once with
   * a plate of `rgb(12,12,12)` - the bare page colour, with none of the grounds
   * painted. Gating and measuring on the same image makes the run repeatable.
   */
  const frame = await page
    .screenshot({ type: "png" })
    .then((b) => b.toString("base64"))
    .catch(() => null);
  if (!frame) continue;

  // Text pixels are the extreme end of the histogram; the mode is the plate.
  const measured = await reader.evaluate(
    async ({ data, items }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${data}`;
      await img.decode();
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx2 = cv.getContext("2d", { willReadFrequently: true });
      ctx2.drawImage(img, 0, 0);

      // A separate one-pixel canvas for resolving colours: compositing them on
      // the frame canvas would paint over the top left of the page.
      const swatch = document.createElement("canvas");
      swatch.width = 1;
      swatch.height = 1;
      const swatchCtx = swatch.getContext("2d", { willReadFrequently: true });
      const paintOver = (base, colour) => {
        swatchCtx.clearRect(0, 0, 1, 1);
        swatchCtx.fillStyle = `rgb(${base.join(",")})`;
        swatchCtx.fillRect(0, 0, 1, 1);
        swatchCtx.fillStyle = colour;
        swatchCtx.fillRect(0, 0, 1, 1);
        return [...swatchCtx.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };

      const lum = ([r, g, b]) =>
        [r, g, b]
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);

      return items.map(({ rect, color }) => {
        const x = Math.max(0, Math.round(rect.x));
        const y = Math.max(0, Math.round(rect.y));
        const w = Math.min(Math.round(rect.width), cv.width - x);
        const h = Math.min(Math.round(rect.height), cv.height - y);
        if (w < 1 || h < 1) return null;
        const px = ctx2.getImageData(x, y, w, h).data;

        // The plate is the most common colour inside the text box once the
        // glyphs are taken out of the histogram. Both halves matter: sampling
        // the interior is what lets a pill, a badge or a button be measured
        // against its own fill rather than the page behind it, and dropping the
        // glyph pixels is what stops heavy display type from being counted as
        // its own background, which is the reason the ring existed.
        const total = px.length / 4;
        const mode = (exclude) => {
          const counts = new Map();
          let kept = 0;
          for (let i = 0; i < px.length; i += 4) {
            if (exclude?.(px[i], px[i + 1], px[i + 2])) continue;
            kept += 1;
            const key = `${px[i] >> 3},${px[i + 1] >> 3},${px[i + 2] >> 3}`;
            counts.set(key, (counts.get(key) ?? 0) + 1);
          }
          if (!kept) return null;
          const [key] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
          return { rgb: key.split(",").map((v) => (Number(v) << 3) + 4), kept };
        };

        // Two passes. The first is only accurate enough to resolve a text
        // colour that carries alpha; the second uses that to drop the glyphs.
        const first = mode(null);
        // Antialiased edges sit between the ink and the plate, so the cut has
        // to be wide enough to take them along. If almost nothing survives it,
        // the plate really is the same colour as the ink and the first pass is
        // the honest answer: a genuine failure, reported as one. Heavy display
        // type at a small size can cover more than half its own box, which is
        // the case this second pass exists for.
        const ink = paintOver(first.rgb, color);
        const NEAR = 90;
        const withoutInk = mode(
          (r, g, b) => (r - ink[0]) ** 2 + (g - ink[1]) ** 2 + (b - ink[2]) ** 2 < NEAR ** 2,
        );
        const plate =
          withoutInk && withoutInk.kept > total * 0.1 ? withoutInk.rgb : first.rgb;

        // Text colours here carry alpha (oklab(... / 0.55)), so paint them over
        // the plate rather than over whatever the canvas started as.
        const [hi, lo] = [lum(paintOver(plate, color)), lum(plate)].sort((a, b) => b - a);
        return { plate, ratio: +((hi + 0.05) / (lo + 0.05)).toFixed(2) };
      });
    },
    { data: frame, items: fresh.map((c) => ({ rect: c.rect, color: c.color })) },
  );

  fresh.forEach((c, i) => {
    if (!measured[i]) return;
    const large = c.size >= 24 || (c.size >= 18.66 && Number(c.weight) >= 700);
    results.push({ ...c, ...measured[i], floor: large ? 3 : 4.5 });
  });
}

const failures = results.filter((r) => r.ratio < r.floor);
console.log(`${ROUTE} at ${WIDTH}x${HEIGHT} in ${LOCALE}: measured ${results.length} text nodes, ${failures.length} below floor`);
for (const f of failures)
  console.log(
    `  ${f.ratio}:1 (needs ${f.floor}) ${f.size}px ${JSON.stringify(f.text)} colour ${f.color} on rgb(${f.plate})`,
  );

await browser.close();
