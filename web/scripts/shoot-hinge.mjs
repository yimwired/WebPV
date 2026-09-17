// Verifies /labs/hinge, which the generic audit cannot: the device is a WebGL
// canvas, so "is it working" means the geometry moved when the fold changed,
// an uploaded image actually landed on the panels, the inner display was split
// across the two leaves in the right order, and the export button produced a
// PNG bigger than the frame it was taken from.
//
// Needs the built site served. From the repo root:
//   npx wrangler dev -c wrangler.jsonc --port 3000
// then from web/:
//   node scripts/shoot-hinge.mjs
import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.SHOOT_URL ?? "http://localhost:3000";
const ROUTE = "/labs/hinge";
const OUT = fileURLToPath(new URL("../screenshots/hinge", import.meta.url));

const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Reads the WebGL canvas back through a small 2D canvas: a hash to tell
 * whether anything moved, and a coarse grid of pixels to tell what is where.
 * Both halves of the artwork test need position, not just presence.
 */
const sample = (page) =>
  page.evaluate(() => {
    const source = document.querySelector("canvas");
    if (!source) return null;

    const grid = document.createElement("canvas");
    grid.width = 64;
    grid.height = 40;
    const context = grid.getContext("2d");
    context.drawImage(source, 0, 0, grid.width, grid.height);
    const { data } = context.getImageData(0, 0, grid.width, grid.height);

    let hash = 0;
    let lit = 0;
    const columnsWith = { red: [], blue: [] };

    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      hash = (hash * 31 + r + g * 3 + b * 7 + a) % 2147483647;
      if (a > 16) lit += 1;

      const column = ((i / 4) % grid.width) | 0;
      if (a > 200 && r > 150 && g < 90 && b < 90) columnsWith.red.push(column);
      if (a > 200 && b > 150 && g < 90 && r < 90) columnsWith.blue.push(column);
    }

    const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);
    return {
      hash,
      lit,
      total: (data.length / 4) | 0,
      red: { count: columnsWith.red.length, centre: mean(columnsWith.red) },
      blue: { count: columnsWith.blue.length, centre: mean(columnsWith.blue) },
    };
  });

/**
 * Polls `sample` until it says what we are waiting for. A fixed sleep is not
 * enough here: the bigger the canvas the longer a software renderer takes to
 * put the first textured frame up, so the desktop pass read the frame before
 * the artwork was on it while the phone pass read it after.
 */
const sampleUntil = async (page, ready, timeout = 15000) => {
  const deadline = Date.now() + timeout;
  let last = null;
  do {
    last = await sample(page);
    if (last && ready(last)) return last;
    await sleep(250);
  } while (Date.now() < deadline);
  return last;
};

/**
 * The export presets, and the file each one has to produce. The three fixed
 * frames exist so a shot needs no crop after it is saved, which only holds if
 * the PNG is exactly the size on the button.
 */
const EXPORT_FRAMES = [
  { label: "9:16", slug: "vertical", size: { width: 1080, height: 1920 } },
  { label: "1:1", slug: "square", size: { width: 1440, height: 1440 } },
  { label: "16:9", slug: "wide", size: { width: 1920, height: 1080 } },
  { label: "Frame", slug: "frame", size: null },
];

/** A 600x400 PNG, red on the left half and blue on the right. */
const splitImage = async (page) => {
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ff1818";
    context.fillRect(0, 0, 300, 400);
    context.fillStyle = "#1818ff";
    context.fillRect(300, 0, 300, 400);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  return Buffer.from(encoded, "base64");
};

/** Width and height out of a PNG's IHDR, so an export can be measured. */
const pngSize = (buffer) => ({
  width: buffer.readUInt32BE(16),
  height: buffer.readUInt32BE(20),
});

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const findings = [];

for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
    acceptDownloads: true,
  });
  const page = await context.newPage();

  const errors = [];
  const note = (text) => {
    errors.push(text);
    // printed as it happens: a failure later in the run throws before the
    // summary, and the console error is usually what explains it
    if (process.env.SHOOT_VERBOSE) console.log(`  [${size.name}] ${text}`);
  };
  page.on("console", (message) => {
    if (message.type() === "error") note(message.text());
  });
  page.on("pageerror", (error) => note(String(error)));

  await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
  await page.waitForSelector("canvas", { state: "attached", timeout: 15000 });
  // the scene needs a beat to compile shaders and light the environment
  await sleep(1800);

  const start = await sample(page);
  if (!start) {
    findings.push(`${size.name}: no canvas on the page`);
    await context.close();
    continue;
  }
  if (start.lit < start.total * 0.02) {
    findings.push(
      `${size.name}: canvas is effectively empty (${start.lit}/${start.total} pixels carry anything)`,
    );
  }
  await page.screenshot({ path: `${OUT}/${size.name}-01-open.png` });

  // 1. the fold has to change the picture
  const slider = page.locator("#fold");
  await slider.fill("0.95");
  await sleep(700);
  const shut = await sample(page);
  if (shut.hash === start.hash) {
    findings.push(`${size.name}: moving the fold slider did not change a pixel`);
  }
  await page.screenshot({ path: `${OUT}/${size.name}-02-shut.png` });

  const readout = await page.locator("output").first().innerText();
  if (!readout.startsWith("9")) {
    findings.push(`${size.name}: fold at 0.95 should read about 9 degrees, got "${readout}"`);
  }

  await slider.fill("0.12");
  await sleep(700);

  // 2. an uploaded image has to land on the panels, left half on the left leaf
  const artwork = await splitImage(page);
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "split.png",
    mimeType: "image/png",
    buffer: artwork,
  });
  const withArtwork = await sampleUntil(
    page,
    (s) => s.red.count >= 20 && s.blue.count >= 20,
  );
  await page.screenshot({ path: `${OUT}/${size.name}-03-artwork.png` });

  if (withArtwork.red.count < 20 || withArtwork.blue.count < 20) {
    findings.push(
      `${size.name}: the uploaded image did not reach the inner display ` +
        `(red ${withArtwork.red.count}px, blue ${withArtwork.blue.count}px)`,
    );
  } else if (withArtwork.red.centre >= withArtwork.blue.centre) {
    findings.push(
      `${size.name}: the inner display is split the wrong way round — the left half of the ` +
        `artwork sits at column ${withArtwork.red.centre.toFixed(1)}, the right half at ` +
        `${withArtwork.blue.centre.toFixed(1)}`,
    );
  }

  // 3. removing it has to put the display back to its off state
  await page.getByRole("button", { name: /Remove the inner/i }).click();
  const cleared = await sampleUntil(page, (s) => s.red.count <= 10 && s.blue.count <= 10, 8000);
  if (cleared.red.count > 10 || cleared.blue.count > 10) {
    findings.push(`${size.name}: clearing the inner display left the artwork on it`);
  }

  // 4. every export frame has to come out at exactly the size it advertises
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "split.png",
    mimeType: "image/png",
    buffer: artwork,
  });
  await sleep(900);

  const exportOnce = async () => {
    // The listener has to be attached before the click, but awaiting them
    // together swallows which of the two actually failed.
    const downloading = page.waitForEvent("download", { timeout: 90000 });
    await page.getByRole("button", { name: /Export PNG/i }).click();
    const download = await downloading.catch(async (error) => {
      const said = await page.evaluate(() => {
        const status = document.querySelector('[role="status"]');
        const gl = document.querySelector("canvas")?.getContext("webgl2");
        return {
          status: status ? status.textContent : "(nothing said)",
          contextLost: gl ? gl.isContextLost() : "no webgl2 handle",
        };
      });
      console.log(`  [${size.name}] export never downloaded:`, said, "console:", errors);
      throw error;
    });
    const bytes = await readFile(await download.path());
    return { bytes, ...pngSize(bytes), name: download.suggestedFilename() };
  };

  for (const preset of EXPORT_FRAMES) {
    await page.getByRole("button", { name: preset.label, exact: true }).click();
    await sleep(500);

    // The canvas is reshaped by the preset, so it has to be measured after the
    // choice rather than once before the loop.
    const canvasBox = await page.locator("canvas").first().boundingBox();
    const ratio = canvasBox.width / canvasBox.height;
    if (preset.size && Math.abs(ratio - preset.size.width / preset.size.height) > 0.02) {
      findings.push(
        `${size.name}: with ${preset.label} chosen the canvas is ${ratio.toFixed(3)} on screen, ` +
          `not the ${(preset.size.width / preset.size.height).toFixed(3)} it exports at`,
      );
    }

    const shot = await exportOnce();
    const want = preset.size ?? {
      width: Math.round(canvasBox.width * 3),
      height: Math.round(canvasBox.height * 3),
    };

    if (shot.bytes.length < 20_000) {
      findings.push(`${size.name}: the ${preset.label} export is only ${shot.bytes.length} bytes`);
    }
    // The canvas is measured in CSS pixels and can land on a half, so the
    // "Frame" preset is allowed a pixel of rounding either way.
    const slack = preset.size ? 0 : 3;
    if (
      Math.abs(shot.width - want.width) > slack ||
      Math.abs(shot.height - want.height) > slack
    ) {
      findings.push(
        `${size.name}: the ${preset.label} export came out ${shot.width}x${shot.height}, ` +
          `not ${want.width}x${want.height}`,
      );
    }
    if (preset.slug && !shot.name.includes(preset.slug)) {
      findings.push(
        `${size.name}: the ${preset.label} export was saved as "${shot.name}", ` +
          `which does not say which frame it is`,
      );
    }
  }

  // back to the vertical frame for the rest of the pass
  await page.getByRole("button", { name: "9:16", exact: true }).click();
  await sleep(300);

  // 5. an export renders the canvas at the file's size, so the element has to
  // be back at its own afterwards or the page is left showing a scaled buffer
  const beforeExport = await page.locator("canvas").first().boundingBox();
  await exportOnce();
  await sleep(600);
  const afterExport = await page.locator("canvas").first().boundingBox();
  if (Math.abs(afterExport.width - beforeExport.width) > 2) {
    findings.push(
      `${size.name}: the canvas did not return to its own size after an export ` +
        `(${Math.round(beforeExport.width)} then ${Math.round(afterExport.width)})`,
    );
  }

  // 6. dragging has to turn the device. The canvas sits below the controls on
  // a phone, so its box has to be brought into the viewport first or the drag
  // lands on whatever is at those coordinates instead.
  await page.locator("canvas").first().scrollIntoViewIfNeeded();
  await sleep(300);
  const dragBox = await page.locator("canvas").first().boundingBox();
  const midX = dragBox.x + dragBox.width / 2;
  const midY = dragBox.y + dragBox.height / 2;

  const before = await sample(page);
  await page.mouse.move(midX, midY);
  await page.mouse.down();
  await page.mouse.move(midX + 160, midY + 40, { steps: 14 });
  await page.mouse.up();
  const after = await sampleUntil(page, (s) => s.hash !== before.hash, 8000);
  if (after.hash === before.hash) {
    findings.push(`${size.name}: dragging the device did not turn it`);
  }
  await page.screenshot({ path: `${OUT}/${size.name}-04-turned.png` });

  for (const error of errors) findings.push(`${size.name}: console error - ${error}`);
  await context.close();
}

// reduced motion: the damping is the only thing that should change, and the
// scene still has to draw
const reduced = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const reducedPage = await reduced.newPage();
await reducedPage.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
await reducedPage.waitForSelector("canvas", { state: "attached", timeout: 15000 });
await sleep(1800);
const reducedSample = await sample(reducedPage);
if (!reducedSample || reducedSample.lit < reducedSample.total * 0.02) {
  findings.push("reduced-motion: the scene did not draw");
}
await reducedPage.screenshot({ path: `${OUT}/reduced-motion.png` });
await reduced.close();

await browser.close();

if (findings.length === 0) {
  console.log(`hinge: clean. Screenshots in ${OUT}`);
} else {
  console.log(`hinge: ${findings.length} finding(s)`);
  for (const finding of findings) console.log(`  - ${finding}`);
  process.exitCode = 1;
}
