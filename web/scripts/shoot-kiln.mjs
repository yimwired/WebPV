// /labs/kiln: the page's claim is that the marks on the photograph are real
// positions on real pieces, not decoration. Check that every marker lands on
// the picture, that pressing one explains that specific flaw, and that picking
// another piece swaps the photograph, the markers and the spec together.
//
//   SHOOT_URL=http://localhost:3000 node web/scripts/shoot-kiln.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:3000";
const OUT = process.env.AUDIT_OUT || "web/screenshots";
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`${pass ? "ok  " : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));

await page.goto(`${BASE}/labs/kiln`, { waitUntil: "load" });
await page.waitForTimeout(1000);
await page.locator("#pieces").scrollIntoViewIfNeeded();
await page.waitForTimeout(700);

const PIECES = ["ชามดอกไม้", "ถ้วยเคลือบขี้เถ้า", "โถสามขา", "จานหินดำ"];
const frame = () => page.locator("#pieces .aspect-square").first();
const markers = () => page.locator("#pieces .aspect-square button[aria-expanded]");

// ── every marker sits inside the photograph, with room to be pressed ───────
{
  let worst = null;
  for (const name of PIECES) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(500);

    const box = await frame().boundingBox();
    const count = await markers().count();
    for (let i = 0; i < count; i += 1) {
      const m = await markers().nth(i).boundingBox();
      // 6% in from every edge: a marker hard against the rim is either
      // pointing at the crop rather than the object, or gets clipped.
      const inset = {
        left: (m.x - box.x) / box.width,
        top: (m.y - box.y) / box.height,
        right: (box.x + box.width - (m.x + m.width)) / box.width,
        bottom: (box.y + box.height - (m.y + m.height)) / box.height,
      };
      const min = Math.min(inset.left, inset.top, inset.right, inset.bottom);
      if (worst === null || min < worst.min) worst = { min, name, i };
    }
  }
  check(
    "every marker sits well inside its photograph",
    worst.min > 0.06,
    `closest is ${(worst.min * 100).toFixed(1)}% from an edge, on ${worst.name}`
  );
}

// ── pressing a marker explains that flaw, and only one is open at a time ───
{
  await page.getByRole("button", { name: "โถสามขา", exact: true }).click();
  await page.waitForTimeout(500);

  const openCount = async () =>
    markers().evaluateAll((els) => els.filter((e) => e.getAttribute("aria-expanded") === "true").length);

  check("no flaw is open to begin with", (await openCount()) === 0);

  await markers().nth(0).click();
  await page.waitForTimeout(400);
  const first = await page.locator("#pieces .aspect-square + div").innerText();
  check(
    "pressing a marker names that flaw and says what caused it",
    first.includes("ฝาปิดสนิทแค่ทางเดียว") && first.includes("หดไม่เท่ากัน"),
    first.replace(/\s+/g, " ").slice(0, 60)
  );

  await markers().nth(1).click();
  await page.waitForTimeout(400);
  check("opening the second closes the first", (await openCount()) === 1, `${await openCount()} open`);
  const second = await page.locator("#pieces .aspect-square + div").innerText();
  check(
    "the callout followed the marker",
    second.includes("ขาสามขาไม่ยาวเท่ากัน"),
    second.replace(/\s+/g, " ").slice(0, 40)
  );
}

// ── picking a piece swaps the photograph, the markers and the spec ─────────
{
  const before = await frame().locator("img").getAttribute("src");
  await page.getByRole("button", { name: "จานหินดำ", exact: true }).click();
  await page.waitForTimeout(600);
  const after = await frame().locator("img").getAttribute("src");
  check("the photograph changes with the piece", before !== after, `${before} then ${after}`);

  const spec = await page.locator("#pieces").innerText();
  check(
    "the number, price and clay are this piece's",
    spec.includes("24-044") && spec.includes("890") && spec.includes("ดินดำผสมแมงกานีส"),
    "24-044 / 890 / ดินดำ"
  );

  check("the flaw callout reset when the piece changed", (await page.locator("#pieces .aspect-square + div").innerText()).includes("กดดูได้"));
}

// ── the markers are reachable without a mouse ──────────────────────────────
{
  const named = await markers().evaluateAll((els) =>
    els.every((el) => (el.textContent || "").trim().length > 0)
  );
  check("each marker carries the flaw name for a screen reader", named);
}

const real = errors.filter((e) => !/Failed to load resource/.test(e));
check("no console errors", real.length === 0, real.slice(0, 2).join(" | "));

await page.screenshot({ path: `${OUT}/kiln-pieces.png` });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/kiln-hero.png` });
await ctx.close();

{
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const small = await phone.newPage();
  await small.goto(`${BASE}/labs/kiln`, { waitUntil: "load" });
  await small.waitForTimeout(900);
  const overflow = await small.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check("no sideways scroll on a phone", overflow <= 0, `${overflow}px`);
  await small.locator("#pieces").scrollIntoViewIfNeeded();
  await small.waitForTimeout(700);
  await small.screenshot({ path: `${OUT}/kiln-phone.png` });
  await phone.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
