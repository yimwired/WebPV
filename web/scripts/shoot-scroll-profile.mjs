// Explains a slow swipe: what the main thread, the compositor and the GPU
// spend their time on while a finger works down a page on a phone and back
// up. shoot-smooth.mjs says whether scrolling is smooth; this says why not.
//
// One run prints the frame counts, each thread's busy time, the main thread's
// time by trace event, the scripts behind it, and the longest tasks with what
// filled them. To find a culprit, switch one suspect off at a time with
// INJECT_CSS and compare the runs: on 2026-10-23 that showed the glass lens
// was half the GPU's work and the lanes' mask none of it, before anything was
// rewritten. REDUCED=1 measures under reduced motion, a floor for what the
// page's animations cost.
//
// Same input as shoot-smooth (touch drags, 4x CPU, the real GPU, 60 ms of
// latency), and the same caveat: compare runs with each other, not with a
// phone's own figures.
//
//   node web/scripts/shoot-scroll-profile.mjs     from the repo root, export served
//   ROUTE=/pricing  DEVICE="Galaxy Tab S4"  REDUCED=1  TRACE_OUT=web/screenshots/trace.json
//   INJECT_CSS=".glass{backdrop-filter:none!important}"
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const ROUTE = process.env.ROUTE || "/";
const DEVICE = process.env.DEVICE || "Pixel 7";
const SPEED = 1600; // px a second
const MOVE_MS = 16;
const CATEGORIES = [
  "toplevel", // ThreadControllerImpl::RunTask on every thread, GPU process included
  "benchmark",
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.frame",
  "viz",
  "gpu",
];

const browser = await chromium.launch({ args: ["--use-angle=d3d11"] });
const context = await browser.newContext({
  ...devices[DEVICE],
  locale: "en-US",
  reducedMotion: process.env.REDUCED === "1" ? "reduce" : "no-preference",
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-transparency", value: "no-preference" }] });
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 60, downloadThroughput: -1, uploadThroughput: -1 });
await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
if (process.env.INJECT_CSS) await page.addStyleTag({ content: process.env.INJECT_CSS });
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

const viewport = page.viewportSize();
const distance = Math.min(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight), 9000);

/** Scrolls `distance` px (positive is down) with drags of a thumb. */
async function swipe(distance) {
  const direction = Math.sign(distance);
  const stroke = Math.round(viewport.height * 0.6);
  for (let left = Math.abs(distance); left > 0; left -= stroke) {
    const length = Math.min(stroke, left);
    const fromY = Math.round(viewport.height * (direction > 0 ? 0.8 : 0.2));
    const steps = Math.max(2, Math.round(((length / SPEED) * 1000) / MOVE_MS));
    const x = Math.round(viewport.width / 2);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: fromY }] });
    for (let step = 1; step <= steps; step++) {
      const y = Math.round(fromY - (direction * length * step) / steps);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
      await page.waitForTimeout(MOVE_MS);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
}

await browser.startTracing(page, { categories: CATEGORIES });
await swipe(distance);
await swipe(-distance);
const raw = await browser.stopTracing();
await browser.close();
if (process.env.TRACE_OUT) writeFileSync(process.env.TRACE_OUT, raw);
const events = JSON.parse(raw.toString()).traceEvents;

const threadOf = (event) => `${event.pid}:${event.tid}`;
const threadNames = new Map(events.filter((e) => e.name === "thread_name").map((e) => [threadOf(e), e.args.name]));
const processNames = new Map(events.filter((e) => e.name === "process_name").map((e) => [e.pid, e.args.name]));
const ms = (us) => (us / 1000).toFixed(0).padStart(6);

// Each thread's busy time from its top-level tasks only. The renderer logs a
// RunTask inside every ThreadControllerImpl::RunTask, so counting both would
// double it; a thread that has the outer one is read from that alone.
const tasksByThread = new Map();
for (const event of events) {
  if (!event.dur || (event.name !== "ThreadControllerImpl::RunTask" && event.name !== "RunTask")) continue;
  const entry = tasksByThread.get(threadOf(event)) ?? { outer: 0, inner: 0 };
  entry[event.name === "RunTask" ? "inner" : "outer"] += event.dur;
  tasksByThread.set(threadOf(event), entry);
}
const busy = [...tasksByThread].map(([thread, { outer, inner }]) => [thread, outer || inner]);

const frames = events.filter((e) => e.name === "PipelineReporter" && e.args?.frame_reporter?.state).map((e) => e.args.frame_reporter);
const count = (state) => frames.filter((frame) => frame.state === state).length;
console.log(`${BASE}${ROUTE} on ${DEVICE}${process.env.REDUCED === "1" ? ", reduced motion" : ""}${process.env.INJECT_CSS ? `, with ${process.env.INJECT_CSS}` : ""}`);
console.log(`frames ${frames.length} · partial ${count("STATE_PRESENTED_PARTIAL")} · dropped ${count("STATE_DROPPED")} · with a main-thread animation ${frames.filter((f) => f.has_main_animation).length}`);

console.log("\nbusy by thread (ms):");
for (const [thread, time] of busy.sort((a, b) => b[1] - a[1]).slice(0, 6)) {
  console.log(`${ms(time)}  ${processNames.get(Number(thread.split(":")[0])) ?? "?"} / ${threadNames.get(thread) ?? thread}`);
}

// The page's renderer main thread is the CrRendererMain that worked hardest.
const main = busy.filter(([thread]) => threadNames.get(thread) === "CrRendererMain").sort((a, b) => b[1] - a[1])[0]?.[0];
const onMain = events.filter((e) => threadOf(e) === main && e.ph === "X" && e.dur);

const tally = (list, keyOf) => {
  const totals = new Map();
  for (const event of list) {
    const key = keyOf(event);
    const entry = totals.get(key) ?? { time: 0, n: 0 };
    entry.time += event.dur;
    entry.n += 1;
    totals.set(key, entry);
  }
  return [...totals].sort((a, b) => b[1].time - a[1].time);
};

console.log("\nmain thread by trace event (ms, count):");
for (const [name, { time, n }] of tally(onMain.filter((e) => !/RunTask$/.test(e.name)), (e) => e.name).slice(0, 15)) {
  console.log(`${ms(time)} ${String(n).padStart(6)}x  ${name}`);
}

console.log("\nscripts (ms, count):");
const where = (e) => {
  const data = e.args?.data ?? {};
  return `${(data.url ?? "").split("/").pop()}:${data.lineNumber ?? ""} ${data.functionName ?? ""}`.trim();
};
for (const [name, { time, n }] of tally(onMain.filter((e) => e.name === "FunctionCall"), where).slice(0, 8)) {
  console.log(`${ms(time)} ${String(n).padStart(6)}x  ${name}`);
}

console.log("\nlongest tasks:");
const longest = onMain.filter((e) => e.name === "RunTask").sort((a, b) => b.dur - a.dur).slice(0, 5);
for (const task of longest) {
  const inside = onMain
    .filter((e) => e !== task && e.ts >= task.ts && e.ts + e.dur <= task.ts + task.dur && !/RunTask$/.test(e.name))
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 4)
    .map((e) => `${e.name} ${(e.dur / 1000).toFixed(1)}`);
  console.log(`${(task.dur / 1000).toFixed(1).padStart(6)} ms: ${inside.join(" | ")}`);
}
