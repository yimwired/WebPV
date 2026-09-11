// Walks /labs/unfold at three widths and reports what the page actually
// painted: console errors, horizontal overflow, and one frame per section.
//
// The page is normal flow now rather than a pinned stage, so sections are
// found by their headings instead of by a scroll fraction.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const URL = process.env.SHOOT_URL ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "shots";

/** Matched against each section's first heading. */
const SECTIONS = [
  ["1-hero", "Unfold"],
  ["2-unfold", "One hinge"],
  ["3-light", "Then the room"],
  ["4-warmth", "Warm to work"],
  ["5-dimensions", "320 mm bar"],
  ["6-specs", "Unfold, in full"],
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

  for (const [name, heading] of SECTIONS) {
    await page.evaluate((text) => {
      const node = [...document.querySelectorAll("h1, h2")].find((n) =>
        (n.textContent ?? "").includes(text)
      );
      node?.scrollIntoView({ block: "center", behavior: "instant" });
    }, heading);
    // entrances are 600ms, the clip needs a moment to start
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${OUT}/${label}-${name}.png` });
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  const clip = await page.evaluate(() => {
    const video = document.querySelector("video");
    if (!video) return "(no clip)";
    return `clip ${video.readyState >= 2 ? "loaded" : "not loaded"}, t=${video.currentTime.toFixed(1)}s`;
  });

  console.log(
    `${label} ${width}px  overflow=${overflow}px  errors=${errors.length}  ${clip}`
  );
  errors.slice(0, 4).forEach((e) => console.log("   " + e.slice(0, 160)));
  await page.close();
}

await browser.close();
