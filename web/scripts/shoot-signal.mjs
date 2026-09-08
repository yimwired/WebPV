// Verify the Signal lab, which the generic audit cannot: the scope is a canvas,
// so "is it working" means the trace moved, the readout was measured off it
// rather than printed beside it, and the controls changed both.
//
// The frequency figures are the ones worth watching. Bearing vibration is
// generated at 48 Hz and line current at 50 Hz; if either reads far off, the
// trigger hysteresis is counting noise as zero crossings again.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then from web/:
//   node scripts/shoot-signal.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const OUT = "screenshots/signal";
await mkdir(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();

const readout = (page) =>
  page.evaluate(() => [...document.querySelectorAll("dd")].map((d) => d.textContent.trim()));
const trace = (page) =>
  page.evaluate(() => document.querySelector("canvas")?.toDataURL().slice(-72) ?? "none");

for (const size of [{ n: "phone", w: 390, h: 844 }, { n: "desktop", w: 1440, h: 900 }]) {
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !m.text().includes("404") && errors.push(m.text()));

  await page.goto("http://localhost:3000/labs/signal", { waitUntil: "load" });
  await sleep(1800);

  const first = await readout(page);
  const traceA = await trace(page);
  await sleep(900);
  const traceB = await trace(page);

  await page.getByRole("button", { name: "Line current" }).click();
  await sleep(1200);
  const afterChannel = await readout(page);

  await page.getByRole("button", { name: "2 ms" }).click();
  await sleep(1200);
  const afterTimebase = await readout(page);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  console.log(JSON.stringify({
    size: size.n, errors, overflow,
    running: traceA !== traceB,
    first, afterChannel, afterTimebase,
    readoutChanged: JSON.stringify(first) !== JSON.stringify(afterChannel),
  }));

  await page.screenshot({ path: `${OUT}/${size.n}.png` });
  await ctx.close();
}

// reduced motion: one sweep, held, but still measured
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/labs/signal", { waitUntil: "load" });
await sleep(1200);
const a = await trace(page);
await sleep(900);
const b = await trace(page);
console.log(JSON.stringify({ size: "reduced", still: a === b, readout: await readout(page) }));
await page.screenshot({ path: `${OUT}/reduced.png` });
await ctx.close();
await browser.close();
