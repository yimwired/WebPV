// Verifies /labs/draft, which claims two things a picture cannot claim on its
// own: that the plan is drawn to the room's real proportions, and that the
// notes in the margin are measured off that same plan.
//
// So nothing is compared against a figure typed into this file. The room's
// rectangle, the furniture rectangles, the dimension strings and the notes all
// come off the page, and each has to agree with the others.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then from web/:
//   node scripts/shoot-draft.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const ROUTE = "/labs/draft";
const OUT = fileURLToPath(new URL("../screenshots/draft", import.meta.url));

const findings = [];
const note = (text) => findings.push(text);
const check = (ok, text) => {
  if (!ok) note(text);
};

/** Every rectangle on the sheet, in the centimetres the viewBox is drawn in. */
const readSheet = (page) =>
  page.evaluate(() => {
    const num = (el, name) => Number(el.getAttribute(name));
    const room = document.querySelector("[data-room]");
    const pieces = [...document.querySelectorAll("[data-piece]")].map((el) => ({
      name: el.getAttribute("data-piece"),
      x: num(el, "x"),
      y: num(el, "y"),
      width: num(el, "width"),
      depth: num(el, "height"),
    }));
    const text = [...document.querySelectorAll("svg text")].map((el) =>
      el.textContent.trim(),
    );
    return {
      room: room?.getAttribute("data-room") ?? null,
      pieces,
      text,
      notes: document.querySelector("[aria-live] ul")?.innerText ?? "",
      area: document.querySelector("dl dd")?.textContent ?? "",
    };
  });

/**
 * The two pieces that face each other across the room. Sorting by y is not
 * enough: the side piece stands at the head of the anchor, so it shares y = 0
 * with it and was being read as the far wall's unit.
 */
const facingPair = (pieces, depth) => {
  const facing = pieces.find((p) => p.y + p.depth === depth);
  const anchor = pieces
    .filter((p) => p !== facing && p.y === 0)
    .sort((a, b) => b.depth - a.depth)[0];
  return { anchor, facing };
};

const setRoom = async (page, width, depth) => {
  await page.locator("#draft-width").fill(String(width));
  await page.locator("#draft-depth").fill(String(depth));
  await page.waitForTimeout(350);
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "en-US",
});
const page = await context.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
await page.waitForSelector("[data-room]");

// ── 1. the drawing is the room, at the size the controls say ───────────────
{
  await setRoom(page, 360, 420);
  const sheet = await readSheet(page);
  check(sheet.room === "360x420", `the room is drawn ${sheet.room}, not 360x420`);
  check(
    sheet.text.includes("3.60 ม.") && sheet.text.includes("4.20 ม."),
    `the sheet does not dimension itself in metres: ${JSON.stringify(sheet.text)}`,
  );
  await page.screenshot({ path: `${OUT}/01-bedroom.png` });

  // every piece carries its own size, and the rectangle is that size
  for (const piece of sheet.pieces) {
    const printed = `${piece.width} x ${piece.depth}`;
    check(
      sheet.text.includes(printed),
      `${piece.name} is drawn ${printed} and the sheet does not say so`,
    );
  }

  // the walkway is what is left between the two pieces that face each other
  const { anchor, facing } = facingPair(sheet.pieces, 420);
  const gap = facing.y - (anchor.y + anchor.depth);
  check(
    sheet.text.some((t) => t === `${gap} ซม.`),
    `the gap between ${anchor.name} and ${facing.name} measures ${gap} cm on the ` +
      `drawing and the sheet does not dimension it: ${JSON.stringify(sheet.text)}`,
  );
  check(
    sheet.notes.includes(String(gap)),
    `the margin note does not carry the ${gap} cm the drawing shows: "${sheet.notes}"`,
  );
}

// ── 2. proportion: a wider room is drawn wider, to scale ───────────────────
{
  await setRoom(page, 500, 300);
  const sheet = await readSheet(page);
  check(sheet.room === "500x300", `the room is drawn ${sheet.room}, not 500x300`);
  const wardrobe = sheet.pieces.find((p) => p.y > 0);
  check(
    wardrobe !== undefined && wardrobe.y + wardrobe.depth === 300,
    `the piece against the far wall does not reach it: ${JSON.stringify(wardrobe)}`,
  );
  // and it is centred on the wall it stands against
  const anchor = sheet.pieces.find((p) => p.y === 0 && p.width > 100);
  check(
    anchor !== undefined && Math.abs(anchor.x - (500 - anchor.width) / 2) <= 1,
    `the anchor piece is not centred on its wall: ${JSON.stringify(anchor)}`,
  );
}

// ── 3. the note that makes the page worth building ─────────────────────────
{
  await setRoom(page, 360, 300);
  const sheet = await readSheet(page);
  const { anchor, facing } = facingPair(sheet.pieces, 300);
  const gap = facing.y - (anchor.y + anchor.depth);

  const numbers = (sheet.notes.match(/\d+/g) ?? []).map(Number);
  check(
    numbers.includes(gap),
    `the note does not state the ${gap} cm that is left: "${sheet.notes}"`,
  );
  // it says what is wanted and by how much the room falls short, and those
  // three numbers have to add up
  const wanted = numbers.find((n) => n > gap && n <= 200);
  check(
    wanted !== undefined && numbers.includes(wanted - gap),
    `the shortfall is not the difference: ${wanted} wanted, ${gap} left, ` +
      `note says "${sheet.notes}"`,
  );
  await page.screenshot({ path: `${OUT}/02-tight.png` });
}

// ── 4. a room narrower than the furniture is named as such ─────────────────
{
  await page.getByText("ห้องครัว", { exact: true }).click();
  await setRoom(page, 180, 400);
  const sheet = await readSheet(page);
  const widest = Math.max(...sheet.pieces.map((p) => p.width), 0);
  check(
    sheet.notes.includes("กว้างเกินผนัง"),
    `a 180 cm room was given a ${widest} cm run of units without a word: "${sheet.notes}"`,
  );
  const over = (sheet.notes.match(/(\d+) ซม/g) ?? []).map((s) => parseInt(s, 10));
  check(
    over.includes(240 - 180) || over.includes(190 - 180),
    `the note does not say how much too wide the units are: "${sheet.notes}"`,
  );
  await page.screenshot({ path: `${OUT}/03-too-narrow.png` });
}

// ── 5. the area and the budget are the room, not decoration ────────────────
{
  await page.getByText("ห้องนอน", { exact: true }).click();
  await setRoom(page, 400, 500);
  const shown = await page.locator("dl").first().innerText();
  const area = (400 * 500) / 10_000;
  check(
    shown.includes(`${area.toFixed(1)} ตร.ม.`),
    `4 by 5 metres is ${area} sqm and the panel says "${shown.replace(/\n/g, " ")}"`,
  );
  const low = Math.round((area * 9000) / 1000) * 1000;
  check(
    shown.includes(low.toLocaleString("th-TH")),
    `the budget does not start at ${low} for ${area} sqm: "${shown.replace(/\n/g, " ")}"`,
  );
}

// ── 6. the keyboard reaches the layouts ────────────────────────────────────
{
  await page.getByRole("radio", { name: "ห้องนอน" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const living = await page.getByRole("radio", { name: "ห้องนั่งเล่น" }).isChecked();
  check(living, "an arrow key did not move between the room types");
}

for (const error of errors) note(`console error - ${error}`);
await context.close();

// ── 7. the phone does not scroll sideways ──────────────────────────────────
{
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
  });
  const small = await phone.newPage();
  await small.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
  await small.waitForSelector("[data-room]");
  const overflow = await small.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(overflow <= 0, `the page scrolls ${overflow}px sideways on a phone`);
  await small.screenshot({ path: `${OUT}/04-phone.png`, fullPage: false });
  await phone.close();
}

await browser.close();

if (findings.length === 0) {
  console.log(`draft: clean. Screenshots in ${OUT}`);
} else {
  console.log(`draft: ${findings.length} finding(s)`);
  for (const finding of findings) console.log(`  - ${finding}`);
  process.exitCode = 1;
}
