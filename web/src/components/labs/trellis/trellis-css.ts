/**
 * Every animation on the page, in one stylesheet.
 *
 * Growth is three acts per character. The stem draws at one steady speed,
 * leaves pop where the drawing tip has passed, then the rose opens with a
 * quarter turn and its petal lines draw last. Backspace plays the same parts
 * the other way. Each element carries its own start time in `--at`, measured
 * from when its character was typed, plus a shared `--offset` that staggers a
 * whole word put in at once. Vines draw linearly, and that is what lets the
 * pieces of vine drawn in front of a letter start and stop exactly where the
 * vine behind it is: both are the same distance along the same line.
 *
 * A piece that appears after its plant has grown, because a new letter arrived
 * under an old vine, is pushed back by `--late`, so it lands already drawn.
 *
 * The wind moves the HTML wrapper around each plant rather than anything inside
 * the SVG, because a transform on a div is composited and one on an SVG element
 * is repainted every frame. A pointer passing over a letter shakes its plant
 * through the separate `rotate` property, which stacks with the wind instead of
 * replacing it.
 *
 * Under reduced motion the global block in globals.css collapses durations to
 * nothing; the delays are zeroed here too, so the garden is simply there.
 * Every keyframe ends on the resting pose for the same reason: an animation cut
 * to one 0.01ms iteration stops on its last frame.
 */
export const TRELLIS_CSS = `
html:has(.tr-root), html:has(.tr-root) body {
  overflow: hidden;
  overscroll-behavior: none;
}
/* No colour transitions in the garden: a palette change happens behind a veil
   (see choosePalette in trellis-demo.tsx). Fading every fill and stroke
   repainted each plant on every frame, and on the way from a dark palette to a
   light one the letters and the ground met in the same grey and blinked out. */
.tr-root {
  background-color: var(--tr-ground);
  color: var(--tr-ink);
}
/* The controls stay above the veil and fade to the new palette themselves:
   a few dozen small elements, cheap to repaint. */
.tr-chrome, .tr-chrome * {
  transition-property: color, background-color, border-color, box-shadow, outline-color;
  transition-duration: .3s;
  transition-timing-function: ease;
}

.tr-plant {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  animation: tr-sway var(--sway) ease-in-out var(--sway-at) infinite;
}
.tr-plant[data-rustle="a"] {
  animation: tr-sway var(--sway) ease-in-out var(--sway-at) infinite, tr-rustle-a .95s ease-out;
}
.tr-plant[data-rustle="b"] {
  animation: tr-sway var(--sway) ease-in-out var(--sway-at) infinite, tr-rustle-b .95s ease-out;
}
.tr-plant > svg { position: absolute; overflow: visible; }
@keyframes tr-sway {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(1deg); }
  75% { transform: rotate(-1deg); }
}
@keyframes tr-rustle-a {
  0%, 100% { rotate: 0deg; }
  14% { rotate: 2.4deg; }
  34% { rotate: -1.8deg; }
  54% { rotate: 1deg; }
  74% { rotate: -.4deg; }
}
@keyframes tr-rustle-b {
  0%, 100% { rotate: 0deg; }
  14% { rotate: -2.4deg; }
  34% { rotate: 1.8deg; }
  54% { rotate: -1deg; }
  74% { rotate: .4deg; }
}

.tr-vine, .tr-front, .tr-detail {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
}
.tr-vine, .tr-front {
  animation: tr-draw var(--dur) linear calc(var(--at) + var(--offset, 0ms) - var(--late, 0ms)) both;
}
.tr-vine, .tr-front {
  stroke: var(--tr-vine);
  stroke-width: .022px;
}
.tr-thorns {
  fill: none;
  stroke: var(--tr-vine);
  stroke-width: .011px;
  stroke-linecap: round;
  animation: tr-fade .3s ease-out calc(var(--at) + var(--offset, 0ms)) both;
}
.tr-detail {
  stroke: var(--tr-rose-line);
  stroke-width: .009px;
  animation: tr-draw .6s ease-out calc(var(--at) + var(--offset, 0ms)) both;
}
@keyframes tr-draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
@keyframes tr-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tr-leaf, .tr-bud, .tr-rose { transform-origin: 0 0; }
.tr-leaf > path:first-child { fill: var(--tr-vine); }
.tr-rib {
  fill: none;
  stroke: var(--tr-ground);
  stroke-width: .0065px;
  stroke-linecap: round;
}
/* Roses and buds carry a ground-coloured edge, half of it outside the shape,
   so a rose resting on a letter reads as on it rather than melted into it. */
.tr-head, .tr-bud {
  fill: var(--tr-rose);
  stroke: var(--tr-ground);
  stroke-width: .018px;
  stroke-linejoin: round;
  paint-order: stroke;
}
.tr-leaf, .tr-bud {
  animation: tr-pop .38s cubic-bezier(.3, 1.6, .5, 1) calc(var(--at) + var(--offset, 0ms)) both;
}
.tr-rose {
  animation: tr-bloom .62s cubic-bezier(.25, 1.45, .45, 1) calc(var(--at) + var(--offset, 0ms)) both;
}
@keyframes tr-pop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
@keyframes tr-bloom {
  from { transform: rotate(-60deg) scale(0); }
  to { transform: rotate(0deg) scale(1); }
}

.tr-plant[data-dying] :is(.tr-vine, .tr-front, .tr-detail) { animation: tr-undraw .46s ease-in both; }
.tr-plant[data-dying] .tr-thorns { animation: tr-fade .2s ease-in reverse both; }
.tr-plant[data-dying] :is(.tr-leaf, .tr-bud) { animation: tr-droop .42s ease-in both; }
.tr-plant[data-dying] .tr-rose { animation: tr-wilt .5s ease-in both; }
@keyframes tr-undraw {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: 1; }
}
@keyframes tr-droop {
  from { transform: rotate(0deg) scale(1); opacity: 1; }
  to { transform: rotate(48deg) scale(.55); opacity: 0; }
}
@keyframes tr-wilt {
  from { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
  to { transform: translateY(.06px) rotate(35deg) scale(.4); opacity: 0; }
}

/* Marks drawn again above the garden, so a tone mark is never under a petal:
   a ground-coloured edge, then the letter itself. */
.tr-mark-ink { color: var(--tr-ink); }
.tr-mark-edge {
  color: var(--tr-ground);
  text-shadow:
    .012em 0 0 var(--tr-ground), -.012em 0 0 var(--tr-ground),
    0 .012em 0 var(--tr-ground), 0 -.012em 0 var(--tr-ground),
    .009em .009em 0 var(--tr-ground), -.009em .009em 0 var(--tr-ground),
    .009em -.009em 0 var(--tr-ground), -.009em -.009em 0 var(--tr-ground);
}

.tr-caret { animation: tr-blink 1.06s steps(1) infinite; }
@keyframes tr-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .tr-root * { animation-delay: 0s !important; }
}
`;
