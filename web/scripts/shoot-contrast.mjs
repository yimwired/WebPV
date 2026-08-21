// Measure text contrast against what is actually painted behind it. Half of
// The Lab draws its backgrounds on canvas or in a gradient, so the DOM's
// backgroundColor is not the colour the text sits on. Screenshot the element's
// box, load it into a second page's canvas, and read the pixels.
import { chromium } from "playwright";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const ROUTE = process.env.ROUTE || "/labs/contour";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const reader = await ctx.newPage();
await reader.goto("about:blank");

await page.goto(BASE + ROUTE, { waitUntil: "load" });
// WebGL scenes paint after load; measuring before they do gives every element
// the base page colour as its plate.
await page.waitForTimeout(4000);

// Walk the page in viewport-sized steps so scroll-driven acts settle before
// their text is measured.
const results = [];
const height = await page.evaluate(() => document.body.scrollHeight);
const STEP = Number(process.env.STEP ?? 400);

for (let y = 0; y < height; y += STEP) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(900);

  const candidates = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length || !el.textContent?.trim()) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.top < 0 || r.bottom > window.innerHeight) continue;
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
        // Padded by the ring the reader samples for the plate colour.
        rect: {
          x: Math.max(0, r.x - 6),
          y: Math.max(0, r.y - 6),
          width: Math.min(r.width + 12, 600),
          height: r.height + 12,
        },
      });
    }
    return out;
  });

  for (const c of candidates) {
    if (results.some((r) => r.text === c.text)) continue;
    const shot = await page
      .screenshot({ clip: c.rect, type: "png" })
      .then((b) => b.toString("base64"))
      .catch(() => null);
    if (!shot) continue;

    // Text pixels are the extreme end of the histogram; the mode is the plate.
    const measured = await reader.evaluate(
      async ({ data, color }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${data}`;
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = img.width;
        cv.height = img.height;
        const ctx2 = cv.getContext("2d", { willReadFrequently: true });
        ctx2.drawImage(img, 0, 0);
        const px = ctx2.getImageData(0, 0, cv.width, cv.height).data;

        // Only the margin ring around the glyphs: inside the text box the most
        // common colour can be the type itself, which would score 1:1.
        const counts = new Map();
        const ring = 6;
        for (let y = 0; y < cv.height; y++) {
          for (let x = 0; x < cv.width; x++) {
            const inside =
              x >= ring && x < cv.width - ring && y >= ring && y < cv.height - ring;
            if (inside) continue;
            const i = (y * cv.width + x) * 4;
            const key = `${px[i] >> 3},${px[i + 1] >> 3},${px[i + 2] >> 3}`;
            counts.set(key, (counts.get(key) ?? 0) + 1);
          }
        }
        const [modeKey] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        const plate = modeKey.split(",").map((v) => (Number(v) << 3) + 4);

        // Text colours here carry alpha (oklab(... / 0.55)), so paint them over
        // the plate rather than over whatever the canvas started as.
        const toRgb = (c) => {
          ctx2.clearRect(0, 0, 1, 1);
          ctx2.fillStyle = `rgb(${plate.join(",")})`;
          ctx2.fillRect(0, 0, 1, 1);
          ctx2.fillStyle = c;
          ctx2.fillRect(0, 0, 1, 1);
          return [...ctx2.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
        const lum = ([r, g, b]) =>
          [r, g, b]
            .map((v) => v / 255)
            .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
            .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
        const [hi, lo] = [lum(toRgb(color)), lum(plate)].sort((a, b) => b - a);
        return { plate, ratio: +((hi + 0.05) / (lo + 0.05)).toFixed(2) };
      },
      { data: shot, color: c.color },
    );

    const large = c.size >= 24 || (c.size >= 18.66 && Number(c.weight) >= 700);
    results.push({ ...c, ...measured, floor: large ? 3 : 4.5 });
  }
}

const failures = results.filter((r) => r.ratio < r.floor);
console.log(`${ROUTE}: measured ${results.length} text nodes, ${failures.length} below floor`);
for (const f of failures)
  console.log(
    `  ${f.ratio}:1 (needs ${f.floor}) ${f.size}px ${JSON.stringify(f.text)} colour ${f.color} on rgb(${f.plate})`,
  );

await browser.close();
