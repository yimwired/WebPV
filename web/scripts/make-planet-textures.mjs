// ─────────────────────────────────────────────────────────────
//  Builds the three textures the Deep Space globe wears, from NASA source
//  imagery. Run it only to regenerate them; the output is committed.
//
//    node web/scripts/make-planet-textures.mjs
//
//  The sources are NASA Visible Earth and are public domain. NASA asks for
//  credit rather than requiring it, and the lab page carries that credit at
//  the foot of the page. Keep it there if these files stay.
//
//  Sizes are chosen against how the globe is actually drawn: the sphere is
//  about 1,400 device pixels across on a retina screen, so a hemisphere wants
//  roughly a thousand texels and the colour map is 2048 wide. Cloud cover
//  only drives an alpha channel and is blurred across a sphere, so it halves
//  without anyone noticing. City lights are sparse points that would vanish
//  if the map were scaled down, so that one keeps its width and pays for it
//  with quality instead, which costs nothing on a mostly black image.
// ─────────────────────────────────────────────────────────────
import sharp from "sharp";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = "web/public/planet";
const WORK = join(tmpdir(), "webpv-planet");

const SOURCES = [
  {
    name: "day",
    url: "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_2048.tif",
    out: "earth-day.webp",
    width: 2048,
    quality: 84,
    grey: false,
  },
  {
    name: "clouds",
    url: "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.tif",
    out: "earth-clouds.webp",
    width: 1024,
    quality: 74,
    grey: true,
  },
  {
    name: "night",
    url: "https://eoimages.gsfc.nasa.gov/images/imagerecords/55000/55167/earth_lights_lrg.jpg",
    out: "earth-night.webp",
    width: 2048,
    quality: 70,
    grey: false,
  },
];

mkdirSync(OUT, { recursive: true });
mkdirSync(WORK, { recursive: true });

for (const source of SOURCES) {
  const raw = join(WORK, source.name);

  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`${source.name}: ${response.status} from ${source.url}`);
  writeFileSync(raw, Buffer.from(await response.arrayBuffer()));

  let pipe = sharp(raw).resize({ width: source.width, height: source.width / 2, fit: "fill" });
  if (source.grey) pipe = pipe.greyscale();
  await pipe.webp({ quality: source.quality }).toFile(join(OUT, source.out));

  const kb = Math.round(statSync(join(OUT, source.out)).size / 1024);
  console.log(`${source.out.padEnd(20)} ${source.width}x${source.width / 2}  ${kb} KB`);
}
