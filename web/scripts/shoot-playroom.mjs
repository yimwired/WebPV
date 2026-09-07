// Verifies /labs/playroom, which the generic audit cannot: the jar is a
// canvas, so "is it working" means the pile moved when a button was pressed,
// and "is it cheap" means the loop stopped again afterwards.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then from web/:
//   node scripts/shoot-playroom.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const ROUTE = "/labs/playroom";

// Resolved against this file, not the shell: the output lands in
// web/screenshots either way, instead of wherever it was invoked from.
const OUT = fileURLToPath(new URL("../screenshots/playroom", import.meta.url));

const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 1024, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
];

const jarPixels = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    return canvas ? canvas.toDataURL().length + ":" + canvas.toDataURL().slice(-64) : "none";
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const findings = [];

for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  await page.goto(BASE + ROUTE, { waitUntil: "networkidle" });
  await sleep(2500); // let the opening drop settle

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  // the pile must be doing something on load, then stop
  const settledA = await jarPixels(page);
  await sleep(1200);
  const settledB = await jarPixels(page);

  // press + on the first flavour and confirm price, count and pile all move
  const priceBefore = await page.locator("text=/^฿\\d+$/").first().innerText();
  await page.getByLabel("One more Mango sticky rice").click();
  await page.getByLabel("One more Mango sticky rice").click();
  await sleep(1600);
  const priceAfter = await page.locator("text=/^฿\\d+$/").first().innerText();
  const afterAdd = await jarPixels(page);

  // and that it comes to rest again rather than spinning forever
  await sleep(3000);
  const restA = await jarPixels(page);
  await sleep(900);
  const restB = await jarPixels(page);

  const tapTargets = await page.evaluate(() =>
    [...document.querySelectorAll("button, a")]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 34), w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((t) => t.h > 0 && (t.w < 44 || t.h < 44)),
  );

  findings.push({
    size: size.name,
    errors,
    overflow,
    idleStable: settledA === settledB,
    pileChangedOnAdd: afterAdd !== settledB,
    priceBefore,
    priceAfter,
    settlesAgain: restA === restB,
    smallTargets: tapTargets,
  });

  await page.screenshot({ path: `${OUT}/${size.name}.png` });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(700);
  await page.screenshot({ path: `${OUT}/${size.name}-bottom.png` });

  await context.close();
}

// reduced motion: the jar must be filled and still
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(BASE + ROUTE, { waitUntil: "networkidle" });
  await sleep(1200);

  const a = await jarPixels(page);
  await sleep(1000);
  const b = await jarPixels(page);
  const painted = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let filled = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 10) filled++;
    return filled;
  });

  findings.push({ size: "reduced-motion", errors, still: a === b, paintedPixels: painted });
  await page.screenshot({ path: `${OUT}/reduced-motion.png` });
  await context.close();
}

await browser.close();
console.log(JSON.stringify(findings, null, 2));
