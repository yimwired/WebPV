// Shoots the site on phones and tablets and lays each page out as one contact
// sheet, so a change can be judged across devices without a drawer of them.
//
// iPhones and iPads run in Playwright's WebKit, the engine Safari is built on,
// and the Android devices in Chromium; each gets its real viewport, pixel
// ratio and touch. Every page is shot twice: the first screen, and partway
// down after a pause, since the sections below reveal as they scroll in (a
// full-page shot would catch them blank). Sheets go to web/screenshots/devices.
//
// WebKit headless here paints no backdrop-filter at all, so the glass navbar
// shows unblurred on the iPhone and iPad rows; that is the tool, not the site.
//
//   node web/scripts/shoot-devices.mjs     from the repo root, export served
//   SHOOT_URL=https://webpv.yimwired.workers.dev   or a local server
//   ROUTES=/,/pricing  THEMES=light,dark  DEVICES="iPhone 15,Pixel 7"
import { chromium, devices, webkit } from "playwright";
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const OUT = resolve("web/screenshots/devices");
mkdirSync(OUT, { recursive: true });

const ROUTES = (process.env.ROUTES || "/,/services,/pricing,/labs").split(",");
const THEMES = (process.env.THEMES || "light,dark").split(",");
const DEVICE_NAMES = (process.env.DEVICES || "iPhone SE,iPhone 15,Pixel 7,iPad Mini,iPad Pro 11 landscape").split(",");

const engineFor = (descriptor) => (descriptor.defaultBrowserType === "webkit" ? webkit : chromium);
const slug = (route) => (route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-"));

async function shoot(browser, name, route, theme) {
  const descriptor = devices[name];
  const context = await browser.newContext({ ...descriptor, locale: "en-US", reducedMotion: "no-preference" });
  if (theme === "dark") {
    await context.addInitScript(() => {
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    });
  }
  const page = await context.newPage();
  await page.goto(`${BASE}${route}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1600);
  const files = [];
  for (const [label, fraction] of [["top", 0], ["mid", 0.42]]) {
    if (fraction > 0) {
      await page.evaluate((f) => window.scrollTo({ top: document.documentElement.scrollHeight * f, behavior: "instant" }), fraction);
      await page.waitForTimeout(1600);
    }
    const file = `${OUT}/.${slug(route)}-${theme}-${name.replace(/\s+/g, "_")}-${label}.png`;
    await page.screenshot({ path: file });
    files.push(file);
  }
  await context.close();
  return { name, size: descriptor.viewport, files };
}

/** One sheet per page and theme: each device's two shots side by side, devices in a row. */
async function sheet(browser, route, theme, shots) {
  const cells = shots
    .map(
      (shot) => `<figure>
        <figcaption>${shot.name} · ${shot.size.width}×${shot.size.height}</figcaption>
        <div>${shot.files.map((file) => `<img src="${pathToFileURL(file).href}" style="height:${shot.size.width > shot.size.height ? 300 : 520}px">`).join("")}</div>
      </figure>`,
    )
    .join("");
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#16181d;color:#e8e8ea;font:14px system-ui,sans-serif">
    <h1 style="margin:0 0 16px;font-size:18px">${route} · ${theme}</h1>
    <div style="display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start">${cells}</div>
    <style>figure{margin:0}figcaption{margin-bottom:8px;opacity:.8}figure div{display:flex;gap:8px}img{border-radius:10px;box-shadow:0 0 0 1px #ffffff22}</style>
  </body></html>`;
  const page = await browser.newPage({ viewport: { width: 2400, height: 800 } });
  const htmlFile = `${OUT}/.sheet.html`;
  await (await import("node:fs/promises")).writeFile(htmlFile, html);
  await page.goto(pathToFileURL(htmlFile).href);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  const path = `${OUT}/${slug(route)}-${theme}.png`;
  await page.screenshot({ path, fullPage: true });
  await page.close();
  return path;
}

const browsers = { chromium: await chromium.launch(), webkit: await webkit.launch() };
try {
  for (const route of ROUTES) {
    for (const theme of THEMES) {
      const shots = [];
      for (const name of DEVICE_NAMES) {
        const descriptor = devices[name];
        if (!descriptor) throw new Error(`Playwright has no device called "${name}"`);
        shots.push(await shoot(browsers[engineFor(descriptor) === webkit ? "webkit" : "chromium"], name, route, theme));
      }
      console.log(await sheet(browsers.chromium, route, theme, shots));
    }
  }
} finally {
  await Promise.all(Object.values(browsers).map((browser) => browser.close()));
}
