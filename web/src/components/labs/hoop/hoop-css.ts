/**
 * Every animation on the page, in one stylesheet.
 *
 * Growth is three acts per character, each timed against the vine: the stem
 * draws, leaves pop where the drawing tip has passed, then the rose opens with
 * a quarter turn and its petal lines draw last. Backspace plays the same parts
 * the other way. Each element carries its own start time in `--at`, measured
 * from when its character was typed, plus a shared `--offset` that staggers a
 * whole name filled in at once.
 *
 * The wind moves the HTML wrapper around each plant rather than anything inside
 * the SVG, because a transform on a div is composited and one on an SVG element
 * is repainted every frame.
 *
 * Under reduced motion the global block in globals.css collapses durations to
 * nothing; the delays are zeroed here too, so the garden is simply there.
 * Every keyframe ends on the resting pose for the same reason: an animation
 * cut to one 0.01ms iteration stops on its last frame.
 */
export const HOOP_CSS = `
.hoop-root {
  background-color: var(--hoop-fabric);
  color: var(--hoop-ink);
  transition: background-color .45s ease, color .45s ease;
}
.hoop-root svg :where(path, g) { transition: fill .45s ease, stroke .45s ease; }

.hoop-weave {
  background-image:
    repeating-linear-gradient(0deg, color-mix(in oklab, var(--hoop-ink) 4%, transparent) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(90deg, color-mix(in oklab, var(--hoop-ink) 3%, transparent) 0 1px, transparent 1px 3px);
}

.hoop-plant {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  animation: hoop-sway var(--sway) ease-in-out var(--sway-at) infinite;
}
.hoop-plant > svg { position: absolute; overflow: visible; }
@keyframes hoop-sway {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(1.3deg); }
  75% { transform: rotate(-1.3deg); }
}

.hoop-vine, .hoop-detail {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
}
.hoop-vine {
  stroke: var(--hoop-vine);
  stroke-width: .026px;
  animation: hoop-draw .7s cubic-bezier(.3, .7, .4, 1) calc(var(--at) + var(--offset, 0ms)) both;
}
.hoop-detail {
  stroke: var(--hoop-rose-line);
  stroke-width: .009px;
  animation: hoop-draw .6s ease-out calc(var(--at) + var(--offset, 0ms)) both;
}
@keyframes hoop-draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}

.hoop-leaf, .hoop-bud, .hoop-rose { transform-origin: 0 0; }
.hoop-leaf { fill: var(--hoop-vine); }
.hoop-bud, .hoop-rose { fill: var(--hoop-rose); }
.hoop-leaf, .hoop-bud {
  animation: hoop-pop .38s cubic-bezier(.3, 1.6, .5, 1) calc(var(--at) + var(--offset, 0ms)) both;
}
.hoop-rose {
  animation: hoop-bloom .62s cubic-bezier(.25, 1.45, .45, 1) calc(var(--at) + var(--offset, 0ms)) both;
}
@keyframes hoop-pop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
@keyframes hoop-bloom {
  from { transform: rotate(-60deg) scale(0); }
  to { transform: rotate(0deg) scale(1); }
}

.hoop-plant[data-dying] .hoop-vine,
.hoop-plant[data-dying] .hoop-detail { animation: hoop-undraw .46s ease-in both; }
.hoop-plant[data-dying] .hoop-leaf,
.hoop-plant[data-dying] .hoop-bud { animation: hoop-droop .42s ease-in both; }
.hoop-plant[data-dying] .hoop-rose { animation: hoop-wilt .5s ease-in both; }
@keyframes hoop-undraw {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: 1; }
}
@keyframes hoop-droop {
  from { transform: rotate(0deg) scale(1); opacity: 1; }
  to { transform: rotate(48deg) scale(.55); opacity: 0; }
}
@keyframes hoop-wilt {
  from { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
  to { transform: translateY(.06px) rotate(35deg) scale(.4); opacity: 0; }
}

.hoop-caret { animation: hoop-blink 1.06s steps(1) infinite; }
@keyframes hoop-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .hoop-root * { animation-delay: 0s !important; }
}
`;
