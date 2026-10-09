// /labs/trellis: the page claims that the whole thing fits the screen with the
// controls on top of it and nothing to scroll, that typing grows one plant per
// character in three timed acts, that the vines pass in front of some strokes
// and behind others rather than lying over the text, that a Thai tone mark is
// never covered, that backspace withers exactly one plant, that a palette
// repaints without regrowing, that a pointer shakes the plant it passes and a
// press grows it again, that a copied link grows the same garden elsewhere,
// and that PNG and SVG come out at their stated sizes. All of that is checkable.
//
// Nothing here imports the page's own code. Graphemes are counted with Node's
// Intl.Segmenter; where the ink is comes from drawing the line again on a canvas
// in the page's own font; what is in front of what comes from the pixels of a
// screenshot, read back through a canvas inside the page.
//
// Motion checks read signed values and order, per the verify-motion-traps
// memory: a vine that drew after its rose would still "change".
//
//   SHOOT_URL=http://127.0.0.1:8790 node web/scripts/shoot-trellis.mjs
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:8788";
const ROUTE = `${BASE}/labs/trellis`;
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

const FIELD = "input[aria-label='ข้อความที่จะปลูก']";
const LIVE = '.tr-plant[data-layer="back"]:not([data-dying])';
const grow = (page, ms = 3200) => page.waitForTimeout(ms);

// On Film's Windows machine Chromium is now and then refused a local socket by
// the OS (net::ERR_NETWORK_ACCESS_DENIED), about one request in a thousand,
// while curl gets every one of the same URLs; when the refused one is a script
// chunk the page never hydrates and every check after it fails for nothing.
// Running the network service outside its sandbox took it to none in a
// thousand. It changes how the browser opens sockets, not what the page does.
const browser = await chromium.launch({ args: ["--disable-features=NetworkServiceSandbox"] });
const errors = [];
// Any refusal that still happens is listed apart from the page's own errors,
// since the server never saw the request, rather than hidden or counted.
const REFUSED = "net::ERR_NETWORK_ACCESS_DENIED";
const refused = [];
const watch = (page, tag = "") => {
  page.on("pageerror", (e) => errors.push(`${tag}${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes(REFUSED)) errors.push(`${tag}${m.text().slice(0, 160)}`);
  });
  // The router aborts prefetches it no longer needs; anything else is named.
  page.on("requestfailed", (r) => {
    const reason = r.failure()?.errorText;
    const where = `${tag}${r.url().replace(BASE, "")}`;
    if (reason === REFUSED) refused.push(where);
    else if (reason && reason !== "net::ERR_ABORTED") errors.push(`${reason} ${where}`);
  });
};

/** Navigate, trying again once if the OS refused the socket (see REFUSED). */
async function visit(page, url) {
  try {
    await page.goto(url, { waitUntil: "load" });
  } catch (error) {
    if (!String(error).includes(REFUSED)) throw error;
    refused.push(`navigation to ${url.replace(BASE, "")}, retried`);
    await page.waitForTimeout(500);
    await page.goto(url, { waitUntil: "load" });
  }
}

const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
  acceptDownloads: true,
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await ctx.newPage();
watch(page);
const field = page.locator(FIELD);
const livePlants = () => page.locator(LIVE).count();
const setText = async (value) => {
  await field.fill(value);
  await grow(page);
};

/**
 * Reads the screenshot's pixels inside the page, together with an ink mask of
 * the text drawn again on a canvas in the page's own font, and hands both to
 * `probe`, which runs in the page.
 */
async function withPixels(probe, arg) {
  const shot = (await page.screenshot()).toString("base64");
  return page.evaluate(
    async ({ shot, probe, arg }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${shot}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const c = canvas.getContext("2d");
      c.drawImage(image, 0, 0);
      const pixels = c.getImageData(0, 0, canvas.width, canvas.height).data;
      const pixel = (x, y) => {
        const i = (Math.round(y) * canvas.width + Math.round(x)) * 4;
        return [pixels[i], pixels[i + 1], pixels[i + 2]];
      };

      // Each line of text, drawn again where it stands, gives the ink.
      const inkCanvas = document.createElement("canvas");
      inkCanvas.width = innerWidth;
      inkCanvas.height = innerHeight;
      const ink = inkCanvas.getContext("2d", { willReadFrequently: true });
      const drawLine = (span, text, colour) => {
        const style = getComputedStyle(span);
        ink.font = `400 ${style.fontSize} ${style.fontFamily}`;
        ink.fillStyle = colour;
        const baseline = span.lastElementChild.getBoundingClientRect().top;
        ink.fillText(text, span.getBoundingClientRect().left, baseline);
      };
      const lines = [...document.querySelectorAll("[data-line]")];
      for (const span of lines) drawLine(span, span.textContent, "#000");
      let inkData = ink.getImageData(0, 0, innerWidth, innerHeight).data;
      const inkAt = (x, y) => {
        const xi = Math.round(x);
        const yi = Math.round(y);
        if (xi < 0 || yi < 0 || xi >= innerWidth || yi >= innerHeight) return false;
        return inkData[(yi * innerWidth + xi) * 4 + 3] >= 160;
      };
      const redraw = (transform) => {
        ink.clearRect(0, 0, innerWidth, innerHeight);
        for (const span of lines) drawLine(span, transform(span.textContent), "#000");
        inkData = ink.getImageData(0, 0, innerWidth, innerHeight).data;
      };

      const near = (a, b, tolerance = 40) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < tolerance;
      const rgb = (css) => {
        const probe = document.createElement("div");
        probe.style.color = css;
        document.body.appendChild(probe);
        const value = getComputedStyle(probe).color.match(/\d+/g).slice(0, 3).map(Number);
        probe.remove();
        return value;
      };
      const root = document.querySelector(".tr-root");
      const colours = {
        ink: rgb(getComputedStyle(root).getPropertyValue("--tr-ink")),
        vine: rgb(getComputedStyle(root).getPropertyValue("--tr-vine")),
        ground: rgb(getComputedStyle(root).getPropertyValue("--tr-ground")),
      };

      /** Points along a path every `step` px, in screen coordinates. */
      const along = (path, step = 2) => {
        const total = path.getTotalLength();
        const ctm = path.getScreenCTM();
        const scale = Math.hypot(ctm.a, ctm.b);
        const count = Math.max(2, Math.ceil((total * scale) / step));
        return Array.from({ length: count + 1 }, (_, k) => {
          const p = path.getPointAtLength((total * k) / count).matrixTransform(ctm);
          return { x: p.x, y: p.y };
        });
      };

      return new Function("tools", `return (${probe})(tools)`)({ pixel, inkAt, redraw, near, colours, along, arg });
    },
    { shot, probe: probe.toString(), arg },
  );
}

await visit(page, ROUTE);
await grow(page, 4000);

// ── 1. the page is the screen: nothing scrolls, the controls sit on it ──────
const fitCheck = async (p, label) => {
  const state = await p.evaluate(async () => {
    const before = scrollY;
    window.scrollBy(0, 400);
    document.scrollingElement.scrollTop = 400;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const switcher = document.querySelector("a[aria-label='Exit to gallery']")?.closest(".fixed");
    const switcherTop = switcher ? switcher.firstElementChild.getBoundingClientRect().top : innerHeight;
    const controls = [
      ...document.querySelectorAll(".tr-root button, .tr-root fieldset"),
    ].filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden");
    const outside = controls
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > switcherTop - 4))
      .map(({ el, r }) => `${el.tagName} "${el.textContent.trim().slice(0, 14)}" ${Math.round(r.left)},${Math.round(r.top)}-${Math.round(r.right)},${Math.round(r.bottom)}`);
    const text = document.querySelector("[data-line='0']").getBoundingClientRect();
    return {
      scrollH: document.documentElement.scrollHeight - innerHeight,
      scrollW: document.documentElement.scrollWidth - innerWidth,
      moved: scrollY - before,
      outside,
      count: controls.length,
      textInside: text.left >= 0 && text.right <= innerWidth && text.top >= 0 && text.bottom <= switcherTop,
    };
  });
  check(`${label}: no scroll in either direction, and scrolling moves nothing`, state.scrollH <= 0 && state.scrollW <= 0 && state.moved === 0, `overflow ${state.scrollH}/${state.scrollW}px, moved ${state.moved}`);
  check(`${label}: all ${state.count} controls are on screen and clear of the lab switcher`, state.outside.length === 0, state.outside.join("; "));
  check(`${label}: the text is fully on screen`, state.textInside);
};
await fitCheck(page, "desktop");
await page.screenshot({ path: `${OUT}/trellis-default.png` });
{
  const ready = await page.evaluate((field) => ({
    focused: document.activeElement === document.querySelector(field),
    caret: Boolean(document.querySelector(".tr-caret")),
  }), FIELD);
  check("on a desktop the field has focus on arrival, caret showing, so typing starts at once", ready.focused && ready.caret, JSON.stringify(ready));
}

// ── 2. one plant per character, none for a space ──────────────────────────
{
  const opening = await field.inputValue();
  check("the word it opens on grows one plant per character", (await livePlants()) === graphemes(opening).length, `${await livePlants()} plants for "${opening}"`);
  await setText("Rose bud");
  check("a space grows nothing", (await livePlants()) === graphemes("Rose bud").length, `${await livePlants()} plants for 7 letters`);
}

// ── 3. the stem draws before the rose opens, and the front pieces keep pace ─
{
  await setText("Ro");
  await field.focus();
  let verdict = null;
  let sync = { pieces: 0, early: [] };
  for (const letter of "lbhdkft") {
    await page.evaluate((live) => {
      window.__trellis = { samples: [], early: [], pieces: 0 };
      const start = performance.now();
      const before = document.querySelectorAll(live).length;
      let pieceStarts = null;
      const tick = () => {
        const backs = document.querySelectorAll(live);
        if (backs.length > before) {
          const back = backs[backs.length - 1];
          const front = [...document.querySelectorAll('.tr-plant[data-layer="front"]:not([data-dying])')].find(
            (f) => f.style.left === back.style.left && f.style.top === back.style.top,
          );
          const vines = [...back.querySelectorAll(".tr-vine")];
          const rose = front?.querySelector(".tr-rose");
          let scale = null;
          if (rose) {
            const m = new DOMMatrix(getComputedStyle(rose).transform);
            scale = Math.hypot(m.a, m.b);
          }
          const off = (el) => parseFloat(getComputedStyle(el).strokeDashoffset);
          window.__trellis.samples.push({ t: performance.now() - start, off: off(vines[0]), scale });

          // Where along its vine each crossing piece begins, found once by
          // walking the vine to the piece's first point.
          const pieces = front ? [...front.querySelectorAll(".tr-front")] : [];
          if (!pieceStarts && pieces.length) {
            pieceStarts = pieces.map((piece) => {
              const p0 = piece.getPointAtLength(0);
              let best = { vine: null, at: 0, gap: Infinity };
              for (const vine of vines) {
                const total = vine.getTotalLength();
                for (let k = 0; k <= 400; k++) {
                  const q = vine.getPointAtLength((total * k) / 400);
                  const gap = Math.hypot(q.x - p0.x, q.y - p0.y);
                  if (gap < best.gap) best = { vine, at: k / 400, gap };
                }
              }
              return best;
            });
            window.__trellis.pieces = pieces.length;
          }
          if (pieceStarts) {
            pieces.forEach((piece, i) => {
              const { vine, at } = pieceStarts[i];
              if (!vine) return;
              const drawn = 1 - off(piece);
              const tip = 1 - off(vine);
              // A piece that has started drawing before the vine's tip reached it.
              if (drawn > 0.05 && tip < at - 0.03) window.__trellis.early.push(`${drawn.toFixed(2)} drawn, tip ${tip.toFixed(2)} < ${at.toFixed(2)}`);
            });
          }
        }
        if (performance.now() - start < 2800) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, LIVE);
    await page.keyboard.press("End");
    await page.keyboard.type(letter);
    await grow(page, 3000);
    const run = await page.evaluate(() => window.__trellis);
    sync = { pieces: sync.pieces + run.pieces, early: [...sync.early, ...run.early] };
    if (!verdict && run.samples.length && run.samples[0].scale !== null) verdict = run.samples;
    if (verdict && sync.pieces >= 3) break;
  }
  if (!verdict) {
    check("a rose grew somewhere in seven letters", false, "no new plant had a rose");
  } else {
    const first = verdict[0];
    const opening = verdict.find((s) => s.scale > 0.05);
    check("the stem starts undrawn and the rose closed", first.off > 0.8 && first.scale < 0.05, `first frame: dashoffset ${first.off.toFixed(2)}, rose scale ${first.scale.toFixed(2)}`);
    check(
      "a rose only opens once its stem is well under way",
      opening !== undefined && opening.off <= 0.6,
      opening ? `opened at ${Math.round(opening.t)}ms with the stem ${Math.round((1 - opening.off) * 100)}% drawn` : "never opened",
    );
    const last = verdict[verdict.length - 1];
    check("both finish: stem drawn, rose fully open", last.off < 0.01 && Math.abs(last.scale - 1) < 0.02, `end: dashoffset ${last.off}, scale ${last.scale.toFixed(3)}`);
  }
  check(
    "a vine crossing in front of a letter never draws ahead of the vine itself",
    sync.pieces > 0 && sync.early.length === 0,
    sync.early.length ? sync.early.slice(0, 3).join("; ") : `${sync.pieces} crossings followed`,
  );
}

// ── 4. vines go in front of some strokes and behind others ─────────────────
// Read off the pixels, against the ink of the text drawn again on a canvas:
// where a front piece crosses ink the screen shows the vine; where a vine
// crosses ink with no front piece, leaf or rose over it, the screen shows the
// letter, so the vine is behind it.
{
  await setText("Bloom");
  const weave = await withPixels(({ pixel, inkAt, near, colours, along }) => {
    const fronts = [...document.querySelectorAll('.tr-plant[data-layer="front"]:not([data-dying]) .tr-front')];
    const frontPoints = fronts.flatMap((p) => along(p));
    const covers = [...document.querySelectorAll('.tr-plant[data-layer="front"]:not([data-dying]) :is(.tr-leaf, .tr-rose, .tr-bud)')].map((el) =>
      el.getBoundingClientRect(),
    );
    const inside = (p) => covers.some((r) => p.x >= r.left - 3 && p.x <= r.right + 3 && p.y >= r.top - 3 && p.y <= r.bottom + 3);

    let frontOverInk = 0;
    let frontShowsVine = 0;
    for (const piece of fronts) {
      const points = along(piece).filter((p) => inkAt(p.x, p.y) && !inside(p));
      if (!points.length) continue;
      frontOverInk++;
      const mid = points[Math.floor(points.length / 2)];
      if (near(pixel(mid.x, mid.y), colours.vine)) frontShowsVine++;
    }

    let hidden = 0;
    let hiddenShowsInk = 0;
    for (const vine of document.querySelectorAll('.tr-plant[data-layer="back"]:not([data-dying]) .tr-vine')) {
      for (const p of along(vine, 3)) {
        if (!inkAt(p.x, p.y) || !inkAt(p.x + 4, p.y) || !inkAt(p.x - 4, p.y) || inside(p)) continue;
        if (frontPoints.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 9)) continue;
        hidden++;
        if (near(pixel(p.x, p.y), colours.ink)) hiddenShowsInk++;
      }
    }
    return { fronts: fronts.length, frontOverInk, frontShowsVine, hidden, hiddenShowsInk };
  });
  check(
    "vines cross letters in front: each such stretch shows the vine over the ink",
    weave.frontOverInk >= 3 && weave.frontShowsVine / weave.frontOverInk >= 0.9,
    `${weave.frontShowsVine}/${weave.frontOverInk} crossings over ink show the vine (${weave.fronts} pieces)`,
  );
  check(
    "and behind: where a vine meets ink with nothing in front, the letter shows",
    weave.hidden >= 20 && weave.hiddenShowsInk / weave.hidden >= 0.95,
    `${weave.hiddenShowsInk}/${weave.hidden} hidden points show the letter`,
  );
  await page.screenshot({ path: `${OUT}/trellis-bloom.png` });
}

// ── 5. Thai: one plant per cluster, and a tone mark is never covered ────────
// The proof covers everything at once: a solid block is laid over the whole
// line, in front of every plant, and the marks must still come through it.
{
  const thai = "ข้าวหอมมะลิ";
  await setText(thai);
  check("Thai grows one plant per cluster, marks included", (await livePlants()) === graphemes(thai).length, `${await livePlants()} plants for ${graphemes(thai).length} clusters`);
  const MARKS = /[ัิ-ฺ็-๎]/g;
  const covered = async (withBlock) => {
    if (withBlock) {
      await page.evaluate(() => {
        const host = document.querySelector("[data-line='0']").parentElement;
        const block = document.createElement("div");
        block.id = "__block";
        block.style.cssText = "position:absolute;left:-1em;top:-1.4em;width:30em;height:2.2em;background:rgb(255,0,200)";
        const firstMarks = host.querySelector("[data-marks]");
        host.insertBefore(block, firstMarks);
      });
    }
    const verdict = await withPixels(
      ({ pixel, inkAt, redraw, near, colours, arg }) => {
        // Mark pixels: ink with the marks, none without them, and ink all
        // round, so an antialiased edge is not mistaken for a covered mark.
        const withMarks = [];
        for (let y = 0; y < innerHeight; y++) for (let x = 0; x < innerWidth; x++) if (inkAt(x, y)) withMarks.push([x, y]);
        const full = new Set(withMarks.map(([x, y]) => y * innerWidth + x));
        redraw((text) => text.replace(new RegExp(arg, "g"), ""));
        const marks = withMarks.filter(([x, y]) => {
          if (inkAt(x, y)) return false;
          return [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => full.has((y + dy) * innerWidth + x + dx));
        });
        const shown = marks.filter(([x, y]) => near(pixel(x, y), colours.ink, 60)).length;
        return { marks: marks.length, shown };
      },
      MARKS.source,
    );
    if (withBlock) await page.evaluate(() => document.getElementById("__block")?.remove());
    return verdict;
  };
  const plain = await covered(false);
  const blocked = await covered(true);
  check("every tone mark and vowel above or below shows in the ink colour", plain.marks > 50 && plain.shown / plain.marks >= 0.98, `${plain.shown}/${plain.marks} mark pixels`);
  check("even under a solid block laid over the whole line", blocked.marks > 50 && blocked.shown / blocked.marks >= 0.98, `${blocked.shown}/${blocked.marks} mark pixels`);
  await page.screenshot({ path: `${OUT}/trellis-thai.png` });
}

// ── 6. backspace withers that character's plant, and only that one ─────────
{
  await setText("Mali");
  const before = await livePlants();
  await page.evaluate((live) => {
    const plants = document.querySelectorAll(live);
    window.__doomed = plants[plants.length - 1].style.left;
    window.__kept = [...plants].slice(0, -1);
  }, LIVE);
  await field.focus();
  await page.keyboard.press("End");
  await page.keyboard.press("Backspace");
  // Timed from the moment the withering plant is on the page, not from the key,
  // so a busy machine cannot make it look as if nothing was fading.
  await page.waitForSelector('.tr-plant[data-layer="front"][data-dying]', { state: "attached", timeout: 2000 });
  await page.waitForTimeout(220);
  const midway = await page.evaluate(() => {
    const dying = [...document.querySelectorAll('.tr-plant[data-layer="back"][data-dying]')];
    const ghost = dying.find((n) => n.style.left === window.__doomed);
    const leaf = document.querySelector('.tr-plant[data-layer="front"][data-dying] .tr-leaf');
    return { found: Boolean(ghost), count: dying.length, opacity: leaf ? parseFloat(getComputedStyle(leaf).opacity) : null };
  });
  check("one plant withers, where the deleted character stood", midway.found && midway.count === 1, `${midway.count} withering`);
  check("and is fading, not just gone", midway.opacity === null || (midway.opacity < 0.95 && midway.opacity >= 0), `leaf opacity ${midway.opacity}`);
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({
    gone: document.querySelectorAll(".tr-plant[data-dying]").length === 0,
    kept: window.__kept.every((n) => n.isConnected && !n.hasAttribute("data-dying")),
  }));
  check("it leaves the page once withered", after.gone);
  check("every other plant is untouched", after.kept);
  check("the count drops by exactly one", (await livePlants()) === before - 1, `${before} -> ${await livePlants()}`);

  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const cleared = await page.evaluate(() => document.querySelectorAll('.tr-plant[data-layer="back"][data-dying]').length);
  check("Enter clears the garden, withering every plant", (await field.inputValue()) === "" && cleared === before - 1, `${cleared} withering, text "${await field.inputValue()}"`);
}

// ── 7. a palette repaints without regrowing ───────────────────────────────
{
  await setText("Mali");
  await page.evaluate(() => {
    window.__nodes = [...document.querySelectorAll(".tr-plant")];
  });
  await page.locator("label:has(input[name='trellis-palette'][value='banana-leaf'])").click();
  await page.waitForTimeout(800);
  const state = await page.evaluate(() => {
    const rose = document.querySelector(".tr-head, .tr-bud");
    const vine = document.querySelector(".tr-vine");
    return {
      same: window.__nodes.length > 0 && window.__nodes.every((n) => n.isConnected),
      count: document.querySelectorAll(".tr-plant").length === window.__nodes.length,
      rose: rose ? getComputedStyle(rose).fill : null,
      ground: getComputedStyle(document.querySelector(".tr-root")).backgroundColor,
      vine: vine ? parseFloat(getComputedStyle(vine).strokeDashoffset) : null,
      checked: document.querySelector("input[name='trellis-palette']:checked")?.value,
    };
  });
  check("the same plants are still on the page", state.same && state.count);
  check("roses and the ground take the new palette", state.rose === "rgb(240, 143, 176)" && state.ground === "rgb(16, 35, 26)", `${state.rose} on ${state.ground}`);
  check("nothing is drawing again", state.vine === 0, `vine dashoffset ${state.vine}`);
  check("the chosen swatch is the checked radio", state.checked === "banana-leaf", state.checked);
  await page.screenshot({ path: `${OUT}/trellis-banana-leaf.png` });

  // With the swatch focused, a letter still goes into the garden, and so does
  // Backspace; Space stays with the radio.
  const plantsBefore = await livePlants();
  await page.keyboard.type("s");
  await page.waitForTimeout(300);
  const typed = { text: await field.inputValue(), plants: await livePlants() };
  await page.locator("label:has(input[name='trellis-palette'][value='banana-leaf'])").click();
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);
  check(
    "a key pressed while a swatch has focus still types into the garden, Backspace too",
    typed.text === "Malis" && typed.plants === plantsBefore + 1 && (await field.inputValue()) === "Mali",
    `"${typed.text}" with ${typed.plants} plants, then "${await field.inputValue()}"`,
  );
  await page.locator("label:has(input[name='trellis-palette'][value='night'])").click();
}

// ── 8. a pointer shakes the plant it passes; a press grows it again ────────
{
  await setText("Mali");
  const centre = async (i) =>
    page.evaluate((i) => {
      const span = document.querySelector("[data-line='0']");
      const range = document.createRange();
      const segments = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(span.firstChild.textContent)];
      range.setStart(span.firstChild, segments[i].index);
      range.setEnd(span.firstChild, segments[i].index + segments[i].segment.length);
      const r = range.getBoundingClientRect();
      const baseline = span.lastElementChild.getBoundingClientRect().top;
      return { x: r.left + r.width / 2, y: baseline - (baseline - r.top) * 0.3 };
    }, i);
  const target = await centre(1);
  // In from straight above, through empty space, so no other letter is crossed.
  await page.mouse.move(target.x, 90);
  await page.mouse.move(target.x, target.y, { steps: 8 });
  await page.waitForTimeout(120);
  const shaken = await page.evaluate((live) => {
    const plants = [...document.querySelectorAll(live)];
    return plants.map((p) => p.dataset.rustle ?? null);
  }, LIVE);
  check("the plant of the letter under the pointer shakes, and only that one", shaken[1] !== null && shaken.filter((v) => v !== null).length === 1, JSON.stringify(shaken));

  await field.focus();
  const before = await page.evaluate((live) => {
    const plant = document.querySelectorAll(live)[1];
    return { left: plant.style.left, d: plant.querySelector(".tr-vine").getAttribute("d") };
  }, LIVE);
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(300);
  const after = await page.evaluate(
    ({ live, left }) => {
      const ghost = [...document.querySelectorAll('.tr-plant[data-layer="back"][data-dying]')].find((n) => n.style.left === left);
      const fresh = [...document.querySelectorAll(live)].find((n) => n.style.left === left);
      return { ghost: Boolean(ghost), d: fresh?.querySelector(".tr-vine")?.getAttribute("d") ?? null, count: document.querySelectorAll(live).length };
    },
    { live: LIVE, left: before.left },
  );
  check("pressing a letter withers its plant and grows a new one in its place", after.ghost && after.d !== null && after.d !== before.d && after.count === 4, `ghost ${after.ghost}, count ${after.count}`);
  check("the text is untouched by it", (await field.inputValue()) === "Mali");
}

// ── 9. a copied link grows the same garden on another page ────────────────
{
  await setText("in full bloom");
  await page.locator("label:has(input[name='trellis-mode'][value='poster'])").click();
  await page.locator("label:has(input[name='trellis-palette'][value='lotus'])").click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "คัดลอกลิงก์" }).click();
  await page.waitForTimeout(300);
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const shape = () =>
    [...document.querySelectorAll('.tr-plant[data-layer="back"]:not([data-dying])')].map((p) =>
      [...p.querySelectorAll(".tr-vine")].map((v) => v.getAttribute("d")).join("|"),
    );
  const here = await page.evaluate(shape);
  const other = await ctx.newPage();
  watch(other, "link: ");
  await visit(other, link);
  await grow(other, 4500);
  const there = await other.evaluate(shape);
  const state = await other.evaluate(() => ({
    text: document.querySelector("input[aria-label='ข้อความที่จะปลูก']").value,
    palette: document.querySelector("input[name='trellis-palette']:checked")?.value,
    mode: document.querySelector("input[name='trellis-mode']:checked")?.value,
  }));
  check("the link carries the text, palette and mode", state.text === "in full bloom" && state.palette === "lotus" && state.mode === "poster", JSON.stringify(state));
  check("and every plant grows back exactly", here.length === 11 && there.length === here.length && here.every((d, i) => d === there[i]), `${there.length} plants, ${here.filter((d, i) => d === there[i]).length} identical`);
  await other.screenshot({ path: `${OUT}/trellis-shared-poster.png` });
  await other.close();
}

// ── 10. Poster stacks the words inside a 4:5 sheet ────────────────────────
{
  const poster = await page.evaluate(() => {
    const frame = document.querySelector("[data-poster-frame]")?.getBoundingClientRect();
    const lines = [...document.querySelectorAll("[data-line]")].map((l) => ({ text: l.textContent, r: l.getBoundingClientRect() }));
    return {
      frame: frame ? { w: frame.width, h: frame.height, l: frame.left, t: frame.top, r: frame.right, b: frame.bottom } : null,
      lines: lines.map((l) => ({ text: l.text, top: l.r.top, inside: frame ? l.r.left >= frame.left && l.r.right <= frame.right && l.r.top >= frame.top && l.r.bottom <= frame.bottom : false })),
    };
  });
  check("the sheet is 4:5", poster.frame && Math.abs(poster.frame.w / poster.frame.h - 0.8) < 0.01, poster.frame && `${Math.round(poster.frame.w)}x${Math.round(poster.frame.h)}`);
  check(
    "one word per line, top to bottom, all inside the sheet",
    poster.lines.map((l) => l.text).join("|") === "in|full|bloom" && poster.lines.every((l, i) => l.inside && (i === 0 || l.top > poster.lines[i - 1].top)),
    poster.lines.map((l) => l.text).join("|"),
  );
}

// ── 11. PNG and SVG come out at their stated sizes, with the text in them ──
{
  const save = async (kind) => {
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.locator(`button[aria-label='บันทึกเป็นไฟล์ ${kind}']:visible`).click()]);
    const path = `${OUT}/trellis-export.${kind.toLowerCase()}`;
    await download.saveAs(path);
    return { name: download.suggestedFilename(), data: readFileSync(path) };
  };
  const png = await save("PNG");
  const width = png.data.readUInt32BE(16);
  const height = png.data.readUInt32BE(20);
  check("Poster PNG is 2160x2700", width === 2160 && height === 2700 && png.data.length > 100000, `${png.name}: ${width}x${height}, ${Math.round(png.data.length / 1024)} KB`);
  const svg = (await save("SVG")).data.toString("utf8");
  check(
    "the SVG carries the words, the fonts and every plant",
    svg.includes(">in</text>") && svg.includes(">bloom</text>") && svg.includes("@font-face") && (svg.match(/<path /g) ?? []).length > 100,
    `${Math.round(svg.length / 1024)} KB, ${(svg.match(/<path /g) ?? []).length} paths`,
  );

  await page.locator("label:has(input[name='trellis-mode'][value='type'])").click();
  await page.waitForTimeout(400);
  const card = await save("PNG");
  check("Type PNG is a 3840x2160 title card", card.data.readUInt32BE(16) === 3840 && card.data.readUInt32BE(20) === 2160, `${card.data.readUInt32BE(16)}x${card.data.readUInt32BE(20)}`);
}

// ── 12. phone: the same screen, typed into with a tap ─────────────────────
{
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference", hasTouch: true, isMobile: true });
  const p = await phone.newPage();
  watch(p, "phone: ");
  await visit(p, ROUTE);
  await p.waitForTimeout(3500);
  const state = await p.evaluate(() => ({
    overflow: Math.max(document.documentElement.scrollWidth - innerWidth, document.documentElement.scrollHeight - innerHeight),
    hidden: [...document.querySelectorAll(".tr-root button")].filter((b) => b.getClientRects().length && (b.getBoundingClientRect().right > innerWidth || b.getBoundingClientRect().left < 0)).length,
  }));
  check("phone: nothing scrolls and no control is cut off", state.overflow <= 0 && state.hidden === 0, `overflow ${state.overflow}, ${state.hidden} cut off`);
  check("phone: the keyboard waits for a tap instead of opening on arrival", !(await p.evaluate((field) => document.activeElement === document.querySelector(field), FIELD)));
  await fitCheck(p, "phone");
  const input = p.locator(FIELD);
  await input.tap();
  const before = await p.locator(LIVE).count();
  await p.keyboard.type("ad");
  await p.waitForTimeout(900);
  check("phone: a tap and typing grow plants", (await p.locator(LIVE).count()) === before + 2);
  await p.screenshot({ path: `${OUT}/trellis-phone.png` });
  await phone.close();
}

// ── 13. a face that never arrives does not stop the garden ────────────────
// Found the hard way: a refused font request once left the page bare, because
// the wait for the faces never settled. With every font file failing, the text
// falls back and the plants still grow.
{
  const offline = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  await offline.route(/\.woff2(\?|$)/, (route) => route.abort("failed"));
  const p = await offline.newPage();
  const uncaught = [];
  p.on("pageerror", (e) => uncaught.push(e.message));
  await visit(p, ROUTE);
  const grew = await p
    .waitForFunction((live) => document.querySelectorAll(live).length === 5, LIVE, { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  check("with every font file failing, the garden still grows in the fallback face", grew && uncaught.length === 0, `${await p.locator(LIVE).count()} plants, ${uncaught.length} uncaught`);
  await offline.close();
}

// ── 14. reduced motion: the garden is simply there ────────────────────────
{
  const still = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const quiet = await still.newPage();
  watch(quiet, "reduced: ");
  await visit(quiet, ROUTE);
  await quiet.waitForFunction((live) => document.querySelectorAll(live).length > 0, LIVE, { timeout: 8000 }).catch(() => undefined);
  // Poll rather than sleep: the claim is that nothing animates, so everything
  // should be in its final pose within a few frames of appearing.
  const settled = await quiet
    .waitForFunction(
      () =>
        [...document.querySelectorAll(".tr-rose")].every((el) => {
          const m = new DOMMatrix(getComputedStyle(el).transform);
          return Math.abs(Math.hypot(m.a, m.b) - 1) < 0.01;
        }),
      null,
      { timeout: 500, polling: "raf" },
    )
    .then(() => true)
    .catch(() => false);
  const pose = await quiet.evaluate(() => {
    const scale = (el) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return Math.hypot(m.a, m.b);
    };
    return {
      roses: [...document.querySelectorAll(".tr-rose")].map(scale),
      strokes: [...document.querySelectorAll(".tr-vine, .tr-front")].map((v) => parseFloat(getComputedStyle(v).strokeDashoffset)),
      sway: getComputedStyle(document.querySelector(".tr-plant")).animationDuration,
    };
  });
  check("every rose is open within half a second of appearing", settled && pose.roses.length > 0 && pose.roses.every((s) => Math.abs(s - 1) < 0.01), pose.roses.map((s) => s.toFixed(2)).join(","));
  check("every stem and crossing is already drawn", pose.strokes.every((v) => v === 0), `${pose.strokes.filter((v) => v !== 0).length} of ${pose.strokes.length} not drawn`);
  check("the wind stops", parseFloat(pose.sway) < 1, pose.sway);
  await still.close();
}

check("no console or page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
if (refused.length) console.log(`note ${refused.length} request(s) refused by the OS before reaching the server, not counted above: ${refused.slice(0, 4).join(", ")}`);

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
