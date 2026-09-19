// Verifies /labs/clash, whose whole claim is arithmetic: pick two sets and the
// page says how much they overlap, how long the walk between their stages is,
// and what that costs you.
//
// Nothing here is compared against a number typed into this file. The times
// come off the lineup, the walking minutes come off the site map, and the
// clash row has to agree with both: if the data changes, the check moves with
// it, and if the page starts making its numbers up, the check fails.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then from web/:
//   node scripts/shoot-clash.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const ROUTE = "/labs/clash";
const OUT = fileURLToPath(new URL("../screenshots/clash", import.meta.url));

/** Two sets that overlap, on different stages, on the Saturday. */
const CLASHING = ["ควายเหล็ก", "พัดลมสามใบพัด"];
/** Two sets that do not overlap but are further apart than the walk. */
const TIGHT = ["น้ำแข็งใส", "หิ่งห้อยดีเซล"];

const findings = [];
const note = (text) => findings.push(text);

const minutes = (clock) => {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

// ── 1. the clash arithmetic ────────────────────────────────────────────────
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "en-US",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
  await page.waitForSelector("h1");

  // the walking table the page publishes about itself
  const mapLine = await page
    .locator("p", { hasText: "เดินระหว่างเวที" })
    .first()
    .innerText();
  const walks = Object.fromEntries(
    mapLine
      .split("·")
      .map((part) => part.match(/(\S+)ถึง(\S+)\s+(\d+)\s*นาที/))
      .filter(Boolean)
      .map((m) => [`${m[1]}|${m[2]}`, Number(m[3])]),
  );
  if (Object.keys(walks).length !== 3) {
    note(`the site map did not list three walks, it said "${mapLine}"`);
  }

  for (const name of CLASHING) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/01-clash.png` });

  const panel = page.locator("aside");
  const rows = await panel.locator("li").allInnerTexts();
  const clashRow = rows.find((row) => row.includes("ชนกัน"));
  if (!clashRow) {
    note("two overlapping sets were picked and the panel said nothing about a clash");
  } else {
    // What the panel itself printed for each set. A row for a set opens
    // with its start time; the clash row names both sets too, so matching
    // on the names alone picks it up as a third set with two clocks in it.
    const actRows = rows.filter((row) => /^[0-9]{2}:[0-9]{2}/.test(row.trim()));
    const times = actRows.map((row) =>
      (row.match(/[0-9]{2}:[0-9]{2}/g) ?? []).map(minutes),
    );

    if (times.length !== 2 || times.some((pair) => pair.length !== 2)) {
      note(`the two picked sets did not print a start and an end each: ${JSON.stringify(times)}`);
    } else {
      const ordered = actRows
        .map((row, i) => ({ row, time: times[i] }))
        .sort((a, b) => a.time[0] - b.time[0]);
      const [first, second] = ordered.map((entry) => entry.time);
      const overlap = first[1] - second[0];
      const stages = ordered.map((entry) => entry.row.split("\n").at(-1).trim());
      const walk =
        walks[`${stages[0]}|${stages[1]}`] ?? walks[`${stages[1]}|${stages[0]}`];

      if (!walk) {
        note(`no walk published between ${stages[0]} and ${stages[1]}`);
      } else {
        const want = {
          overlap,
          walk,
          cost: overlap + walk,
          arrive: first[1] + walk,
          leaveBy: second[0] - walk,
        };
        const clock = (m) =>
          `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

        const expected = [
          [`ชนกัน ${want.overlap} นาที`, "the overlap"],
          [`เดินอีก ${want.walk} นาที`, "the walk"],
          [`${want.cost} นาที`, "the cost, which is the overlap plus the walk"],
          [clock(want.arrive), "the time you would arrive"],
          [clock(want.leaveBy), "the time you would have to leave"],
        ];
        for (const [text, what] of expected) {
          if (!clashRow.includes(text)) {
            note(
              `the clash row does not carry ${what}: expected "${text}" in "${clashRow.replace(/\n/g, " ")}"`,
            );
          }
        }
      }
    }
  }

  // the counters have to agree with the picks
  const summary = await panel.locator("dl").first().innerText();
  if (!summary.includes("2")) note(`the counters do not say two sets: "${summary}"`);
  if (!/จุดชน[\s\S]*1/.test(summary)) {
    note(`the counters do not report one clash: "${summary}"`);
  }

  // ── 2. clearing ─────────────────────────────────────────────────────────
  await page.getByRole("button", { name: "ล้างทั้งหมด" }).click();
  await page.waitForTimeout(300);
  if (!(await panel.innerText()).includes("ยังไม่ได้เลือก")) {
    note("clearing the plan did not put the panel back to its empty state");
  }

  // ── 3. the transfer that looks fine and is not ──────────────────────────
  await page.getByText("อาทิตย์", { exact: false }).first().click();
  await page.waitForTimeout(300);
  for (const name of TIGHT) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/02-tight.png` });

  const tightRows = await panel.locator("li").allInnerTexts();
  const tightRow = tightRows.find((row) => row.includes("ไปถึงช้า"));
  if (!tightRow) {
    note("two sets closer together than the walk did not produce a late warning");
  } else {
    const [gap, walkMinutes, late] = (tightRow.match(/\d+/g) ?? []).map(Number);
    if (walkMinutes - gap !== late) {
      note(
        `the late warning does not subtract: ${walkMinutes} minutes of walking minus a ` +
          `${gap} minute gap should be ${walkMinutes - gap}, the page said ${late}`,
      );
    }
  }

  // ── 4. the keyboard ─────────────────────────────────────────────────────
  await page.getByRole("button", { name: "ล้างทั้งหมด" }).click();
  await page.waitForTimeout(200);
  const firstCard = page.getByRole("button", { name: new RegExp(TIGHT[0]) });
  await firstCard.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  if ((await firstCard.getAttribute("aria-pressed")) !== "true") {
    note("space on a set did not pick it, so the cards are not real buttons");
  }

  await page.getByRole("radio", { name: /เสาร์/ }).focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  if (!(await page.getByRole("radio", { name: /อาทิตย์/ }).isChecked())) {
    note("an arrow key did not move between the days, so they are not real radios");
  }

  for (const error of errors) note(`console error - ${error}`);
  await context.close();
}

// ── 5. reduced motion: the marquee holds still ─────────────────────────────
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    locale: "en-US",
  });
  const page = await context.newPage();
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
  await page.waitForSelector("h1");

  const strip = page.locator("header").first().locator("xpath=preceding::div[1]");
  const read = () => strip.evaluate((el) => getComputedStyle(el).transform);
  const before = await read();
  await page.waitForTimeout(1200);
  if ((await read()) !== before) {
    note("the marquee is still running under prefers-reduced-motion");
  }
  await page.screenshot({ path: `${OUT}/03-reduced.png` });
  await context.close();
}

await browser.close();

if (findings.length === 0) {
  console.log(`clash: clean. Screenshots in ${OUT}`);
} else {
  console.log(`clash: ${findings.length} finding(s)`);
  for (const finding of findings) console.log(`  - ${finding}`);
  process.exitCode = 1;
}
