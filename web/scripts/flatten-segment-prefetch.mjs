// Post-build fixup for Next 16's segment prefetch under `output: "export"`.
//
// Hovering a <Link> makes the router ask for the RSC payload of each route
// segment. It builds those filenames by joining the segment path with dots:
//
//   GET /labs/kiln/__next.labs.kiln.txt
//   GET /labs/kiln/__next.labs.kiln.__PAGE__.txt
//
// The exporter writes the same payloads with the segment path joined by
// slashes, so they land as directories instead:
//
//   out/labs/kiln/__next.labs/kiln.txt
//   out/labs/kiln/__next.labs/kiln/__PAGE__.txt
//
// Nothing serves the names the client asks for, so every prefetch 404s and the
// router falls back to a full document load on click. Measured on 16.2.9: two
// 404s per link hovered, and no prefetch anywhere on the site.
//
// This copies each payload to the dot-joined name next to its `__next.` parent.
// The originals stay: they cost a few KB and a future Next may start asking for
// them. Re-run safe, and a no-op if Next ever writes the flat names itself.

import { copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
const SEGMENT_DIR = "__next.";

/** Every file under `dir`, paired with its dot-joined name. */
function payloadsIn(dir, prefix) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const name = `${prefix}.${entry.name}`;
    if (entry.isDirectory()) found.push(...payloadsIn(join(dir, entry.name), name));
    else found.push({ from: join(dir, entry.name), name });
  }
  return found;
}

function flatten(dir) {
  let copied = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = join(dir, entry.name);
    if (!entry.name.startsWith(SEGMENT_DIR)) {
      copied += flatten(child);
      continue;
    }
    for (const payload of payloadsIn(child, entry.name)) {
      copyFileSync(payload.from, join(dir, payload.name));
      copied += 1;
    }
  }
  return copied;
}

let copied = 0;
try {
  copied = flatten(OUT);
} catch (err) {
  if (err.code !== "ENOENT") throw err;
  console.error(`flatten-segment-prefetch: no ${OUT}/ directory, run this after next build`);
  process.exit(1);
}

console.log(`flatten-segment-prefetch: ${copied} segment payload${copied === 1 ? "" : "s"} served at the name the router asks for`);
