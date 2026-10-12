/**
 * The sound of a key: a Cherry MX Blue, recorded rather than synthesised.
 *
 * Six single keystrokes, each the press click and the click of the switch
 * coming back up, cut from "Typing (Cherry MX Blue Switches)" by
 * jameslovescode on Freesound (CC0) and laid end to end in one 31 KB file by
 * `scripts/make-thock-sound.mjs`. The file is fetched only once sound is
 * switched on.
 *
 * The strokes are found again by their onsets after decoding, so the silence
 * an MP3 encoder adds at the start of a file never shifts them. A press plays
 * one at random, never the same one twice running, a few percent off in pitch
 * and level, the way no two keys on a board sound quite alike.
 */

const SPRITE = "/lab-assets/thock/mx-blue.mp3";
/** A stroke starts at the first sample this loud after a silence... */
const ONSET = 0.02;
/** ...and has ended once nothing is louder than this for a tenth of a second. */
const TAIL = 0.002;
const SILENCE_S = 0.1;
/** Kept before each onset, so the very front of the click is not shaved off. */
const LEAD_S = 0.002;

interface Stroke {
  start: number;
  duration: number;
}

export class KeySound {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private sprite: AudioBuffer | null = null;
  private strokes: Stroke[] = [];
  private loading: Promise<void> | null = null;
  private last = -1;

  /**
   * Starts audio and loads the strokes. The first call has to come from a
   * click or a key press, or the browser keeps the context suspended; resolves
   * to whether sound is ready to play.
   */
  async enable(): Promise<boolean> {
    if (!this.context) {
      const Context =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return false;
      this.context = new Context();
      this.output = this.context.createGain();
      this.output.gain.value = 0.8;
      this.output.connect(this.context.destination);
    }
    try {
      if (this.context.state !== "running") await this.context.resume();
      this.loading ??= this.load(this.context);
      await this.loading;
    } catch {
      // a failed fetch can be tried again on the next switch-on
      this.loading = null;
      return false;
    }
    return this.context.state === "running" && this.strokes.length > 0;
  }

  /** One keystroke; `loudness` from 0 to 1, quieter for a cap on the far side of the ball. */
  play(loudness = 1) {
    const { context, output, sprite, strokes } = this;
    if (!context || context.state !== "running" || !output || !sprite || strokes.length === 0) return;

    let pick = Math.floor(Math.random() * strokes.length);
    if (pick === this.last && strokes.length > 1) pick = (pick + 1) % strokes.length;
    this.last = pick;

    const source = context.createBufferSource();
    source.buffer = sprite;
    source.playbackRate.value = vary(0.04);
    const level = context.createGain();
    level.gain.value = loudness * vary(0.1);
    source.connect(level).connect(output);
    source.start(context.currentTime, strokes[pick].start, strokes[pick].duration);
  }

  dispose() {
    void this.context?.close();
    this.context = null;
    this.output = null;
    this.sprite = null;
    this.strokes = [];
    this.loading = null;
  }

  private async load(context: AudioContext) {
    const response = await fetch(SPRITE);
    if (!response.ok) throw new Error(`${SPRITE}: ${response.status}`);
    this.sprite = await context.decodeAudioData(await response.arrayBuffer());
    this.strokes = findStrokes(this.sprite);
  }
}

/** Each run of sound between silences, in seconds into the buffer. */
function findStrokes(buffer: AudioBuffer): Stroke[] {
  const samples = buffer.getChannelData(0);
  const rate = buffer.sampleRate;
  const silence = Math.round(SILENCE_S * rate);
  const lead = Math.round(LEAD_S * rate);
  const strokes: Stroke[] = [];
  let i = 0;
  while (i < samples.length) {
    if (Math.abs(samples[i]) < ONSET) {
      i++;
      continue;
    }
    const onset = i;
    let end = i;
    while (i < samples.length && i - end < silence) {
      if (Math.abs(samples[i]) > TAIL) end = i;
      i++;
    }
    const start = Math.max(0, onset - lead);
    strokes.push({ start: start / rate, duration: (end - start) / rate });
  }
  return strokes;
}

function vary(spread: number): number {
  return 1 + (Math.random() * 2 - 1) * spread;
}
