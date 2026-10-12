// /labs/thock: the page claims that the ball is drawn at every size without
// spilling off the screen or under its controls; that a drag turns it the way
// the pointer goes and a flick keeps it turning while a still release does not;
// that hovering a cap lifts that cap; that a press sinks the cap and sends a
// wave that reaches near caps before far ones; that a key on a real keyboard
// presses the copy of that key facing the viewer, matched by the physical key
// and not the character, so Thai typing presses the same caps; that shortcuts
// and keys meant for a focused control are left alone; that reduced motion
// stops the idle turn and the waves and lets the loop sleep; that a colourway
// repaints the stage; that the ball comes back after the GPU context is lost;
// and that a browser without WebGL2 is told so.
//
// The canvas has no DOM to query, so state is read through `window.__thock`,
// the handle the page exposes for this. Colours come from screenshot pixels,
// read back through a canvas inside the page. Motion checks read signed values
// and order, and anything timed is sampled inside the page on its own frames,
// per the verify-motion-traps memory.
//
//   SHOOT_URL=http://127.0.0.1:8788 node web/scripts/shoot-thock.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const ROUTE = `${BASE}/labs/thock`;
const OUT = process.env.AUDIT_OUT || "web/screenshots";
mkdirSync(OUT, { recursive: true });

const IDLE_SPIN = 0.16;

const results = [];
const refused = [];
const check = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`${pass ? "ok  " : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
};

// Headless Chromium draws WebGL on SwiftShader, on the CPU, unless told
// otherwise: a few frames a second for this scene, which is not what a visitor
// with any GPU sees. On Windows it can be pointed at the real one.
const GPU = process.platform === "win32" ? ["--use-angle=d3d11"] : [];
const browser = await chromium.launch({ args: [...GPU, "--ignore-gpu-blocklist"] });

async function open({ width = 1440, height = 900, reducedMotion = "no-preference", init } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    // This machine's Chromium is refused a localhost socket now and then while
    // curl never is (CLAUDE.md). Listed apart: if what it refused mattered, the
    // checks that need it fail on their own.
    if (message.text().includes("ERR_NETWORK_ACCESS_DENIED")) refused.push(message.text());
    else errors.push(message.text());
  });
  if (init) await page.addInitScript(init);
  try {
    await page.goto(ROUTE, { waitUntil: "load" });
  } catch (error) {
    // the same refusal, on the navigation itself: once more, then let it fail
    if (!String(error).includes("ERR_NETWORK_ACCESS_DENIED")) throw error;
    refused.push(`navigation: ${ROUTE}`);
    await page.waitForTimeout(500);
    await page.goto(ROUTE, { waitUntil: "load" });
  }
  return { context, page, errors };
}

const ready = (page) =>
  page.waitForFunction(() => window.__thock?.inspect().legendsReady === true, null, { timeout: 15000 });

const state = (page) => page.evaluate(() => window.__thock.inspect());

/** Waits until `predicate(state)` holds, polling the page; returns the state that satisfied it, or null. */
async function until(page, predicate, timeout = 2500) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const s = await state(page);
    if (predicate(s)) return s;
    await page.waitForTimeout(40);
  }
  return null;
}

/** The cap facing the viewer whose top is nearest a screen point. */
const capNear = (page, x, y) =>
  page.evaluate(
    ({ x, y }) => {
      const thock = window.__thock;
      let best = null;
      for (let cap = 0; cap < thock.inspect().capCount; cap++) {
        const at = thock.locate(cap);
        if (at.facing < 0.85) continue;
        const distance = Math.hypot(at.x - x, at.y - y);
        if (!best || distance < best.distance) best = { cap, distance, ...at };
      }
      return best;
    },
    { x, y },
  );

const locate = (page, cap) => page.evaluate((cap) => window.__thock.locate(cap), cap);

/** RGB at each point of a screenshot, decoded inside the page. */
async function pixels(page, points) {
  const data = (await page.screenshot()).toString("base64");
  return page.evaluate(
    async ({ data, points }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      return points.map(([x, y]) => [...ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data].slice(0, 3));
    },
    { data, points },
  );
}

/** Starts recording the lift of `caps` on every frame, in the page, before an action is taken. */
const startSampling = (page, caps) =>
  page.evaluate((caps) => {
    window.__samples = [];
    const start = performance.now();
    const sample = () => {
      const s = window.__thock.inspect();
      window.__samples.push({ t: performance.now() - start, lift: caps.map((cap) => s.lift[cap]), waves: s.waves.length });
      if (performance.now() - start < 3000) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, caps);

const samples = (page) => page.evaluate(() => window.__samples);

const spinLength = (spin) => Math.hypot(spin[0], spin[1], spin[2]);

// ─── Every size: drawn, fits, nothing spills, controls clear of the ball ───
for (const size of [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const { context, page, errors } = await open(size);
  await ready(page);
  await page.waitForTimeout(1200);
  const s = await state(page);
  check(`${size.name}: WebGL2 ball running with legends printed`, s.legendsReady && s.capCount > 200, `${s.capCount} caps`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`${size.name}: no horizontal scroll`, overflow === 0, `${overflow}px`);

  const extent = await page.evaluate(() => {
    const thock = window.__thock;
    const box = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
    for (let cap = 0; cap < thock.inspect().capCount; cap++) {
      const at = thock.locate(cap);
      if (at.facing < -0.05) continue;
      box.left = Math.min(box.left, at.x);
      box.right = Math.max(box.right, at.x);
      box.top = Math.min(box.top, at.y);
      box.bottom = Math.max(box.bottom, at.y);
    }
    return box;
  });
  check(
    `${size.name}: the ball fits the screen`,
    extent.left > 4 && extent.right < size.width - 4 && extent.top > 4 && extent.bottom < size.height - 4,
    `x ${extent.left.toFixed(0)}-${extent.right.toFixed(0)}, y ${extent.top.toFixed(0)}-${extent.bottom.toFixed(0)}`,
  );

  const picker = await page.locator("fieldset").boundingBox();
  const soundButton = await page.getByRole("button", { name: "เสียงปุ่ม" }).boundingBox();
  const centre = { x: (extent.left + extent.right) / 2, y: (extent.top + extent.bottom) / 2 };
  const radius = (extent.right - extent.left) / 2;
  const clear = (box) => {
    const nearestX = Math.max(box.x, Math.min(centre.x, box.x + box.width));
    const nearestY = Math.max(box.y, Math.min(centre.y, box.y + box.height));
    return Math.hypot(nearestX - centre.x, nearestY - centre.y) > radius;
  };
  check(`${size.name}: colourways and sound sit clear of the ball`, clear(picker) && clear(soundButton));

  // The ball is drawn: across its middle the points are not the stage colour
  // beside it, and not one flat colour either. A point can land on a black cap
  // or in a gap, which is close to the stage, so it takes more than one.
  const spots = [-0.3, 0, 0.3].flatMap((u) => [-0.3, 0, 0.3].map((v) => [centre.x + u * radius, centre.y + v * radius]));
  const [beside, ...inside] = await pixels(page, [[8, centre.y], ...spots]);
  const painted = inside.filter((rgb) => Math.abs(rgb[0] - beside[0]) + Math.abs(rgb[1] - beside[1]) + Math.abs(rgb[2] - beside[2]) > 60);
  const brightness = inside.map(([r, g, b]) => r + g + b);
  const spread = Math.max(...brightness) - Math.min(...brightness);
  check(`${size.name}: the ball is painted`, painted.length >= 4 && spread > 120, `${painted.length}/9 points differ from the stage, spread ${spread}`);

  await page.screenshot({ path: `${OUT}/thock-${size.name}.png` });
  check(`${size.name}: no page errors`, errors.length === 0, errors.join(" | "));
  await context.close();
}

// ─── Desktop, full motion: drag, flick, hover, press, wave, keys ───
{
  const { context, page, errors } = await open();
  await ready(page);
  // the opening types T-H-O-C-K by itself, then the waves die away
  const opening = await until(page, (s) => s.waves.length > 0, 3000);
  check("the opening presses keys by itself", opening !== null);
  await until(page, (s) => s.waves.length === 0, 6000);

  const thaiFace = await page.evaluate(() => {
    const family = getComputedStyle(document.querySelector(".th-root")).getPropertyValue("--font-thock-thai").trim();
    return document.fonts.check(`500 40px ${family}`, "ฟ");
  });
  check("the Thai legend face is loaded", thaiFace);

  const box = await page.locator("canvas").boundingBox();
  const middle = { x: box.width / 2, y: box.height * 0.42 };

  // A drag turns the ball the way the pointer goes, and by about as far.
  const dragged = await capNear(page, middle.x, middle.y);
  await page.mouse.move(dragged.x, dragged.y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(dragged.x + step * 12, dragged.y);
    await page.waitForTimeout(16);
  }
  const duringRight = await locate(page, dragged.cap);
  const dx = duringRight.x - dragged.x;
  const dy = duringRight.y - dragged.y;
  check("dragging right moves the cap under the pointer right", dx > 60 && Math.abs(dy) < dx * 0.5, `dx ${dx.toFixed(1)} dy ${dy.toFixed(1)}`);

  // held still before letting go: no flick
  await page.waitForTimeout(250);
  await page.mouse.up();
  const stillRelease = await state(page);
  check("a release after holding still does not flick", spinLength(stillRelease.spin) < 0.1, `|spin| ${spinLength(stillRelease.spin).toFixed(3)}`);

  const lowered = await capNear(page, middle.x, middle.y);
  await page.mouse.move(lowered.x, lowered.y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(lowered.x, lowered.y + step * 10);
    await page.waitForTimeout(16);
  }
  const duringDown = await locate(page, lowered.cap);
  const downBy = duringDown.y - lowered.y;
  check("dragging down moves the cap under the pointer down", downBy > 50, `dy ${downBy.toFixed(1)}`);
  await page.waitForTimeout(250);
  await page.mouse.up();

  // A flick to the right leaves the ball spinning about +y, then it settles back to the idle turn.
  await page.mouse.move(middle.x - 150, middle.y);
  await page.mouse.down();
  await page.mouse.move(middle.x + 150, middle.y, { steps: 8 });
  await page.mouse.up();
  const flicked = await state(page);
  check("a flick to the right keeps the ball turning right", flicked.spin[1] > 1, `spin y ${flicked.spin[1].toFixed(2)}`);
  const settled = await until(page, (s) => Math.abs(spinLength(s.spin) - IDLE_SPIN) < 0.03 && s.spin[1] > 0, 12000);
  check("the flick settles back into the idle turn", settled !== null, settled ? `spin y ${settled.spin[1].toFixed(3)}` : "never settled");

  // Hover lifts exactly the cap under the pointer, and leaving lets it down.
  const hoverTarget = await capNear(page, middle.x + 40, middle.y + 30);
  await page.mouse.move(hoverTarget.x, hoverTarget.y);
  const hovered = await until(page, (s) => s.hovered === hoverTarget.cap && s.lift[hoverTarget.cap] > 0.25);
  check("hovering a cap lifts that cap", hovered !== null, hovered ? `lift ${hovered.lift[hoverTarget.cap].toFixed(2)}` : "not lifted");
  // The ball keeps turning under a still pointer; the lift moves on to whatever cap is under it now.
  const movedOn = await until(page, (s) => s.hovered >= 0 && s.hovered !== hoverTarget.cap && s.lift[hoverTarget.cap] < 0.05, 6000);
  check("a cap that turns out from under a still pointer is let down", movedOn !== null);
  await page.mouse.move(6, 6);
  const leftAlone = await until(page, (s) => s.hovered === -1 && Math.max(...s.lift) < 0.03);
  check("moving off the ball lets every cap down", leftAlone !== null);

  // A press sinks the cap, and its wave reaches a near cap before a far one.
  await until(page, (s) => s.waves.length === 0, 4000);
  const pressed = await capNear(page, middle.x, middle.y);
  const plan = await page.evaluate((origin) => {
    const thock = window.__thock;
    const o = thock.direction(origin);
    const pick = (target) => {
      let best = -1;
      let error = Infinity;
      for (let cap = 0; cap < thock.inspect().capCount; cap++) {
        const d = thock.direction(cap);
        const a = Math.acos(Math.max(-1, Math.min(1, o[0] * d[0] + o[1] * d[1] + o[2] * d[2])));
        if (Math.abs(a - target) < error) {
          error = Math.abs(a - target);
          best = cap;
        }
      }
      return best;
    };
    return { near: pick(0.5), far: pick(1.3) };
  }, pressed.cap);
  await startSampling(page, [pressed.cap, plan.near, plan.far]);
  await page.mouse.click(pressed.x, pressed.y);
  const justPressed = await state(page);
  check("a click starts a wave from the cap clicked", justPressed.waves.at(-1)?.origin === pressed.cap, `origin ${justPressed.waves.at(-1)?.origin} for ${pressed.cap}`);
  await page.waitForTimeout(2200);
  const recorded = await samples(page);
  const peakOf = (index) => recorded.reduce((best, s) => (s.lift[index] > best.lift ? { t: s.t, lift: s.lift[index] } : best), { t: -1, lift: -Infinity });
  const deepest = Math.min(...recorded.map((s) => s.lift[0]));
  check("pressing a cap sinks it", deepest < -0.1, `lowest ${deepest.toFixed(2)}`);
  const near = peakOf(1);
  const far = peakOf(2);
  check("the wave lifts a near cap and a far one", near.lift > 0.2 && far.lift > 0.15, `near ${near.lift.toFixed(2)} far ${far.lift.toFixed(2)}`);
  check("the wave reaches the near cap first", near.t < far.t, `near at ${near.t.toFixed(0)}ms, far at ${far.t.toFixed(0)}ms`);

  // A real key presses the copy of that key facing the viewer.
  await page.mouse.move(6, 6);
  await until(page, (s) => s.waves.length === 0, 4000);
  const waveFor = async (press) => {
    const before = (await state(page)).waves.length;
    await press();
    const after = await until(page, (s) => s.waves.length > before, 800);
    if (!after) return null;
    const wave = after.waves[after.waves.length - 1];
    return page.evaluate((origin) => ({ origin, key: window.__thock.keyOf(origin), facing: window.__thock.locate(origin).facing }), wave.origin);
  };
  const typedA = await waveFor(() => page.keyboard.press("KeyA"));
  const facings = await page.evaluate(() => window.__thock.capsFor("KeyA").map((cap) => window.__thock.locate(cap).facing));
  check(
    "typing A presses the A facing the viewer",
    typedA?.key === "KeyA" && Math.abs(typedA.facing - Math.max(...facings)) < 0.02,
    typedA ? `facing ${typedA.facing.toFixed(2)} of ${facings.map((f) => f.toFixed(2)).join(", ")}` : "no wave",
  );

  // Thai typing sends the same physical key with a Thai character: still the S cap.
  const typedThai = await waveFor(() =>
    page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", key: "ห", bubbles: true }))),
  );
  check("a key typed in Thai presses its physical cap", typedThai?.key === "KeyS", typedThai ? typedThai.key : "no wave");

  const shift = await waveFor(() => page.keyboard.press("ShiftLeft"));
  check("a modifier pressed on its own presses its cap", shift?.key === "Shift", shift ? shift.key : "no wave");

  await until(page, (s) => s.waves.length === 0, 4000);
  await page.keyboard.press("Control+KeyC");
  await page.waitForTimeout(300);
  const shortcutKeys = await page.evaluate(() => window.__thock.inspect().waves.map((wave) => window.__thock.keyOf(wave.origin)));
  check("a shortcut is left to the browser", !shortcutKeys.includes("KeyC"), `waves from ${shortcutKeys.join(", ") || "nothing"}`);

  // Space on the focused sound button works the button, not the ball.
  const sound = page.getByRole("button", { name: "เสียงปุ่ม" });
  await sound.focus();
  await until(page, (s) => s.waves.length === 0, 4000);
  const spaceOnButton = await waveFor(() => page.keyboard.press("Space"));
  const pressedState = await sound.getAttribute("aria-pressed");
  check("Space on a focused control stays with the control", spaceOnButton === null && pressedState === "true", `aria-pressed ${pressedState}`);
  await page.keyboard.press("Space");
  check("the sound switch turns off again", (await sound.getAttribute("aria-pressed")) === "false");

  check("desktop interaction: no page errors", errors.length === 0, errors.join(" | "));
  await context.close();
}

// ─── Colourway: the stage repaints ───
{
  const { context, page, errors } = await open();
  await ready(page);
  // low on the left, where the floor shows and the lab switcher does not
  const points = [
    [140, 780],
    [24, 24],
  ];
  const [floorBefore] = await pixels(page, points);
  await page.getByLabel("คราม").check({ force: true });
  await until(page, (s) => s.colorway === "indigo");
  await page.waitForTimeout(1000);
  const [floorAfter, topAfter] = await pixels(page, points);
  check("ครั่ง paints a red floor", floorBefore[0] > floorBefore[2] + 40, `rgb ${floorBefore}`);
  check("คราม repaints it blue", floorAfter[2] > floorAfter[0] + 20, `rgb ${floorAfter}`);
  check("the backdrop stays dark", Math.max(...topAfter) < 30, `rgb ${topAfter}`);
  check("colourway: no page errors", errors.length === 0, errors.join(" | "));
  await context.close();
}

// ─── Reduced motion: no idle turn, no waves, the loop sleeps ───
{
  const { context, page, errors } = await open({ reducedMotion: "reduce" });
  await ready(page);
  await page.waitForTimeout(1500);
  const a = await state(page);
  await page.waitForTimeout(1200);
  const b = await state(page);
  const turned = Math.max(...a.orientation.map((value, i) => Math.abs(value - b.orientation[i])));
  check("reduced motion: the ball holds still", turned < 1e-4 && b.waves.length === 0, `moved ${turned.toExponential(1)}`);
  check("reduced motion: the loop sleeps", !b.running && a.frames === b.frames, `frames ${a.frames} then ${b.frames}`);

  const box = await page.locator("canvas").boundingBox();
  const target = await capNear(page, box.width / 2, box.height * 0.42);
  await startSampling(page, [target.cap]);
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(900);
  const recorded = await samples(page);
  const deepest = Math.min(...recorded.map((s) => s.lift[0]));
  check("reduced motion: a press still sinks its cap", deepest < -0.1, `lowest ${deepest.toFixed(2)}`);
  check("reduced motion: a press sends no wave", recorded.every((s) => s.waves === 0));
  await page.mouse.move(4, 4);
  const asleep = await until(page, (s) => !s.running, 3000);
  check("reduced motion: the loop sleeps again after a press", asleep !== null);
  check("reduced motion: no page errors", errors.length === 0, errors.join(" | "));
  await context.close();
}

// ─── A CPU renderer: the bottom rung from the start, and still when idle ───
if (GPU.length) {
  const software = await chromium.launch();
  const context = await software.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "no-preference" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  await page.goto(ROUTE, { waitUntil: "load" }).catch(() => page.goto(ROUTE, { waitUntil: "load" }));
  await ready(page);
  const renderer = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
  });
  const s = await state(page);
  check("software renderer: one pixel per pixel, no reflection", s.dpr === 1 && !s.reflections, `${renderer}: dpr ${s.dpr}, reflections ${s.reflections}`);
  const idle = await until(page, (s) => !s.running && s.waves.length === 0, 15000);
  check("software renderer: the loop sleeps once the opening is over", idle !== null);
  check("software renderer: no page errors", errors.length === 0, errors.join(" | "));
  await software.close();
}

// ─── The GPU context is lost and given back ───
{
  const { context, page, errors } = await open();
  await ready(page);
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const gl = document.querySelector("canvas").getContext("webgl2");
    window.__loseContext = gl.getExtension("WEBGL_lose_context");
    window.__loseContext.loseContext();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__loseContext.restoreContext());
  const framesBefore = (await state(page)).frames;
  const resumed = await until(page, (s) => s.frames > framesBefore + 5, 4000);
  const box = await page.locator("canvas").boundingBox();
  const [middle, beside] = await pixels(page, [
    [box.width / 2, box.height * 0.42],
    [8, box.height * 0.42],
  ]);
  const differs = Math.abs(middle[0] - beside[0]) + Math.abs(middle[1] - beside[1]) + Math.abs(middle[2] - beside[2]);
  check("after a lost context the ball draws again", resumed !== null && differs > 60, `middle ${middle} beside ${beside}`);
  check("context loss: no page errors", errors.length === 0, errors.join(" | "));
  await context.close();
}

// ─── No WebGL2: the page says so ───
{
  const { context, page, errors } = await open({
    init: () => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        return type === "webgl2" ? null : original.call(this, type, ...rest);
      };
    },
  });
  await page.waitForTimeout(1500);
  const notice = page.getByText("เบราว์เซอร์นี้เปิด WebGL2 ไม่ได้");
  check("without WebGL2 the page says so", await notice.isVisible());
  check("without WebGL2: no page errors", errors.length === 0, errors.join(" | "));
  await page.screenshot({ path: `${OUT}/thock-no-webgl2.png` });
  await context.close();
}

await browser.close();
if (refused.length) console.log(`
${refused.length} localhost request(s) refused by Chromium, not counted as page errors`);
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
