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

// /services has to offer a way through to the prices, under the headline and
// again after the websites offering, where a reader who wants numbers is
// looking; the navbar is not
await page.goto(`${BASE}/services`, { waitUntil: "load" });
await page.waitForTimeout(1000);
await revealAll();
const toPricing = page.getByRole("link", { name: /^(See the packages|ดูแพ็กเกจกับราคา)$/ });
console.log(`links to the packages on /services: ${await toPricing.count()}`);
await toPricing.first().click();
await page.waitForTimeout(1200);
console.log(`services → pricing → ${new URL(page.url()).pathname}`);

// the hero's plate of the four kinds of work jumps to each one below. By
// position, since the switch above left the site in Thai.
await page.goto(`${BASE}/services`, { waitUntil: "load" });
await page.waitForTimeout(1000);
const plate = page.getByRole("navigation", { name: /^(Kinds of work|งานที่รับ)$/ });
for (const index of [1, 3]) {
  const link = plate.getByRole("link").nth(index);
  const name = (await link.textContent())?.trim();
  await link.click();
  await page.waitForTimeout(1200);
  const hash = new URL(page.url()).hash;
  const inView = await page.evaluate((id) => {
    const box = document.getElementById(id)?.getBoundingClientRect();
    return Boolean(box) && box.top >= 0 && box.top < window.innerHeight / 2;
  }, hash.slice(1));
  console.log(`plate "${name}" → ${hash}, section at the top: ${inView}`);
}

// the labs gallery CTAs reach /services and /pricing
// (label is "What I build", renamed from "See what I build" in 6251edc)
await page.goto(`${BASE}/labs`, { waitUntil: "load" });
await page.waitForTimeout(1000);
await revealAll();
const labsCosts = await page
  .getByRole("link", { name: /^What it costs$/ })
  .getAttribute("href");
console.log(`labs "What it costs" href → ${labsCosts}`);
await page.getByRole("link", { name: /^What I build$/ }).click();
await page.waitForTimeout(1200);
console.log(`labs CTA → ${new URL(page.url()).pathname}`);

await ctx.close();
await browser.close();
console.log("done");
