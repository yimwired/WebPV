// Screenshot /pricing in both languages, on desktop and on a phone, and check
// the things that break silently: horizontal overflow, Thai words split in
// half, and text that lands below the AA contrast threshold.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://localhost:3000";
const OUT = "web/screenshots/pricing";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

const revealAll = async (page) => {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 200));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
};

// computed colours come back as oklab(), which canvas can resolve to RGB for us
const contrastReport = (page) =>
  page.evaluate(() => {
    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d");
    const toRgb = (color) => {
      ctx.fillStyle = "#000";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    };
    const lum = ([r, g, b]) =>
      [r, g, b]
        .map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const opaqueBg = (el) => {
      for (let n = el; n; n = n.parentElement) {
        const bg = getComputedStyle(n).backgroundColor;
        const rgba = bg.match(/[\d.]+/g)?.map(Number) ?? [];
        if (rgba.length < 4 || rgba[3] > 0.9) return toRgb(bg);
      }
      return toRgb(getComputedStyle(document.body).backgroundColor);
    };

    const out = [];
    for (const el of document.querySelectorAll("main *")) {
      if (!el.textContent?.trim() || el.children.length) continue;
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      const r = ratio(toRgb(cs.color), opaqueBg(el));
      if (r < (large ? 3 : 4.5)) {
        out.push({
          text: el.textContent.trim().slice(0, 42),
          size,
          ratio: Number(r.toFixed(2)),
        });
      }
    }
    return out;
  });

for (const [device, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["phone", { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport, locale: "en-US" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`[pageerror ${device}] ${e.message}`));

  const res = await page.goto(`${BASE}/pricing`, { waitUntil: "load" });
  console.log(`${device} /pricing → ${res.status()}`);
  await page.waitForTimeout(1000);
  await revealAll(page);
  await page.screenshot({ path: `${OUT}/pricing-en-${device}.png`, fullPage: true });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  console.log(`  horizontal overflow: ${overflow}px`);
  console.log(`  contrast failures EN: ${JSON.stringify(await contrastReport(page))}`);

  // the switch lives in the navbar on desktop and inside the sheet on a phone
  await page.getByRole("switch").first().click();
  await page.waitForTimeout(800);
  await revealAll(page);
  await page.screenshot({ path: `${OUT}/pricing-th-${device}.png`, fullPage: true });
  console.log(`  contrast failures TH: ${JSON.stringify(await contrastReport(page))}`);

  // every Thai heading word must stay whole on one line
  const brokenWords = await page.evaluate(() => {
    const h1 = document.querySelector("main h1");
    const spans = [...h1.querySelectorAll("span")];
    const lines = new Map();
    for (const s of spans) {
      const top = Math.round(s.getBoundingClientRect().top);
      lines.set(top, (lines.get(top) ?? "") + s.textContent);
    }
    return [...lines.values()];
  });
  console.log(`  h1 TH lines: ${JSON.stringify(brokenWords)}`);

  await ctx.close();
}

await browser.close();
console.log("done");
