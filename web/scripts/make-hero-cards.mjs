// Draws the portrait cards that float around the home page hero.
//
// The sources are the portfolio stills `make-profile-kit.mjs` shoots for the
// fastwork.com profile (gitignored, in fastwork-covers/profile/portfolio), so
// run that first if the folder is empty or a lab has changed. This only
// crops and shrinks them: a card renders about 220px wide, so 440px covers a
// 2x screen, and the export serves images as they are (no resizing on request).
//
// From the repo root:
//   node web/scripts/make-hero-cards.mjs
import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SOURCE = fileURLToPath(
  new URL("../../fastwork-covers/profile/portfolio/", import.meta.url),
);
const OUT = fileURLToPath(new URL("../public/home/cards/", import.meta.url));

/** Card width in pixels, and the aspect each card is cut to (width / height). */
const WIDTH = 440;
const PORTRAIT = 4 / 5;
const SQUARE = 1;

// Which still feeds which card, and how it is cut. The kit names its files
// `NN-<slug>[-variant].jpg`; the phone shot of Counter is the one tall frame.
const cards = [
  { slug: "thock", file: "01-thock.jpg", aspect: PORTRAIT },
  { slug: "trellis", file: "02-trellis.jpg", aspect: SQUARE },
  { slug: "clash", file: "03-clash.jpg", aspect: PORTRAIT },
  { slug: "gaze", file: "04-gaze.jpg", aspect: SQUARE },
  { slug: "counter", file: "05-counter-phone.jpg", aspect: PORTRAIT, position: "top" },
  { slug: "longtail", file: "06-longtail.jpg", aspect: PORTRAIT },
  { slug: "meeple", file: "07-meeple.jpg", aspect: SQUARE },
  { slug: "ember", file: "08-ember.jpg", aspect: PORTRAIT },
  { slug: "trine", file: "09-trine.jpg", aspect: PORTRAIT },
];

await mkdir(OUT, { recursive: true });
const available = new Set(await readdir(SOURCE).catch(() => []));

for (const card of cards) {
  if (!available.has(card.file)) {
    console.log(`skip ${card.slug}: ${card.file} is not in ${SOURCE}`);
    continue;
  }
  const height = Math.round(WIDTH / card.aspect);
  const target = `${OUT}${card.slug}.webp`;
  await sharp(`${SOURCE}${card.file}`)
    .resize(WIDTH, height, { fit: "cover", position: card.position ?? "centre" })
    .webp({ quality: 70, effort: 6 })
    .toFile(target);
  const { size } = await stat(target);
  console.log(`${card.slug.padEnd(9)} ${WIDTH}x${height}  ${(size / 1024).toFixed(1)} KB`);
}
