// Measures how smoothly a page scrolls on a phone and a tablet, as numbers:
// how many frames Chrome itself reports dropped or only partly updated while
// a finger works down the page and back up, the long animation frames on the
// main thread behind them, and how busy that thread was meanwhile.
//
// The finger is real touch input (Input.dispatchTouchEvent): drags of most of
// a screen, one after another, so the page scrolls on the compositor the way
// it does under a thumb, with no hover changing under a pointer and no wheel
// events for the page to handle. Headless will not run the touch flavour of
// Input.synthesizeScrollGesture (the page never moves), and it does not fling
// after a lift, which is why the drags follow each other closely. INPUT=wheel
// swaps in the gesture with a mouse wheel, for a laptop. Frames are read off
// Chrome's trace (PipelineReporter), which sees compositor and GPU work too,
// not only the main thread a requestAnimationFrame loop can see.
//
// "Partial" is a frame the compositor showed without the main thread's part:
// the scroll moved on time, but whatever script or a non-composited animation
// was changing that frame arrived late. Visitors read that as a stutter in
// the moving parts, not the page. "Main busy" is the renderer's main thread
// over the whole swipe; on a phone it is battery as much as smoothness.
//
// The main thread is slowed 4x, about a mid-range phone; the GPU is not, so
// an effect that is heavy only on a phone's GPU reads lighter here than it
// is. Compare runs with each other, not with a phone's own figures. GPU=1
// draws on this machine's real GPU; without it Chromium draws on SwiftShader,
// on the CPU, which exaggerates GPU-heavy effects instead.
//
// Every request waits LATENCY ms (60 by default), as it would on a phone's
// connection. A local server answers in a few ms, so the pages Next fetches
// ahead for links scrolling into view all land in one frame and read as a
// long frame that live never shows; LATENCY=0 measures that.
//
//   node web/scripts/shoot-smooth.mjs           from the repo root, export served
//   SHOOT_URL=https://webpv.yimwired.workers.dev  ROUTES=/,/pricing  RUNS=3  CPU=4  GPU=1  INPUT=wheel  LATENCY=60
import { chromium, devices } from "playwright";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const ROUTES = (process.env.ROUTES || "/").split(",");
const RUNS = Number(process.env.RUNS || 3);
const CPU = Number(process.env.CPU || 4);
const INPUT = process.env.INPUT || "touch";
const LATENCY = Number(process.env.LATENCY ?? 60);
const PROFILES = [
  ["phone", devices["Pixel 7"]],
  ["tablet", devices["Galaxy Tab S4"]],
];
const TRACE_CATEGORIES = [
  "benchmark",
  "rail",
  "devtools.timeline",
  "disabled-by-default-devtools.timeline", // RunTask, for the main thread's busy time
  "disabled-by-default-devtools.timeline.frame",
];
// A brisk read-and-scroll, in px a second.
const SPEED = 1600;
// Touch moves arrive about this often; phones sample at 60 to 120 Hz.
const MOVE_MS = 16;

const browser = await chromium.launch({ args: process.env.GPU === "1" ? ["--use-angle=d3d11"] : [] });

/** Scrolls `distance` px (positive is down the page) with drags of a thumb. */
async function swipeByTouch(cdp, page, viewport, distance) {
  const direction = Math.sign(distance);
  const stroke = Math.round(viewport.height * 0.6);
  const x = Math.round(viewport.width / 2);
  for (let left = Math.abs(distance); left > 0; left -= stroke) {
    const length = Math.min(stroke, left);
    // Scrolling down means the finger travels up the screen.
    const fromY = direction > 0 ? Math.round(viewport.height * 0.8) : Math.round(viewport.height * 0.2);
    const steps = Math.max(2, Math.round((length / SPEED) * 1000 / MOVE_MS));
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: fromY }] });
    for (let step = 1; step <= steps; step++) {
      const y = fromY - (direction * length * step) / steps;
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: Math.round(y) }] });
      await page.waitForTimeout(MOVE_MS);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
}

/** Frame counts over one swipe down the page and one back up. */
async function measure(profile, route) {
  const context = await browser.newContext({ ...profile, locale: "en-US", reducedMotion: "no-preference" });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  // The glass is solid under headless's default reduced transparency, which
  // would leave its cost out of the measurement.
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-transparency", value: "no-preference" }] });
  if (LATENCY > 0) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: LATENCY, downloadThroughput: -1, uploadThroughput: -1 });
  }
  await page.goto(`${BASE}${route}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  await page.evaluate(() => {
    window.__loaf = [];
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__loaf.push(entry.duration);
      }).observe({ type: "long-animation-frame" });
    } catch {}
  });

  const distance = Math.min(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight), 9000);
  const viewport = page.viewportSize();
  const swipe =
    INPUT === "wheel"
      ? (yDistance) =>
          cdp.send("Input.synthesizeScrollGesture", {
            x: Math.round(viewport.width / 2),
            y: Math.round(viewport.height / 2),
            yDistance: -yDistance,
            speed: SPEED,
            gestureSourceType: "default",
          })
      : (yDistance) => swipeByTouch(cdp, page, viewport, yDistance);

  await browser.startTracing(page, { categories: TRACE_CATEGORIES });
  await swipe(distance);
  await swipe(-distance);
  const trace = JSON.parse((await browser.stopTracing()).toString()).traceEvents;
  const loaf = await page.evaluate(() => window.__loaf);
  await context.close();

  const frames = trace
    .filter((event) => event.name === "PipelineReporter" && event.args?.frame_reporter?.state)
    .map((event) => event.args.frame_reporter);
  const count = (state) => frames.filter((frame) => frame.state === state).length;
  return {
    frames: frames.length,
    dropped: count("STATE_DROPPED"),
    partial: count("STATE_PRESENTED_PARTIAL"),
    loafCount: loaf.length,
    loafMs: loaf.reduce((sum, ms) => sum + ms, 0),
    mainMs: mainThreadBusy(trace),
  };
}

/** Time the page's renderer main thread spent in tasks, in ms. */
function mainThreadBusy(trace) {
  const mainThreads = new Set(
    trace.filter((event) => event.name === "thread_name" && event.args?.name === "CrRendererMain").map((event) => `${event.pid}:${event.tid}`),
  );
  const busy = new Map();
  for (const event of trace) {
    const thread = `${event.pid}:${event.tid}`;
    if (event.name === "RunTask" && event.dur && mainThreads.has(thread)) busy.set(thread, (busy.get(thread) || 0) + event.dur);
  }
  // Other renderers (an extension, a blank tab) idle; the page's is the busy one.
  return Math.max(0, ...busy.values()) / 1000;
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

console.log(
  `${BASE}  ${INPUT}  cpu ${CPU}x  ${process.env.GPU === "1" ? "real GPU" : "SwiftShader"}  latency ${LATENCY} ms  median of ${RUNS}`,
);
for (const route of ROUTES) {
  for (const [name, profile] of PROFILES) {
    const runs = [];
    for (let run = 0; run < RUNS; run++) runs.push(await measure(profile, route));
    const pick = (key) => median(runs.map((result) => result[key]));
    const share = (key) => ((pick(key) / Math.max(pick("frames"), 1)) * 100).toFixed(1);
    console.log(
      `${route.padEnd(10)} ${name.padEnd(7)} ${pick("frames")} frames · dropped ${pick("dropped")} (${share("dropped")}%)` +
        ` · partial ${pick("partial")} (${share("partial")}%) · long frames ${pick("loafCount")} (${pick("loafMs").toFixed(0)} ms)` +
        ` · main busy ${pick("mainMs").toFixed(0)} ms`,
    );
  }
}
await browser.close();
