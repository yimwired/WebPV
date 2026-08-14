/** Throwaway: check the Trine hero, the ring placement and the metal picker. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "screenshots/trine";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror ${e}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console ${m.text()}`);
});

await page.goto("http://localhost:3000/labs/trine", { waitUntil: "load" });
await page.waitForTimeout(4000);

const canvas = page.locator("canvas");
console.log("canvas count:", await canvas.count());
if (await canvas.count()) {
  const box = await canvas.first().boundingBox();
  const fig = await page.locator("figure").boundingBox();
  console.log("canvas box:", JSON.stringify(box));
  console.log("figure box:", JSON.stringify(fig));
  console.log(
    "ring centre within photo: x",
    (((box.x + box.width / 2) - fig.x) / fig.width * 100).toFixed(1) + "%",
    " y",
    (((box.y + box.height / 2) - fig.y) / fig.height * 100).toFixed(1) + "%",
  );
  // does the scene actually draw anything?
  const drawn = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    return { hasContext: !!gl, w: c.width, h: c.height };
  });
  console.log("gl:", JSON.stringify(drawn));
}

await page.locator("figure").screenshot({ path: `${OUT}/hero-figure.png` });
await page.screenshot({ path: `${OUT}/hero.png` });

// switch metal and shoot again
await page.getByRole("button", { name: /Rose only/ }).click();
await page.waitForTimeout(1500);
await page.locator("figure").screenshot({ path: `${OUT}/figure-rose.png` });
console.log("price now:", await page.locator("h1 ~ div span").first().textContent());

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/full.png`, fullPage: true });

console.log("problems:", problems.length ? problems.slice(0, 5) : "none");
await browser.close();
