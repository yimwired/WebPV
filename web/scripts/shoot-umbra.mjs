// Verifies /labs/umbra, which claims that the picture is lit by arithmetic:
// every shadow in it is the length trigonometry says it is at the angle the
// sun is drawn at, and the reading beside it measures a borrowed object
// against that same arithmetic.
//
// So this script does the trigonometry itself and compares it with what was
// painted. Shadow geometry comes from getBBox, which returns the scene's own
// decimetres, and the angle comes from where the sun is drawn rather than from
// anything the page says about it. The one number taken from prose is the
// borrowed object's own elevation, which is only ever stated in the note.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then:
//   node web/scripts/shoot-umbra.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const ROUTE = "/labs/umbra";
const OUT = fileURLToPath(new URL("../screenshots/umbra", import.meta.url));

const findings = [];
const note = (text) => findings.push(text);
const check = (ok, text) => {
  if (!ok) note(text);
};

const radians = (degrees) => (degrees * Math.PI) / 180;
const tan = (degrees) => Math.tan(radians(degrees));
const sin = (degrees) => Math.sin(radians(degrees));

/** The whole scene, in the decimetres its viewBox is drawn in. */
const readScene = (page) =>
  page.evaluate(() => {
    const box = (element) => {
      const { x, y, width, height } = element.getBBox();
      return { x, y, width, height };
    };
    const svg = document.querySelector("[data-scene]");
    const sun = document.querySelector("[data-sun]");
    const [width] = svg.dataset.scene.split("x").map(Number);

    return {
      width,
      ground: Number(svg.dataset.ground),
      elevation: Number(svg.dataset.elevation),
      side: svg.dataset.side,
      sun: {
        x: Number(sun.getAttribute("cx")),
        y: Number(sun.getAttribute("cy")),
      },
      pieces: [...document.querySelectorAll("[data-piece]")].map((group) => ({
        id: group.dataset.piece,
        height: Number(group.dataset.height),
        footprint: Number(group.dataset.width),
        lift: Number(group.dataset.lift),
        borrowed: group.dataset.borrowed !== undefined,
        box: box(group),
      })),
      shadows: Object.fromEntries(
        [...document.querySelectorAll("[data-shadow]")].map((element) => [
          element.dataset.shadow,
          box(element),
        ]),
      ),
      table: Object.fromEntries(
        [...document.querySelectorAll("[data-shadow-length]")].map((cell) => [
          cell.dataset.shadowLength,
          parseFloat(cell.textContent),
        ]),
      ),
      reading: document.querySelector("[data-reading]")?.innerText ?? "",
      fix: document.querySelector("[data-fix]")?.textContent?.trim() ?? "",
      price: document.querySelector("[data-price]")?.textContent?.trim() ?? "",
      readout:
        document.querySelector("[data-elevation-readout]")?.textContent ?? "",
    };
  });

const setSun = async (page, degrees) => {
  await page.locator("#umbra-elevation").fill(String(degrees));
  await page.waitForTimeout(250);
};

/** The correction toggle is a real checkbox inside the label that shows it. */
const toggleCorrection = async (page) => {
  await page.locator('label:has(input[type="checkbox"])').first().click();
  await page.waitForTimeout(300);
};

const pick = async (page, text) => {
  await page.locator("label").filter({ hasText: text }).first().click();
  await page.waitForTimeout(250);
};

/** The shadow a standing object throws, with its own footprint taken off. */
const bandLength = (scene, id) => {
  const piece = scene.pieces.find((entry) => entry.id === id);
  return scene.shadows[id].width - piece.footprint;
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
await page.waitForSelector("[data-scene]");

// ── 1. the sun is drawn at the angle the page is set to ────────────────────
{
  await setSun(page, 24);
  const scene = await readScene(page);
  const measured =
    (Math.atan2(
      scene.ground - scene.sun.y,
      Math.abs(scene.width / 2 - scene.sun.x),
    ) *
      180) /
    Math.PI;
  check(
    Math.abs(measured - 24) < 0.8,
    `the sun is drawn at ${measured.toFixed(1)} degrees above the horizon, not 24`,
  );
  check(
    scene.sun.x < scene.width / 2,
    `light from the left puts the sun at x ${scene.sun.x} on a ${scene.width} wide scene`,
  );
  check(
    scene.readout.includes("24"),
    `the readout says "${scene.readout}" at 24 degrees`,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/01-afternoon.png` });
}

// ── 2. a standing shadow is height over tan, on the page and in the paint ──
{
  const scene = await readScene(page);
  for (const piece of scene.pieces) {
    if (piece.lift > 0 || piece.borrowed) continue;

    const wanted = piece.height / tan(scene.elevation);
    check(
      Math.abs(bandLength(scene, piece.id) - wanted) < 0.6,
      `${piece.id} is ${piece.height} tall at ${scene.elevation} degrees, so its ` +
        `shadow is ${wanted.toFixed(1)} and ${bandLength(scene, piece.id).toFixed(1)} was drawn`,
    );
    check(
      Math.abs(scene.table[piece.id] - wanted / 10) < 0.03,
      `the table says ${piece.id} throws ${scene.table[piece.id]} m and the angle ` +
        `makes it ${(wanted / 10).toFixed(2)} m`,
    );
  }
}

// ── 3. it really is a tangent, not a line through two points ───────────────
{
  const low = await readScene(page);
  await setSun(page, 60);
  const high = await readScene(page);

  for (const piece of low.pieces) {
    if (piece.lift > 0 || piece.borrowed) continue;
    // the footprint cancels out of the difference, so nothing here needs to
    // know how wide the object is
    const drawn =
      low.shadows[piece.id].width - high.shadows[piece.id].width;
    const wanted = piece.height * (1 / tan(24) - 1 / tan(60));
    check(
      Math.abs(drawn - wanted) < 0.8,
      `going from 24 to 60 degrees should shorten ${piece.id}'s shadow by ` +
        `${wanted.toFixed(1)}, and it moved ${drawn.toFixed(1)}`,
    );
  }
}

// ── 4. the floating sphere gets the other formula ──────────────────────────
{
  await setSun(page, 24);
  const scene = await readScene(page);
  const sphere = scene.pieces.find((piece) => piece.lift > 0);
  check(sphere !== undefined, "nothing in the scene floats");

  const shadow = scene.shadows[sphere.id];
  const wanted = sphere.footprint / sin(scene.elevation);
  check(
    Math.abs(shadow.width - wanted) < 0.8,
    `a sphere ${sphere.footprint} across at ${scene.elevation} degrees casts an ` +
      `ellipse ${wanted.toFixed(1)} wide, and ${shadow.width.toFixed(1)} was drawn`,
  );

  // and it lands away from the sphere by the height it floats at
  const drift =
    shadow.x + shadow.width / 2 - (sphere.box.x + sphere.box.width / 2);
  const wantedDrift = sphere.lift / tan(scene.elevation);
  check(
    Math.abs(drift - wantedDrift) < 0.8,
    `the sphere floats ${sphere.lift} up, so its shadow falls ${wantedDrift.toFixed(1)} ` +
      `to the side, and it fell ${drift.toFixed(1)}`,
  );
}

// ── 5. the light changes side and everything follows ───────────────────────
{
  const before = await readScene(page);
  await pick(page, "แสงจากขวา");
  const after = await readScene(page);

  check(
    after.sun.x > after.width / 2,
    `light from the right left the sun at x ${after.sun.x}`,
  );
  const column = after.pieces.find((piece) => piece.id === "column");
  check(
    after.shadows.column.x < column.box.x,
    "light from the right did not move the column's shadow to its left",
  );
  check(
    Math.abs(
      after.shadows.column.width - before.shadows.column.width,
    ) < 0.6,
    "flipping the light changed how long the shadow is",
  );
  await page.screenshot({ path: `${OUT}/02-right.png` });
  await pick(page, "แสงจากซ้าย");
}

// ── 6. the borrowed object keeps the light it was shot under ───────────────
{
  await setSun(page, 24);
  const scene = await readScene(page);
  const borrowed = scene.pieces.find((piece) => piece.borrowed);
  const own = Number(scene.reading.match(/มุม (\d+) องศา/)?.[1]);
  check(
    Number.isFinite(own),
    `the note does not say what the borrowed object was shot at: "${scene.reading}"`,
  );

  const drawn = bandLength(scene, borrowed.id);
  check(
    Math.abs(drawn - borrowed.height / tan(own)) < 0.5,
    `the chair was shot at ${own} degrees, so it brought a ` +
      `${(borrowed.height / tan(own)).toFixed(1)} shadow, and ${drawn.toFixed(1)} was drawn`,
  );
  check(
    Math.abs(drawn - borrowed.height / tan(scene.elevation)) > 1,
    "the borrowed object was quietly relit to match the scene",
  );
  check(
    scene.reading.includes("คนละข้าง"),
    `the chair was lit from the other side and the note does not say so: "${scene.reading}"`,
  );
  check(
    scene.fix.includes("ถ่ายใหม่") && scene.price.includes("3,500"),
    `a wrong-sided object was quoted as "${scene.fix}" at ${scene.price}`,
  );
}

// ── 7. the factor in the note is the ratio of the two shadows on screen ────
{
  const before = await readScene(page);
  const borrowed = before.pieces.find((piece) => piece.borrowed);
  const printed = Number(before.reading.match(/([\d.]+) เท่า/)?.[1]);
  check(Number.isFinite(printed), `the note states no factor: "${before.reading}"`);

  await toggleCorrection(page);
  check(
    await page.getByRole("checkbox").isChecked(),
    "pressing the correction label did not tick it",
  );
  const after = await readScene(page);

  const wasDrawn = bandLength(before, borrowed.id);
  const nowDrawn = bandLength(after, borrowed.id);
  const measured = Math.max(nowDrawn / wasDrawn, wasDrawn / nowDrawn);
  check(
    Math.abs(measured - printed) < 0.2,
    `the note says the shadow is ${printed} times out and the picture moved it ` +
      `${measured.toFixed(1)} times`,
  );

  // and what it corrects to is what the scene asks of anything that height
  check(
    Math.abs(nowDrawn - borrowed.height / tan(after.elevation)) < 0.5,
    `corrected, the shadow should be ${(borrowed.height / tan(after.elevation)).toFixed(1)} ` +
      `and it is ${nowDrawn.toFixed(1)}`,
  );
  check(
    after.reading.includes("ชุดเดียวกับทั้งฉาก"),
    `the corrected note reads: "${after.reading}"`,
  );
  await page.screenshot({ path: `${OUT}/03-corrected.png` });
  check(
    after.reading.includes("ถ่ายของชิ้นนี้ใหม่"),
    `a corrected view of a reshoot case should say software cannot do it: "${after.reading}"`,
  );
  await toggleCorrection(page);
}

// ── 8. an object already in the scene's light is quoted as free ────────────
{
  await pick(page, "โคมไฟตั้งพื้น");
  const own = Number(
    (await readScene(page)).reading.match(/มุม (\d+) องศา/)?.[1],
  );
  await setSun(page, own);
  const scene = await readScene(page);

  check(
    scene.fix.includes("เข้าฉากอยู่แล้ว"),
    `a lamp shot at ${own} degrees, in a scene at ${own} degrees, was quoted ` +
      `"${scene.fix}"`,
  );
  check(
    scene.price.includes("ไม่มี"),
    `nothing to fix and the price says ${scene.price}`,
  );

  // one degree of drift is still nothing; twenty is a redraw
  await setSun(page, Math.max(15, own - 20));
  const drifted = await readScene(page);
  check(
    drifted.fix !== scene.fix,
    `moving the sun 20 degrees left the quote at "${drifted.fix}"`,
  );
  await page.screenshot({ path: `${OUT}/04-lamp.png` });
}

// ── 9. the keyboard reaches the sun and the side ───────────────────────────
{
  await page.locator("#umbra-elevation").focus();
  const before = Number((await readScene(page)).elevation);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  const after = Number((await readScene(page)).elevation);
  check(after === before + 1, `an arrow key moved the sun from ${before} to ${after}`);

  await page.getByRole("radio", { name: /แสงจากซ้าย/ }).focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(250);
  check(
    (await readScene(page)).side === "right",
    "an arrow key did not move between the two sides",
  );
}

for (const error of errors) note(`console error - ${error}`);
await context.close();

// ── 10. the phone does not scroll sideways, and the scene still measures ───
{
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
  });
  const small = await phone.newPage();
  await small.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
  await small.waitForSelector("[data-scene]");

  const overflow = await small.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  check(overflow <= 0, `the page scrolls ${overflow}px sideways on a phone`);

  const scene = await readScene(small);
  const column = scene.pieces.find((piece) => piece.id === "column");
  check(
    Math.abs(
      bandLength(scene, "column") - column.height / tan(scene.elevation),
    ) < 0.6,
    "the scene is drawn to a different geometry on a phone",
  );
  await small.screenshot({ path: `${OUT}/05-phone.png` });
  await phone.close();
}

await browser.close();

if (findings.length === 0) {
  console.log(`umbra: clean on ${BASE}${ROUTE}`);
} else {
  console.log(`umbra: ${findings.length} finding(s) on ${BASE}${ROUTE}`);
  for (const finding of findings) console.log(` - ${finding}`);
  process.exitCode = 1;
}
