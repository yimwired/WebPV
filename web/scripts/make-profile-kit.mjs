// Draws the image kit for Film's fastwork.com profile out of the site itself:
// the banner, a cover per service, a circle-safe avatar, the portfolio stills
// and three short clips of demos being used. Everything lands in
// fastwork-covers/profile/, which is gitignored with the rest of that folder.
//
// Run from the repo root with the built site served:
//   npx wrangler dev -c wrangler.jsonc --port 8788
//   SHOOT_URL=http://127.0.0.1:8788 node web/scripts/make-profile-kit.mjs
//   ONLY=banner,services node web/scripts/make-profile-kit.mjs
//
// Parts: banner, services, avatar, stills, clips.
//
// Sizes come off fastwork.com's own showcase profile, read 2026-10-17: the
// cover is a 1400x786 image shown through a 3.56:1 band across its middle
// (a phone shows a taller 2.2:1 band), the avatar a 480 square cut to a
// circle, portfolio tiles 4:5, 1:1 or 9:16 at 1120-1400 wide, and service
// thumbnails 1400 squares shown through a 4:3 window.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.SHOOT_URL ?? "http://127.0.0.1:8788";
const OUT = "fastwork-covers/profile";
const ONLY = process.env.ONLY?.split(",").map((part) => part.trim());
const wants = (part) => !ONLY || ONLY.includes(part);

// ── Facts, read from the source so the images cannot drift from the site ───

const labsSource = readFileSync("web/src/lib/labs.ts", "utf8");
const LAB_COUNT = (
  labsSource.slice(0, labsSource.indexOf("export const archivedLabs")).match(/^\s+slug: "/gm) ?? []
).length;

// Only the packages: the care plans below them in the same file are monthly.
const pricingSource = readFileSync("web/src/lib/pricing.ts", "utf8");
const tiersSource = pricingSource.slice(
  pricingSource.indexOf("export const pricingTiers"),
  pricingSource.indexOf("];", pricingSource.indexOf("export const pricingTiers")),
);
const FROM_PRICE = Math.min(
  ...[...tiersSource.matchAll(/\bprice: "([\d,]+)"/g)].map((m) => Number(m[1].replaceAll(",", ""))),
).toLocaleString("en-US");

// ── Type: fetched once, then inlined ────────────────────────────────────────
// Geist is the site's own face. Thai on the site falls back to whatever the
// visitor's system has, which is Noto Sans Thai on Android; an image needs one
// answer, so it gets that one. Every file is inlined as a data URI and cached,
// so a render never waits on the network and cannot half-load a font.

const FONT_CACHE = join(OUT, ".fonts.css");
const FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400;600&family=Geist+Mono:wght@400;500&family=Noto+Sans+Thai:wght@400;600&display=block";

async function fontCss() {
  if (existsSync(FONT_CACHE)) return readFileSync(FONT_CACHE, "utf8");
  // A desktop Chrome user agent, or the API answers with TTF instead of woff2.
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  };
  let css = await (await fetch(FONT_CSS_URL, { headers })).text();
  for (const url of new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) ?? [])) {
    const font = Buffer.from(await (await fetch(url)).arrayBuffer()).toString("base64");
    css = css.replaceAll(url, `data:font/woff2;base64,${font}`);
  }
  writeFileSync(FONT_CACHE, css);
  return css;
}

// ── Shared look: the site's own tokens and type ─────────────────────────────

const HEAD = (fonts) => `
<style>${fonts}</style>
<style>
  :root {
    --background: oklch(0.145 0 0);
    --surface: oklch(0.185 0 0);
    --foreground: oklch(0.985 0 0);
    --muted: oklch(0.708 0 0);
    --brand: oklch(0.78 0.13 66);
    --line: oklch(1 0 0 / 9%);
    --line-strong: oklch(1 0 0 / 18%);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: var(--background); color: var(--foreground); }
  body { font-family: "Geist", "Noto Sans Thai", sans-serif; -webkit-font-smoothing: antialiased; }
  .th { font-family: "Noto Sans Thai", "Geist", sans-serif; }
  .spec {
    font-family: "Geist Mono", "Noto Sans Thai", monospace;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }
  .dot { display: inline-block; background: var(--brand); border-radius: 999px; }
  .num { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
  img.card {
    position: absolute;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    object-fit: cover;
    background: var(--surface);
  }
</style>`;

// Inlined for the same reason as the fonts: nothing to fetch, nothing to fail.
const card = (slug) =>
  `data:image/webp;base64,${readFileSync(`web/public/labs/cards/${slug}.webp`).toString("base64")}`;

async function render(browser, { html, width, height, scale = 1, file }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8">${HEAD(await fontCss())}</head><body>${html}</body></html>`,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  const missing = await page.evaluate(async () => {
    const wanted = ["Geist", "Geist Mono", "Noto Sans Thai"];
    await Promise.all(wanted.map((family) => document.fonts.load(`16px "${family}"`, "aก1")));
    return wanted.filter((family) => !document.fonts.check(`16px "${family}"`, "aก1"));
  });
  if (missing.length) throw new Error(`${file}: fonts did not load: ${missing.join(", ")}`);
  await page.screenshot({ path: join(OUT, file), type: file.endsWith(".jpg") ? "jpeg" : "png", quality: file.endsWith(".jpg") ? 92 : undefined });
  await page.close();
  console.log(`  ${file}`);
}

// ── Banner ──────────────────────────────────────────────────────────────────
// Everything that has to be read sits inside the middle 50% of the height,
// which is all a desktop profile shows. The cards overlap rather than cast
// shadows: depth by occlusion, the way the site lifts panels by tone.

function bannerHtml() {
  return `
<div style="position:relative;width:1400px;height:786px;overflow:hidden;background:var(--background)">
  <div style="position:absolute;left:96px;top:268px;width:700px">
    <p class="spec" style="font-size:17px;display:flex;align-items:center;gap:12px">
      <span class="dot" style="width:9px;height:9px"></span>Web developer · Bangkok
    </p>
    <h1 class="th" style="margin-top:22px;font-size:62px;font-weight:600;line-height:1.16;letter-spacing:-0.01em">
      ผมทำเว็บที่กดเล่นได้จริง<br>ลองก่อนแล้วค่อยจ้าง
    </h1>
    <div style="margin-top:30px;padding-top:22px;border-top:1px solid var(--line-strong);display:flex;gap:56px">
      ${[
        [String(LAB_COUNT), "แบบให้กดลอง"],
        [FROM_PRICE, "บาท เริ่มต้น"],
        ["30", "วัน แก้ฟรี"],
      ]
        .map(
          ([value, label]) => `
        <div>
          <div class="num" style="font-size:36px;font-weight:600;line-height:1">${value}</div>
          <div class="th" style="margin-top:8px;font-size:17px;color:var(--muted)">${label}</div>
        </div>`,
        )
        .join("")}
    </div>
  </div>
  <img class="card" src="${card("clash")}" style="left:930px;top:170px;width:400px;height:250px;filter:brightness(0.42)">
  <img class="card" src="${card("trellis")}" style="left:878px;top:236px;width:420px;height:262px;filter:brightness(0.68)">
  <img class="card" src="${card("thock")}" style="left:818px;top:306px;width:460px;height:288px">
</div>`;
}

// ── Service covers ──────────────────────────────────────────────────────────
// The list shows these through a 4:3 window (y 175 to 1225 of 1400), at about
// a tenth of their size, so the price is the one thing sized to survive that.

const SERVICES = [
  {
    file: "service-1-quick.jpg",
    label: "แพ็ก 1 · Quick page",
    price: "4,900",
    title: "เว็บหน้าเดียว ส่งใน 3 วัน",
    lines: ["ใช้หน้าตาจากตัวอย่างที่เลือก ใส่ข้อความกับรูปของคุณ", "แก้ได้ 1 รอบ · แก้บั๊กฟรี 30 วัน"],
    slug: "counter",
  },
  {
    file: "service-2-business.jpg",
    label: "แพ็ก 2 · Business",
    price: "14,900",
    title: "เว็บธุรกิจ 4 ถึง 6 หน้า",
    lines: ["ออกแบบแยกทีละหน้า ไทยและอังกฤษ", "ราว 10 วัน · แก้ได้ 2 รอบ"],
    slug: "ember",
  },
  {
    file: "service-3-standard.jpg",
    label: "แพ็ก 3 · Standard",
    price: "24,900",
    title: "เว็บที่ขายของได้ ไม่เกิน 8 หน้า",
    lines: ["ปรับสไตล์ให้เข้ากับแบรนด์ แก้ข้อความเองได้", "ราว 2 สัปดาห์ · แก้ได้ 3 รอบ"],
    slug: "longtail",
  },
  {
    file: "service-4-signature.jpg",
    label: "Signature",
    price: "49,900",
    title: "เว็บ 3D และ motion ทำใหม่ให้เฉพาะคุณ",
    lines: ["WebGL, configurator หรือ motion ที่เขียนขึ้นใหม่", "3 ถึง 5 สัปดาห์ · แก้ได้ 3 รอบ"],
    slug: "thock",
  },
];

function serviceHtml(service) {
  return `
<div style="position:relative;width:1400px;height:1400px;overflow:hidden;background:var(--background)">
  <div style="position:absolute;left:110px;right:110px;top:196px">
    <p class="spec" style="font-size:28px;display:flex;align-items:center;gap:16px">
      <span class="dot" style="width:12px;height:12px"></span><span class="th" style="font-family:'Geist Mono','Noto Sans Thai',monospace">${service.label}</span>
    </p>
    <div style="margin-top:34px;display:flex;align-items:baseline;gap:26px">
      <span class="num" style="font-size:236px;font-weight:600;line-height:0.9">${service.price}</span>
      <span class="th" style="font-size:60px;color:var(--muted)">บาท</span>
    </div>
    <h2 class="th" style="margin-top:46px;font-size:64px;font-weight:600;line-height:1.2">${service.title}</h2>
    <div class="th" style="margin-top:22px;font-size:34px;line-height:1.55;color:var(--muted)">
      ${service.lines.map((line) => `<div>${line}</div>`).join("")}
    </div>
  </div>
  <img class="card" src="${card(service.slug)}" style="left:110px;top:930px;width:1180px;height:738px;border-radius:16px">
</div>`;
}

// ── Avatar ──────────────────────────────────────────────────────────────────
// make-avatar.mjs draws a rounded square with an inset hairline, which a
// circle crop cuts through. This one has nothing near its edges to cut.

function avatarHtml() {
  return `
<div style="width:512px;height:512px;display:flex;align-items:center;justify-content:center;background:var(--background)">
  <span style="font-size:300px;font-weight:600;color:var(--brand);line-height:1;transform:translateY(-6px)">F</span>
</div>`;
}

// ── Portfolio stills ────────────────────────────────────────────────────────

async function hideSwitcher(page) {
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  await page.evaluate(() => {
    const bar = document.querySelector('[aria-label="Exit to gallery"]')?.closest(".fixed");
    if (bar instanceof HTMLElement) bar.style.setProperty("display", "none", "important");
  });
}

const settleAnimations = (page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => {
      const end = animation.effect?.getComputedTiming().endTime;
      return !Number.isFinite(end) || animation.playState === "finished";
    }),
  );

const thockAtRest = (page) =>
  page.waitForFunction(
    () => {
      const state = window.__thock?.inspect();
      return state?.legendsReady && state.waves.length === 0 && state.lift.every((lift) => Math.abs(lift) < 0.01);
    },
    null,
    { timeout: 20000 },
  );

const STILLS = [
  { file: "01-thock.jpg", slug: "thock", width: 1120, height: 1400, prepare: thockAtRest },
  { file: "02-trellis.jpg", slug: "trellis", width: 1400, height: 1400, prepare: settleAnimations },
  { file: "03-clash.jpg", slug: "clash", width: 1120, height: 1400 },
  {
    file: "04-gaze.jpg",
    slug: "gaze",
    width: 1400,
    height: 1400,
    prepare: async (page) => {
      await page.mouse.move(1000, 520, { steps: 12 });
      await page.waitForTimeout(1500);
    },
  },
  { file: "05-counter-phone.jpg", slug: "counter", width: 390, height: 693, scale: 3, phone: true },
  { file: "06-longtail.jpg", slug: "longtail", width: 1120, height: 1400 },
  { file: "07-meeple.jpg", slug: "meeple", width: 1400, height: 1400 },
  { file: "08-ember.jpg", slug: "ember", width: 1120, height: 1400 },
  { file: "09-trine.jpg", slug: "trine", width: 1120, height: 1400 },
];

async function still(browser, item) {
  const context = await browser.newContext({
    viewport: { width: item.width, height: item.height },
    deviceScaleFactor: item.scale ?? 1,
    isMobile: Boolean(item.phone),
    hasTouch: Boolean(item.phone),
    reducedMotion: "no-preference",
    locale: "th-TH",
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/labs/${item.slug}`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await hideSwitcher(page);
  if (item.prepare) await item.prepare(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, "portfolio", item.file), type: "jpeg", quality: 92 });
  await context.close();
  console.log(`  portfolio/${item.file}`);
}

// ── Clips ───────────────────────────────────────────────────────────────────
// Chromium's screencast hands over a frame each time the page repaints, with
// the time it was drawn. Writing each one out for exactly as long as it was on
// screen gives a clip that runs at the page's real speed, however slowly the
// headless browser happened to draw.

const CLIPS = [
  {
    file: "clip-thock.mp4",
    slug: "thock",
    trimStart: 1.2,
    act: async (page) => {
      // It types T-H-O-C-K on its own once the legends are printed.
      await page.waitForTimeout(4200);
      await page.mouse.move(700, 640);
      await page.mouse.down();
      await page.mouse.move(380, 600, { steps: 14 });
      await page.mouse.up();
      await page.waitForTimeout(1600);
      for (const key of ["KeyF", "KeyI", "KeyL", "KeyM"]) {
        await page.keyboard.press(key);
        await page.waitForTimeout(380);
      }
      await page.waitForTimeout(1800);
    },
  },
  {
    file: "clip-trellis.mp4",
    slug: "trellis",
    trimStart: 0.4,
    act: async (page) => {
      await page.waitForTimeout(3200);
      await page.getByLabel("ข้อความที่จะปลูก").focus();
      // Enter withers the whole garden; start the new word as soon as it is
      // gone, or the clip spends a second and a half on an empty screen.
      await page.keyboard.press("Enter");
      await page.waitForTimeout(650);
      await page.keyboard.type("สวัสดี", { delay: 260 });
      await page.waitForTimeout(3600);
    },
  },
  {
    file: "clip-gaze.mp4",
    slug: "gaze",
    trimStart: 0.4,
    act: async (page) => {
      await page.waitForTimeout(1200);
      // A slow figure of eight across the page, so the head turns both ways
      // and tips up and down.
      const steps = 180;
      for (let i = 0; i <= steps; i += 1) {
        const t = (i / steps) * Math.PI * 2;
        await page.mouse.move(540 + Math.sin(t) * 430, 640 + Math.sin(t * 2) * 300);
        await page.waitForTimeout(38);
      }
      await page.waitForTimeout(600);
    },
  },
];

async function clip(browser, item) {
  const width = 1080;
  const height = 1350;
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "no-preference",
    locale: "th-TH",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    frames.push({ data, time: metadata.timestamp });
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });

  await page.goto(`${BASE}/labs/${item.slug}`, { waitUntil: "load" });
  await hideSwitcher(page);
  await page.mouse.move(width / 2, height / 2);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: width, maxHeight: height });
  const started = Date.now();
  await item.act(page);
  const lastTime = frames.at(-1)?.time ?? 0;
  const tail = (Date.now() - started) / 1000 - (lastTime - (frames[0]?.time ?? lastTime));
  await cdp.send("Page.stopScreencast");
  await context.close();

  const dir = join(OUT, "clips", `.frames-${item.slug}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const list = [];
  frames.forEach((frame, i) => {
    const name = `${String(i).padStart(5, "0")}.jpg`;
    writeFileSync(join(dir, name), Buffer.from(frame.data, "base64"));
    const next = frames[i + 1]?.time ?? frame.time + Math.max(tail, 0.5);
    list.push(`file '${name}'`, `duration ${(next - frame.time).toFixed(4)}`);
  });
  // The concat demuxer drops the last duration unless the file is listed again.
  list.push(`file '${String(frames.length - 1).padStart(5, "0")}.jpg'`);
  writeFileSync(join(dir, "list.txt"), list.join("\n"));

  const target = join(OUT, "clips", item.file);
  execFileSync("ffmpeg", [
    "-loglevel", "error", "-y",
    "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"),
    "-ss", String(item.trimStart),
    "-vf", `fps=30,scale=${width}:${height}:flags=lanczos,format=yuv420p`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", "-an",
    target,
  ]);
  rmSync(dir, { recursive: true, force: true });
  const seconds = (frames.at(-1).time - frames[0].time + tail).toFixed(1);
  console.log(`  clips/${item.file}: ${frames.length} frames over ${seconds}s`);
}

// ── Run ─────────────────────────────────────────────────────────────────────

mkdirSync(join(OUT, "portfolio"), { recursive: true });
mkdirSync(join(OUT, "clips"), { recursive: true });
console.log(`labs listed: ${LAB_COUNT} · cheapest package: ${FROM_PRICE}`);

// The real GPU, not SwiftShader: Thock and Trine draw WebGL and drop to their
// lowest quality on a software renderer.
const browser = await chromium.launch({ args: ["--use-angle=d3d11"] });

if (wants("banner")) {
  await render(browser, { html: bannerHtml(), width: 1400, height: 786, scale: 2, file: "banner@2x.jpg" });
  await render(browser, { html: bannerHtml(), width: 1400, height: 786, scale: 1, file: "banner.jpg" });
}
if (wants("services")) {
  for (const service of SERVICES) {
    await render(browser, { html: serviceHtml(service), width: 1400, height: 1400, file: service.file });
  }
}
if (wants("avatar")) {
  await render(browser, { html: avatarHtml(), width: 512, height: 512, file: "avatar-circle.png" });
}
if (wants("stills")) {
  for (const item of STILLS) await still(browser, item);
}
if (wants("clips")) {
  for (const item of CLIPS) await clip(browser, item);
}

await browser.close();
