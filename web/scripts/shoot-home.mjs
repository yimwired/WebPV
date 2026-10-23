// Checks small behaviours on the home page that no other script covers:
// the hero's "Scroll down" hint fades out over the first 160px of scroll and
// comes back at the top (`.scroll-hint` in globals.css); switching language
// while the ledger of worries is on screen writes the ledger out again, rows
// and crossings, instead of swapping in text that never animated
// (components/site/pains.tsx); the navbar (components/site/navbar.tsx) takes
// the tone of the topmost ground under its line, pearl sheets inside a dark
// section included, while its empty edges let the page take the pointer; and
// on a phone, everything that animates in has arrived once scrolled past.
//
// The ledger is keyed by locale, so a switch mounts a fresh list that is
// already in view. The way that fails is a list that mounts hidden and stays
// hidden, so the replay is read from both ends: a recorder running every frame
// catches the rows starting from nothing, and the end state is read once every
// row has settled. Waits poll on animation frames, never a fixed time, since
// headless Chromium draws only a few frames a second when the machine is busy.
//
//   node web/scripts/shoot-home.mjs        from the repo root, export served
//   SHOOT_URL=http://127.0.0.1:8788        where the export is served
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const OUT = "web/screenshots/home";
mkdirSync(OUT, { recursive: true });

const HINT = "#top > p[aria-hidden]";
const LEDGER = 'section[aria-labelledby="pains-title"] ol';
// `.scroll-hint` in globals.css maps scrollY 0..160 onto the hint's opacity 1..0.
const HINT_FADE_PX = 160;

const browser = await chromium.launch();
const results = [];
const check = (ok, label, detail) =>
  results.push(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
// Chromium on this machine is refused a localhost socket now and then
// (web/scripts/CLAUDE.md). Those are listed apart from page errors: a refused
// script chunk already fails the behaviour checks by leaving the page inert.
const refused = [];
const REFUSED = /ERR_NETWORK_ACCESS_DENIED/;

async function open(reducedMotion, device = { viewport: { width: 1440, height: 900 } }) {
  const context = await browser.newContext({
    ...device,
    reducedMotion,
    // This machine's Chrome reports Thai; every run starts in English.
    locale: "en-US",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !REFUSED.test(message.text())) errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (REFUSED.test(request.failure()?.errorText ?? "")) refused.push(request.url());
  });
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  return { context, page, errors };
}

/**
 * Jumps to `y` (the page scrolls smoothly by default, which would make every
 * reading a moment in a glide) and returns the hint's opacity once it has
 * reached the value that position should give, or whatever it holds when
 * that never happens.
 */
async function hintOpacityAt(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  const expected = Math.min(Math.max(1 - y / HINT_FADE_PX, 0), 1);
  await page
    .waitForFunction(
      ([selector, target]) =>
        Math.abs(Number(getComputedStyle(document.querySelector(selector)).opacity) - target) < 0.02,
      [HINT, expected],
      { polling: "raf", timeout: 4000 },
    )
    .catch(() => {});
  return page.$eval(HINT, (hint) => Number(getComputedStyle(hint).opacity));
}

/** Every row, crossing and margin answer of the ledger, as the browser paints them now. */
const readLedger = (page) =>
  page.$eval(LEDGER, (list) => {
    const rows = [...list.children];
    const opacity = (element) => Number(getComputedStyle(element).opacity);
    return {
      rows: rows.length,
      rowOpacity: rows.map(opacity),
      answerOpacity: rows.map((row) => opacity(row.lastElementChild)),
      strikeWidth: [...list.querySelectorAll(".strike")].map(
        (strike) => parseFloat(getComputedStyle(strike).backgroundSize),
      ),
      firstWorry: list.querySelector(".strike")?.textContent ?? "",
    };
  });

const isSettled = (ledger) =>
  ledger.rows > 0 &&
  ledger.rowOpacity.every((value) => value === 1) &&
  ledger.answerOpacity.every((value) => value === 1) &&
  ledger.strikeWidth.every((value) => value === 100);

/** Waits until the ledger has finished writing itself out, in the given script. */
async function waitForLedger(page, thai) {
  await page
    .waitForFunction(
      ([selector, wantThai]) => {
        const list = document.querySelector(selector);
        if (!list || !list.children.length) return false;
        const strikes = [...list.querySelectorAll(".strike")];
        const inThai = /[฀-๿]/.test(strikes[0]?.textContent ?? "");
        return (
          inThai === wantThai &&
          [...list.children].every(
            (row) =>
              getComputedStyle(row).opacity === "1" &&
              getComputedStyle(row.lastElementChild).opacity === "1",
          ) &&
          strikes.every((strike) => parseFloat(getComputedStyle(strike).backgroundSize) === 100)
        );
      },
      [LEDGER, thai],
      { polling: "raf", timeout: 15000 },
    )
    .catch(() => {});
  return readLedger(page);
}

/**
 * Starts a recorder that keeps, frame by frame, the lowest opacity the last
 * row reaches, the narrowest any crossing gets, and whether the list element
 * itself was replaced. The last row waits longest in the stagger, so it is the
 * one still hidden when a slow frame finally lands.
 */
const startRecorder = (page) =>
  page.evaluate((selector) => {
    const original = document.querySelector(selector);
    const record = { remounted: false, lastRowMin: 1, strikeMin: 100, frames: 0 };
    window.__ledgerRecord = record;
    const tick = () => {
      const list = document.querySelector(selector);
      if (list && list.children.length) {
        if (list !== original) record.remounted = true;
        const last = list.children[list.children.length - 1];
        record.lastRowMin = Math.min(record.lastRowMin, Number(getComputedStyle(last).opacity));
        for (const strike of list.querySelectorAll(".strike")) {
          record.strikeMin = Math.min(record.strikeMin, parseFloat(getComputedStyle(strike).backgroundSize));
        }
      }
      record.frames += 1;
      if (!window.__ledgerRecordStop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, LEDGER);

const stopRecorder = (page) =>
  page.evaluate(() => {
    window.__ledgerRecordStop = true;
    return window.__ledgerRecord;
  });

const switchToThai = (page) => page.getByRole("switch", { name: "เปลี่ยนภาษาเป็นไทย" }).click();

// --- The scroll hint ---------------------------------------------------------

for (const reducedMotion of ["no-preference", "reduce"]) {
  const tag = reducedMotion === "reduce" ? "reduced motion: " : "";
  const { context, page, errors } = await open(reducedMotion);
  const atTop = await hintOpacityAt(page, 0);
  const halfway = await hintOpacityAt(page, HINT_FADE_PX / 2);
  const past = await hintOpacityAt(page, HINT_FADE_PX + 40);
  const back = await hintOpacityAt(page, 0);
  check(atTop === 1, `${tag}the hint shows at the top`, `${atTop}`);
  check(halfway > 0.35 && halfway < 0.65, `${tag}the hint is half gone ${HINT_FADE_PX / 2}px down`, `${halfway.toFixed(2)}`);
  // Opacity is not motion, so the hint clears under reduced motion as well.
  check(past === 0, `${tag}the hint is gone past ${HINT_FADE_PX}px`, `${past}`);
  check(back === 1, `${tag}the hint returns at the top`, `${back}`);
  check(errors.length === 0, `${tag}no page errors`, errors.slice(0, 2).join(" | "));
  await context.close();
}

// --- The ledger on a language switch ----------------------------------------

{
  const { context, page, errors } = await open("no-preference");
  await page.locator(LEDGER).scrollIntoViewIfNeeded();
  const english = await waitForLedger(page, false);
  check(isSettled(english), "the ledger writes itself out in English", `${english.rows} rows`);

  await startRecorder(page);
  await switchToThai(page);
  const thai = await waitForLedger(page, true);
  const record = await stopRecorder(page);
  check(/[฀-๿]/.test(thai.firstWorry), "the ledger is in Thai after the switch", thai.firstWorry);
  check(record.remounted, "the switch mounts a fresh list");
  check(record.lastRowMin < 0.1, "the rows replay from hidden", `last row low ${record.lastRowMin.toFixed(2)} over ${record.frames} frames`);
  check(record.strikeMin < 5, "the crossings are drawn again", `narrowest ${record.strikeMin}%`);
  check(isSettled(thai), "the Thai ledger finishes writing itself out", `${thai.rows} rows`);
  check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "));
  // The whole sheet, not the list: the tilted margin notes reach past the
  // list's box into the sheet's padding, and a list-sized shot clips them.
  await page.locator('section[aria-labelledby="pains-title"] .paper').screenshot({ path: `${OUT}/ledger-th.png` });
  await context.close();
}

{
  const { context, page, errors } = await open("reduce");
  await page.locator(LEDGER).scrollIntoViewIfNeeded();
  await waitForLedger(page, false);
  await switchToThai(page);
  const thai = await waitForLedger(page, true);
  check(isSettled(thai), "reduced motion: the Thai ledger ends fully shown", `${thai.rows} rows`);
  check(errors.length === 0, "reduced motion: no page errors", errors.slice(0, 2).join(" | "));
  await context.close();
}

// --- The navbar's tone and its empty edges --------------------------------

{
  const { context, page, errors } = await open("no-preference");
  // The line the navbar reads its ground at, from navbar.tsx.
  const NAV_LINE = 44;
  const spots = await page.evaluate(() => {
    const top = (element) => element.getBoundingClientRect().top + scrollY;
    const pains = document.querySelector('section[aria-labelledby="pains-title"]');
    const card = document.querySelector('section[aria-labelledby="promise-title"] > [data-nav-tone]');
    const platform = document.querySelector('section[aria-labelledby="platform-title"]');
    return [
      ["the hero", 200, "light"],
      ["the dark section's title", top(pains) + 80, "dark"],
      ["the pearl ledger inside it", top(pains.querySelector(".paper")) + 120, "light"],
      ["the card risen into its foot", top(card) + 40, "light"],
      ["the next dark section", top(platform) + 80, "dark"],
    ];
  });
  for (const [where, y, expected] of spots) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y - NAV_LINE);
    await page
      .waitForFunction(
        (want) => document.querySelector("header").classList.contains("dark") === (want === "dark"),
        expected,
        { polling: "raf", timeout: 3000 },
      )
      .catch(() => {});
    const tone = await page.evaluate(() => (document.querySelector("header").classList.contains("dark") ? "dark" : "light"));
    check(tone === expected, `the navbar is ${expected} over ${where}`, tone);
  }

  // Beside the pill at 1440px the header is empty: the page underneath, not
  // the header, has to be what a pointer there lands on.
  const beside = await page.evaluate(() => {
    const hit = document.elementFromPoint(100, 40);
    return { inHeader: Boolean(hit?.closest("header")), tag: hit?.tagName.toLowerCase() };
  });
  check(!beside.inHeader, "the empty strip beside the pill lets the pointer through", beside.tag);
  const link = await page.getByRole("link", { name: "Pricing" }).first().boundingBox();
  const onLink = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.textContent?.trim(),
    [link.x + link.width / 2, link.y + link.height / 2],
  );
  check(onLink === "Pricing", "the pill's links still take the pointer", onLink);
  check(errors.length === 0, "no page errors", errors.slice(0, 2).join(" | "));
  await context.close();
}

// --- Entrances on a phone ----------------------------------------------------

// What animates in when scrolled to starts invisible. On a phone two sets of
// ticks never arrived: their trigger's margin cut the sides off the screen as
// well as the top and bottom, and the ticks by the left edge never entered
// what was left. After a walk to the bottom, nothing laid out within the
// screen's width may still be held at opacity 0 by an entrance.
{
  const { context, page, errors } = await open("no-preference", devices["Pixel 7"]);
  await page.waitForTimeout(1000);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 300) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(200);
  }
  // The last entrances begin at the bottom and take about two seconds.
  await page.waitForTimeout(2500);
  const stuck = await page.evaluate(() =>
    [...document.querySelectorAll("[style*='opacity']")]
      .filter((element) => element.style.opacity === "0" && !element.closest(".drift-track"))
      .filter((element) => {
        // Not laid out (the hint below lg), or off to the side in a row that
        // scrolls sideways: neither is the visitor's to see yet.
        const box = element.getBoundingClientRect();
        return element.getClientRects().length > 0 && box.right > 0 && box.left < window.innerWidth;
      })
      .map((element) => `${element.tagName.toLowerCase()}.${String(element.className).split(" ").slice(0, 3).join(".")}`),
  );
  check(stuck.length === 0, "phone: every entrance has arrived after a scroll to the bottom", stuck.slice(0, 4).join(", ") || "none left hidden");
  // The quote's deposit bar grows in width rather than fading in, so the
  // opacity sweep above cannot see it; it sat empty on a phone for the same
  // reason as the ticks.
  const deposit = await page.evaluate(() => {
    const bar = document.querySelector('section[aria-labelledby="promise-title"] [class~="h-1.5"] > div');
    return bar ? bar.getBoundingClientRect().width / bar.parentElement.getBoundingClientRect().width : null;
  });
  check(deposit !== null && Math.abs(deposit - 0.5) < 0.02, "phone: the deposit bar fills to half", deposit?.toFixed(2));
  check(errors.length === 0, "phone: no page errors", errors.slice(0, 2).join(" | "));
  await context.close();
}

await browser.close();
console.log(results.join("\n"));
if (refused.length) console.log(`\nrefused by the sandbox, not the site: ${refused.join(", ")}`);
if (results.some((line) => line.startsWith("FAIL"))) process.exitCode = 1;
