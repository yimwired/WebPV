// Screenshots the Contour lab in all three pack states, desktop and phone.
// Needs `npm run start` on :3000. Output lands in web/screenshots (gitignored).
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "screenshots";
const URL = "http://localhost:3000/labs/contour";

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

const shootRun = async (label, viewport) => {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(URL, { waitUntil: "networkidle" });
  // let the label texture paint and the intro settle
  await page.waitForTimeout(2500);

  for (let i = 0; i < 3; i++) {
    await page.screenshot({ path: `${OUT}/contour-${label}-${i}.png` });
    await page.getByRole("button", { name: "Next pack size", exact: true }).click();
    // the swap is damped, so wait for it to finish before the next frame
    await page.waitForTimeout(1800);
  }

  console.log(`${label}: ${errors.length ? errors.join(" | ") : "no errors"}`);
  await page.close();
};

await shootRun("desktop", { width: 1440, height: 900 });
await shootRun("phone", { width: 390, height: 844 });

await browser.close();
