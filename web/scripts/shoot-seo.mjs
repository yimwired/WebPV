// Checks what a crawler and a chat app see, which is not what a visitor sees.
//
// Every route has to carry its own title, description, canonical and share
// card: Next inherits the root's openGraph block unless a page sets its own,
// and the failure is invisible in a browser. It only shows up when a link is
// pasted somewhere and previews as the home page.
//
// It walks the sitemap rather than a list kept here, so a route added without
// metadata is caught by the same run that adds it, and it also checks the
// unlisted lab demos, which are exactly the pages Film pastes into a chat.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then:
//   node web/scripts/shoot-seo.mjs
import { chromium } from "playwright";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";

const findings = [];
const note = (text) => findings.push(text);
const check = (ok, text) => {
  if (!ok) note(text);
};

/** Pages that are deliberately not in the sitemap but do get pasted around. */
const UNLISTED = (process.env.UNLISTED ?? "/labs/deed,/labs/steep,/labs/umbra")
  .split(",")
  .filter(Boolean);

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "en-US" });
const page = await context.newPage();

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const routes = [
  ...new Set([
    ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      new URL(m[1]).pathname,
    ),
    ...UNLISTED,
  ]),
];
check(routes.length > 10, `the sitemap lists ${routes.length} routes`);

const seen = new Map();

for (const route of routes) {
  const response = await page.goto(`${BASE}${route}`, { waitUntil: "load" });
  check(
    response?.status() === 200,
    `${route} answered ${response?.status()}`,
  );

  // load fires before the router has finished settling on this document, and
  // reading straight through it returned an empty head on one route in a run
  await page
    .waitForFunction(() => document.title.length > 0, null, { timeout: 5000 })
    .catch(() => note(`${route} never painted a title`));

  const head = await page.evaluate(() => {
    const meta = (selector) =>
      document.querySelector(selector)?.getAttribute("content")?.trim() ?? "";
    return {
      title: document.title.trim(),
      description: meta('meta[name="description"]'),
      canonical:
        document.querySelector('link[rel="canonical"]')?.getAttribute("href") ??
        "",
      ogTitle: meta('meta[property="og:title"]'),
      ogDescription: meta('meta[property="og:description"]'),
      ogUrl: meta('meta[property="og:url"]'),
      ogImage: meta('meta[property="og:image"]'),
      twitterCard: meta('meta[name="twitter:card"]'),
      h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()),
      jsonLd: [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ].map((s) => s.textContent),
    };
  });

  for (const [field, value] of Object.entries({
    title: head.title,
    description: head.description,
    canonical: head.canonical,
    "og:title": head.ogTitle,
    "og:url": head.ogUrl,
    "og:image": head.ogImage,
  })) {
    check(value.length > 0, `${route} has no ${field}`);
  }

  check(
    head.canonical === `${BASE}${route === "/" ? "" : route}` ||
      head.canonical.endsWith(route === "/" ? "" : route),
    `${route} points its canonical at ${head.canonical}`,
  );
  check(
    head.ogTitle === head.title,
    `${route} shares as "${head.ogTitle}" but its title is "${head.title}"`,
  );
  check(
    head.h1.length === 1,
    `${route} has ${head.h1.length} h1 elements: ${JSON.stringify(head.h1)}`,
  );
  check(
    head.twitterCard === "summary_large_image",
    `${route} has twitter card "${head.twitterCard}"`,
  );
  check(
    head.description.length >= 50 && head.description.length <= 320,
    `${route} has a ${head.description.length} character description`,
  );

  // two routes sharing a title is the failure this script exists for
  const clash = seen.get(head.title);
  check(
    clash === undefined,
    `${route} and ${clash} share the title "${head.title}"`,
  );
  seen.set(head.title, route);

  for (const block of head.jsonLd) {
    try {
      JSON.parse(block);
    } catch (error) {
      note(`${route} has JSON-LD that does not parse: ${error.message}`);
    }
  }
}

// ── the price list has to say what the page says ───────────────────────────
{
  await page.goto(`${BASE}/pricing`, { waitUntil: "load" });
  const { offers, shown } = await page.evaluate(() => {
    const graphs = [
      ...document.querySelectorAll('script[type="application/ld+json"]'),
    ]
      .map((s) => JSON.parse(s.textContent))
      .flatMap((g) => g["@graph"] ?? [g]);
    const service = graphs.find((node) => node["@type"] === "Service");
    return {
      offers: service?.offers ?? [],
      shown: document.body.innerText,
    };
  });

  check(offers.length >= 4, `the price list publishes ${offers.length} offers`);
  for (const offer of offers) {
    check(
      offer.priceCurrency === "THB",
      `${offer.name} is priced in ${offer.priceCurrency}`,
    );
    check(
      shown.includes(offer.price.toLocaleString("en-US")),
      `${offer.name} is offered at ${offer.price} and the page does not show ` +
        "that number anywhere",
    );
  }
}

await browser.close();

if (findings.length === 0) {
  console.log(`seo: clean across ${routes.length} routes on ${BASE}`);
} else {
  console.log(`seo: ${findings.length} finding(s) on ${BASE}`);
  for (const finding of findings) console.log(` - ${finding}`);
  process.exitCode = 1;
}
