// Shoots one real frame of every lab and writes it to public/labs/cards,
// which is what the gallery cards show. Committed output, unlike the
// screenshots/ directory, because the site serves these.
//
// Needs the built site served on :3000. `next start` does not work here - the
// app is `output: "export"` - so build first, then from the repo root run
// `npx wrangler dev -c wrangler.jsonc --port 3000`, and stop it before the
// next build or the export fails with EBUSY on web/out.
//
// Re-run after changing any demo's look, and after changing `lib/projects.ts`:
// five of these demos render the project list, so adding a project silently
// dates their cards.
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);

const OUT = "public/labs/cards";
const MANIFEST = "src/lib/lab-cards.ts";
const SIZE = { width: 1280, height: 800 };

/**
 * Cards ship as WebP at 1200px wide, converted with ffmpeg after the shot.
 *
 * Playwright only writes PNG or JPEG, and the JPEGs this used to keep came out
 * at 2560px - the full 2x of the viewport - for a card that renders about
 * 560 CSS px wide. That is far more pixels than the densest
 * phone can show, and it cost 2.5 MB across the gallery: Lighthouse scored
 * /labs at 75 with an 8.2s largest paint. 1200px still covers the widest use
 * on the page - the gallery card at 2x - and takes the whole set under 500 KB.
 */
const CARD_WIDTH = 1200;
const CARD_QUALITY = 80;

/**
 * How far down each demo to shoot. Most read best at the top; the scrolling
 * ones need to be moved to the frame that actually sells them.
 */
const SHOT_AT = {
  contour: 0.42,
  meridian: 0.12,
  // 0.08 framed this correctly until the project list grew and the page with
  // it: the same fraction then scrolled past the headline into empty black.
  // Jumping further does not help either, since the sections below the hero
  // are scroll-reveals that a teleported scroll never fires.
  vision: 0.02,
  // the lit act with the control in it, not the closed object: the folded lamp
  // on white is the least interesting of the five frames. 0.5 landed on the
  // crossfade between two acts, which freezes into ghost text on a still.
  unfold: 0.575,
  // the four product templates: each one's card has to show the thing it sells,
  // which is never the top of the page
  cart: 0.06, // the headline and the bundle tiles, not the bare product shot
  counter: 0.18, // the signature dishes
  longtail: 0.3, // tour cards beside the live booking panel
  stall: 0.22, // the rail beside the listings
  playroom: 0.05, // the jar with the pile in it, not the headline alone
};

/**
 * Demos that need to be used before they are worth a photograph.
 *
 * Terminal opens on an empty prompt, which is an accurate picture of a shell
 * nobody has typed into and a poor advertisement for one that answers. The
 * card shows it mid-deploy instead, which is the thing being sold.
 */
const PREPARE = {
  terminal: async (page) => {
    const prompt = page.locator("#ridge-prompt");
    await prompt.fill("status");
    await prompt.press("Enter");
    await page.waitForTimeout(400);
    await prompt.fill("deploy");
    await prompt.press("Enter");
    await page.waitForTimeout(2600);
  },
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
await page.goto("http://localhost:3000/labs", { waitUntil: "load" });
const slugs = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a[href^="/labs/"]'))
    .map((a) => a.getAttribute("href").replace("/labs/", ""))
    .filter((slug) => slug && !slug.includes("/"))
);

const unique = [...new Set(slugs)];
console.log(`${unique.length} labs: ${unique.join(", ")}`);

// ONLY=playroom,cart reshoots just those, for when one demo changed and the
// rest are already correct. The hashes below are still read off every file on
// disk, so the manifest stays complete either way.
const only = process.env.ONLY?.split(",").map((s) => s.trim());
const targets = only ? unique.filter((slug) => only.includes(slug)) : unique;

for (const slug of targets) {
  // `load`, not `networkidle`. Every page carries the switcher, which
  // prefetches an RSC payload for all fourteen labs, and those prefetches
  // outlive the navigation that started them: with thirteen labs the pile
  // cleared inside the 30s default and with fourteen it stopped doing so, so
  // this timed out on whichever demo happened to be first. None of it is in
  // the screenshot - `load` already covers the images and scripts this page
  // needs, and the wait below covers the WebGL paint.
  await page.goto(`http://localhost:3000/labs/${slug}`, { waitUntil: "load" });
  // WebGL scenes need a moment to light up and textures to paint
  await page.waitForTimeout(3000);

  const prepare = PREPARE[slug];
  if (prepare) {
    await prepare(page);
    await page.waitForTimeout(400);
  }

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

  const shot = `${OUT}/${slug}.shot.jpg`;
  await page.screenshot({ path: shot, type: "jpeg", quality: 92 });

  // -y overwrite, and the intermediate goes away: only the webp is committed
  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", shot,
    "-vf", `scale=${CARD_WIDTH}:-1`,
    "-quality", String(CARD_QUALITY),
    `${OUT}/${slug}.webp`,
  ]);
  await unlink(shot);
  console.log(`  ${slug}.webp`);
}

await browser.close();

// The cards keep their filenames, and `_headers` caches them for a day, so a
// reshoot is invisible to anyone who has already loaded the gallery. Writing a
// content hash beside them lets the gallery ask for the new bytes by URL,
// which is the only thing a browser reliably notices.
const hashes = Object.fromEntries(
  await Promise.all(
    unique.map(async (slug) => [
      slug,
      createHash("sha1")
        .update(await readFile(`${OUT}/${slug}.webp`))
        .digest("hex")
        .slice(0, 8),
    ]),
  ),
);

await writeFile(
  MANIFEST,
  [
    "// Generated by `node shoot-lab-cards.mjs`. Do not edit by hand.",
    "//",
    "// One content hash per gallery card, appended to its URL so a reshoot is",
    "// visible immediately: the images keep their filenames and `public/_headers`",
    "// caches them for a day.",
    "// สร้างจากสคริปต์ ห้ามแก้มือ",
    "",
    "export const labCardVersions: Record<string, string> = " +
      JSON.stringify(hashes, null, 2) +
      ";",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`  ${MANIFEST}`);
