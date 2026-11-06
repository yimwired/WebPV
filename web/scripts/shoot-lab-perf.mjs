// What a 3D lab costs while someone uses it: how many bytes it pulls, how long it
// takes to load, and how even its frames are during real input. shoot-labs-3d.mjs
// says whether the render loop parks; this says what it costs while it runs.
//
// Frames are timed with requestAnimationFrame in every frame of the page, so a demo
// inside an iframe is measured too, and the slowest frame's numbers are the ones
// reported. Runs on the real GPU. The tablet profile throttles the CPU 4x to stand in
// for a tablet's slower core, not its GPU, so compare runs with each other: a real
// iPad is the only way to know what an iPad does.
//
//   node web/scripts/shoot-lab-perf.mjs            from the repo root, export served
//   SHOOT_URL=http://127.0.0.1:3000  ROUTES=/labs/trine,/labs/songtor
import { chromium, devices } from "playwright";

const BASE = process.env.SHOOT_URL ?? "http://127.0.0.1:8788";
const ROUTES = (process.env.ROUTES ?? "/labs/trine").split(",");
const SAMPLE_MS = 8000;

const PROFILES = [
  { name: "desktop 1440", context: { viewport: { width: 1440, height: 900 } }, cpu: 1 },
  { name: "iPad, cpu x4", context: devices["iPad Pro 11"], cpu: 4 },
];

const installProbe = () => {
  const probe = { deltas: [], longTasks: 0, last: 0 };
  window.__perf = probe;
  const tick = (now) => {
    if (probe.last) probe.deltas.push(now - probe.last);
    probe.last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) probe.longTasks += entry.duration;
  }).observe({ type: "longtask", buffered: true });
};

const percentile = (sorted, share) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))] ?? 0;

/** A demo that scrolls moves through itself; one that does not gets a pointer dragged across it. */
async function exercise(page) {
  for (const frame of page.frames()) {
    const scrollable = await frame.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    if (frame !== page.mainFrame() && scrollable > 500) {
      await frame.evaluate(
        ([duration, travel]) =>
          new Promise((done) => {
            const start = performance.now();
            const step = (now) => {
              const progress = Math.min(1, (now - start) / duration);
              window.scrollTo(0, progress * travel);
              if (progress < 1) requestAnimationFrame(step);
              else done();
            };
            requestAnimationFrame(step);
          }),
        [SAMPLE_MS, scrollable],
      );
      return "scroll through the whole demo";
    }
  }

  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  const startedAt = Date.now();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  let tick = 0;
  while (Date.now() - startedAt < SAMPLE_MS) {
    tick += 1;
    await page.mouse.move(
      box.x + box.width * (0.5 + 0.3 * Math.sin(tick / 12)),
      box.y + box.height * (0.5 + 0.2 * Math.cos(tick / 17)),
    );
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  return "drag across the canvas";
}

const browser = await chromium.launch({ args: ["--use-angle=d3d11"] });
const failures = [];

for (const route of ROUTES) {
  for (const profile of PROFILES) {
    const context = await browser.newContext(profile.context);
    await context.addInitScript(installProbe);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
    await cdp.send("Network.enable");
    let bytes = 0;
    cdp.on("Network.loadingFinished", (event) => {
      bytes += event.encodedDataLength;
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const loadStart = Date.now();
    await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 120000 });
    const demo = page.frames().find((frame) => frame !== page.mainFrame());
    if (demo) {
      await demo.waitForSelector("[data-loader].is-done", { state: "attached", timeout: 120000 }).catch(() => {});
    }
    const loadMs = Date.now() - loadStart;
    await page.waitForTimeout(1500);

    // Proof the throttle reached the document being measured: the same loop takes
    // about 2.5x as long on the tablet profile (a rate of 4 is not a clean 4x here).
    const spinMs = await (demo ?? page).evaluate(() => {
      const start = performance.now();
      let total = 0;
      for (let index = 0; index < 5e7; index += 1) total += index % 7;
      return performance.now() - start + (total & 0);
    });

    for (const frame of page.frames()) {
      await frame.evaluate(() => {
        window.__perf.deltas.length = 0;
        window.__perf.longTasks = 0;
      });
    }
    const input = await exercise(page);

    const samples = await Promise.all(
      page.frames().map((frame) =>
        frame.evaluate(() => ({
          deltas: window.__perf.deltas,
          longTasks: window.__perf.longTasks,
          heap: performance.memory?.usedJSHeapSize ?? 0,
        })),
      ),
    );
    const worst = samples.toSorted((a, b) => percentile(b.deltas.toSorted((x, y) => x - y), 0.95) - percentile(a.deltas.toSorted((x, y) => x - y), 0.95))[0];
    const sorted = worst.deltas.toSorted((a, b) => a - b);
    const janky = sorted.filter((delta) => delta > 33.4).length;
    const heapMb = Math.max(...samples.map((sample) => sample.heap)) / 1048576;

    console.log(`${route}  ${profile.name}  (${input})`);
    console.log(`  load ${(loadMs / 1000).toFixed(1)}s, ${(bytes / 1048576).toFixed(1)} MB over the wire, heap ${heapMb.toFixed(0)} MB, spin ${spinMs.toFixed(0)} ms`);
    console.log(
      `  frames ${sorted.length}, median ${percentile(sorted, 0.5).toFixed(1)} ms, p95 ${percentile(sorted, 0.95).toFixed(1)} ms, ` +
        `over 33 ms ${((janky / Math.max(1, sorted.length)) * 100).toFixed(1)}%, long tasks ${Math.round(worst.longTasks)} ms`,
    );
    if (errors.length) {
      console.log(`  errors: ${errors.join(" | ")}`);
      failures.push(route);
    }
    await context.close();
  }
}

await browser.close();
process.exit(failures.length ? 1 : 0);
