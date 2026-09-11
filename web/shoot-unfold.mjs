// Walks /labs/unfold through every act at two widths and reports what the page
// actually painted: console errors, horizontal overflow, and one frame per act.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const URL = process.env.SHOOT_URL ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "shots";
const ACTS = [
  ["1-closed", 0.06],
  ["2-unfold", 0.26],
  ["3-light", 0.47],
  ["4-warmth", 0.68],
  ["5-drawing", 0.9],
  ["6-specs", 1.0],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const [label, width, height] of [
  ["wide", 1920, 860],
  ["desktop", 1440, 900],
  ["phone", 390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    locale: "en-US",
  });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(`${URL}/labs/unfold`, { waitUntil: "load" });
  await page.waitForTimeout(900);

  const stage = await page.evaluate(() => {
    const section = document.querySelector("section");
    return section ? section.getBoundingClientRect().height : 0;
  });

  for (const [name, at] of ACTS) {
    // the pinned section is the first <section>; scroll inside its own range
    await page.evaluate(
      ([h, frac]) => window.scrollTo(0, (h - window.innerHeight) * frac),
      [stage, at]
    );
    await page.waitForTimeout(650);
    await page.screenshot({ path: `${OUT}/${label}-${name}.png` });
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  const hinge = await page.evaluate(() => {
    const hit = [...document.querySelectorAll("li")].find((n) =>
      /open \d/i.test(n.textContent ?? "")
    );
    return hit?.textContent?.trim() ?? "(no open readout found)";
  });

  console.log(
    `${label} ${width}px  overflow=${overflow}px  errors=${errors.length}  ${hinge}`
  );
  errors.slice(0, 4).forEach((e) => console.log("   " + e.slice(0, 160)));
  await page.close();
}

await browser.close();
