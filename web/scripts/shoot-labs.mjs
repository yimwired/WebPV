import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://localhost:3000";
const OUT = "web/screenshots/labs";
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

const routes = (process.env.SHOOT_ROUTES?.split(",") ?? [
  "labs",
  "labs/dimension",
  "labs/nebula",
  "labs/space",
  "labs/luxe",
  "labs/minimal",
]).map((r) => r.trim());

for (const r of routes) {
  const label = r.replaceAll("/", "-");
  await page.goto(`${BASE}/${r}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(r === "labs/dimension" ? 5000 : 2500); // WebGL needs warm-up
  await page.screenshot({ path: `${OUT}/${label}-top.png` });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, document.body.scrollHeight * 0.55);
  });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/${label}-mid.png` });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/${label}-end.png` });
}

await ctx.close();
await browser.close();
console.log("done");
