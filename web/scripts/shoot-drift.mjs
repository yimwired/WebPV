// Checks the home page's drifting lanes of demos (components/site/hero-cards.tsx):
// that they move, that they move UP and at a drifting pace rather than a scroll,
// that hovering a lane stops it and lights the card under the pointer, that the
// others keep going meanwhile, that they rest under reduced motion, and that the
// phone band rises without pushing the page sideways.
//
// Every motion check reads a signed value: a lane running backwards would pass
// "did it move?" and fail "did y decrease?". Positions come from the track's
// computed transform, sampled twice, so no check depends on a fixed frame rate.
//
//   node web/scripts/shoot-drift.mjs          from the repo root, export served
//   SHOOT_URL=http://127.0.0.1:8788           where the export is served
import { chromium } from "playwright";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const browser = await chromium.launch();
const results = [];
const check = (ok, label, detail) =>
  results.push(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);

/** The vertical offset of every visible lane, in DOM order. */
const laneOffsets = (page) =>
  page.$$eval(".drift-lane .drift-track", (tracks) =>
    tracks
      .filter((track) => track.offsetParent)
      .map((track) => new DOMMatrixReadOnly(getComputedStyle(track).transform).m42),
  );

async function open(reducedMotion, width = 1440, height = 900) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  return { context, page };
}

{
  const { context, page } = await open("no-preference");
  const before = await laneOffsets(page);
  await page.waitForTimeout(3000);
  const after = await laneOffsets(page);
  const moved = before.map((y, i) => after[i] - y);
  const speeds = moved.map((distance) => -distance / 3);
  check(before.length === 4, "four lanes on desktop", `${before.length}`);
  check(moved.every((distance) => distance < -10), "every lane rises", moved.map((d) => d.toFixed(1)).join(", ") + " px in 3s");
  check(speeds.every((speed) => speed >= 6 && speed <= 30), "drifting pace, 6 to 30 px a second", speeds.map((s) => s.toFixed(1)).join(", "));

  // A card well inside the window: the lane keeps moving, so pick one whose
  // whole box is on screen and clear of the navbar.
  const cards = page.locator(".drift-lane:visible").nth(2).locator(".drift-card");
  let box = null;
  for (let i = 0; i < (await cards.count()); i++) {
    const candidate = await cards.nth(i).boundingBox();
    if (candidate && candidate.y > 140 && candidate.y + candidate.height < 820) {
      box = candidate;
      break;
    }
  }
  check(Boolean(box), "a card fully on screen in the right inner lane");
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    const held = await laneOffsets(page);
    await page.waitForTimeout(1500);
    const later = await laneOffsets(page);
    check(Math.abs(later[2] - held[2]) < 0.5, "the hovered lane stops", `${(later[2] - held[2]).toFixed(2)} px`);
    check(later[0] - held[0] < -5, "the other lanes keep moving", `${(later[0] - held[0]).toFixed(1)} px`);
    const lit = await page.evaluate(() => {
      const card = document.querySelector(".drift-lane:hover .drift-card:hover");
      return card ? getComputedStyle(card).opacity : null;
    });
    check(lit === "1", "the hovered card comes to full opacity", `${lit}`);
    const resting = await page.evaluate(() => {
      const lane = [...document.querySelectorAll(".drift-lane")].find(
        (candidate) => candidate.offsetParent && !candidate.matches(":hover"),
      );
      return getComputedStyle(lane.querySelector(".drift-card")).opacity;
    });
    check(Number(resting) < 0.6, "resting cards stay faded", resting);
  }
  await context.close();
}

{
  const { context, page } = await open("reduce");
  const before = await laneOffsets(page);
  await page.waitForTimeout(2000);
  const after = await laneOffsets(page);
  check(
    before.every((y, i) => Math.abs(after[i] - y) < 0.5 && Math.abs(y) < 0.5),
    "reduced motion: the lanes rest where they start",
    before.map((y) => y.toFixed(1)).join(", "),
  );
  await context.close();
}

{
  const { context, page } = await open("no-preference", 390, 844);
  const before = await laneOffsets(page);
  await page.waitForTimeout(3000);
  const after = await laneOffsets(page);
  check(before.length === 3, "three lanes on a phone", `${before.length}`);
  check(before.every((y, i) => after[i] - y < -5), "the phone lanes rise", before.map((y, i) => (after[i] - y).toFixed(1)).join(", "));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 0, "no sideways scroll at 390", `${overflow}px`);
  await context.close();
}

await browser.close();
console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) process.exitCode = 1;
