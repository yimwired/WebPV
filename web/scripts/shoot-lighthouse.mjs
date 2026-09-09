// Measure the site the way the site says it measures a client's.
//
//   node scripts/shoot-lighthouse.mjs                    # every main route, mobile
//   ROUTES=/,/pricing node scripts/shoot-lighthouse.mjs  # just these
//   PRESET=desktop node scripts/shoot-lighthouse.mjs     # desktop throttling
//
// /pricing sells "speed and accessibility measured, not assumed" and until this
// existed nothing in the repo measured either. The other verify scripts check
// what a page looks like - overflow, contrast, tap targets - and none of them
// could answer the first question a client asks back: what does your own site
// score?
//
// Writes screenshots/lighthouse/<route>.json (the full report, for digging) and
// prints the four category scores plus the three metrics that actually decide
// them. Needs the built site served, as the other scripts do:
//   npx wrangler dev -c wrangler.jsonc --port 3000   (from the repo root)
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const OUT = fileURLToPath(new URL("../screenshots/lighthouse", import.meta.url));

const ROUTES = process.env.ROUTES?.split(",") ?? [
  "/",
  "/services",
  "/pricing",
  "/labs",
  "/work/aurum",
  "/labs/counter",
];

/**
 * Mobile by default, and deliberately.
 *
 * Lighthouse's mobile preset throttles to a mid-tier phone on slow 4G, which is
 * the machine most visitors arrive on and the one a WebGL demo has to survive.
 * A desktop run flatters every number and would make the claim on /pricing an
 * easier one to keep than it should be.
 */
const PRESET = process.env.PRESET === "desktop" ? "desktop" : "mobile";

const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

/** Metrics worth printing: the ones that move the performance score. */
const METRICS = [
  ["largest-contentful-paint", "LCP"],
  ["cumulative-layout-shift", "CLS"],
  ["total-blocking-time", "TBT"],
];

const pad = (s, n) => String(s).padEnd(n);
const slug = (route) => (route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-"));

await mkdir(OUT, { recursive: true });

// One browser for every route: a cold launch per page costs more than it buys,
// and Lighthouse resets its own state between runs anyway.
const chrome = await launch({ chromeFlags: ["--headless=new", "--no-sandbox"] });

const rows = [];

try {
  for (const route of ROUTES) {
    const url = BASE + route;
    const result = await lighthouse(
      url,
      { port: chrome.port, output: "json", logLevel: "error" },
      PRESET === "desktop"
        ? { extends: "lighthouse:default", settings: { formFactor: "desktop", screenEmulation: { disabled: true } } }
        : undefined,
    );

    if (!result?.lhr) {
      console.error(`${route}: lighthouse returned nothing`);
      continue;
    }

    const { lhr } = result;
    await writeFile(join(OUT, `${slug(route)}.json`), JSON.stringify(lhr, null, 2), "utf8");

    const scores = Object.fromEntries(
      CATEGORIES.map((c) => [c, Math.round((lhr.categories[c]?.score ?? 0) * 100)]),
    );
    const metrics = Object.fromEntries(
      METRICS.map(([id, label]) => [label, lhr.audits[id]?.displayValue ?? "-"]),
    );

    rows.push({ route, ...scores, ...metrics });
  }
} finally {
  await chrome.kill();
}

// ── report ───────────────────────────────────────────────────────────────

console.log(`\n${PRESET} · ${BASE}\n`);
console.log(
  pad("route", 16),
  pad("perf", 6),
  pad("a11y", 6),
  pad("best", 6),
  pad("seo", 6),
  pad("LCP", 10),
  pad("CLS", 8),
  "TBT",
);

for (const r of rows) {
  console.log(
    pad(r.route, 16),
    pad(r.performance, 6),
    pad(r.accessibility, 6),
    pad(r["best-practices"], 6),
    pad(r.seo, 6),
    pad(r.LCP, 10),
    pad(r.CLS, 8),
    r.TBT,
  );
}

// The number worth quoting is the worst one, not the average: a client lands on
// one page, and it might be the slow one.
const lowest = Object.fromEntries(
  CATEGORIES.map((c) => [c, rows.reduce((min, r) => Math.min(min, r[c]), 100)]),
);

console.log(
  `\nworst across ${rows.length} routes: ` +
    CATEGORIES.map((c) => `${c} ${lowest[c]}`).join(" · "),
);
console.log("reports: screenshots/lighthouse/");

// ── the manifest the site quotes from ────────────────────────────────────
//
// Written only for a run against the deployed site. A localhost run has no
// network in front of it and scores several points higher; putting that on the
// page would be quoting a lab result as a field one.
const MANIFEST = fileURLToPath(new URL("../src/lib/lighthouse.ts", import.meta.url));

if (!/localhost|127\.0\.0\.1/.test(BASE) && rows.length >= 3) {
  const manifest = {
    measuredAt: new Date().toISOString().slice(0, 10),
    target: BASE,
    preset: PRESET,
    routes: rows.length,
    lowest: {
      performance: lowest.performance,
      accessibility: lowest.accessibility,
      bestPractices: lowest["best-practices"],
      seo: lowest.seo,
    },
  };

  await writeFile(
    MANIFEST,
    [
      "// Generated by `node scripts/shoot-lighthouse.mjs` against the deployed site.",
      "// Do not edit by hand - re-run the script instead.",
      "//",
      "// The site tells clients it measures speed and accessibility rather than",
      "// assuming them, so what it claims about itself has to come from a real",
      "// run. These are the LOWEST score in each category across every route",
      "// measured, on Lighthouse's throttled mobile preset.",
      "// สร้างจากสคริปต์ ห้ามแก้มือ",
      "",
      `export const lighthouse = ${JSON.stringify(manifest, null, 2)} as const;`,
      "",
    ].join("\n"),
    "utf8",
  );
  console.log(`manifest: src/lib/lighthouse.ts (lowest of ${rows.length} routes)\n`);
} else {
  console.log("manifest: skipped (localhost run)\n");
}
