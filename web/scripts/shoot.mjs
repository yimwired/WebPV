import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL_ = process.env.SHOOT_URL || "http://localhost:3000";
const OUT = "web/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shootSections(label, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800); // let hero animation settle

  await page.screenshot({ path: `${OUT}/${label}-hero.png` });

  for (const id of ["work", "about", "contact"]) {
    await page.evaluate((sel) => {
      document.getElementById(sel)?.scrollIntoView({ block: "start" });
    }, id);
    await page.waitForTimeout(1400); // let scroll-reveal fire
    await page.screenshot({ path: `${OUT}/${label}-${id}.png` });
  }

  if (label === "desktop") {
    // mid-scroll of the Work reveal (card flattening) — instant scroll
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      const el = document.getElementById("work");
      if (el) window.scrollTo(0, el.offsetTop + 680);
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}/${label}-work-mid.png` });

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      const cards = Array.from(document.querySelectorAll("#work a"));
      const target = cards.find((c) =>
        c.textContent?.includes("Product Dashboard"),
      );
      target?.scrollIntoView({ block: "center" });
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${label}-work-grid.png` });
  }

  await ctx.close();
}

await shootSections("desktop", { width: 1440, height: 900 });
await shootSections("mobile", { width: 390, height: 844 });

await browser.close();
console.log("done");
