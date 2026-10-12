// ─────────────────────────────────────────────────────────────
//  Builds the key sound /labs/thock plays: six single keystrokes of a Cherry
//  MX Blue switch, cut out of a typing recording into one small MP3. Run it
//  only to regenerate the file; the output is committed.
//
//    node web/scripts/make-thock-sound.mjs
//
//  Source: "Typing (Cherry MX Blue Switches)" by jameslovescode on Freesound,
//  https://freesound.org/people/jameslovescode/sounds/400699/ , a Pok3r with
//  blue switches recorded on a Zoom. It is CC0, so no credit is required; the
//  lab's sound module names it anyway. Freesound serves the original WAV only
//  to signed-in users, so this works from the public HQ preview, which is
//  plenty for a click that lasts a fifth of a second.
//
//  The strokes are ones followed by a pause in the typing, so the click the
//  switch makes on its way back up is in the cut and the next key is not.
//  Each runs from just before its press click to just before anything loud
//  enough to be another press, is faded at both ends and brought to the same
//  peak. They are laid end to end with silence between them, and the page
//  finds them again by their onsets after decoding, which makes it immune to
//  the delay an MP3 encoder puts at the start of the file.
// ─────────────────────────────────────────────────────────────
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const SOURCE = "https://cdn.freesound.org/previews/400/400699_6081465-hq.mp3";
const OUT = "web/public/lab-assets/thock/mx-blue.mp3";
const WORK = join(tmpdir(), "webpv-thock-sound");
const RATE = 44100;

/** Roughly where each chosen stroke starts in the recording, in ms. */
const STROKES_MS = [2528, 6373, 7261, 916, 1526, 4411];

const SILENCE_S = 0.15;
const PEAK = 10 ** (-3 / 20);
const MAX_LENGTH_S = 0.19;
const FADE_OUT_S = 0.02;

mkdirSync(WORK, { recursive: true });
const source = join(WORK, "source.mp3");
if (!existsSync(source)) {
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`${SOURCE}: ${response.status}`);
  writeFileSync(source, Buffer.from(await response.arrayBuffer()));
}

const raw = join(WORK, "source.raw");
await run("ffmpeg", ["-v", "error", "-y", "-i", source, "-ac", "1", "-ar", String(RATE), "-f", "s16le", raw]);
// Read sample by sample: a Buffer can sit inside a larger shared pool, so its
// .buffer is not this file alone.
const bytes = readFileSync(raw);
const samples = new Float32Array(bytes.length / 2);
for (let i = 0; i < samples.length; i++) samples[i] = bytes.readInt16LE(i * 2) / 32768;

const peakIn = (from, to) => {
  let peak = 0;
  for (let i = from; i < to; i++) peak = Math.max(peak, Math.abs(samples[i]));
  return peak;
};

function cut(approxMs) {
  // whole samples per millisecond, so every index below stays an integer
  const ms = Math.floor(RATE / 1000);
  const from = Math.max(0, Math.round((approxMs - 15) * ms));
  const to = Math.min(samples.length, Math.round((approxMs + 300) * ms));
  let press = from;
  for (let i = from; i < to; i++) if (Math.abs(samples[i]) > Math.abs(samples[press])) press = i;
  const peak = Math.abs(samples[press]);

  // Back up to where the click starts rising out of the room.
  let onset = press;
  while (onset > press - 15 * ms && Math.abs(samples[onset]) > peak * 0.04) onset--;
  onset = Math.max(0, Math.round(onset - 2 * ms));

  // Stop before anything as loud as a new press, once the release has been heard.
  let end = press + Math.round(MAX_LENGTH_S * RATE);
  for (let i = press + 60 * ms; i < Math.min(end, samples.length); i += ms) {
    if (peakIn(i, i + ms) > peak * 0.6) {
      end = Math.round(i - 3 * ms);
      break;
    }
  }

  const stroke = samples.slice(onset, end);
  const fadeIn = Math.round(ms);
  for (let i = 0; i < fadeIn; i++) stroke[i] *= i / fadeIn;
  const fadeOut = Math.min(Math.round(FADE_OUT_S * RATE), Math.floor(stroke.length / 3));
  for (let i = 0; i < fadeOut; i++) {
    stroke[stroke.length - fadeOut + i] *= 0.5 * (1 + Math.cos((Math.PI * i) / (fadeOut - 1)));
  }
  let loudest = 0;
  for (const value of stroke) loudest = Math.max(loudest, Math.abs(value));
  return stroke.map((value) => (value * PEAK) / loudest);
}

const gap = new Float32Array(Math.round(SILENCE_S * RATE));
const parts = [gap];
for (const at of STROKES_MS) {
  const stroke = cut(at);
  console.log(`stroke at ~${at} ms: ${Math.round((stroke.length / RATE) * 1000)} ms`);
  parts.push(stroke, gap);
}
const sprite = new Int16Array(parts.reduce((total, part) => total + part.length, 0));
let offset = 0;
for (const part of parts) {
  for (const value of part) sprite[offset++] = Math.round(Math.max(-1, Math.min(1, value)) * 32767);
}

const spriteRaw = join(WORK, "sprite.raw");
writeFileSync(spriteRaw, Buffer.from(sprite.buffer));
mkdirSync("web/public/lab-assets/thock", { recursive: true });
await run("ffmpeg", [
  "-v", "error", "-y",
  "-f", "s16le", "-ar", String(RATE), "-ac", "1", "-i", spriteRaw,
  "-c:a", "libmp3lame", "-b:a", "112k", "-map_metadata", "-1",
  OUT,
]);
console.log(`${OUT}: ${(sprite.length / RATE).toFixed(2)} s, ${STROKES_MS.length} strokes`);
