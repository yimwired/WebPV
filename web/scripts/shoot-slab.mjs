// /labs/slab: the page claims the palette belongs to the product, not to the
// page. Check that picking a course actually repaints every part of it, and
// that the curriculum and the price follow.
//
//   SHOOT_URL=http://localhost:3000 node web/scripts/shoot-slab.mjs
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
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));

await page.goto(`${BASE}/labs/slab`, { waitUntil: "load" });
await page.waitForTimeout(900);

/**
 * The band that holds the hero headline, which carries the current accent.
 * It is the section's first child: it used to be an aria-hidden block placed
 * behind the copy, and that selector broke when the band was made to contain
 * its own headline instead of guessing a height.
 */
const bandColour = () =>
  page.evaluate(() => {
    const band = document.querySelector("main section:nth-of-type(1) > div:first-child");
    if (!band) throw new Error("hero band not found");
    return getComputedStyle(band).backgroundColor;
  });

// ── the palette follows the product ────────────────────────────────────────
{
  const yellow = await bandColour();
  check("opens on the first course's accent", yellow.includes("255, 225, 77"), yellow);

  await page.getByRole("button", { name: "สลับไปคอร์สสีจบ" }).click();
  await page.waitForTimeout(400);
  const pink = await bandColour();
  check("the top bar swatch repaints the hero", pink.includes("255, 143, 199"), pink);

  // and it is not only the hero: the footer block takes it too
  const footer = await page.evaluate(
    () => getComputedStyle(document.querySelector("footer div[aria-hidden]")).backgroundColor
  );
  check("the footer block repaints with it", footer === pink, footer);

  await page.getByRole("button", { name: "สลับไปคอร์สเสียงจบ" }).click();
  await page.waitForTimeout(400);
  const cyan = await bandColour();
  check("all three accents are reachable", cyan.includes("122, 215, 240"), cyan);
}

// ── the curriculum and the price follow the choice ─────────────────────────
{
  const heading = await page.locator("#curriculum h2").innerText();
  check("the curriculum heading names the chosen course", heading.includes("เสียงจบ"), heading.trim());

  const firstModule = await page.locator("#curriculum h3 button").first().innerText();
  check(
    "the module list is the chosen course's, not the first one's",
    firstModule.includes("เก็บเสียง"),
    firstModule.replace(/\s+/g, " ").trim()
  );

  // The card lives in the last section of <main>, not in the footer, which is
  // where "footer, section" resolved to and why this read zero.
  const card = page.locator("main section").last();
  const priceShown = await card.getByText("1,990.-").count();
  const nameShown = await card.locator("h3").innerText();
  check(
    "the sticky card shows the chosen course's name and price",
    priceShown > 0 && nameShown.includes("เสียงจบ"),
    `${nameShown.trim()} / ${priceShown} price match`
  );
}

// ── the accordion opens one row at a time ──────────────────────────────────
{
  const rows = page.locator("#curriculum h3 button");
  const openCount = async () =>
    rows.evaluateAll((els) => els.filter((el) => el.getAttribute("aria-expanded") === "true").length);

  check("one row starts open", (await openCount()) === 1, `${await openCount()} open`);

  await rows.nth(3).click();
  await page.waitForTimeout(350);
  check("opening another closes the first", (await openCount()) === 1, `${await openCount()} open`);

  await rows.nth(3).click();
  await page.waitForTimeout(350);
  check("clicking the open row closes it", (await openCount()) === 0, `${await openCount()} open`);
}

// ── controls actually travel when pressed ──────────────────────────────────
{
  const cls = await page.locator("a[href='#courses']").first().getAttribute("class");
  check(
    "controls carry the press travel, not just a shadow",
    cls.includes("active:translate-x-") && cls.includes("active:shadow-none"),
    "static classes present"
  );
}

const real = errors.filter((e) => !/Failed to load resource/.test(e));
check("no console errors", real.length === 0, real.slice(0, 2).join(" | "));

await page.screenshot({ path: `${OUT}/slab-desktop.png`, fullPage: false });
await page.getByRole("button", { name: "สลับไปคอร์สตัดจบ" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/slab-yellow.png`, fullPage: false });
await ctx.close();

// ── phone ──────────────────────────────────────────────────────────────────
{
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const small = await phone.newPage();
  await small.goto(`${BASE}/labs/slab`, { waitUntil: "load" });
  await small.waitForTimeout(900);
  const overflow = await small.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check("no sideways scroll on a phone", overflow <= 0, `${overflow}px`);
  await small.screenshot({ path: `${OUT}/slab-phone.png`, fullPage: false });
  await phone.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
