// Screenshot /services in both languages and check the cross-page nav links.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://localhost:3000";
const OUT = "web/screenshots/services";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));

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

const res = await page.goto(`${BASE}/services`, { waitUntil: "load" });
console.log(`/services → ${res.status()}`);
await page.waitForTimeout(1200);
await revealAll();
await page.screenshot({ path: `${OUT}/services-en.png`, fullPage: true });

await page.getByRole("switch").first().click();
await page.waitForTimeout(800);
await revealAll();
await page.screenshot({ path: `${OUT}/services-th.png`, fullPage: true });

// section anchors in the navbar must jump back to the home page from here
const workHref = await page
  .getByRole("link", { name: /^(Work|ผลงาน)$/ })
  .first()
  .getAttribute("href");
console.log(`nav Work href on /services → ${workHref}`);
await page.getByRole("link", { name: /^(Work|ผลงาน)$/ }).first().click();
await page.waitForTimeout(1500);
console.log(`landed on → ${new URL(page.url()).pathname + new URL(page.url()).hash}`);

// and the labs gallery CTA reaches /services
await page.goto(`${BASE}/labs`, { waitUntil: "load" });
await page.waitForTimeout(1000);
await revealAll();
await page.getByRole("link", { name: /see what i build/i }).click();
await page.waitForTimeout(1200);
console.log(`labs CTA → ${new URL(page.url()).pathname}`);

await ctx.close();
await browser.close();
console.log("done");
