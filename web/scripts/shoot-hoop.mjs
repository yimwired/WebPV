// /labs/hoop: the page claims that typing a name grows one plant per character
// in three timed acts, that deleting a character withers exactly its plant,
// that a colourway repaints without regrowing anything, that no flower drawn in
// front of the name covers its ink (a rose over the tone mark of ข้าว leaves
// ขาว), and that the stitch label is the count of the design on screen, priced
// by the rule printed beside it. All of that is checkable.
//
// Nothing here imports the page's own code. Graphemes are counted with Node's
// Intl.Segmenter, the satin check measures the letter off a canvas by itself,
// the font size is read back from the rendered field, and the price rule is
// typed in from the copy on the page.
//
// Motion checks read signed values and order, per the verify-motion-traps
// memory: a vine that drew after its rose would still "change".
//
//   SHOOT_URL=http://127.0.0.1:8788 node web/scripts/shoot-hoop.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const OUT = process.env.AUDIT_OUT || "web/screenshots";
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`${pass ? "ok  " : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
};

const graphemes = (text) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text)]
    .map((s) => s.segment)
    .filter((s) => s.trim() !== "");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));

const field = page.locator('input[aria-label="ชื่อที่จะปัก"]');
const LIVE = '.hoop-plant[data-layer="back"]:not([data-dying])';
const livePlants = () => page.locator(LIVE).count();
const grow = (ms = 3000) => page.waitForTimeout(ms);

const setText = async (value) => {
  await field.fill(value);
  await grow();
};

const readLabel = () =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll("[data-hoop-stitches]")].map((dd) => ({
      label: dd.dataset.hoopStitches,
      stitches: Number(dd.textContent.replace(/[^\d]/g, "")),
    }));
    const text = (selector) => document.querySelector(selector)?.textContent ?? "";
    return {
      rows,
      total: Number(text("[data-hoop-total]").replace(/[^\d]/g, "")),
      colours: Number(document.querySelector("[data-hoop-colours]")?.dataset.hoopColours ?? NaN),
      embroidery: Number(text("[data-hoop-embroidery]").replace(/[^\d]/g, "")),
      price: Number(text("[data-hoop-price]").replace(/[^\d]/g, "")),
      minutes: Number(text("[data-hoop-minutes]").replace(/[^\d]/g, "")),
      size: text("[data-hoop-size]"),
    };
  });

await page.goto(`${BASE}/labs/hoop`, { waitUntil: "load" });
await grow(3500);

// ── 1. one plant per character, none for a space ──────────────────────────
{
  const startText = await field.inputValue();
  const wanted = graphemes(startText).length;
  check("the name it opens on grows one plant per character", (await livePlants()) === wanted, `${await livePlants()} plants for ${wanted} in "${startText}"`);
  await page.screenshot({ path: `${OUT}/hoop-default.png` });

  await setText("Mali Fi");
  check("a space grows nothing", (await livePlants()) === graphemes("Mali Fi").length, `${await livePlants()} plants`);
}

// ── 2. the stem draws before the rose opens ───────────────────────────────
// Type one letter at a time until one of them grows a rose, sampling the new
// plant every frame from inside the page.
{
  await setText("Ma");
  await field.focus();
  await page.keyboard.press("End");
  let verdict = null;
  for (const letter of "lisonde") {
    await page.evaluate((live) => {
      window.__hoop = [];
      const start = performance.now();
      const before = document.querySelectorAll(live).length;
      const tick = () => {
        const backs = document.querySelectorAll(live);
        if (backs.length > before) {
          const back = backs[backs.length - 1];
          const fronts = document.querySelectorAll('.hoop-plant[data-layer="front"]:not([data-dying])');
          const front = fronts[fronts.length - 1];
          const vine = back.querySelector(".hoop-vine");
          const rose = front?.querySelector(".hoop-rose");
          let scale = null;
          if (rose) {
            const m = new DOMMatrix(getComputedStyle(rose).transform);
            scale = Math.hypot(m.a, m.b);
          }
          window.__hoop.push({ t: performance.now() - start, off: parseFloat(getComputedStyle(vine).strokeDashoffset), scale });
        }
        if (performance.now() - start < 2600) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, LIVE);
    await page.keyboard.type(letter);
    await grow(2800);
    const samples = await page.evaluate(() => window.__hoop);
    if (samples.length && samples[0].scale !== null) {
      verdict = samples;
      break;
    }
  }
  if (!verdict) {
    check("a rose grew somewhere in seven letters", false, "no new plant had a rose");
  } else {
    const first = verdict[0];
    const opening = verdict.find((s) => s.scale > 0.05);
    check("the stem starts undrawn and the rose closed", first.off > 0.8 && first.scale < 0.05, `first frame: dashoffset ${first.off.toFixed(2)}, rose scale ${first.scale.toFixed(2)}`);
    check(
      "the rose only opens once the stem is at least half drawn",
      opening !== undefined && opening.off <= 0.5,
      opening ? `rose opened at ${Math.round(opening.t)}ms with the stem ${Math.round((1 - opening.off) * 100)}% drawn` : "never opened",
    );
    const last = verdict[verdict.length - 1];
    check("both finish: stem drawn, rose fully open", last.off < 0.01 && Math.abs(last.scale - 1) < 0.02, `end: dashoffset ${last.off}, scale ${last.scale.toFixed(3)}`);
  }
}

// ── 3. backspace withers that character's plant, and only that one ─────────
// The withering plant is a new element in the dying state at the deleted
// character's position, so it is found by that state and position rather than
// by holding on to the live node.
{
  const before = await livePlants();
  await page.evaluate((live) => {
    const plants = document.querySelectorAll(live);
    window.__doomedLeft = plants[plants.length - 1].style.left;
    window.__kept = [...plants].slice(0, -1);
  }, LIVE);
  await field.focus();
  await page.keyboard.press("End");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(250);
  const midway = await page.evaluate(() => {
    const dying = [...document.querySelectorAll('.hoop-plant[data-layer="back"][data-dying]')];
    const ghost = dying.find((n) => n.style.left === window.__doomedLeft);
    const leaf = ghost?.querySelector(".hoop-leaf");
    return { found: Boolean(ghost), count: dying.length, opacity: leaf ? parseFloat(getComputedStyle(leaf).opacity) : null };
  });
  check("one plant withers, where the deleted character stood", midway.found && midway.count === 1, `${midway.count} withering`);
  check("and is fading, not just gone", midway.opacity !== null && midway.opacity < 0.95 && midway.opacity >= 0, `leaf opacity ${midway.opacity}`);
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({
    gone: document.querySelectorAll(".hoop-plant[data-dying]").length === 0,
    kept: window.__kept.every((n) => n.isConnected && !n.hasAttribute("data-dying")),
  }));
  check("it leaves the page once withered", after.gone);
  check("every other plant is untouched", after.kept);
  check("the count drops by exactly one", (await livePlants()) === before - 1, `${before} -> ${await livePlants()}`);
}

// ── 4. the label adds up, and the price follows the printed rule ───────────
{
  await setText("Mali");
  const label = await readLabel();
  const sum = label.rows.reduce((total, row) => total + row.stitches, 0);
  check("the four stitch lines add up to the total", sum === label.total, `${sum} vs ${label.total}`);
  // Copy on the page: 35 baht per 1,000 stitches, 10 per extra colour, a 150
  // minimum, a 190 bag, 800 stitches a minute and half a minute per colour.
  const embroidery = Math.max(150, Math.round((label.total / 1000) * 35 + (label.colours - 1) * 10));
  check("embroidery is priced by the printed rule", label.embroidery === embroidery, `page ${label.embroidery}, rule ${embroidery}`);
  check("the total adds the bag", label.price === embroidery + 190, `page ${label.price}`);
  const minutes = Math.ceil(label.total / 800 + label.colours * 0.5);
  check("machine time follows from the count", label.minutes === minutes, `page ${label.minutes}, rule ${minutes}`);
}

// ── 5. typing adds stitches, deleting takes exactly those back ────────────
{
  const before = (await readLabel()).total;
  await field.focus();
  await page.keyboard.press("End");
  await page.keyboard.type("e");
  await grow(400);
  const more = (await readLabel()).total;
  await page.keyboard.press("Backspace");
  await grow(900);
  const back = (await readLabel()).total;
  check("a letter more is more stitches", more > before, `${before} -> ${more}`);
  check("deleting it returns the exact count", back === before, `${more} -> ${back}, started at ${before}`);
}

// ── 6. a colourway repaints without regrowing ─────────────────────────────
{
  await page.evaluate(() => {
    window.__nodes = [...document.querySelectorAll(".hoop-plant")];
  });
  await page.locator("label", { hasText: "ใบตอง" }).click();
  await page.waitForTimeout(800);
  const state = await page.evaluate(() => {
    const rose = document.querySelector(".hoop-rose path, .hoop-bud");
    const vine = document.querySelector(".hoop-vine");
    return {
      same: window.__nodes.length > 0 && window.__nodes.every((n) => n.isConnected),
      count: document.querySelectorAll(".hoop-plant").length === window.__nodes.length,
      rose: rose ? getComputedStyle(rose).fill : null,
      vine: vine ? parseFloat(getComputedStyle(vine).strokeDashoffset) : null,
    };
  });
  check("the same plants are still on the page", state.same && state.count);
  check("roses take the new thread", state.rose === "rgb(246, 165, 190)", state.rose);
  check("and nothing is drawing again", state.vine === 0, `vine dashoffset ${state.vine}`);
  await page.screenshot({ path: `${OUT}/hoop-banana-leaf.png` });
}

// ── 7. the satin count matches the letter's own outline ────────────────────
// For a lone "l", a satin column's centre line is about its height plus its
// stem width. Measure both off a canvas here, in the page's own font, and turn
// px into mm with the field's printed 200 mm width.
{
  await setText("l");
  const probe = await page.evaluate(() => {
    const text = document.querySelector('[aria-hidden="true"].whitespace-pre');
    const fieldBox = document.querySelector('input[aria-label="ชื่อที่จะปัก"]').parentElement.getBoundingClientRect();
    const fontPx = parseFloat(getComputedStyle(text).fontSize);
    const mmPerPx = 200 / fieldBox.width;
    const canvas = document.createElement("canvas");
    const c = canvas.getContext("2d");
    c.font = `400 ${fontPx}px ${getComputedStyle(text).fontFamily}`;
    const m = c.measureText("l");
    const height = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * mmPerPx;
    const width = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * mmPerPx;
    return { height, width };
  });
  const letters = (await readLabel()).rows.find((r) => r.label === "ตัวอักษร")?.stitches ?? 0;
  const expected = (probe.height + probe.width) / 0.4;
  const ratio = letters / expected;
  check(
    "satin stitches for one letter match its measured outline",
    ratio > 0.9 && ratio < 1.5,
    `page ${letters}, outline says ${Math.round(expected)} (${probe.height.toFixed(1)} mm tall, ${probe.width.toFixed(1)} mm wide), ratio ${ratio.toFixed(2)}`,
  );
}

// ── 8. letter size is fixed per order and scales the count ────────────────
{
  await setText("Mali");
  await page.evaluate(() => {
    window.__nodes = [...document.querySelectorAll(".hoop-plant")];
  });
  const totals = {};
  for (const size of ["ใหญ่", "กลาง", "เล็ก"]) {
    await page.locator("label", { hasText: size }).click();
    await page.waitForTimeout(300);
    totals[size] = (await readLabel()).total;
  }
  check("large, medium, small: each smaller size sews fewer stitches", totals["ใหญ่"] > totals["กลาง"] && totals["กลาง"] > totals["เล็ก"], JSON.stringify(totals));
  check("changing size regrows nothing", await page.evaluate(() => window.__nodes.every((n) => n.isConnected)));
  await page.locator("label", { hasText: "ใหญ่" }).click();
}

// ── 9. a name the field cannot hold is refused, not shrunk ────────────────
{
  await setText("");
  await field.focus();
  const wanted = "Mali Film Garden Rose";
  await page.keyboard.type(wanted, { delay: 30 });
  await grow(1500);
  const kept = await field.inputValue();
  const status = await page.locator('[role="status"]').count();
  check("typing stops where the field runs out, with no letter skipped", kept.length < wanted.length && wanted.startsWith(kept), `kept "${kept}"`);
  check("and says why", status > 0);
  const size = (await readLabel()).size.match(/(\d+)\s*×\s*(\d+)/);
  check("the design still fits the 200 × 130 mm field", size && Number(size[1]) <= 200 && Number(size[2]) <= 130, size?.[0]);
  const spill = await page.evaluate(() => {
    const box = document.querySelector('input[aria-label="ชื่อที่จะปัก"]').parentElement.getBoundingClientRect();
    return [...document.querySelectorAll(".hoop-plant path")].filter((p) => {
      const r = p.getBoundingClientRect();
      return r.width > 0 && (r.left < box.left - 3 || r.right > box.right + 3 || r.top < box.top - 3 || r.bottom > box.bottom + 3);
    }).length;
  });
  check("no part of the garden is drawn outside the field", spill === 0, `${spill} shapes outside`);
}

// ── 10. Thai: one plant per cluster, and nothing in front covers the ink ───
{
  await page.getByRole("button", { name: "ขวัญข้าว" }).click();
  await grow(4000);
  const wanted = graphemes("ขวัญข้าว").length;
  check("Thai grows one plant per cluster, marks included", (await livePlants()) === wanted, `${await livePlants()} plants for ${wanted} clusters`);

  const overlap = await page.evaluate(() => {
    const text = document.querySelector('[aria-hidden="true"].whitespace-pre');
    const node = text.firstChild;
    const marker = text.lastElementChild.getBoundingClientRect();
    const baseline = marker.top;
    const fontPx = parseFloat(getComputedStyle(text).fontSize);
    const c = document.createElement("canvas").getContext("2d");
    c.font = `400 ${fontPx}px ${getComputedStyle(text).fontFamily}`;
    const clusters = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(node.textContent)];
    const range = document.createRange();
    const inks = clusters.map(({ segment, index }) => {
      range.setStart(node, index);
      range.setEnd(node, index + segment.length);
      const r = range.getBoundingClientRect();
      const m = c.measureText(segment);
      return { segment, left: r.left, right: r.right, top: baseline - m.actualBoundingBoxAscent, bottom: baseline + m.actualBoundingBoxDescent };
    });
    const front = [...document.querySelectorAll('.hoop-plant[data-layer="front"]:not([data-dying]) path')].filter(
      (p) => !p.classList.contains("hoop-detail"),
    );
    const hits = [];
    for (const p of front) {
      const r = p.getBoundingClientRect();
      for (const ink of inks) {
        const x = Math.min(r.right, ink.right) - Math.max(r.left, ink.left);
        const y = Math.min(r.bottom, ink.bottom) - Math.max(r.top, ink.top);
        if (x > 2 && y > 2) hits.push(`${ink.segment} by ${Math.round(x)}x${Math.round(y)}px`);
      }
    }
    return { hits, front: front.length };
  });
  check(
    "no rose, bud or front leaf overlaps any cluster's ink",
    overlap.hits.length === 0,
    overlap.hits.length ? overlap.hits.slice(0, 4).join(", ") : `${overlap.front} front shapes checked`,
  );
  await page.screenshot({ path: `${OUT}/hoop-thai.png` });
}

// ── 11. phone: no sideways scroll, and the field takes typing ─────────────
{
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference", hasTouch: true, isMobile: true });
  const p = await phone.newPage();
  p.on("pageerror", (e) => errors.push(`phone: ${e.message}`));
  await p.goto(`${BASE}/labs/hoop`, { waitUntil: "load" });
  await p.waitForTimeout(3000);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("no sideways scroll at 390", overflow <= 0, `${overflow}px`);
  const input = p.locator('input[aria-label="ชื่อที่จะปัก"]');
  await input.tap();
  const before = await p.locator(LIVE).count();
  await p.keyboard.press("End");
  await p.keyboard.type("na");
  await p.waitForTimeout(800);
  check("tapping the field and typing grows plants on a phone", (await p.locator(LIVE).count()) === before + 2);
  await p.screenshot({ path: `${OUT}/hoop-phone.png` });
  await phone.close();
}

// ── 12. reduced motion: the garden is simply there ────────────────────────
{
  const still = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const quiet = await still.newPage();
  await quiet.goto(`${BASE}/labs/hoop`, { waitUntil: "load" });
  await quiet.waitForFunction((live) => document.querySelectorAll(live).length > 0, LIVE, { timeout: 8000 });
  await quiet.waitForTimeout(120);
  const pose = await quiet.evaluate(() => {
    const roses = [...document.querySelectorAll(".hoop-rose")].map((r) => {
      const m = new DOMMatrix(getComputedStyle(r).transform);
      return Math.hypot(m.a, m.b);
    });
    const vines = [...document.querySelectorAll(".hoop-vine")].map((v) => parseFloat(getComputedStyle(v).strokeDashoffset));
    const sway = getComputedStyle(document.querySelector(".hoop-plant")).animationDuration;
    return { roses, vines, sway };
  });
  check("every rose is open within a frame or two", pose.roses.every((s) => Math.abs(s - 1) < 0.01), pose.roses.map((s) => s.toFixed(2)).join(","));
  check("every stem is already drawn", pose.vines.every((v) => v === 0), pose.vines.join(","));
  check("the wind stops", parseFloat(pose.sway) < 1, pose.sway);
  await still.close();
}

check("no console or page errors", errors.length === 0, errors.slice(0, 3).join(" | "));

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
