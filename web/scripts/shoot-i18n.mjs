// Verify the EN/TH switch, 404 page, case study and OG image with real screenshots.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://localhost:3000";
const OUT = "web/screenshots/i18n";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  // this machine's Chrome reports Thai, which would make every "-en" shot Thai
  locale: "en-US",
});
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log(`[console.error] ${m.text()}`);
});
page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));

// Sections animate in with `whileInView`, so a full-page shot of an unscrolled
// page captures them at opacity 0 — walk the page down first, then back up.
const revealAll = async () => {
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

const shoot = async (label, fullPage) => {
  if (fullPage) await revealAll();
  const lang = await page.evaluate(() => document.documentElement.lang);
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage });
  console.log(`  ${label}.png (lang=${lang})`);
};

const shootBoth = async (route, label, { fullPage = false } = {}) => {
  const res = await page.goto(`${BASE}${route}`, {
    waitUntil: "load",
    timeout: 60000,
  });
  console.log(`${route} → ${res.status()}`);
  await page.waitForTimeout(2000);
  await shoot(`${label}-en`, fullPage);
  await page.getByRole("switch").first().click();
  await page.waitForTimeout(800);
  await shoot(`${label}-th`, fullPage);
  // reset stored locale so the next page starts in EN
  await page.evaluate(() => localStorage.removeItem("webpv-locale"));
};

const CASE_STUDIES = [
  "aurum",
  "you-are-the-virus",
  "product-dashboard",
  "affiliate",
  "jarvis-moon",
];

await shootBoth("/", "home");
for (const slug of CASE_STUDIES) {
  await shootBoth(`/work/${slug}`, slug, { fullPage: true });
}
await shootBoth("/does-not-exist", "404");

// OG image
const res = await page.request.get(`${BASE}/opengraph-image`);
writeFileSync(`${OUT}/og.png`, await res.body());
console.log(`og status: ${res.status()}`);

await ctx.close();
await browser.close();
console.log("done");
