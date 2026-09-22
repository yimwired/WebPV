// Verifies the dark/light switch, which is three claims a screenshot cannot
// make: that dark is what a first visitor gets, that a choice survives a
// reload, and that the remembered choice is on the page before the first
// paint rather than a frame later.
//
// The last one is the one that matters and the one nobody checks. The theme
// lives in localStorage, which a static export can only read on the client, so
// without the inline script in <head> a returning visitor gets a dark frame
// before their light page arrives. This records the class on <html> at
// DOMContentLoaded, from inside the page, which is before React has run.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then:
//   node web/scripts/shoot-theme.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const ROUTE = process.env.ROUTE ?? "/";
const OUT = fileURLToPath(new URL("../screenshots/theme", import.meta.url));

const findings = [];
const note = (text) => findings.push(text);
const check = (ok, text) => {
  if (!ok) note(text);
};

/** What <html> carries, plus what the browser was told to paint its chrome as. */
const readTheme = (page) =>
  page.evaluate(() => ({
    dark: document.documentElement.classList.contains("dark"),
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    background: getComputedStyle(document.body).backgroundColor,
    stored: (() => {
      try {
        return localStorage.getItem("theme");
      } catch {
        return null;
      }
    })(),
    /** recorded by the init script below, before React ran */
    atParse: window.__themeAtParse ?? null,
  }));

/**
 * Records the class as soon as the document is parsed. Running inside the page
 * is the point: by the time Playwright could ask, the frame has been painted
 * and a flash would already be over.
 */
const recordFirstPaint = (context) =>
  context.addInitScript(() => {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        window.__themeAtParse = document.documentElement.classList.contains(
          "dark",
        )
          ? "dark"
          : "light";
      },
      { once: true },
    );
  });

const toggle = async (page) => {
  await page.getByRole("button", { name: /dark and light|สลับธีม/i }).click();
  await page.waitForTimeout(900);
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

// ── 1. a first visitor gets the dark the site was designed in ──────────────
{
  const context = await browser.newContext({ locale: "en-US" });
  await recordFirstPaint(context);
  const page = await context.newPage();
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });

  const theme = await readTheme(page);
  check(theme.dark, "a first visit did not come up dark");
  check(
    theme.stored === null,
    `nothing was chosen yet and localStorage already holds "${theme.stored}"`,
  );
  check(
    theme.colorScheme === "dark",
    `the dark page declares color-scheme: ${theme.colorScheme}, so the browser ` +
      "paints its own scrollbars and form controls light",
  );
  await page.screenshot({ path: `${OUT}/01-dark.png` });
  await context.close();
}

// ── 2. the switch changes the page and says so ─────────────────────────────
{
  const context = await browser.newContext({ locale: "en-US" });
  await recordFirstPaint(context);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });

  const before = await readTheme(page);
  await toggle(page);
  const after = await readTheme(page);

  check(!after.dark, "pressing the switch left the page dark");
  check(
    after.background !== before.background,
    `the body stayed ${after.background} through the switch`,
  );
  check(
    after.colorScheme !== "dark",
    `the light page still declares color-scheme: ${after.colorScheme}`,
  );
  check(
    after.stored === "light",
    `the choice was saved as "${after.stored}"`,
  );
  await page.screenshot({ path: `${OUT}/02-light.png` });

  // ── 3. and it holds across a reload, before the first paint ──────────────
  await page.reload({ waitUntil: "load" });
  const returned = await readTheme(page);
  check(!returned.dark, "the light choice did not survive a reload");
  check(
    returned.atParse === "light",
    `a returning visitor's document was ${returned.atParse} when it finished ` +
      "parsing, so the dark page is on screen before the light one replaces it",
  );

  // ── 4. and back again ────────────────────────────────────────────────────
  await toggle(page);
  const back = await readTheme(page);
  check(back.dark, "pressing the switch again did not return to dark");
  check(back.stored === "dark", `going back stored "${back.stored}"`);

  await page.reload({ waitUntil: "load" });
  const kept = await readTheme(page);
  check(kept.dark && kept.atParse === "dark", "dark did not survive a reload");

  for (const error of errors) note(`page error - ${error}`);
  await context.close();
}

// ── 5. the switch is reachable and labelled ────────────────────────────────
{
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });

  const button = page.getByRole("button", { name: /dark and light|สลับธีม/i });
  check((await button.count()) === 1, `found ${await button.count()} theme switches`);

  const box = await button.boundingBox();
  check(
    box !== null && box.width >= 24 && box.height >= 24,
    `the switch is ${box?.width}x${box?.height}, under the 24px a finger needs`,
  );

  await button.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(900);
  check(
    !(await readTheme(page)).dark,
    "the keyboard could not work the switch",
  );
  await context.close();
}

// ── 6. reduced motion skips the wipe and still switches ────────────────────
{
  const context = await browser.newContext({
    locale: "en-US",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });

  await toggle(page);
  check(
    !(await readTheme(page)).dark,
    "with reduced motion on, the switch did not change the theme",
  );
  await page.screenshot({ path: `${OUT}/03-reduced-motion.png` });
  await context.close();
}

await browser.close();

if (findings.length === 0) {
  console.log(`theme: clean on ${BASE}${ROUTE}`);
} else {
  console.log(`theme: ${findings.length} finding(s) on ${BASE}${ROUTE}`);
  for (const finding of findings) console.log(` - ${finding}`);
  process.exitCode = 1;
}
