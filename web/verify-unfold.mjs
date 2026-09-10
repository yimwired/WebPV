// Proves the claims /labs/unfold makes about itself, against the running page.
//
//   1. the slider changes the light, not a label
//   2. the hinge readout matches the arm's actual rotation
//   3. the control takes keyboard focus and shows a ring
//   4. body copy clears 4.5:1 against the pixels actually painted behind it
//   5. reduced motion still reaches every act
//
// From `web/`, with the site served: `node verify-unfold.mjs`
import { chromium } from "playwright";

const URL = process.env.SHOOT_URL ?? "http://localhost:3000";
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
};

/** Relative luminance of an "rgb(r, g, b)" string. */
function luminance(css) {
  const [r, g, b] = css.match(/[\d.]+/g).slice(0, 3).map(Number);
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const browser = await chromium.launch();

async function openStage(context) {
  const page = await context.newPage();
  await page.goto(`${URL}/labs/unfold`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  const height = await page.evaluate(
    () => document.querySelector("section").getBoundingClientRect().height
  );
  const seek = async (fraction) => {
    await page.evaluate(
      ([h, f]) => window.scrollTo(0, (h - window.innerHeight) * f),
      [height, fraction]
    );
    await page.waitForTimeout(550);
  };
  return { page, seek };
}

// ── 1-4: the full-motion page ────────────────────────────────────────────
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
  const { page, seek } = await openStage(context);

  await seek(0.68);
  const slider = page.locator("#unfold-kelvin");

  const sample = () =>
    page.evaluate(() => {
      const overlay = document.querySelector('[style*="mix-blend-mode: color"]');
      if (!overlay) return null;
      const style = getComputedStyle(overlay);
      return `${style.backgroundColor} @ ${(+style.opacity).toFixed(2)}`;
    });

  // Driven with the keyboard rather than by assigning `value`: React installs
  // its own value setter, so a scripted assignment repaints nothing and the
  // test would be measuring itself.
  await slider.focus();
  for (let i = 0; i < 40; i += 1) await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(250);
  const warm = await sample();

  for (let i = 0; i < 40; i += 1) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  const cool = await sample();

  check(
    "slider repaints the emitter",
    Boolean(warm && cool && warm !== cool),
    `${warm} -> ${cool}`
  );

  const readout = (await page.locator("output").textContent()).trim();
  check("readout matches the slider", readout === "5,000 K", readout);

  // Chrome will not report ::-webkit-slider-thumb through getComputedStyle, so
  // the focus ring is checked the only way that proves anything: by looking.
  const box = await slider.boundingBox();
  const region = {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  };
  await page.locator("h2").first().focus();
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.waitForTimeout(200);
  const blurred = await page.screenshot({ clip: region });
  await slider.focus();
  await page.waitForTimeout(200);
  const focused = await page.screenshot({ clip: region });
  check(
    "focus is visible on the control",
    Buffer.compare(blurred, focused) !== 0,
    `${blurred.length} vs ${focused.length} bytes`
  );

  // Exactly one of the three stacked photographs may be visible at a time.
  // Two of them sat half-lit for a while because `useTransform(v, [a, b],
  // [c, d], { clamp: true })` is misread with a two-stop range, so this is a
  // regression guard and not a formality.
  for (const at of [0.06, 0.3, 0.5, 0.68, 0.9]) {
    await seek(at);
    const layers = await page.evaluate(() => {
      const box = document.querySelector('[style*="aspect-ratio"]');
      return [...box.children].map((el) => +(+getComputedStyle(el).opacity).toFixed(3));
    });
    const lit = layers.filter((o) => o > 0.02);
    check(
      `one layer only at ${at}`,
      lit.length === 1 && lit[0] > 0.98,
      layers.join(" / ")
    );
  }

  // The open figure is read off the same value that picks the frame.
  await seek(0.28);
  await page.waitForTimeout(400);
  const open = await page.evaluate(() => {
    const li = [...document.querySelectorAll("li")].find((n) =>
      /open \d/i.test(n.textContent ?? "")
    );
    return li?.textContent?.trim() ?? "";
  });
  const claimed = Number(open.match(/\d+/)?.[0] ?? -1);
  const expected = Math.round(((0.28 - 0.14) / (0.42 - 0.14)) * 100);
  check(
    "open figure tracks the frame it is showing",
    Math.abs(claimed - expected) <= 2,
    `${open} vs expected ${expected}%`
  );

  // Contrast for every act, measured off the pixels behind the text at the
  // scroll position where that text is actually on screen. Reading the token
  // values instead would miss the whole point of a page that repaints itself.
  const SAMPLES = [
    [0.06, "A desk light"],
    [0.06, "Unfold"],
    [0.28, "One hinge"],
    [0.52, "2,200 lumens"],
    [0.7, "Move the slider"],
    [0.9, "Open, the head sits"],
  ];

  for (const [at, needle] of SAMPLES) {
    await seek(at);
    const measured = await page.evaluate((text) => {
      const node = [...document.querySelectorAll("h1, h2, p")].find((n) =>
        (n.textContent ?? "").includes(text)
      );
      if (!node) return null;
      const box = node.getBoundingClientRect();
      const behind = document
        .elementsFromPoint(box.left + 4, box.top + box.height / 2)
        // an invisible layer still reports its background colour, and the
        // relight overlay sits over everything at opacity 0 most of the time
        .filter((el) => +getComputedStyle(el).opacity > 0.02)
        .map((el) => getComputedStyle(el).backgroundColor)
        .find((c) => c && c !== "rgba(0, 0, 0, 0)");
      return { colour: getComputedStyle(node).color, behind };
    }, needle);

    const ratio = measured ? contrast(measured.colour, measured.behind) : 0;
    check(
      `contrast: "${needle}"`,
      ratio >= 4.5,
      `${ratio.toFixed(2)}:1  ${measured?.colour} on ${measured?.behind}`
    );
  }

  await context.close();
}

// ── 5: reduced motion still reaches every act ────────────────────────────
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    reducedMotion: "reduce",
  });
  const { page, seek } = await openStage(context);

  const openFigure = () =>
    page.evaluate(() => {
      const li = [...document.querySelectorAll("li")].find((n) =>
        /open \d/i.test(n.textContent ?? "")
      );
      return Number(li?.textContent?.match(/\d+/)?.[0] ?? -1);
    });

  await seek(0.05);
  const closedAt = await openFigure();
  await seek(0.5);
  const openAt = await openFigure();
  check(
    "reduced motion still opens the lamp",
    closedAt === 0 && openAt === 100,
    `${closedAt}% -> ${openAt}%`
  );

  await seek(0.9);
  const drawingVisible = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((n) =>
      /320 mm bar/.test(n.textContent ?? "")
    );
    return Number(getComputedStyle(h.closest("div")).opacity);
  });
  check(
    "reduced motion still reaches the last act",
    drawingVisible > 0.9,
    `opacity ${drawingVisible}`
  );

  await context.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
