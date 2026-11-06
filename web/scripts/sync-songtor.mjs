// Copies the build of G:\songtor into public/lab-demos/songtor. Songtor is its
// own project and not a git repo, so what the Lab serves is this committed copy.
//
//   npm run build --prefix G:\songtor
//   node web/scripts/sync-songtor.mjs        (from the repo root)
//
// The folder is deleted first because Vite's file names are content hashes: an
// old bundle would otherwise stay in the repo and on the site forever.
//
// ESLint walks public/, and this bundle is minified three.js: 8 errors and 1369
// warnings that say nothing about this repo. Marking the bundle itself leaves the
// config alone, so everything else under public/ is still linted.

import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";

const SOURCE = process.env.SONGTOR_DIST ?? "G:/songtor/dist";
const TARGET = "web/public/lab-demos/songtor";
const GENERATED_MARK = "/* eslint-disable -- generated bundle, see scripts/sync-songtor.mjs */\n";

await rm(TARGET, { recursive: true, force: true });
await cp(SOURCE, TARGET, { recursive: true });

const assets = await readdir(`${TARGET}/assets`);
const bundles = assets.filter((file) => file.endsWith(".js"));
if (bundles.length === 0) throw new Error(`no bundle found in ${SOURCE}/assets`);

for (const file of bundles) {
  const path = `${TARGET}/assets/${file}`;
  await writeFile(path, GENERATED_MARK + (await readFile(path, "utf8")));
}

console.log(`synced ${assets.length} assets, marked ${bundles.join(", ")}`);
