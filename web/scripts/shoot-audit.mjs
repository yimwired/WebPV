// Path B audit sweep: every public route at three widths. Reports what breaks
// silently — console errors, horizontal overflow, sub-AA contrast, tap targets,
// and CTA labels that wrap.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:3001";
const OUT = process.env.AUDIT_OUT || "screenshots";
mkdirSync(OUT, { recursive: true });

const ROUTES = process.env.ROUTES?.split(",") ?? [
  "/",
  "/services",
  "/pricing",
  "/labs",
  "/work/aurum",
];

const VIEWPORTS = [
  ["phone", { width: 390, height: 844 }],
  ["tablet", { width: 1024, height: 768 }],
  ["desktop", { width: 1440, height: 900 }],
];

const revealAll = async (page) => {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
};

// Computed colours resolve to oklab(), which only canvas can turn back into RGB.
const probe = (page) =>
  page.evaluate(() => {
    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d", { willReadFrequently: true });
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
        const rgba = getComputedStyle(n).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
        if (rgba.length < 4 || rgba[3] > 0.9) return toRgb(getComputedStyle(n).backgroundColor);
      }
      return toRgb(getComputedStyle(document.body).backgroundColor);
    };
    const label = (el) => (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40);

    const contrast = [];
    for (const el of document.querySelectorAll("body *")) {
      if (!el.textContent?.trim() || el.children.length) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || !el.getClientRects().length) continue;
      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      const r = ratio(toRgb(cs.color), opaqueBg(el));
      if (r < (large ? 3 : 4.5)) contrast.push({ text: label(el), size, ratio: +r.toFixed(2) });
    }

    // Interactive targets: size floor and labels that wrap onto two lines.
    const targets = [];
    const wrapped = [];
    for (const el of document.querySelectorAll("a, button, [role='switch'], input, select, textarea")) {
      const rects = el.getClientRects();
      if (!rects.length) continue;
      const { width, height } = rects[0];
      if (height > 0 && height < 24 && el.closest("nav, header, footer, main")) {
        targets.push({ tag: el.tagName, text: label(el), w: +width.toFixed(0), h: +height.toFixed(0) });
      }
      if (rects.length > 1 && el.matches("a[class*='bg-'], button[class*='bg-'], a[class*='border'], button[class*='border']")) {
        wrapped.push({ text: label(el), lines: rects.length });
      }
    }

    // An accessible name is required on every control.
    const unnamed = [...document.querySelectorAll("a, button, input, select, textarea")]
      .filter((el) => el.getClientRects().length)
      .filter((el) => !(el.textContent?.trim() || el.getAttribute("aria-label") || el.getAttribute("title")))
      .map((el) => el.tagName + (el.className ? `.${String(el.className).slice(0, 40)}` : ""));

    const images = [...document.querySelectorAll("img")]
      .filter((img) => img.alt === null || img.alt === undefined)
      .map((img) => img.currentSrc || img.src);

    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      contrast,
      targets,
      wrapped,
      unnamed,
      imagesMissingAlt: images,
      headings: [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => `${h.tagName} ${label(h)}`),
    };
  });

const browser = await chromium.launch();
const report = {};

for (const route of ROUTES) {
  for (const [device, viewport] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport, locale: "en-US" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text().slice(0, 160)}`));
    page.on("requestfailed", (r) => errors.push(`requestfailed: ${r.url().slice(0, 120)}`));

    const res = await page.goto(BASE + route, { waitUntil: "load" });
    await page.waitForTimeout(800);
    await revealAll(page);

    const slug = route === "/" ? "home" : route.replace(/\//g, "-").replace(/^-/, "");
    await page.screenshot({ path: `${OUT}/${slug}-${device}.png`, fullPage: true });

    const result = await probe(page);
    report[`${route} @${device}`] = { status: res.status(), errors, ...result };
    await ctx.close();
  }
}

await browser.close();

// Only print what needs a decision.
for (const [key, r] of Object.entries(report)) {
  const issues = [];
  if (r.status !== 200) issues.push(`status ${r.status}`);
  if (r.errors.length) issues.push(`errors ${JSON.stringify(r.errors.slice(0, 4))}`);
  if (r.overflow > 0) issues.push(`overflow ${r.overflow}px`);
  if (r.contrast.length) issues.push(`contrast ${JSON.stringify(r.contrast)}`);
  if (r.targets.length) issues.push(`small targets ${JSON.stringify(r.targets)}`);
  if (r.wrapped.length) issues.push(`wrapped CTA ${JSON.stringify(r.wrapped)}`);
  if (r.unnamed.length) issues.push(`unnamed controls ${JSON.stringify(r.unnamed)}`);
  if (r.imagesMissingAlt.length) issues.push(`img no alt ${JSON.stringify(r.imagesMissingAlt)}`);
  console.log(issues.length ? `\n=== ${key}\n  ${issues.join("\n  ")}` : `ok  ${key}`);
}
console.log(`\nheadings @desktop /: ${JSON.stringify(report["/ @desktop"]?.headings)}`);
