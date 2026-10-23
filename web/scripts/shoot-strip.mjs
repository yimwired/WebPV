// Shoots a page one screen at a time, top to bottom, and lays the screens out
// on one sheet, so a whole page can be read at a glance: before a redesign, to
// see what is there, and after it, to judge the result at real size.
//
// Screen by screen rather than fullPage because the site's sections reveal as
// they scroll in, and a full-page shot catches them blank. Each page is
// reloaded until Google Sans is in: the sandbox here refuses a localhost
// request now and then, and when it is the font stylesheet the page falls
// back to serif and the sheet judges the wrong typography.
//
// Screens go to web/screenshots/strips, and each route's sheet beside them
// (ffmpeg tiles them, three across on desktop, one row on a phone).
//
//   node web/scripts/shoot-strip.mjs              from the repo root, export served
//   SHOOT_URL=https://webpv.yimwired.workers.dev  ROUTES=/services,/pricing
//   W=390 H=844  THEME=dark  LOCALE=th            a phone, the dark theme, Thai
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const ROUTES = (process.env.ROUTES || "/").split(",");
const WIDTH = Number(process.env.W || 1440);
const HEIGHT = Number(process.env.H || 900);
const THEME = process.env.THEME === "dark" ? "dark" : "light";
const LOCALE = process.env.LOCALE === "th" ? "th" : "en";
const OUT = resolve("web/screenshots/strips");
mkdirSync(OUT, { recursive: true });

const slug = (route) => (route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-"));
const browser = await chromium.launch();

for (const route of ROUTES) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    reducedMotion: "no-preference",
    locale: LOCALE === "th" ? "th-TH" : "en-US",
  });
  await context.addInitScript(
    ([theme, locale]) => {
      try {
        localStorage.setItem("theme", theme);
        localStorage.setItem("webpv-locale", locale);
      } catch {}
    },
    [THEME, LOCALE],
  );
  const page = await context.newPage();
  // Headless defaults to reduced transparency, which turns the glass solid.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-transparency", value: "no-preference" }] });

  for (let attempt = 0; attempt < 4; attempt++) {
    await page.goto(`${BASE}${route}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const family = await page.evaluate(() => getComputedStyle(document.querySelector("h1") || document.body).fontFamily);
    if (/Google Sans/i.test(family) || route.startsWith("/labs/")) break;
    console.log(`  ${route}: the font did not load, reloading`);
  }
  await page.waitForTimeout(900);

  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const name = `${slug(route)}-${THEME}-${LOCALE}-${WIDTH}`;
  let screens = 0;
  for (let y = 0; y < total; y += HEIGHT, screens++) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${name}-${screens}.png` });
  }
  await context.close();

  // Desktop screens three across at half size; a phone's in one row.
  const across = WIDTH > HEIGHT ? 3 : screens;
  const scale = WIDTH > HEIGHT ? "720:-1" : "300:-1";
  const rows = Math.ceil(screens / across);
  execFileSync("ffmpeg", [
    "-loglevel", "error", "-y",
    "-start_number", "0", "-i", `${OUT}/${name}-%d.png`,
    "-vf", `scale=${scale},tile=${across}x${rows}:padding=6:color=0x16181d`,
    "-frames:v", "1", `${OUT}/${name}.png`,
  ]);
  console.log(`${route}: ${total}px in ${screens} screens -> web/screenshots/strips/${name}.png`);
}

await browser.close();
