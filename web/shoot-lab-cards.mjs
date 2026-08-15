// Shoots one real frame of every lab and writes it to public/labs/cards,
// which is what the gallery cards show. Committed output, unlike the
// screenshots/ directory, because the site serves these.
//
// Needs `npm run start` on :3000. Re-run after changing any demo's look.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "public/labs/cards";
const SIZE = { width: 1280, height: 800 };

/**
 * How far down each demo to shoot. Most read best at the top; the scrolling
 * ones need to be moved to the frame that actually sells them.
 */
const SHOT_AT = {
  contour: 0.42,
  meridian: 0.12,
  vision: 0.08,
};

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
// force English: the gallery around these cards is English, and the demos
// pick their language up from the browser
const page = await browser.newPage({
  viewport: SIZE,
  deviceScaleFactor: 2,
  locale: "en-US",
});

// read the slug list off the gallery itself, so the two can never drift
await page.goto("http://localhost:3000/labs", { waitUntil: "networkidle" });
const slugs = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a[href^="/labs/"]'))
    .map((a) => a.getAttribute("href").replace("/labs/", ""))
    .filter((slug) => slug && !slug.includes("/"))
);

const unique = [...new Set(slugs)];
console.log(`${unique.length} labs: ${unique.join(", ")}`);

for (const slug of unique) {
  await page.goto(`http://localhost:3000/labs/${slug}`, {
    waitUntil: "networkidle",
  });
  // WebGL scenes need a moment to light up and textures to paint
  await page.waitForTimeout(3000);

  const at = SHOT_AT[slug];
  if (at) {
    await page.evaluate((fraction) => {
      const total = document.body.scrollHeight - window.innerHeight;
      window.scrollTo({ top: total * fraction, behavior: "instant" });
    }, at);
    await page.waitForTimeout(2200);
  }

  // hide the switcher pill: it is chrome, and it is the same on every card
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("a[href='/labs']")) {
      const pill = el.closest("div.fixed");
      if (pill) pill.style.visibility = "hidden";
    }
  });

  await page.screenshot({
    path: `${OUT}/${slug}.jpg`,
    type: "jpeg",
    quality: 82,
  });
  console.log(`  ${slug}.jpg`);
}

await browser.close();
