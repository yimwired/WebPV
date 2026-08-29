// ─────────────────────────────────────────────────────────────
//  Checks the three WebGL labs, the parts a screenshot cannot show.
//
//    1. the canvas has a live, sized WebGL context
//    2. nothing threw
//    3. the render loop stops once the canvas leaves the viewport
//
//  (3) is the one worth automating. Nothing about a render loop left running
//  is visible, so a regression there is silent: the page keeps looking right
//  while a phone burns through its battery. The count comes from patching
//  requestAnimationFrame, which is what R3F drives its loop from.
//
//  Run from the repo root against a served build:
//    npx wrangler dev --port 8788
//    node web/scripts/shoot-labs-3d.mjs
// ─────────────────────────────────────────────────────────────
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.SHOOT_URL ?? "http://127.0.0.1:8788";
const OUT = "web/screenshots/labs-3d";
const ROUTES = (process.env.ROUTES ?? "/labs/space,/labs/dimension,/labs/trine,/labs/contour").split(",");

/** Frames counted over this window, in and out of view. */
const SAMPLE_MS = 2000;

/** Long enough for entry animations to finish so they are not counted. */
const SETTLE_MS = 3500;

/**
 * Headless Chromium has no GPU: it renders WebGL through SwiftShader on the
 * CPU. A retina-sized canvas with a bloom pass drops to a couple of frames a
 * second there, which is too coarse a sample to tell a gated loop from a slow
 * one, so the run is deliberately small and non-retina. Frame *counts* here
 * say nothing about real-device performance; only the ratio matters.
 */
const VIEWPORT = { width: 900, height: 640 };

const COUNT_RAF = `
  window.__raf = 0;
  const original = window.requestAnimationFrame;
  window.requestAnimationFrame = (cb) => { window.__raf++; return original(cb); };
`;

async function framesOver(page, ms) {
  await page.evaluate(() => { window.__raf = 0; });
  await page.waitForTimeout(ms);
  return page.evaluate(() => window.__raf);
}

/** True while any part of the canvas is still inside the viewport. */
async function canvasOnScreen(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return false;
    const r = canvas.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
  });
}

/**
 * Hides the tab the way a browser does, so the visibility gate is exercised
 * without needing a second window. Contour pins its canvas for the whole
 * page, so scrolling never takes it off screen and this is the only gate
 * that applies there.
 */
async function setHidden(page, hidden) {
  await page.evaluate((h) => {
    Object.defineProperty(document, "hidden", { value: h, configurable: true });
    Object.defineProperty(document, "visibilityState", {
      value: h ? "hidden" : "visible",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

/**
 * Whether the scene has a live drawing surface.
 *
 * Reading the pixels back is not an option: R3F leaves preserveDrawingBuffer
 * off, so the buffer is already cleared by the time script can sample it and
 * every canvas reads back as one flat colour. What can be asserted is that a
 * sized canvas exists and its context has not been lost, which is the failure
 * that actually happens (a dead context leaves the page looking blank).
 */
async function live(page) {
  return page.evaluate(() => {
    // Deep Space puts a 2D starfield behind the globe, so the first canvas on
    // the page is not the one to test: getContext("webgl") on a canvas that
    // already handed out a 2D context returns null. Find the WebGL one.
    const canvases = Array.from(document.querySelectorAll("canvas"));
    if (!canvases.length) return { ok: false, reason: "no canvas on the page" };

    for (const canvas of canvases) {
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (!gl) continue;
      return {
        ok: !gl.isContextLost() && canvas.width > 0 && canvas.height > 0,
        size: `${canvas.width}x${canvas.height}`,
        lost: gl.isContextLost(),
      };
    }
    return { ok: false, reason: "no WebGL context on any canvas" };
  });
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const report = {};

for (const route of ROUTES) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();

  // The lab switcher prefetches all ten sibling routes on mount, and each
  // one asks for several RSC payloads the static export only answers on
  // production (session 9). Locally that is a burst big enough to take
  // wrangler down mid-run, and none of it is what this script measures.
  await page.route("**/__next.*", (r) => r.abort());

  // Only thrown errors count: the prefetch 404s above are expected here.
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.addInitScript(COUNT_RAF);
  await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(SETTLE_MS);

  const drawn = await live(page);
  const inView = await framesOver(page, SAMPLE_MS);
  const name = route.split("/").pop();
  // the page, not the canvas element: an animating canvas never reaches the
  // "stable" state locator.screenshot() waits for, and the call times out
  await page.screenshot({ path: `${OUT}/${name}.png` });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2500);
  const leftViewport = !(await canvasOnScreen(page));
  const scrolled = leftViewport ? await framesOver(page, SAMPLE_MS) : null;

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await setHidden(page, true);
  await page.waitForTimeout(600);
  const hidden = await framesOver(page, SAMPLE_MS);

  report[route] = { canvas: drawn, errors, frames: { inView, scrolled, hidden } };
  await context.close();
}

await browser.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));

let failed = false;
for (const [route, r] of Object.entries(report)) {
  const { inView, scrolled, hidden } = r.frames;

  // A gate passes when it all but stops the loop. Both are only reported
  // where they apply: a pinned canvas never leaves the viewport, so its
  // scroll column reads n/a rather than failing.
  const stopped = (after) => after === null || after === 0 || after / inView <= 0.2;
  const gated = stopped(scrolled) && stopped(hidden);
  if (!r.canvas.ok || !gated || r.errors.length) failed = true;

  console.log(
    `${route.padEnd(18)} canvas=${r.canvas.size ?? r.canvas.reason}  ` +
    `frames in=${inView} scrolled=${scrolled ?? "n/a"} hidden=${hidden}  ` +
    `gated=${gated}  thrown=${r.errors.length}`,
  );
  r.errors.slice(0, 3).forEach((e) => console.log(`    ! ${e.slice(0, 160)}`));
}

console.log(failed ? "\nFAIL" : "\nPASS");
process.exit(failed ? 1 : 0);
