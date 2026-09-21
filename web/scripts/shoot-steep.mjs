// Verifies /labs/steep, whose claim is that the label, the two scales and the
// notes underneath are three views of one set of numbers.
//
// So almost nothing here is compared against a figure typed into this file.
// The bars are measured off the rendered page in pixels and converted back to
// degrees and minutes using the scale's own domain, and those have to agree
// with the label, with which bars are drawn as failing, and with what the notes
// say. The one place a constant appears is the caffeine sanity band, where the
// page has no other way of stating what it worked from.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then from web/:
//   node scripts/shoot-steep.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const ROUTE = "/labs/steep";
const OUT = fileURLToPath(new URL("../screenshots/steep", import.meta.url));

const findings = [];
const note = (text) => findings.push(text);
const check = (ok, text) => {
  if (!ok) note(text);
};

/** The four figures the label sets the pot by. */
const readLabel = (page) =>
  page.evaluate(() => {
    const figure = (id) =>
      document.querySelector(`[data-figure="${id}"] dd`)?.textContent?.trim() ??
      "";
    const weights = [...document.querySelectorAll("[data-weight]")].map(
      (row) => ({
        id: row.getAttribute("data-weight"),
        grams: parseFloat(row.lastElementChild.textContent),
      }),
    );
    return {
      blend: document.querySelector("[data-blend]")?.textContent?.trim() ?? "",
      water: parseInt(figure("water"), 10),
      minutes: parseInt(figure("minutes"), 10),
      caffeine: parseInt(figure("caffeine"), 10),
      baht: parseInt(figure("baht"), 10),
      weights,
      totalGrams: parseFloat(
        document.querySelector("[data-total-grams]")?.textContent ?? "",
      ),
      notes: document.querySelector("[data-notes]")?.innerText ?? "",
      aside: document.querySelector("[data-aside]")?.innerText ?? "",
      late: document.querySelector("[data-late]")?.innerText ?? "",
      body: document.body.innerText,
    };
  });

/**
 * Every bar on one scale, read back off the screen. The track is the scale's
 * domain, so a bar's pixels convert straight back into degrees or minutes and
 * can be compared with the range the row prints beside it.
 */
const readScale = (page, scaleId) =>
  page.evaluate((id) => {
    const scale = document.querySelector(`[data-scale="${id}"]`);
    const low = Number(scale.dataset.low);
    const high = Number(scale.dataset.high);
    const rows = [...scale.querySelectorAll("[data-track]")].map((track) => {
      const bar = track.querySelector("[data-band]");
      const rule = track.querySelector("[data-rule]");
      const box = track.getBoundingClientRect();
      const at = (x) => low + ((x - box.left) / box.width) * (high - low);
      const barBox = bar.getBoundingClientRect();
      return {
        id: bar.dataset.band,
        from: Number(bar.dataset.from),
        to: Number(bar.dataset.to),
        ok: bar.dataset.ok === "yes",
        drawnFrom: at(barBox.left),
        drawnTo: at(barBox.right),
        rule: at(rule.getBoundingClientRect().left),
      };
    });
    return { low, high, value: Number(scale.dataset.value), rows };
  }, scaleId);

// The controls are real radios and checkboxes inside their labels, hidden the
// usual way, so the label is what a person presses and what this presses too.
const pick = async (page, pattern) => {
  await page.locator("label").filter({ hasText: pattern }).first().click();
  await page.waitForTimeout(200);
};

/** Leaves only the base selected, so each case starts from a known pot. */
const clearAdditions = async (page) => {
  const checked = page.locator('label:has(input[type="checkbox"]:checked)');
  for (let guard = 0; (await checked.count()) > 0 && guard < 12; guard += 1) {
    await checked.first().click();
    await page.waitForTimeout(120);
  }
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  locale: "en-US",
});
const page = await context.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
await page.waitForSelector("[data-blend]");

// ── 1. the bars are drawn where the figures beside them say ────────────────
{
  const label = await readLabel(page);
  for (const scaleId of ["temperature", "time"]) {
    const scale = await readScale(page, scaleId);
    const tolerance = (scale.high - scale.low) / 200;
    for (const row of scale.rows) {
      check(
        Math.abs(row.drawnFrom - row.from) < tolerance &&
          Math.abs(row.drawnTo - row.to) < tolerance,
        `${scaleId}: ${row.id} prints ${row.from} to ${row.to} and is drawn ` +
          `${row.drawnFrom.toFixed(1)} to ${row.drawnTo.toFixed(1)}`,
      );
    }
    const set = scaleId === "temperature" ? label.water : label.minutes;
    check(
      scale.value === set,
      `${scaleId}: the scale is ruled at ${scale.value} and the label says ${set}`,
    );
    check(
      Math.abs(scale.rows[0].rule - set) < tolerance,
      `${scaleId}: the rule is drawn at ${scale.rows[0].rule.toFixed(1)}, not ${set}`,
    );
  }
  await page.screenshot({ path: `${OUT}/01-morning.png` });
}

// ── 2. a bar is marked as failing exactly when the rule misses it ──────────
{
  for (const scaleId of ["temperature", "time"]) {
    const scale = await readScale(page, scaleId);
    for (const row of scale.rows) {
      const hit = scale.value >= row.from && scale.value <= row.to;
      check(
        hit === row.ok,
        `${scaleId}: ${row.id} runs ${row.from} to ${row.to}, the pot is at ` +
          `${scale.value}, and the bar is drawn as ${row.ok ? "fine" : "failing"}`,
      );
    }
  }
}

// ── 3. every material the pot is wrong for is named in the notes ───────────
{
  const label = await readLabel(page);
  const temperature = await readScale(page, "temperature");
  const time = await readScale(page, "time");
  const failing = [...temperature.rows, ...time.rows].filter((row) => !row.ok);
  check(failing.length > 0, "the shop's opening blend has nothing to report");

  const named = await page.evaluate(() =>
    [...document.querySelectorAll("[data-weight] td:first-child")].map((td) => ({
      id: td.parentElement.dataset.weight,
      name: td.textContent.trim(),
    })),
  );
  for (const row of failing) {
    const name = named.find((entry) => entry.id === row.id)?.name;
    check(
      label.notes.includes(name),
      `${name} is drawn as failing and the notes do not mention it: "${label.notes}"`,
    );
  }

  // and the shortfall in the note is the gap between the bar and the rule
  for (const row of temperature.rows.filter((r) => !r.ok)) {
    const short = Math.round(
      row.from > temperature.value
        ? row.from - temperature.value
        : temperature.value - row.to,
    );
    check(
      label.notes.includes(`${short} องศา`),
      `the gap measures ${short} degrees on the scale and the note does not ` +
        `say so: "${label.notes}"`,
    );
  }
}

// ── 4. the second pot is the one the first pot cannot be ───────────────────
{
  await clearAdditions(page);
  await pick(page, "ชาเขียวเซนฉะ");
  await pick(page, "ขิงแห้งฝาน");

  const label = await readLabel(page);
  const temperature = await readScale(page, "temperature");
  const ginger = temperature.rows.find((row) => row.id === "ginger");

  check(
    label.water === 80,
    `green tea tops out at 80 and the pot was set to ${label.water}`,
  );
  check(!ginger.ok, "ginger was drawn as fine in an 80 degree pot");
  check(
    label.aside.includes(`${Math.round(ginger.from)} องศา`),
    `the second pot does not name the ${ginger.from} degrees ginger needs: "${label.aside}"`,
  );
  const time = await readScale(page, "time");
  const gingerTime = time.rows.find((row) => row.id === "ginger");
  check(
    label.aside.includes(`${Math.round(gingerTime.from)} นาที`),
    `the second pot does not name the ${gingerTime.from} minutes ginger needs: "${label.aside}"`,
  );
  await page.locator("[data-notes]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/02-second-pot.png` });
}

// ── 5. a blend that agrees with itself says so, and asks for one pot ───────
{
  await clearAdditions(page);
  await pick(page, "ชาดำอัสสัม");
  await pick(page, "ตะไคร้");

  const label = await readLabel(page);
  const temperature = await readScale(page, "temperature");
  const time = await readScale(page, "time");
  check(
    [...temperature.rows, ...time.rows].every((row) => row.ok),
    "black tea and lemongrass brew at the same settings and a bar was marked failing",
  );
  check(
    label.notes.includes("ชงหม้อเดียวจบ"),
    `nothing is wrong with this pot and the notes say: "${label.notes}"`,
  );
  check(
    label.aside === "" && label.late === "",
    `a blend with no trouble was still given a second pot: "${label.aside}${label.late}"`,
  );
  await page.screenshot({ path: `${OUT}/03-one-pot.png` });
}

// ── 5b. a petal the pot is only too hot for is not told to wait zero minutes ─
{
  await clearAdditions(page);
  await pick(page, "ชาดำอัสสัม");
  await pick(page, "กลีบกุหลาบแห้ง");

  const label = await readLabel(page);
  const temperature = await readScale(page, "temperature");
  const time = await readScale(page, "time");
  const rose = temperature.rows.find((row) => row.id === "rose");

  check(!rose.ok, "rose was drawn as fine in a 95 degree pot");
  check(
    time.rows.every((row) => row.ok),
    "rose and assam steep for the same minutes, and a time bar was marked failing",
  );
  check(
    label.late.length > 0,
    `a petal that cannot take 95 degrees was given no instruction: "${label.notes}"`,
  );
  check(
    !/\d+ นาทีค่อยใส่/.test(label.late),
    `nothing here runs out of time, so the advice should not be a delay: "${label.late}"`,
  );
  check(
    label.late.includes(`${Math.round(rose.to)} องศา`),
    `the advice does not name the ${rose.to} degrees rose survives: "${label.late}"`,
  );
  check(
    label.aside === "",
    `nothing needs a harder boil here: "${label.aside}"`,
  );
}

// ── 5c. a pot with nothing in it but leaf says so ──────────────────────────
{
  await clearAdditions(page);
  const label = await readLabel(page);
  check(
    label.weights.length === 1,
    `clearing every addition left ${label.weights.length} rows on the label`,
  );
  check(
    !label.body.includes("0 อย่าง"),
    "an unmixed pot is described as blended with 0 other things",
  );
  check(
    label.notes.includes("ชงหม้อเดียวจบ"),
    `one leaf on its own has nothing to report, and the notes say: "${label.notes}"`,
  );
}

// ── 6. the label weighs and prices what is actually in the pot ─────────────
{
  await pick(page, "ตะไคร้");
  const label = await readLabel(page);
  const summed =
    Math.round(label.weights.reduce((total, row) => total + row.grams, 0) * 10) /
    10;
  check(
    summed === label.totalGrams,
    `the rows weigh ${summed} g and the total says ${label.totalGrams} g`,
  );
  check(
    label.weights.length === 2,
    `one leaf and one addition is ${label.weights.length} rows on the label`,
  );

  // caffeine is quoted per cup off a two cup pot, so the dry leaf figure it
  // came from has to land where real tea leaf does
  const base = label.weights[0];
  const perGram = (label.caffeine * 2) / base.grams;
  check(
    perGram >= 10 && perGram <= 30,
    `${label.caffeine} mg a cup off ${base.grams} g works out at ${perGram.toFixed(1)} ` +
      "mg per gram of dry leaf, which no tea is",
  );
  const shots = (label.caffeine / 63).toFixed(1);
  check(
    label.body.includes(`${shots} ช็อต`),
    `${label.caffeine} mg is ${shots} espresso shots and the page does not say so`,
  );
}

// ── 7. changing the leaf changes the pot, the price and the caffeine ───────
{
  const before = await readLabel(page);
  await pick(page, "ชาขาวเข็มเงิน");
  const after = await readLabel(page);

  check(
    after.caffeine < before.caffeine,
    `white tea carries less caffeine than assam and the label went from ` +
      `${before.caffeine} to ${after.caffeine} mg`,
  );
  check(
    after.baht > before.baht,
    `silver needle costs more than assam and the pot went from ${before.baht} ` +
      `to ${after.baht} baht`,
  );
  check(
    after.water < before.water,
    `white tea is brewed cooler than assam and the water went from ` +
      `${before.water} to ${after.water}`,
  );
}

// ── 8. the shop's own recipes load as one press ────────────────────────────
{
  await page.getByRole("button", { name: /สูตรก่อนนอน/ }).click();
  await page.waitForTimeout(250);
  const label = await readLabel(page);
  check(
    label.blend === "สูตรก่อนนอน",
    `pressing the shop's third recipe gave "${label.blend}"`,
  );
  check(
    label.weights.length === 3,
    `that recipe is a leaf and two flowers, and the label lists ${label.weights.length} rows`,
  );
}

// ── 9. the keyboard reaches the leaves and the additions ───────────────────
{
  await page.getByRole("radio", { name: /ชาดำอัสสัม/ }).focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(250);
  check(
    await page.getByRole("radio", { name: /อู่หลง/ }).isChecked(),
    "an arrow key did not move between the base leaves",
  );

  const mint = page.getByRole("checkbox", { name: /สะระแหน่/ });
  const wasChecked = await mint.isChecked();
  await mint.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  check(
    (await mint.isChecked()) !== wasChecked,
    "space did not toggle an addition",
  );
}

for (const error of errors) note(`console error - ${error}`);
await context.close();

// ── 10. the phone does not scroll sideways ─────────────────────────────────
{
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
  });
  const small = await phone.newPage();
  await small.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
  await small.waitForSelector("[data-blend]");
  const overflow = await small.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  check(overflow <= 0, `the page scrolls ${overflow}px sideways on a phone`);
  await small.screenshot({ path: `${OUT}/04-phone.png` });

  // the scales are three columns inside one table, which is where a phone
  // runs out of room first
  await small.locator('[data-scale="temperature"]').scrollIntoViewIfNeeded();
  await small.waitForTimeout(250);
  const scale = await readScale(small, "temperature");
  const tolerance = (scale.high - scale.low) / 100;
  for (const row of scale.rows) {
    check(
      Math.abs(row.drawnFrom - row.from) < tolerance &&
        Math.abs(row.drawnTo - row.to) < tolerance,
      `phone: ${row.id} prints ${row.from} to ${row.to} and is drawn ` +
        `${row.drawnFrom.toFixed(1)} to ${row.drawnTo.toFixed(1)}`,
    );
  }
  await small.screenshot({ path: `${OUT}/05-phone-scales.png` });
  await phone.close();
}

await browser.close();

if (findings.length === 0) {
  console.log(`steep: clean on ${BASE}${ROUTE}`);
} else {
  console.log(`steep: ${findings.length} finding(s) on ${BASE}${ROUTE}`);
  for (const finding of findings) console.log(` - ${finding}`);
  process.exitCode = 1;
}
