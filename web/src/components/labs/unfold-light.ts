/**
 * Colour of the emitted light. Measured whites, not guesses: these are the
 * usual sRGB renderings of black-body temperatures, so the 2700K end reads
 * amber and the 5000K end reads paper-white.
 */
const KELVIN_STOPS: ReadonlyArray<readonly [number, [number, number, number]]> =
  [
    [2700, [255, 166, 87]],
    [3500, [255, 196, 137]],
    [4300, [255, 219, 186]],
    [5000, [255, 236, 224]],
  ];

export function kelvinToRgb(kelvin: number): string {
  const k = Math.min(5000, Math.max(2700, kelvin));
  for (let i = 0; i < KELVIN_STOPS.length - 1; i += 1) {
    const [k0, c0] = KELVIN_STOPS[i];
    const [k1, c1] = KELVIN_STOPS[i + 1];
    if (k <= k1) {
      const t = (k - k0) / (k1 - k0);
      const mix = c0.map((v, j) => Math.round(v + (c1[j] - v) * t));
      return `rgb(${mix[0]} ${mix[1]} ${mix[2]})`;
    }
  }
  return "rgb(255 236 224)";
}
