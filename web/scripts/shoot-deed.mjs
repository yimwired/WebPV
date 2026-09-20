// Verifies /labs/deed, whose whole claim is that its numbers are the real ones:
// an annuity instalment at the floating rate, a bank's own affordability rule,
// the itemised cost of transfer day, and thirty years of instalments charted
// where they actually go.
//
// So this script does the finance itself. It reads the inputs off the page,
// works the instalment, the schedule and every fee from published rates, and
// compares. The chart is measured with getBBox, so a bar has to be the height
// its own row in the table says it is. Nothing is compared against a figure
// typed in here except the published rates themselves, which are what the page
// states it uses.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then:
//   node web/scripts/shoot-deed.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const ROUTE = "/labs/deed";
const OUT = fileURLToPath(new URL("../screenshots/deed", import.meta.url));

// The terms the page says it works to, in one place so a change to them is a
// change to this file too.
const FLOAT_RATE = 5.3;
const PROMO_RATE = 3.5;
const PROMO_YEARS = 3;
const DSR = 0.4;
const MAX_LOAN_SHARE = 0.9;
const TRANSFER = 0.02 * 0.5;
const MORTGAGE = 0.01;
const SINKING_PER_SQM = 500;
const MAINTENANCE_PER_SQM = 50;

const findings = [];
const note = (text) => findings.push(text);
const check = (ok, text) => {
  if (!ok) note(text);
};

const instalment = (principal, annualRate, years) => {
  const monthly = annualRate / 100 / 12;
  return (
    (principal * monthly) / (1 - Math.pow(1 + monthly, -years * 12))
  );
};

/** The same month-by-month walk the page says it does. */
const schedule = (loan, payment, years) => {
  const rows = [];
  let balance = loan;
  for (let year = 1; year <= years && balance > 0.5; year += 1) {
    const rate = year <= PROMO_YEARS ? PROMO_RATE : FLOAT_RATE;
    const monthly = rate / 100 / 12;
    let principal = 0;
    let interest = 0;
    for (let month = 0; month < 12 && balance > 0.5; month += 1) {
      const owed = balance * monthly;
      const paid = Math.min(payment - owed, balance);
      balance -= paid;
      principal += paid;
      interest += owed;
    }
    rows.push({ year, principal, interest, balance });
  }
  return rows;
};

const money = (text) => Number(String(text).replace(/[^\d.-]/g, ""));

/** Everything the page is currently saying, in numbers. */
const readPage = (page) =>
  page.evaluate(() => {
    const clean = (text) => Number(String(text ?? "").replace(/[^\d.-]/g, ""));
    const unit = document.querySelector("[data-unit]:has(input:checked)");

    return {
      price: Number(unit?.dataset.price ?? 0),
      sqm: Number(unit?.dataset.sqm ?? 0),
      income: clean(document.querySelector("[data-income]")?.textContent),
      down: clean(document.querySelector("[data-down]")?.textContent),
      years: Number(
        document.querySelector('input[name="deed-years"]:checked')?.value ?? 0,
      ),
      figures: Object.fromEntries(
        [...document.querySelectorAll("[data-figure]")].map((box) => [
          box.dataset.figure,
          clean(box.querySelector("dd")?.textContent),
        ]),
      ),
      charges: Object.fromEntries(
        [...document.querySelectorAll("[data-charge]")].map((row) => [
          row.dataset.charge,
          clean(row.lastElementChild.textContent),
        ]),
      ),
      cashTotal: clean(
        document.querySelector("[data-cash-total]")?.textContent,
      ),
      rows: [...document.querySelectorAll("[data-year]")].map((row) => {
        const cells = [...row.children].map((cell) => clean(cell.textContent));
        return {
          year: cells[0],
          principal: cells[1],
          interest: cells[2],
          balance: cells[3],
        };
      }),
      bars: [...document.querySelectorAll("[data-bar]")].map((group) => {
        const principal = group.querySelector("[data-principal]").getBBox();
        const interest = group.querySelector("[data-interest]").getBBox();
        return {
          year: Number(group.dataset.bar),
          principalHeight: principal.height,
          interestHeight: interest.height,
        };
      }),
      verdict: document.querySelector("[data-verdict]")?.innerText ?? "",
      remedy: document.querySelector("[data-remedy]")?.innerText ?? "",
      early: document.querySelector("[data-early]")?.innerText ?? "",
      chartNote: document.querySelector("[data-crossover]")?.innerText ?? "",
      promoNote: document.querySelector("[data-promo-note]")?.innerText ?? "",
    };
  });

const setRange = async (page, selector, value) => {
  await page.locator(selector).fill(String(value));
  await page.waitForTimeout(250);
};

const pick = async (page, text) => {
  await page.locator("label").filter({ hasText: text }).first().click();
  await page.waitForTimeout(250);
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  locale: "en-US",
});
const page = await context.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
await page.waitForSelector("[data-figure]");

// ── 1. the instalment is an annuity at the floating rate ───────────────────
{
  const state = await readPage(page);
  const loan = Math.min(
    state.price - state.down,
    state.price * MAX_LOAN_SHARE,
  );
  const payment = instalment(loan, FLOAT_RATE, state.years);

  check(
    Math.abs(state.figures.payment - payment) < 2,
    `a ${loan} baht loan over ${state.years} years at ${FLOAT_RATE}% is ` +
      `${payment.toFixed(0)} a month, and the page says ${state.figures.payment}`,
  );
  check(
    Math.abs(state.figures.needed - payment / DSR) < 3,
    `at a ${DSR * 100}% rule that instalment needs ${(payment / DSR).toFixed(0)} ` +
      `of income, and the page asks for ${state.figures.needed}`,
  );

  // the teaser rate is not quietly used to make the instalment look smaller
  const flattered = instalment(loan, PROMO_RATE, state.years);
  check(
    Math.abs(state.figures.payment - flattered) > 100,
    "the instalment was quoted at the three year teaser rate",
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/01-passes.png` });
}

// ── 2. transfer day is itemised from the published rates ───────────────────
{
  const state = await readPage(page);
  const loan = Math.min(state.price - state.down, state.price * MAX_LOAN_SHARE);

  const wanted = {
    transfer: state.price * TRANSFER,
    mortgage: loan * MORTGAGE,
    sinking: state.sqm * SINKING_PER_SQM,
    maintenance: state.sqm * MAINTENANCE_PER_SQM * 12,
  };
  for (const [id, amount] of Object.entries(wanted)) {
    check(
      Math.abs(state.charges[id] - amount) < 2,
      `${id} should be ${amount.toFixed(0)} and the table says ${state.charges[id]}`,
    );
  }

  const summed =
    state.down +
    Object.values(state.charges).reduce((total, value) => total + value, 0);
  check(
    Math.abs(state.cashTotal - summed) < 6,
    `the rows add to ${summed.toFixed(0)} and the total says ${state.cashTotal}`,
  );
  check(
    Math.abs(state.figures.cash - state.cashTotal) < 6,
    `the headline says ${state.figures.cash} in cash and the table totals ${state.cashTotal}`,
  );

  // the point of the page: transfer day costs a great deal more than the deposit
  check(
    state.cashTotal - state.down > 100_000,
    `the fees on this unit come to ${(state.cashTotal - state.down).toFixed(0)}, ` +
      "which is too little to be worth a page about them",
  );
}

// ── 3. the schedule is the loan, month by month ────────────────────────────
{
  const state = await readPage(page);
  const loan = Math.min(state.price - state.down, state.price * MAX_LOAN_SHARE);
  // worked from the loan rather than from the rounded instalment the page
  // prints, or 27 years of rounding drift shows up in the final year
  const mine = schedule(loan, instalment(loan, FLOAT_RATE, state.years), state.years);

  check(
    mine.length === state.rows.length,
    `the loan runs ${mine.length} years and the table lists ${state.rows.length}`,
  );
  for (const row of mine) {
    const theirs = state.rows.find((entry) => entry.year === row.year);
    check(
      theirs !== undefined &&
        Math.abs(theirs.interest - row.interest) < 40 &&
        Math.abs(theirs.principal - row.principal) < 40,
      `year ${row.year} should pay ${row.interest.toFixed(0)} interest and ` +
        `${row.principal.toFixed(0)} principal, and the table says ` +
        `${theirs?.interest} and ${theirs?.principal}`,
    );
  }

  const paidInterest = state.rows.reduce((sum, row) => sum + row.interest, 0);
  const paidPrincipal = state.rows.reduce((sum, row) => sum + row.principal, 0);
  check(
    Math.abs(state.figures.interest - paidInterest) < 60,
    `the years add to ${paidInterest.toFixed(0)} of interest and the headline ` +
      `says ${state.figures.interest}`,
  );
  check(
    Math.abs(paidPrincipal - loan) < 60,
    `the years repay ${paidPrincipal.toFixed(0)} against a ${loan} loan`,
  );

  // and the teaser years really do buy something
  check(
    /\d+ งวด/.test(state.early),
    `the page does not say how much the teaser years take off: "${state.early}"`,
  );
}

// ── 4. every bar is the height its own row asks for ────────────────────────
{
  const state = await readPage(page);
  const tallest = Math.max(
    ...state.rows.map((row) => row.principal + row.interest),
  );

  for (const bar of state.bars) {
    const row = state.rows.find((entry) => entry.year === bar.year);
    const total = row.principal + row.interest;
    const height = (total / tallest) * 62;
    const principal = (row.principal / total) * height;

    check(
      Math.abs(bar.principalHeight - principal) < 0.4 &&
        Math.abs(bar.interestHeight - (height - principal)) < 0.4,
      `year ${bar.year} pays ${row.principal} principal of ${total.toFixed(0)}, ` +
        `so its bar is ${principal.toFixed(1)} of ${height.toFixed(1)} units, and ` +
        `${bar.principalHeight.toFixed(1)} was drawn`,
    );
  }

  // the crossover the page names is the year the split turns over for good,
  // not the teaser year where it turns over and then turns back
  const turnIndex = state.rows.findIndex((_, index) =>
    state.rows.slice(index).every((later) => later.principal > later.interest),
  );
  const turned = state.rows[turnIndex];
  const named = Number(state.chartNote.match(/ปีที่ (\d+)/)?.[1]);
  check(
    turned !== undefined && named === turned.year,
    `the split turns over in year ${turned?.year} and the page says ${named}`,
  );
  check(
    state.bars[0].interestHeight > state.bars[0].principalHeight,
    "the first year of a thirty year loan was drawn as mostly principal",
  );

  // the teaser years are marked, because the bars step down without them and
  // a reader is owed the reason
  check(
    (await page.locator("[data-promo-edge]").count()) === 1,
    "the year the promotional rate ends is not marked on the chart",
  );
  const afterPromo = state.rows.find((row) => row.year === PROMO_YEARS + 1);
  const lastPromo = state.rows.find((row) => row.year === PROMO_YEARS);
  check(
    afterPromo.principal < lastPromo.principal,
    `the step up from ${PROMO_RATE}% to ${FLOAT_RATE}% should cut what year ` +
      `${PROMO_YEARS + 1} takes off the balance, and it went from ` +
      `${lastPromo.principal} to ${afterPromo.principal}`,
  );
  check(
    state.promoNote.includes(String(PROMO_RATE)),
    `the chart does not explain the step: "${state.promoNote}"`,
  );
}

// ── 5. a hover reads the year it is over ───────────────────────────────────
{
  await page.locator('[data-bar="1"]').hover();
  await page.waitForTimeout(250);
  const tip = await page.locator("[data-tooltip]").innerText();
  const state = await readPage(page);
  const first = state.rows[0];
  check(
    tip.includes(first.interest.toLocaleString("th-TH")),
    `the first bar pays ${first.interest} in interest and the tooltip reads "${tip}"`,
  );

  // and it stays inside the plot rather than covering the verdict above it
  const tipBox = await page.locator("[data-tooltip]").boundingBox();
  const plotBox = await page.locator('[data-chart="amortisation"] svg').boundingBox();
  check(
    tipBox.y >= plotBox.y - 2,
    `the tooltip floats ${(plotBox.y - tipBox.y).toFixed(0)}px above the chart`,
  );
}

// ── 6. a bank saying no says what would fix it, and the fix works ──────────
{
  await setRange(page, "#deed-income", 30_000);
  const refused = await readPage(page);
  check(
    refused.verdict.includes("ยังไม่ผ่าน"),
    `30,000 a month against a ${refused.figures.needed} requirement reads: "${refused.verdict}"`,
  );
  check(
    refused.remedy.length > 0,
    "a refusal came with no way out of it",
  );
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/02-refused.png` });

  const longer = Number(refused.remedy.match(/ยืดเป็น (\d+) ปี/)?.[1]);
  if (Number.isFinite(longer)) {
    await pick(page, String(longer));
    const stretched = await readPage(page);
    check(
      stretched.years === longer && stretched.verdict.includes("ผ่านเกณฑ์"),
      `the page offered ${longer} years as the fix and at ${stretched.years} ` +
        `years it still says: "${stretched.verdict}"`,
    );
    await pick(page, String(refused.years));
  }

  // and the deposit it asks for is enough, to the nearest step the slider has
  const more = money(refused.remedy.match(/ดาวน์เพิ่มอีก ([\d,]+)/)?.[1] ?? "");
  if (Number.isFinite(more) && more > 0) {
    const share = Math.ceil(
      ((refused.down + more) / refused.price) * 100,
    );
    await setRange(page, "#deed-down", Math.min(share, 50));
    const paid = await readPage(page);
    check(
      paid.verdict.includes("ผ่านเกณฑ์"),
      `the page asked for ${more} more down, which is ${share}% of the price, ` +
        `and at ${share}% it still says: "${paid.verdict}"`,
    );
    await page.screenshot({ path: `${OUT}/03-fixed.png` });
    await setRange(page, "#deed-down", 10);
  }
  await setRange(page, "#deed-income", 45_000);
}

// ── 7. the bank's ceiling on the loan is real ──────────────────────────────
{
  await setRange(page, "#deed-down", 10);
  const state = await readPage(page);
  const loan = state.price - state.down;
  check(
    Math.abs(loan - state.price * MAX_LOAN_SHARE) < 2,
    `a ${MAX_LOAN_SHARE * 100}% ceiling on a ${state.price} flat is ` +
      `${state.price * MAX_LOAN_SHARE} and the deposit leaves ${loan}`,
  );
}

// ── 8. a different unit moves every figure with it ─────────────────────────
{
  const before = await readPage(page);
  await pick(page, "2 ห้องนอน");
  const after = await readPage(page);

  check(
    after.price > before.price,
    `picking the two bedroom left the price at ${after.price}`,
  );
  for (const key of ["payment", "needed", "cash", "interest"]) {
    check(
      after.figures[key] > before.figures[key],
      `${key} did not move with the price: ${before.figures[key]} then ${after.figures[key]}`,
    );
  }
  check(
    Math.abs(after.charges.sinking - after.sqm * SINKING_PER_SQM) < 2,
    `the sinking fund on ${after.sqm} sqm is ${after.sqm * SINKING_PER_SQM} and ` +
      `the table says ${after.charges.sinking}`,
  );
  await pick(page, "1 ห้องนอน");
}

// ── 9. the keyboard reaches the unit and the term ──────────────────────────
{
  await page.getByRole("radio", { name: /ยูนิต A/ }).focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(250);
  check(
    (await readPage(page)).price === 3_450_000,
    "an arrow key did not move between the units",
  );

  await page.locator("#deed-income").focus();
  const before = (await readPage(page)).income;
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  check(
    (await readPage(page)).income === before + 1000,
    "an arrow key did not move the income slider",
  );
}

for (const error of errors) note(`console error - ${error}`);
await context.close();

// ── 10. the phone keeps the chart and does not scroll sideways ─────────────
{
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
  });
  const small = await phone.newPage();
  await small.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
  await small.waitForSelector("[data-figure]");

  const overflow = await small.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  check(overflow <= 0, `the page scrolls ${overflow}px sideways on a phone`);

  const state = await readPage(small);
  check(
    state.bars.length === state.rows.length,
    `${state.rows.length} years and ${state.bars.length} bars on a phone`,
  );
  await small.locator('[data-chart="amortisation"]').scrollIntoViewIfNeeded();
  await small.waitForTimeout(250);
  await small.screenshot({ path: `${OUT}/04-phone.png` });
  await phone.close();
}

await browser.close();

if (findings.length === 0) {
  console.log(`deed: clean on ${BASE}${ROUTE}`);
} else {
  console.log(`deed: ${findings.length} finding(s) on ${BASE}${ROUTE}`);
  for (const finding of findings) console.log(` - ${finding}`);
  process.exitCode = 1;
}
