// /labs/ember: the dialog is the whole point of the page, so check the four
// things it claims rather than that it renders. Does the panel start on the
// card that opened it, does Escape close it, does a click on the backdrop close
// it, is the page behind it actually frozen, and does focus come back.
//
//   SHOOT_URL=http://localhost:3000 node web/scripts/shoot-ember.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:3000";
const OUT = process.env.AUDIT_OUT || "web/screenshots";
mkdirSync(OUT, { recursive: true });

const SET_CARD = "#sets li:nth-child(2) button";
const BRANCH_CARD = "#branches li:nth-child(4) button";
const DIALOG = "[role='dialog']";

const centre = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "ok  " : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
};

const browser = await chromium.launch();

// ── the dialog, on a desktop viewport ──────────────────────────────────────
{
  // Headless Chromium reports `prefers-reduced-motion: reduce` unless told
  // otherwise, and MotionConfig honours it by dropping every transform. Without
  // this the panel would jump straight to the centre and the origin check below
  // would be measuring the reduced-motion path, not the animation.
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));

  await page.goto(`${BASE}/labs/ember`, { waitUntil: "load" });
  await page.waitForTimeout(600);

  const card = page.locator(SET_CARD);
  await card.scrollIntoViewIfNeeded();
  // Park the card well away from the middle of the screen. Centred, the panel
  // would start where it ends and the origin could not be told apart from a
  // plain fade, which is exactly what this check exists to catch.
  await page.evaluate(() => window.scrollBy(0, -260));
  await page.waitForTimeout(500);

  const cardCentre = centre(await card.boundingBox());
  const viewportCentre = { x: 720, y: 450 };
  check(
    "the card is off centre, so the origin is measurable",
    dist(viewportCentre, cardCentre) > 200,
    `${Math.round(dist(viewportCentre, cardCentre))}px apart`
  );

  // Sample from inside the page rather than over the protocol: a round trip per
  // frame is slower than the animation, and every measurement would land after
  // it had already finished. The observer arms before the click and records on
  // rAF from the frame the panel is inserted.
  await page.evaluate(() => {
    window.__samples = [];
    const start = performance.now();
    const tick = () => {
      const panel = document.querySelector("[role='dialog']");
      if (panel) {
        const r = panel.getBoundingClientRect();
        window.__samples.push({
          t: Math.round(performance.now() - start),
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
        });
      }
      if (performance.now() - start < 2000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await card.click();
  await page.waitForTimeout(900);

  const samples = await page.evaluate(() => window.__samples);
  const first = samples[0];
  check(
    "dialog opens from the card that was pressed",
    first && dist(first, cardCentre) < dist(viewportCentre, cardCentre) * 0.75,
    first
      ? `frame 0 at t=${first.t}ms is ${Math.round(dist(first, cardCentre))}px from the card, ` +
        `${Math.round(dist(viewportCentre, cardCentre))}px is the distance to the middle ` +
        `(${samples.length} frames sampled)`
      : "no panel measured"
  );

  const settled = centre(await page.locator(DIALOG).boundingBox());
  check(
    "dialog settles in the middle",
    dist(settled, viewportCentre) < 6,
    `${Math.round(dist(settled, viewportCentre))}px off centre`
  );

  check(
    "dialog carries its content",
    (await page.locator(`${DIALOG} h2`).innerText()).trim().length > 0 &&
      (await page.locator(`${DIALOG} li`).count()) >= 5,
    `${await page.locator(`${DIALOG} li`).count()} list rows`
  );

  // The page behind it must not move.
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => window.scrollY);
  check("page behind the dialog is frozen", Math.abs(after - before) < 2, `moved ${after - before}px`);

  check(
    "focus is inside the dialog",
    await page.evaluate(() => document.activeElement?.closest("[role='dialog']") !== null),
    await page.evaluate(() => document.activeElement?.tagName)
  );

  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  check("Escape closes it", (await page.locator(DIALOG).count()) === 0);

  check(
    "focus returns to the card",
    await page.evaluate(
      (sel) => document.activeElement === document.querySelector(sel),
      SET_CARD
    )
  );

  const afterClose = await page.evaluate(() => window.scrollY);
  check("scrolling works again", afterClose >= 0 && (await page.evaluate(async () => {
    const start = window.scrollY;
    window.scrollBy(0, 300);
    await new Promise((r) => setTimeout(r, 200));
    return window.scrollY > start;
  })));

  // A branch card opens the same dialog, and the backdrop dismisses it.
  const branch = page.locator(BRANCH_CARD);
  await branch.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await branch.click();
  await page.waitForTimeout(600);
  check("a branch card opens the dialog too", (await page.locator(DIALOG).count()) === 1);

  await page.mouse.click(40, 40);
  await page.waitForTimeout(500);
  check("a click outside closes it", (await page.locator(DIALOG).count()) === 0);

  // The lab switcher prefetches every other demo, and a static export serves no
  // RSC payload for those links. Every lab page 404s the same set, so it says
  // nothing about this one.
  const real = errors.filter((e) => !/Failed to load resource/.test(e));
  check("no console errors", real.length === 0, real.slice(0, 2).join(" | "));
  await page.screenshot({ path: `${OUT}/ember-desktop.png`, fullPage: true });
  await ctx.close();
}

// ── phone, and the reduced-motion path ─────────────────────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/labs/ember`, { waitUntil: "load" });
  await page.waitForTimeout(600);

  const card = page.locator(SET_CARD);
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await card.click();
  await page.waitForTimeout(500);

  check("dialog opens on a phone with reduced motion", (await page.locator(DIALOG).count()) === 1);

  const box = await page.locator(DIALOG).boundingBox();
  check(
    "dialog fits the phone",
    box.x >= 0 && box.x + box.width <= 390 && box.height <= 844 * 0.9,
    `${Math.round(box.width)}x${Math.round(box.height)} at x=${Math.round(box.x)}`
  );

  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  check("Escape works there too", (await page.locator(DIALOG).count()) === 0);

  await page.screenshot({ path: `${OUT}/ember-phone.png`, fullPage: true });
  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
