// Verify the Gaze lab, which the generic audit cannot: the subject is an SVG
// driven entirely by setAttribute from a rAF loop, so React never re-renders
// and "is it working" is not visible in the markup the server sent.
//
// What is checked:
//   - the pointer turns the subject, and the two sides of the viewport are
//     different frames rather than the same one
//   - the printed frame index is the one the pointer position maps to, since
//     that number is the whole contract with a real <video> later
//   - the loop stops once the subject has arrived, instead of idling at 60fps
//   - prefers-reduced-motion holds the subject still, pointer or no pointer
//   - a touch device, which has no pointer to follow, plays the sweep itself
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 8788
//   SHOOT_URL=http://localhost:8788 node web/scripts/shoot-gaze.mjs
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.SHOOT_URL ?? "http://localhost:8788";
const URL = `${BASE}/labs/gaze`;
const OUT = "web/screenshots/gaze";
await mkdir(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const failures = [];

const check = (label, ok, detail) => {
  if (!ok) failures.push(`${label}: ${detail}`);
  console.log(`${ok ? "  ok  " : "  FAIL"} ${label}${ok ? "" : ` — ${detail}`}`);
};

/** Everything the loop writes, as one comparable string, plus the readout. */
const readRig = (page) =>
  page.evaluate(() => {
    const svg = document.querySelector('[data-gaze="rig"]');
    const shape = [...svg.querySelectorAll("ellipse, circle")]
      .map((n) =>
        ["cx", "cy", "rx", "ry", "opacity"]
          .map((a) => n.getAttribute(a) ?? "")
          .join(",")
      )
      .join("|");
    return {
      shape,
      frame: document.querySelector('[data-gaze="frame"]').textContent.trim(),
      bar: document.querySelector('[data-gaze="bar"]').style.transform,
    };
  });

// ── desktop: the pointer drives it ──────────────────────────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // Headless Chromium reports `reduce` by default, which is the exact
    // preference this page honours by not animating at all.
    reducedMotion: "no-preference",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(URL, { waitUntil: "load" });
  await sleep(600);

  await page.mouse.move(360, 450); // a quarter across
  await sleep(1400);
  const left = await readRig(page);
  await page.screenshot({ path: `${OUT}/desktop-left.png` });

  await page.mouse.move(1080, 450); // three quarters across
  await sleep(1400);
  const right = await readRig(page);
  await page.screenshot({ path: `${OUT}/desktop-right.png` });

  check("subject turns with the pointer", left.shape !== right.shape, "identical geometry on both sides");

  // 1440 * 0.25 = 360 -> 0.25 * 96 = frame 24, and 0.75 -> 72.
  check("frame index matches pointer position", left.frame === "024" && right.frame === "072", `got ${left.frame} and ${right.frame}, wanted 024 and 072`);

  check("progress bar follows", left.bar !== right.bar && right.bar.includes("scaleX"), `left "${left.bar}", right "${right.bar}"`);

  // Arrived is arrived: two reads a second apart with the pointer parked must
  // be byte-identical, or the loop is still running with nothing to do.
  const parkedA = await readRig(page);
  await sleep(1000);
  const parkedB = await readRig(page);
  check("loop sleeps once the subject arrives", parkedA.shape === parkedB.shape, "geometry still changing with the pointer parked");

  // Leaving the window recentres rather than freezing at the last edge.
  await page.mouse.move(1439, 450);
  await sleep(1400);
  const edge = await readRig(page);
  check("far edge is a different frame again", edge.frame === "095", `wanted 095 at the right edge, got ${edge.frame}`);

  check("no console errors", errors.length === 0, errors.join(" / "));
  await ctx.close();
}

// ── reduced motion: held still ──────────────────────────────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await sleep(600);

  const before = await readRig(page);
  await page.mouse.move(120, 200);
  await sleep(1400);
  await page.mouse.move(1320, 700);
  await sleep(1400);
  const after = await readRig(page);

  check("reduced motion holds the subject still", before.shape === after.shape, "subject moved under prefers-reduced-motion");
  check("reduced motion holds the readout mid-sequence", after.frame === "048", `wanted 048, got ${after.frame}`);
  await page.screenshot({ path: `${OUT}/reduced-motion.png` });
  await ctx.close();
}

// ── phone: no pointer to follow, so it plays itself ──────────────────────────
{
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
    reducedMotion: "no-preference",
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await sleep(800);

  const hoverless = await page.evaluate(
    () => !window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
  check("phone reports no fine pointer", hoverless, "device emulation still reports hover, so the fallback was never exercised");

  const a = await readRig(page);
  await sleep(1200);
  const b = await readRig(page);
  check("sweep plays itself with no pointer", a.shape !== b.shape, "subject static on a touch device");

  await page.screenshot({ path: `${OUT}/phone.png`, fullPage: false });
  await ctx.close();
}

await browser.close();

console.log(failures.length ? `\n${failures.length} failure(s)` : "\nall checks passed");
process.exit(failures.length ? 1 : 0);
