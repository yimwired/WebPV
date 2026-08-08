// Verify the phone layout: nav sheet opens, links work, reduced-motion is honoured.
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://localhost:3000";
const OUT = "web/screenshots/mobile";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

const shoot = async (label, { reducedMotion = "no-preference" } = {}) => {
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
    locale: "en-US",
    reducedMotion,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));

  await page.goto(BASE, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${label}-closed.png` });

  await page.getByRole("button", { name: /open menu|เปิดเมนู/i }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${label}-open.png` });

  const linkCount = await page.locator("#mobile-nav a").count();
  await page.getByRole("link", { name: "About", exact: true }).last().click();
  await page.waitForTimeout(900);
  const menuGone = (await page.locator("#mobile-nav").count()) === 0;
  const scrolledTo = await page.evaluate(() => Math.round(window.scrollY));
  await page.screenshot({ path: `${OUT}/${label}-after-nav.png` });

  console.log(
    `${label}: links=${linkCount} closesOnNav=${menuGone} scrollY=${scrolledTo}`
  );
  await ctx.close();
};

await shoot("phone");
await shoot("phone-reduced", { reducedMotion: "reduce" });

await browser.close();
console.log("done");
