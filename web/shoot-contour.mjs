// Screenshots the Contour lab at each act of its scroll, desktop and phone.
// Needs `npm run start` on :3000. Output lands in web/screenshots (gitignored).
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "screenshots";
const URL = "http://localhost:3000/labs/contour";

// one frame in the middle of each act, plus the two crossfades either side
const STOPS = [0.04, 0.22, 0.42, 0.62, 0.72, 0.94];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

const shootRun = async (label, viewport) => {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(URL, { waitUntil: "networkidle" });
  // let the label textures paint before the first frame
  await page.waitForTimeout(2500);

  for (const [i, stop] of STOPS.entries()) {
    await page.evaluate((at) => {
      const total = document.body.scrollHeight - window.innerHeight;
      window.scrollTo({ top: total * at, behavior: "instant" });
    }, stop);
    // the scene damps toward each pose, so give it time to arrive
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}/contour-${label}-${i}.png` });
  }

  console.log(`${label}: ${errors.length ? errors.join(" | ") : "no errors"}`);
  await page.close();
};

await shootRun("desktop", { width: 1440, height: 900 });
await shootRun("phone", { width: 390, height: 844 });

await browser.close();
