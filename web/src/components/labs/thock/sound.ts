/**
 * The sound of a key, synthesised rather than sampled, so nothing is
 * downloaded and no two presses are quite the same.
 *
 * A press is four parts: a low knock that drops in pitch as the stem bottoms
 * out (the "thock"), a short high click, a thud of low noise as the cap meets
 * the plate, and a quieter tick when the spring brings it back up. Each is
 * nudged at random within a few percent, the way a real board never repeats.
 */

type FilterKind = "bandpass" | "lowpass";

export class KeySound {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  /**
   * Starts audio. The first call has to come from a click or a key press, or
   * the browser keeps the context suspended; resolves to whether it is running.
   */
  async enable(): Promise<boolean> {
    if (!this.context) {
      const Context =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return false;
      const context = new Context();
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.ratio.value = 4;
      const output = context.createGain();
      output.gain.value = 0.5;
      output.connect(compressor).connect(context.destination);
      this.context = context;
      this.output = output;
      this.noise = whiteNoise(context, 0.4);
    }
    if (this.context.state !== "running") {
      try {
        await this.context.resume();
      } catch {
        return false;
      }
    }
    return this.context.state === "running";
  }

  /** One press; `loudness` from 0 to 1, quieter for a cap on the far side of the ball. */
  play(loudness = 1) {
    const context = this.context;
    if (!context || context.state !== "running" || !this.output) return;
    const t = context.currentTime;

    const knock = context.createOscillator();
    knock.type = "sine";
    knock.frequency.setValueAtTime(190 * vary(0.08), t);
    knock.frequency.exponentialRampToValueAtTime(78, t + 0.06);
    const knockLevel = context.createGain();
    knockLevel.gain.setValueAtTime(0.0001, t);
    knockLevel.gain.exponentialRampToValueAtTime(0.55 * loudness, t + 0.003);
    knockLevel.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    knock.connect(knockLevel).connect(this.output);
    knock.start(t);
    knock.stop(t + 0.12);

    this.burst(t, "bandpass", 2400 * vary(0.12), 1.1, 0.3 * loudness, 0.03);
    this.burst(t + 0.004, "lowpass", 700 * vary(0.1), 0.7, 0.4 * loudness, 0.05);
    this.burst(t + 0.085 * vary(0.1), "bandpass", 3300 * vary(0.1), 1.4, 0.1 * loudness, 0.02);
  }

  dispose() {
    void this.context?.close();
    this.context = null;
    this.output = null;
    this.noise = null;
  }

  private burst(at: number, kind: FilterKind, frequency: number, q: number, level: number, duration: number) {
    const context = this.context;
    if (!context || !this.output || !this.noise) return;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    const filter = context.createBiquadFilter();
    filter.type = kind;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(level, at);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter).connect(envelope).connect(this.output);
    // a different stretch of the noise each time, so the bursts never match
    source.start(at, Math.random() * 0.3);
    source.stop(at + duration + 0.01);
  }
}

function vary(spread: number): number {
  return 1 + (Math.random() * 2 - 1) * spread;
}

function whiteNoise(context: AudioContext, seconds: number): AudioBuffer {
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * seconds), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  return buffer;
}
