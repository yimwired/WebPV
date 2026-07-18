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
});
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log(`[console.error] ${m.text()}`);
});
page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));

const shootBoth = async (route, label) => {
  await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/${label}-en.png` });
  await page.getByRole("switch").first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${label}-th.png` });
  // reset stored locale so the next page starts in EN
  await page.evaluate(() => localStorage.removeItem("webpv-locale"));
};

await shootBoth("/", "home");
await shootBoth("/work/aurum", "aurum");
await shootBoth("/does-not-exist", "404");

// OG image
const res = await page.request.get(`${BASE}/opengraph-image`);
writeFileSync(`${OUT}/og.png`, await res.body());
console.log(`og status: ${res.status()}`);

await ctx.close();
await browser.close();
console.log("done");
