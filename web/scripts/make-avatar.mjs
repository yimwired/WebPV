// Draw the avatar used on profiles that are not this site: Fastwork, GitHub,
// anywhere a square picture stands in for the person.
//
//   node scripts/make-avatar.mjs
//
// It is generated rather than kept as a hand-made file so it cannot drift from
// the site's own tokens. The one it replaced was a blue-green gradient from a
// palette this site dropped in 2026-08, which meant the profile picture and
// the portfolio it pointed at looked like two different people's work.
//
// Writes avatar-512.png at the repo root, which is gitignored: it is an asset
// Film uploads by hand, not something the site serves.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../../avatar-512.png", import.meta.url));

const SIZE = 512;

/** The dark background and the amber accent, straight from globals.css. */
const BACKGROUND = "#0a0a0a";
const BRAND = "oklch(0.78 0.13 66)";

const HTML = `<!doctype html>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@600&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; }
  body { width: ${SIZE}px; height: ${SIZE}px; }

  .tile {
    width: 100%;
    height: 100%;
    /* the same corner softness as an app icon, so it reads as one at small
       sizes where a square goes hard and a circle loses the letter */
    border-radius: 23%;
    background: ${BACKGROUND};
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
  }

  /* one hairline, the site's own device, rather than a gradient wash */
  .tile::after {
    content: "";
    position: absolute;
    inset: 6.5%;
    border-radius: 19%;
    border: 2px solid color-mix(in oklab, ${BRAND} 26%, transparent);
  }

  .mark {
    font-family: Geist, system-ui, sans-serif;
    font-weight: 600;
    font-size: 280px;
    line-height: 1;
    color: ${BRAND};
    /* optical centring: the F has no descender and its weight sits left, so
       geometric centring reads low and right */
    transform: translate(4px, -10px);
    letter-spacing: -0.02em;
  }
</style>
<div class="tile"><span class="mark">F</span></div>
`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: SIZE, height: SIZE },
  deviceScaleFactor: 1,
});
await page.setContent(HTML, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: OUT, omitBackground: true });
await browser.close();

console.log(`  ${OUT}`);
