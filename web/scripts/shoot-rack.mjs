// Verifies /labs/rack, which the generic audit cannot: the rail is the answer
// to a measurement, so "is it working" means the split moved when the answer
// did, every rejected piece says by how much it missed, the empty case names
// what to change, and the drawings are one scale - a wider garment has to be
// wider on screen, which is the entire claim the page makes about not using
// photographs.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then from web/:
//   node scripts/shoot-rack.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const ROUTE = "/labs/rack";
const OUT = fileURLToPath(new URL("../screenshots/rack", import.meta.url));

const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Reads the state of the rail out of the page: what fits and what did not. */
const readRail = (page) =>
  page.evaluate(() => {
    const heading = (text) =>
      [...document.querySelectorAll("h2")].find((h) => h.textContent.includes(text));

    const fitsPanel = heading("ราวนี้ใส่ได้")?.closest("section");
    const missPanel = heading("ไม่ผ่าน")?.closest("section");

    const cards = (panel, selector) =>
      panel ? [...panel.querySelectorAll(selector)] : [];

    return {
      fitsTitle: heading("ราวนี้ใส่ได้")?.textContent ?? "",
      fits: cards(fitsPanel, "li").map((li) => ({
        name: li.querySelector("h3")?.textContent ?? "",
        text: li.textContent,
        chest: Number((li.textContent.match(/อก (\d+)/) || [])[1]),
      })),
      misses: cards(missPanel, "li").map((li) => ({
        text: li.textContent,
        chest: Number((li.textContent.match(/อก (\d+)/) || [])[1]),
      })),
      /** rendered width of each drawing, keyed by the chest it was drawn from */
      drawn: [...document.querySelectorAll("svg[role='img']")].map((svg) => ({
        label: svg.getAttribute("aria-label") ?? "",
        chest: Number((svg.getAttribute("aria-label").match(/อก (\d+)/) || [])[1]),
        box: svg.getBoundingClientRect().width,
        // the path's own extent inside the shared viewBox, which is what has
        // to scale with the chest; the box is the same for every drawing
        ink: svg.querySelector("path[fill^='url']")?.getBBox().width ?? 0,
      })),
      emptyAdvice:
        [...document.querySelectorAll("p")].find((p) =>
          p.textContent.includes("ตัวที่ใกล้ที่สุด"),
        )?.textContent ?? null,
    };
  });

const setRange = async (page, label, value) => {
  const input = page.getByLabel(label);
  await input.fill(String(value));
  await sleep(350);
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const findings = [];

for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
  await page.waitForSelector("svg[role='img']", { state: "attached", timeout: 15000 });
  await sleep(600);

  const start = await readRail(page);
  await page.screenshot({ path: `${OUT}/${size.name}-01-default.png` });

  // 1. the default answer has to split the rail, not show everything or nothing
  if (start.fits.length === 0 || start.misses.length === 0) {
    findings.push(
      `${size.name}: the default answer does not split the rail ` +
        `(${start.fits.length} fit, ${start.misses.length} did not)`,
    );
  }
  if (start.fits.length + start.misses.length !== 12) {
    findings.push(
      `${size.name}: ${start.fits.length + start.misses.length} pieces accounted for, not 12`,
    );
  }

  // 2. the count in the panel title has to match the cards under it
  if (!start.fitsTitle.includes(String(start.fits.length))) {
    findings.push(
      `${size.name}: the panel says "${start.fitsTitle.trim()}" over ${start.fits.length} cards`,
    );
  }

  // 3. every rejection has to say by how much, in inches, in a direction
  for (const miss of start.misses) {
    if (!/(แคบไป|หลวมไป) [\d.]+ นิ้ว/.test(miss.text)) {
      findings.push(
        `${size.name}: a rejected piece does not say how far off it is: ` +
          `"${miss.text.replace(/\s+/g, " ").trim().slice(0, 60)}"`,
      );
      break;
    }
  }

  // 4. the drawings are one scale: a bigger chest is drawn wider
  const drawn = start.drawn.filter((d) => Number.isFinite(d.chest) && d.ink > 0);
  const widest = drawn.reduce((a, b) => (b.chest > a.chest ? b : a), drawn[0]);
  const narrowest = drawn.reduce((a, b) => (b.chest < a.chest ? b : a), drawn[0]);
  if (widest && narrowest && widest.chest > narrowest.chest) {
    if (widest.ink <= narrowest.ink) {
      findings.push(
        `${size.name}: the ${widest.chest}in piece is drawn ${widest.ink.toFixed(1)} wide and ` +
          `the ${narrowest.chest}in one ${narrowest.ink.toFixed(1)}, so the rail is not one scale`,
      );
    }
    // every drawing shares the viewBox, so the boxes must agree too
    const boxes = new Set(drawn.map((d) => Math.round(d.box)));
    if (size.name === "desktop" && boxes.size > 3) {
      findings.push(
        `${size.name}: the drawings render at ${boxes.size} different widths; ` +
          `a shared viewBox should give one per card size`,
      );
    }
  }

  // 5. changing the answer has to change the rail
  await setRange(page, "รอบอกของคุณ เป็นนิ้ว", 50);
  const wide = await readRail(page);
  await page.screenshot({ path: `${OUT}/${size.name}-02-chest50.png` });
  if (wide.fits.length === start.fits.length && wide.misses.length === start.misses.length) {
    findings.push(`${size.name}: moving the chest from 38 to 50 inches changed nothing`);
  }

  // 6. the widest chest in a fitted cut empties the rail, and the page has to
  //    say which answer to change rather than showing nothing. 50 is not enough:
  //    the hoodie is 26 flat, so it still lands exactly on the bottom of the band.
  await setRange(page, "รอบอกของคุณ เป็นนิ้ว", 52);
  await page.getByRole("button", { name: "พอดีตัว", exact: true }).click();
  await sleep(400);
  const empty = await readRail(page);
  await page.screenshot({ path: `${OUT}/${size.name}-03-empty.png` });

  if (empty.fits.length === 0 && !empty.emptyAdvice) {
    findings.push(`${size.name}: the rail came up empty and said nothing about what to change`);
  }
  if (empty.fits.length > 0) {
    // not a failure of the page, but the test below is then meaningless
    findings.push(
      `${size.name}: a 52 inch chest asking for พอดีตัว still found ${empty.fits.length}, ` +
        `so the empty case is untested here`,
    );
  }

  // 7. the fitted cut has to be the one showing as pressed
  const pressed = await page
    .getByRole("button", { name: "พอดีตัว", exact: true })
    .getAttribute("aria-pressed");
  if (pressed !== "true") {
    findings.push(`${size.name}: the chosen cut is not marked pressed (aria-pressed=${pressed})`);
  }

  for (const error of errors) findings.push(`${size.name}: console error - ${error}`);
  await context.close();
}

await browser.close();

if (findings.length === 0) {
  console.log(`rack: clean. Screenshots in ${OUT}`);
} else {
  console.log(`rack: ${findings.length} finding(s)`);
  for (const finding of findings) console.log(`  - ${finding}`);
  process.exitCode = 1;
}
