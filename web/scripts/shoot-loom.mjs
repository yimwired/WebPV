// Verifies /labs/loom, which the generic audit cannot: the page is a quote, so
// "is it working" means the calendar answers with a real count per night, the
// selection follows the number of nights, a full night cannot be picked, and
// the two prices are the same nights costed two ways - the saving has to be the
// difference between them and not a number typed into the copy.
//
// The calendar is drawn from the viewer's own clock, so nothing here asserts a
// date. It asserts relationships, which hold whatever day the page is opened.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then from web/:
//   node scripts/shoot-loom.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const ROUTE = "/labs/loom";
const OUT = fileURLToPath(new URL("../screenshots/loom", import.meta.url));

const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1100 },
];

/** Commission midpoint the page states, used to check its own arithmetic. */
const COMMISSION_MID = 0.165;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const digits = (text) => Number((text ?? "").replace(/[^\d]/g, "")) || 0;

const readPage = (page) =>
  page.evaluate(() => {
    const cells = [...document.querySelectorAll("button[aria-label*='ว่าง'], button[aria-label*='เต็ม']")];

    const rooms = [...document.querySelectorAll("section")]
      .find((s) => s.querySelector("h2")?.textContent.includes("ห้องที่ว่าง"))
      ?.querySelectorAll("li") ?? [];

    return {
      cells: cells.map((cell) => ({
        label: cell.getAttribute("aria-label"),
        chosen: cell.getAttribute("aria-pressed") === "true",
        full: cell.getAttribute("aria-label").includes("เต็ม"),
        disabled: cell.disabled,
        open: Number((cell.getAttribute("aria-label").match(/ว่าง (\d+)/) || [])[1] ?? 0),
      })),
      stayLine:
        [...document.querySelectorAll("p")].find((p) => p.textContent.includes("ว่าง") && p.textContent.includes("จากทั้งหมด"))
          ?.textContent ?? "",
      rooms: [...rooms].map((li) => ({
        name: li.querySelector("h3")?.textContent ?? "",
        direct: li.querySelector("dd")?.textContent ?? "",
        agent: li.querySelector("dd.line-through")?.textContent ?? "",
        saved: [...li.querySelectorAll("p")].find((p) => p.textContent.startsWith("ประหยัด"))?.textContent ?? "",
      })),
      banner:
        [...document.querySelectorAll("p")].find((p) => p.textContent.includes("ประหยัดได้ถึง"))
          ?.textContent ?? null,
    };
  });

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
  await page.waitForSelector("button[aria-label]", { state: "attached", timeout: 15000 });
  await sleep(700);

  const start = await readPage(page);
  await page.screenshot({ path: `${OUT}/${size.name}-01-default.png` });

  // 1. the calendar has to say something per night, and not the same thing
  const counts = new Set(start.cells.map((c) => c.open));
  if (start.cells.length < 30) {
    findings.push(`${size.name}: the calendar only offers ${start.cells.length} nights`);
  }
  if (counts.size < 2) {
    findings.push(
      `${size.name}: every night reports the same number of free rooms (${[...counts]}), ` +
        `so the calendar is telling the guest nothing`,
    );
  }

  // 2. a night with no rooms has to be unpickable, not merely styled as full
  const fullNights = start.cells.filter((c) => c.full);
  if (fullNights.length === 0) {
    findings.push(`${size.name}: no night is full, so the full-house case is never shown`);
  } else if (fullNights.some((c) => !c.disabled)) {
    findings.push(`${size.name}: a night marked เต็ม can still be chosen`);
  }

  // 3. the selection has to be exactly as long as the stay
  const chosen = start.cells.filter((c) => c.chosen);
  if (chosen.length !== 2) {
    findings.push(`${size.name}: two nights are booked but ${chosen.length} squares are marked`);
  }

  // 4. the two prices have to be the same nights costed two ways, and the
  //    saving has to be their difference rather than a number in the copy
  if (start.rooms.length === 0) {
    findings.push(`${size.name}: no rooms were offered on the default dates`);
  }
  for (const room of start.rooms) {
    const direct = digits(room.direct);
    const agent = digits(room.agent);
    const saved = digits(room.saved);

    if (agent <= direct) {
      findings.push(
        `${size.name}: ${room.name} lists ${agent} through an agent and ${direct} direct, ` +
          `which is not the point the page is making`,
      );
      continue;
    }
    if (agent - direct !== saved) {
      findings.push(
        `${size.name}: ${room.name} saves ${saved} but the two prices differ by ${agent - direct}`,
      );
    }
    // the agent rate has to be the direct rate carrying the stated commission,
    // give or take the rounding to ten baht a night the page does
    const implied = direct / (1 - COMMISSION_MID);
    if (Math.abs(agent - implied) > 25) {
      findings.push(
        `${size.name}: ${room.name} at ${direct} direct should list near ` +
          `${Math.round(implied)} at ${COMMISSION_MID * 100}%, but lists ${agent}`,
      );
    }
  }

  // 5. the banner has to quote the best saving actually on the page
  if (start.rooms.length > 0) {
    const best = Math.max(...start.rooms.map((r) => digits(r.saved)));
    if (!start.banner) {
      findings.push(`${size.name}: rooms are available but the saving is never summarised`);
    } else if (digits(start.banner.match(/ประหยัดได้ถึง[^\d]*([\d,]+)/)?.[1] ?? "") !== best) {
      findings.push(
        `${size.name}: the banner does not quote the best saving on the page (${best})`,
      );
    }
  }

  // 6. asking for more nights has to change the quote
  await page.getByLabel("จำนวนคืนที่เข้าพัก").fill("5");
  await sleep(450);
  const longer = await readPage(page);
  await page.screenshot({ path: `${OUT}/${size.name}-02-five-nights.png` });

  if (longer.cells.filter((c) => c.chosen).length !== 5) {
    findings.push(
      `${size.name}: five nights were asked for but ` +
        `${longer.cells.filter((c) => c.chosen).length} squares are marked`,
    );
  }
  const before = start.rooms[0] ? digits(start.rooms[0].direct) : 0;
  const after = longer.rooms[0] ? digits(longer.rooms[0].direct) : 0;
  if (longer.rooms.length > 0 && start.rooms.length > 0 && after <= before) {
    findings.push(`${size.name}: five nights cost ${after}, no more than two nights at ${before}`);
  }

  // 7. the count in the summary has to match the cards below it
  const said = Number((longer.stayLine.match(/ว่าง (\d+) ห้อง/) || [])[1] ?? -1);
  if (said !== longer.rooms.length) {
    findings.push(
      `${size.name}: the summary says ${said} rooms free over ${longer.rooms.length} cards`,
    );
  }

  for (const error of errors) findings.push(`${size.name}: console error - ${error}`);
  await context.close();
}

await browser.close();

if (findings.length === 0) {
  console.log(`loom: clean. Screenshots in ${OUT}`);
} else {
  console.log(`loom: ${findings.length} finding(s)`);
  for (const finding of findings) console.log(`  - ${finding}`);
  process.exitCode = 1;
}
