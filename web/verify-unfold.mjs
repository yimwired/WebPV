// Proves the claims /labs/unfold makes about itself, against the running page.
//
//   1. the clip is not fetched until it is scrolled to
//   2. it plays on arrival, stops at the end, and offers a replay that works
//   3. the slider relights the photograph, not a label
//   4. copy clears 4.5:1 against the pixels actually painted behind it
//   5. reduced motion does not autoplay, and leaves the clip reachable
//
// From `web/`, with the site served: `node verify-unfold.mjs`
import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = promisify(execFile);
const scratch = await mkdtemp(join(tmpdir(), "unfold-"));
const URL = process.env.SHOOT_URL ?? "http://localhost:3000";

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
};

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

/**
 * Average colour of a screenshot region, straight out of ffmpeg. Reading
 * `backgroundColor` off the elements under a point cannot see what an image or
 * a video painted, and on this page that is most of what sits behind the copy.
 */
async function paintedColour(page, clip) {
  const file = join(scratch, `patch-${Date.now()}-${Math.random()}.png`);
  await page.screenshot({ path: file, clip });
  const { stdout } = await run(
    "ffmpeg",
    [
      "-v", "error", "-i", file,
      "-vf", "scale=1:1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
    ],
    { encoding: "buffer" }
  );
  const [r, g, b] = stdout;
  return `rgb(${r}, ${g}, ${b})`;
}

const toHeading = (page, text) =>
  page.evaluate((needle) => {
    const node = [...document.querySelectorAll("h1, h2")].find((n) =>
      (n.textContent ?? "").includes(needle)
    );
    node?.scrollIntoView({ block: "center", behavior: "instant" });
  }, text);

const browser = await chromium.launch();

// ── 1-4: the page as most people get it ──────────────────────────────────
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
  const page = await context.newPage();

  const fetched = [];
  page.on("request", (r) => {
    if (/unfold\.(mp4|webm)/.test(r.url())) fetched.push(r.url());
  });

  await page.goto(`${URL}/labs/unfold`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  check(
    "clip is not fetched on load",
    fetched.length === 0,
    `${fetched.length} request(s)`
  );

  await toHeading(page, "One hinge");
  await page.waitForTimeout(1500);
  const playing = await page.evaluate(() => {
    const v = document.querySelector("video");
    return { t: v.currentTime, paused: v.paused, loop: v.loop };
  });
  check(
    "clip starts when it is reached",
    fetched.length > 0 && playing.t > 0.3 && !playing.paused,
    `fetched ${fetched.length}, t=${playing.t.toFixed(2)}s`
  );
  check("clip does not loop", playing.loop === false);

  await page.waitForFunction(() => document.querySelector("video").ended, null, {
    timeout: 12000,
  });
  const replay = page.getByRole("button", { name: /replay/i });
  check("replay appears when it ends", await replay.isVisible());

  await replay.click();
  await page.waitForTimeout(700);
  const restarted = await page.evaluate(() => {
    const v = document.querySelector("video");
    return { t: v.currentTime, paused: v.paused };
  });
  check(
    "replay restarts it",
    restarted.t < 2 && !restarted.paused,
    `t=${restarted.t.toFixed(2)}s`
  );

  // ── the slider relights the photograph ──────────────────────────────
  await toHeading(page, "Warm to work");
  await page.waitForTimeout(900);
  const slider = page.locator("#unfold-kelvin");
  const overlay = () =>
    page.evaluate(() => {
      const node = document.querySelector('[style*="mix-blend-mode: color"]');
      if (!node) return null;
      const s = getComputedStyle(node);
      return `${s.backgroundColor} @ ${(+s.opacity).toFixed(2)}`;
    });

  // Driven with the keyboard: React installs its own value setter, so a
  // scripted assignment repaints nothing and the test would measure itself.
  await slider.focus();
  for (let i = 0; i < 40; i += 1) await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(250);
  const warm = await overlay();
  for (let i = 0; i < 40; i += 1) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  const cool = await overlay();

  check("slider relights the photograph", warm !== cool, `${warm} -> ${cool}`);
  check(
    "readout matches the slider",
    (await page.locator("output").textContent()).trim() === "5,000 K"
  );

  const box = await slider.boundingBox();
  const region = {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  };
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.waitForTimeout(200);
  const blurred = await page.screenshot({ clip: region });
  await slider.focus();
  await page.waitForTimeout(200);
  const focused = await page.screenshot({ clip: region });
  check("focus is visible on the control", Buffer.compare(blurred, focused) !== 0);

  // ── contrast, off the pixels rather than off token values ───────────
  const SAMPLES = [
    ["Unfold", "Unfold"],
    ["Unfold", "A desk light"],
    ["One hinge", "One hinge"],
    ["One hinge", "The arm rises"],
    ["Then the room", "Then the room"],
    ["Warm to work", "Move the slider"],
    ["320 mm bar", "Open, the head sits"],
    ["Unfold, in full", "Unfold, in full"],
  ];

  for (const [section, needle] of SAMPLES) {
    await toHeading(page, section);
    await page.waitForTimeout(800);
    const spot = await page.evaluate((text) => {
      const node = [...document.querySelectorAll("h1, h2, p")].find((n) =>
        (n.textContent ?? "").includes(text)
      );
      if (!node) return null;
      const r = node.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) return null;
      return {
        colour: getComputedStyle(node).color,
        clip: {
          x: Math.max(0, Math.round(r.left) - 10),
          y: Math.round(r.top + r.height / 2) - 3,
          width: 6,
          height: 6,
        },
      };
    }, needle);

    if (!spot) {
      check(`contrast: "${needle}"`, false, "not on screen");
      continue;
    }
    const behind = await paintedColour(page, spot.clip);
    const ratio = contrast(spot.colour, behind);
    check(
      `contrast: "${needle}"`,
      ratio >= 4.5,
      `${ratio.toFixed(2)}:1  ${spot.colour} on ${behind}`
    );
  }

  await context.close();
}

// ── 5: reduced motion ────────────────────────────────────────────────────
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${URL}/labs/unfold`, { waitUntil: "load" });
  await toHeading(page, "One hinge");
  await page.waitForTimeout(1800);

  const still = await page.evaluate(() => {
    const v = document.querySelector("video");
    return { t: v.currentTime, paused: v.paused };
  });
  check(
    "reduced motion does not autoplay",
    still.paused && still.t === 0,
    `t=${still.t}, paused=${still.paused}`
  );

  const play = page.getByRole("button", { name: /play/i });
  check("reduced motion still offers the clip", await play.isVisible());

  await play.click();
  await page.waitForTimeout(1000);
  const started = await page.evaluate(
    () => document.querySelector("video").currentTime
  );
  check("that button plays it", started > 0.2, `t=${started.toFixed(2)}s`);

  await context.close();
}

await browser.close();
await rm(scratch, { recursive: true, force: true });

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
