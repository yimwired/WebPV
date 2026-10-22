// Checks that every lab page's root follows the ground the lab is painted on,
// whatever the site theme: each lab declares it in its page.tsx as
// `viewport.colorScheme`, and globals.css gives the root that color-scheme and
// a background to match (see the note above the :has() rules there).
//
// What it reads is what a visitor meets outside the demo: the root's computed
// color-scheme, which styles native controls, and the canvas colour, which is
// what fills the scrollbar's track on Windows and the gap an overscroll opens.
// Every lab is read under the light default and again with dark stored as the
// visitor's choice. Then a client-side round trip, lab to gallery through the
// switcher, checks the gallery gets the site's theme back: Next swaps the meta
// on navigation, and a stale one would leave the gallery painted as the lab.
//
//   node web/scripts/shoot-lab-ground.mjs   from the repo root, export served
//   SHOOT_URL=http://127.0.0.1:8788         where the export is served
import { chromium } from "playwright";
import { readdirSync, readFileSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const LABS_DIR = "web/src/app/labs";

const results = [];
const check = (ok, label, detail) =>
  results.push(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);

// The ground each page declares, read from the source so a new lab is checked
// the day it is added, and a lab that forgets to declare one fails here.
const declared = readdirSync(LABS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const source = readFileSync(`${LABS_DIR}/${entry.name}/page.tsx`, "utf8");
    const scheme = source.match(/colorScheme:\s*"(dark|light)"/)?.[1] ?? null;
    return { slug: entry.name, scheme };
  });

for (const { slug, scheme } of declared.filter((lab) => !lab.scheme)) {
  check(false, `/labs/${slug} declares its ground`, "no viewport.colorScheme in page.tsx");
}

/** The root's scheme and the canvas's relative luminance, resolved through a canvas so oklch() reads right. */
const readRoot = (page) =>
  page.evaluate(() => {
    const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const luminance = (css) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = css;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
      const linear = (value) => {
        const v = value / 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
    };
    // The canvas takes the root's background, or the body's when the root has none.
    const rootBackground = getComputedStyle(document.documentElement).backgroundColor;
    const canvas = /rgba\(0, 0, 0, 0\)|transparent/.test(rootBackground)
      ? getComputedStyle(document.body).backgroundColor
      : rootBackground;
    return {
      scheme: getComputedStyle(document.documentElement).colorScheme,
      canvas: luminance(canvas),
      meta: document.querySelector('meta[name="color-scheme"]')?.content ?? null,
    };
  });

const browser = await chromium.launch();

for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "en-US" });
  if (theme === "dark") {
    await context.addInitScript(() => {
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    });
  }
  const page = await context.newPage();
  const wrong = [];
  for (const { slug, scheme } of declared.filter((lab) => lab.scheme)) {
    // "load", not DOMContentLoaded: computed style before the stylesheet arrives
    // would read the browser's defaults.
    await page.goto(`${BASE}/labs/${slug}`, { waitUntil: "load" });
    const root = await readRoot(page);
    const canvasMatches = scheme === "dark" ? root.canvas < 0.05 : root.canvas > 0.8;
    if (root.scheme !== scheme || !canvasMatches) {
      wrong.push(`${slug}: ${root.scheme}, canvas ${root.canvas.toFixed(2)}`);
    }
  }
  const total = declared.filter((lab) => lab.scheme).length;
  check(wrong.length === 0, `site theme ${theme}: every lab's root follows its ground`, wrong.length ? wrong.join("; ") : `${total} labs`);
  await context.close();
}

// Lab to gallery and back, client-side, with dark stored: the gallery is a
// site page and has to come back in the visitor's theme.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "en-US" });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("theme", "dark");
    } catch {}
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/labs/kiln`, { waitUntil: "load" });
  const onLab = await readRoot(page);
  check(onLab.scheme === "light" && onLab.canvas > 0.8, "dark stored: a light lab still opens light", `${onLab.scheme}, ${onLab.canvas.toFixed(2)}`);
  await page.getByRole("link", { name: "Exit to gallery" }).click();
  await page.waitForURL(/\/labs\/?$/);
  await page.waitForFunction(() => !document.querySelector('meta[name="color-scheme"]'), null, { timeout: 5000 }).catch(() => {});
  const onGallery = await readRoot(page);
  check(onGallery.meta === null, "the lab's meta is gone after a client-side exit", `${onGallery.meta}`);
  check(onGallery.scheme === "dark" && onGallery.canvas < 0.05, "the gallery is back in the stored dark theme", `${onGallery.scheme}, ${onGallery.canvas.toFixed(2)}`);
  await context.close();
}

await browser.close();
console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) process.exitCode = 1;
