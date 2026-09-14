// /labs/prism: the page claims four layers and a sheet that re-reads its own
// backdrop. Check each claim by measuring painted pixels and computed styles,
// not by looking at whether a switch moved.
//
//   SHOOT_URL=http://localhost:3000 node web/scripts/shoot-prism.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:3000";
const OUT = process.env.AUDIT_OUT || "web/screenshots";
mkdirSync(OUT, { recursive: true });

const PANEL = "section:nth-of-type(1) [style*='backdrop-filter']";
const SWITCH = (name) => `[role='switch'][aria-label='${name}']`;

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`${pass ? "ok  " : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  // The crossfade between backdrops is the one motion that carries meaning.
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));

await page.goto(`${BASE}/labs/prism`, { waitUntil: "load" });
await page.waitForTimeout(1200);

// The whole point of the SVG route. If this is false the page is running its
// fallback and every refraction check below is meaningless, so say so loudly.
const supportsSvg = await page.evaluate(() =>
  CSS.supports("backdrop-filter", "url(#prism-lens)")
);
check("this browser can use an SVG filter as a backdrop", supportsSvg);

const filterOf = () => page.locator(PANEL).first().evaluate((el) => getComputedStyle(el).backdropFilter);
const fillOf = () => page.locator(PANEL).first().evaluate((el) => getComputedStyle(el).backgroundColor);

// ── the four layers actually change what is painted ────────────────────────
{
  const full = await filterOf();
  check(
    "all layers on: the backdrop filter references the chromatic lens",
    full.includes("prism-lens-rgb"),
    full
  );

  await page.locator(SWITCH("เหลือบสีที่ขอบ")).click();
  await page.waitForTimeout(300);
  const noChroma = await filterOf();
  check(
    "chromatic off: falls back to the single-channel lens",
    noChroma.includes("prism-lens") && !noChroma.includes("prism-lens-rgb"),
    noChroma
  );

  await page.locator(SWITCH("หักเหที่ขอบ")).click();
  await page.waitForTimeout(300);
  const noLens = await filterOf();
  check(
    "refraction off: no SVG filter left, only blur",
    !noLens.includes("url(") && noLens.includes("blur"),
    noLens
  );

  // Put them back for the rest of the run.
  await page.locator(SWITCH("หักเหที่ขอบ")).click();
  await page.locator(SWITCH("เหลือบสีที่ขอบ")).click();
  await page.waitForTimeout(400);
}

// ── specular changes the rim, not just a flag ──────────────────────────────
{
  const ringBefore = await page.locator(PANEL).first().evaluate(
    (el) => el.querySelectorAll("span[aria-hidden]").length
  );
  await page.locator(SWITCH("เส้นแสงที่ขอบ")).click();
  await page.waitForTimeout(300);
  const ringAfter = await page.locator(PANEL).first().evaluate(
    (el) => el.querySelectorAll("span[aria-hidden]").length
  );
  check("specular off removes the rim element", ringBefore > ringAfter, `${ringBefore} then ${ringAfter}`);
  await page.locator(SWITCH("เส้นแสงที่ขอบ")).click();
  await page.waitForTimeout(300);
}

// ── the sheet flips mode when the photograph behind it changes ─────────────
{
  const darkBackdropFill = await fillOf();
  await page.getByRole("button", { name: /Salt Flat/ }).click();
  await page.waitForTimeout(1100);
  const brightBackdropFill = await fillOf();

  const lum = (rgb) => {
    const [r, g, b] = rgb.match(/[\d.]+/g).map(Number);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  check(
    "the sheet flips when the backdrop gets bright",
    lum(brightBackdropFill) < lum(darkBackdropFill) - 60,
    `over luma 27 the sheet is ${darkBackdropFill}, over luma 174 it is ${brightBackdropFill}`
  );

  await page.screenshot({ path: `${OUT}/prism-bright.png` });
}

// ── with adaptive off the sheet stops flipping, which is the demo ──────────
{
  await page.locator(SWITCH("ปรับตามพื้นหลัง")).click();
  await page.waitForTimeout(400);
  const lockedFill = await fillOf();
  check(
    "adaptive off locks the sheet to one mode",
    lockedFill.includes("248") || lockedFill.includes("249"),
    lockedFill
  );
  await page.locator(SWITCH("ปรับตามพื้นหลัง")).click();
  await page.waitForTimeout(300);
}

// ── changing the track changes the picture behind the glass ────────────────
{
  const srcNow = await page.locator("section:nth-of-type(1) img").first().getAttribute("src");
  await page.getByRole("button", { name: /Midnight Soi/ }).click();
  await page.waitForTimeout(1100);
  const srcAfter = await page.locator("section:nth-of-type(1) img").first().getAttribute("src");
  check("picking a track swaps the backdrop", srcNow !== srcAfter, `${srcNow} then ${srcAfter}`);
}

// The lab switcher prefetches every other demo and a static export serves no
// RSC payload for those links; every lab page 404s the same set.
const real = errors.filter((e) => !/Failed to load resource/.test(e));
check("no console errors", real.length === 0, real.slice(0, 2).join(" | "));

await page.screenshot({ path: `${OUT}/prism-hero.png` });
await page.locator("#layers").scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/prism-layers.png` });

// Phone, and the reduced-motion path.
const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const small = await phone.newPage();
await small.goto(`${BASE}/labs/prism`, { waitUntil: "load" });
await small.waitForTimeout(1200);
const overflow = await small.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth
);
check("no sideways scroll on a phone", overflow <= 0, `${overflow}px`);
await small.screenshot({ path: `${OUT}/prism-phone.png`, fullPage: false });
await phone.close();

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
