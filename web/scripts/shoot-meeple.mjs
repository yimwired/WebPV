// /labs/meeple: the page's claim is that answering three questions splits a
// shelf of twelve boxes into what this group can play tonight and what it
// cannot, with the reason on every box it ruled out. That is checkable, so
// check it rather than screenshotting it and calling it done.
//
// The expected sets below are worked out from the printed shelf by hand, not
// imported from `finder.ts`. Importing the rule the page uses would only prove
// the page calls its own function.
//
//   SHOOT_URL=http://127.0.0.1:8788 node web/scripts/shoot-meeple.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const OUT = process.env.AUDIT_OUT || "web/screenshots";
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`${pass ? "ok  " : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
};

const same = (a, b) => {
  const left = [...a].sort().join(",");
  const right = [...b].sort().join(",");
  return { pass: left === right, detail: left === right ? "" : `got ${left || "(none)"}, wanted ${right || "(none)"}` };
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

await page.goto(`${BASE}/labs/meeple`, { waitUntil: "load" });
await page.waitForTimeout(1200);

const fitting = () =>
  page.$$eval('[data-game][data-fits="yes"]', (nodes) => nodes.map((n) => n.dataset.game));

const answer = async (group, label) => {
  await page.getByRole("group", { name: group }).getByText(label, { exact: true }).click();
  await page.waitForTimeout(350);
};

// ── 1. the shelf it starts on ──────────────────────────────────────────────
// Four people, an hour, played a bit before: everything light or medium that
// runs in 60 minutes and seats four.
{
  const expected = ["lomwon", "khamun", "kwan", "suan", "talat", "chaoban", "rotfai"];
  const { pass, detail } = same(await fitting(), expected);
  check("the default answers match the seven boxes they should", pass, detail);

  const count = await page.textContent("[data-match-count]");
  check("the summary count agrees with the shelf", count === String(expected.length), `summary says ${count}`);
}

// ── 2. every rejected box says why ─────────────────────────────────────────
{
  const rejected = await page.$$eval('[data-game][data-fits="no"]', (nodes) =>
    nodes.map((n) => ({
      id: n.dataset.game,
      reasons: [...n.querySelectorAll("[data-miss]")].map((s) => s.textContent.trim()).filter(Boolean),
    })),
  );
  const silent = rejected.filter((r) => r.reasons.length === 0).map((r) => r.id);
  check("no box is ruled out without a reason", silent.length === 0, silent.join(", "));
  check("all twelve boxes stay on the shelf", rejected.length === 12 - 7, `${rejected.length} rejected`);
}

await page.screenshot({ path: `${OUT}/meeple-default.png`, fullPage: false });

// ── 3. changing an answer repaints the shelf ───────────────────────────────
// Two people who have never played, half an hour. Only the two lightest boxes
// that seat two survive.
{
  await answer("มากี่คน", "2");
  await answer("มีเวลาเท่าไหร่", "ครึ่งชั่วโมง");
  await answer("เคยเล่นบอร์ดเกมมาก่อนไหม", "ยังไม่เคยเล่น");

  const { pass, detail } = same(await fitting(), ["lomwon", "namkhang"]);
  check("two beginners with half an hour get the two boxes that fit", pass, detail);
}

// ── 4. the answer when nothing fits ────────────────────────────────────────
// Seven regulars with half an hour. There is no heavy game for seven people in
// thirty minutes, and there is no such game in real life either, so the page
// has to say which answer to change instead of printing an empty list.
{
  await answer("มากี่คน", "7");
  await answer("เคยเล่นบอร์ดเกมมาก่อนไหม", "เล่นประจำ");

  const matches = await fitting();
  check("nothing matches, as the shelf says it should not", matches.length === 0, matches.join(", "));

  const panel = (await page.textContent("[data-result]")) ?? "";
  check("the empty answer names the condition to relax", panel.includes("ความหนัก"), panel.slice(0, 90));
  check("the empty answer names the closest box", panel.includes("คำมั่น"), panel.slice(0, 90));
  check("the empty answer offers a person to ask", panel.includes("เคาน์เตอร์"));
}

await page.screenshot({ path: `${OUT}/meeple-no-match.png`, fullPage: false });

// ── 5. the answers are real radios ─────────────────────────────────────────
// The buttons are labels over hidden inputs, so a keyboard gets arrow-key
// selection for free. If that ever becomes a row of <button aria-pressed>, this
// fails, which is the point.
{
  await answer("มีเวลาเท่าไหร่", "ไม่รีบ");
  await answer("เคยเล่นบอร์ดเกมมาก่อนไหม", "เคยเล่นมาบ้าง");

  await page.getByRole("radio", { name: "4", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(350);
  const checked = await page.$eval('input[type="radio"]:checked[value="5"]', () => true).catch(() => false);
  check("an arrow key moves between answers", checked);

  // Five people, no hurry, played before: the two-to-four boxes drop out and
  // the one that needs five players comes back.
  const { pass, detail } = same(await fitting(), ["lomwon", "khamun", "kwan", "chaokhao", "rotfai"]);
  check("and the shelf answers the keyboard too", pass, detail);
}

// ── 6. nothing is scaled by a fraction ─────────────────────────────────────
// The one rule the whole style rests on. A sprite drawn at 1.37x is a blurred
// picture of pixel art, so every sprite on the page is measured against its own
// grid rather than trusted.
{
  const offGrid = await page.$$eval('svg[shape-rendering="crispEdges"]', (nodes) =>
    nodes
      .map((svg) => {
        const box = svg.getBoundingClientRect();
        const [, , gridW, gridH] = svg.getAttribute("viewBox").split(" ").map(Number);
        return { w: box.width / gridW, h: box.height / gridH };
      })
      .filter((s) => s.w % 1 !== 0 || s.h % 1 !== 0 || s.w !== s.h),
  );
  const total = await page.$$eval('svg[shape-rendering="crispEdges"]', (n) => n.length);
  check(`all ${total} sprites sit on whole pixels`, offGrid.length === 0, JSON.stringify(offGrid.slice(0, 3)));
}

// ── 7. the motion steps ────────────────────────────────────────────────────
{
  const timing = await page.$eval(".mpl-bob", (el) => getComputedStyle(el).animationTimingFunction);
  check("the idle sprite animates in steps, not on a curve", timing.includes("steps"), timing);
}

// ── 8. phone width ─────────────────────────────────────────────────────────
{
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check("no sideways scroll at 390", overflow <= 0, `${overflow}px`);
  await page.screenshot({ path: `${OUT}/meeple-phone.png`, fullPage: false });
}

// ── 9. reduced motion ──────────────────────────────────────────────────────
{
  const still = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const quiet = await still.newPage();
  await quiet.goto(`${BASE}/labs/meeple`, { waitUntil: "load" });
  await quiet.waitForTimeout(900);
  const duration = await quiet.$eval(".mpl-bob", (el) => getComputedStyle(el).animationDuration);
  check("the bob stops for anyone who asked it to", parseFloat(duration) < 1, duration);
  await still.close();
}

check("no console or page errors", errors.length === 0, errors.slice(0, 3).join(" | "));

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
