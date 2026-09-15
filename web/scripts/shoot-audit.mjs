// Path B audit sweep: every public route at three widths. Reports what breaks
// silently — console errors, horizontal overflow, sub-AA contrast, tap targets,
// and CTA labels that wrap.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:3001";
const OUT = process.env.AUDIT_OUT || "screenshots";
mkdirSync(OUT, { recursive: true });

const ROUTES = process.env.ROUTES?.split(",") ?? [
  "/",
  "/services",
  "/pricing",
  "/labs",
  "/work/aurum",
];

const VIEWPORTS = [
  ["phone", { width: 390, height: 844 }],
  ["tablet", { width: 1024, height: 768 }],
  ["desktop", { width: 1440, height: 900 }],
];

const revealAll = async (page) => {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
};

// Computed colours resolve to oklab(), which only canvas can turn back into RGB.
const probe = (page) =>
  page.evaluate(() => {
    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    // clearRect first, every time. Without it the canvas still holds the last
    // colour drawn, so any colour carrying alpha composited onto whatever
    // element happened to be measured before it, and the reading depended on
    // document order.
    const toRgba = (color) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const toRgb = (color) => toRgba(color).slice(0, 3);
    const lum = ([r, g, b]) =>
      [r, g, b]
        .map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    // Walk up to the first opaque background, then composite every translucent
    // sheet passed on the way back down onto it.
    //
    // Skipping those sheets was wrong, and quietly: a glass panel at 0.64 alpha
    // is most of what its text sits on, so ignoring it reported dark text on a
    // pale sheet over a dark page as 1:1 and buried real findings under the
    // noise. Still blind to images and canvas, which is what
    // shoot-contrast.mjs exists to measure.
    const opaqueBg = (el) => {
      const sheets = [];
      let base = null;
      for (let n = el; n; n = n.parentElement) {
        const rgba = getComputedStyle(n).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
        if (rgba.length < 4 || rgba[3] > 0.9) {
          base = toRgb(getComputedStyle(n).backgroundColor);
          break;
        }
        if (rgba[3] > 0.02) sheets.push(rgba);
      }
      if (!base) base = toRgb(getComputedStyle(document.body).backgroundColor);
      for (let i = sheets.length - 1; i >= 0; i -= 1) {
        const [r, g, b, a] = sheets[i];
        base = [r, g, b].map((c, k) => a * c + (1 - a) * base[k]);
      }
      return base;
    };
    const label = (el) => (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40);

    const contrast = [];
    // Text this probe cannot judge, kept apart from text it judged and failed.
    // Mixing them buried real findings: /labs/vision reported five failures and
    // two of them were only the probe being blind.
    const unmeasurable = [];

    for (const el of document.querySelectorAll("body *")) {
      if (!el.textContent?.trim() || el.children.length) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || !el.getClientRects().length) continue;

      // Visually hidden text. Tailwind's sr-only leaves a 1x1 box that is still
      // "visible" to getComputedStyle, so it was being measured and reported
      // like anything else. It is read aloud, never looked at. Same floor
      // shoot-contrast uses.
      const box = el.getBoundingClientRect();
      if (box.width < 4 || box.height < 4) continue;

      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      const plate = opaqueBg(el);

      // Text painted through the element's background, the bg-clip-text
      // gradient trick. `color` is transparent, so there is nothing to measure
      // against: the ink is whatever the gradient puts there.
      const [cr, cg, cb, ca] = toRgba(cs.color);
      if (ca === 0) {
        unmeasurable.push({ text: label(el), size, why: "color is transparent, painted by a gradient" });
        continue;
      }

      // Anything still faded in is skipped rather than measured, the same rule
      // shoot-contrast uses: a scroll reveal that has not fired sits at opacity
      // 0, and compositing that against its own plate returns 1:1 for every
      // element below the fold. Not a finding, just a thing not on screen yet.
      let shown = 1;
      for (let n = el; n; n = n.parentElement) shown *= Number(getComputedStyle(n).opacity);
      if (shown < 0.95) continue;

      // Semi-transparent ink lands on the plate rather than replacing it.
      const ink = ca >= 0.999
        ? [cr, cg, cb]
        : [cr, cg, cb].map((c, i) => ca * c + (1 - ca) * plate[i]);

      const r = ratio(ink, plate);

      // Exactly 1.00 means the ink and the plate resolved to the same colour,
      // which nobody writes on purpose. It means the real plate is something
      // this probe cannot see: a sibling laid over the text, a canvas, an
      // image. shoot-contrast.mjs reads the painted pixels instead.
      if (r < 1.005) {
        unmeasurable.push({ text: label(el), size, why: "plate matches the ink, so the real backdrop is not in the DOM" });
        continue;
      }

      if (r < (large ? 3 : 4.5)) contrast.push({ text: label(el), size, ratio: +r.toFixed(2) });
    }

    // Interactive targets: size floor and labels that wrap onto two lines.
    const targets = [];
    const wrapped = [];
    for (const el of document.querySelectorAll("a, button, [role='switch'], input, select, textarea")) {
      const rects = el.getClientRects();
      if (!rects.length) continue;
      const { width, height } = rects[0];
      // A skip link is 1x1 until it takes focus, which is the correct shape for
      // one. Anything this small is hidden on purpose, not an undersized target.
      if (width < 4 || height < 4) continue;
      if (height > 0 && height < 24 && el.closest("nav, header, footer, main")) {
        targets.push({ tag: el.tagName, text: label(el), w: +width.toFixed(0), h: +height.toFixed(0) });
      }
      if (rects.length > 1 && el.matches("a[class*='bg-'], button[class*='bg-'], a[class*='border'], button[class*='border']")) {
        wrapped.push({ text: label(el), lines: rects.length });
      }
    }

    // An accessible name is required on every control. A form control never has
    // text of its own, so reading only textContent reported every labelled
    // input on the contact form as unnamed. Follow the same order the accname
    // spec does for the sources a page like this actually uses.
    const accessibleName = (el) => {
      const byIds = (el.getAttribute("aria-labelledby") || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent?.trim() || "")
        .join(" ");
      if (byIds.trim()) return byIds.trim();
      if (el.getAttribute("aria-label")?.trim()) return el.getAttribute("aria-label").trim();

      if (el.matches("input, select, textarea")) {
        // Both associations count: `for=` pointing at the id, and a `<label>`
        // the control is nested inside.
        const explicit = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
        const implicit = el.closest("label");
        const labelText = (explicit || implicit)?.textContent?.trim();
        if (labelText) return labelText;
        if (el.getAttribute("title")?.trim()) return el.getAttribute("title").trim();
        // A placeholder is a fallback name, not a label, but it does leave the
        // control named. Anything without one is genuinely anonymous.
        return el.getAttribute("placeholder")?.trim() || "";
      }

      return el.textContent?.trim() || el.getAttribute("title")?.trim() || "";
    };

    const unnamed = [...document.querySelectorAll("a, button, input, select, textarea")]
      .filter((el) => el.getClientRects().length)
      .filter((el) => !accessibleName(el))
      .map((el) => el.tagName + (el.className ? `.${String(el.className).slice(0, 40)}` : ""));

    const images = [...document.querySelectorAll("img")]
      .filter((img) => img.alt === null || img.alt === undefined)
      .map((img) => img.currentSrc || img.src);

    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      contrast,
      unmeasurable,
      targets,
      wrapped,
      unnamed,
      imagesMissingAlt: images,
      headings: [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => `${h.tagName} ${label(h)}`),
    };
  });

const browser = await chromium.launch();
const report = {};

for (const route of ROUTES) {
  for (const [device, viewport] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport, locale: "en-US" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text().slice(0, 160)}`));
    // A cancelled request is not a failed one. The router starts a full-route
    // fetch alongside its segment prefetches and aborts whichever it no longer
    // needs, so ERR_ABORTED is the normal path and reporting it buried the
    // 404s that actually mattered.
    page.on("requestfailed", (r) => {
      const reason = r.failure()?.errorText ?? "";
      if (reason === "net::ERR_ABORTED") return;
      errors.push(`requestfailed: ${r.url().slice(0, 120)} (${reason})`);
    });

    const res = await page.goto(BASE + route, { waitUntil: "load" });
    await page.waitForTimeout(800);
    await revealAll(page);

    const slug = route === "/" ? "home" : route.replace(/\//g, "-").replace(/^-/, "");
    await page.screenshot({ path: `${OUT}/${slug}-${device}.png`, fullPage: true });

    const result = await probe(page);
    report[`${route} @${device}`] = { status: res.status(), errors, ...result };
    await ctx.close();
  }
}

await browser.close();

// Only print what needs a decision.
for (const [key, r] of Object.entries(report)) {
  const issues = [];
  if (r.status !== 200) issues.push(`status ${r.status}`);
  if (r.errors.length) issues.push(`errors ${JSON.stringify(r.errors.slice(0, 4))}`);
  if (r.overflow > 0) issues.push(`overflow ${r.overflow}px`);
  if (r.contrast.length) issues.push(`contrast ${JSON.stringify(r.contrast)}`);
  if (r.unmeasurable.length)
    issues.push(`not measurable here, use shoot-contrast ${JSON.stringify(r.unmeasurable)}`);
  if (r.targets.length) issues.push(`small targets ${JSON.stringify(r.targets)}`);
  if (r.wrapped.length) issues.push(`wrapped CTA ${JSON.stringify(r.wrapped)}`);
  if (r.unnamed.length) issues.push(`unnamed controls ${JSON.stringify(r.unnamed)}`);
  if (r.imagesMissingAlt.length) issues.push(`img no alt ${JSON.stringify(r.imagesMissingAlt)}`);
  console.log(issues.length ? `\n=== ${key}\n  ${issues.join("\n  ")}` : `ok  ${key}`);
}
console.log(`\nheadings @desktop /: ${JSON.stringify(report["/ @desktop"]?.headings)}`);
