"use client";

/**
 * The SVG filters the glass panels reference from `backdrop-filter: url(#id)`.
 *
 * Rendered once per page, hidden. Two filters: one that bends the backdrop, and
 * one that bends each colour channel by a slightly different amount so the rim
 * picks up the faint fringe a real lens edge has.
 *
 * `backdrop-filter: url()` resolves an SVG filter in Chromium only. Firefox and
 * Safari parse it and paint nothing through it, which is worse than no filter,
 * so `glass-surface.tsx` feature-detects and never emits `url()` unless the
 * browser says it supports it.
 */

/**
 * The displacement map, as a data URI.
 *
 * Red drives the horizontal shift, green the vertical, and 0x80 in a channel
 * means "leave this pixel where it is". So the middle of the sheet is flat and
 * only the outer 18% bends, which is how a lens behaves: hard at the rim,
 * nothing through the centre. `mix-blend-mode: screen` is what lets the two
 * gradients occupy one image without touching each other's channel.
 */
const MAP = (() => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200">' +
    "<defs>" +
    '<linearGradient id="x" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" stop-color="#ff0000"/><stop offset="0.18" stop-color="#800000"/>' +
    '<stop offset="0.82" stop-color="#800000"/><stop offset="1" stop-color="#000000"/>' +
    "</linearGradient>" +
    '<linearGradient id="y" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#00ff00"/><stop offset="0.18" stop-color="#008000"/>' +
    '<stop offset="0.82" stop-color="#008000"/><stop offset="1" stop-color="#000000"/>' +
    "</linearGradient>" +
    "</defs>" +
    '<rect width="100%" height="100%" fill="url(#x)"/>' +
    '<rect width="100%" height="100%" fill="url(#y)" style="mix-blend-mode:screen"/>' +
    "</svg>";
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();

export const LENS_ID = "prism-lens";
export const LENS_RGB_ID = "prism-lens-rgb";

/** How far each channel is pushed. The spread between them is the fringe. */
const SCALE = { plain: 15, red: 18, green: 15, blue: 12 } as const;

/** Keeps one colour channel and discards the rest, alpha intact. */
const keep = (channel: "r" | "g" | "b") =>
  ({
    r: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
    g: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
    b: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
  })[channel];

export function GlassFilters() {
  return (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0" focusable="false">
      <defs>
        <filter
          id={LENS_ID}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feImage result="map" preserveAspectRatio="none" href={MAP} />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={SCALE.plain}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter
          id={LENS_RGB_ID}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feImage result="map" preserveAspectRatio="none" href={MAP} />

          {(["red", "green", "blue"] as const).map((channel) => (
            <feDisplacementMap
              key={channel}
              in="SourceGraphic"
              in2="map"
              scale={SCALE[channel]}
              xChannelSelector="R"
              yChannelSelector="G"
              result={`d-${channel}`}
            />
          ))}

          <feColorMatrix in="d-red" type="matrix" values={keep("r")} result="c-red" />
          <feColorMatrix in="d-green" type="matrix" values={keep("g")} result="c-green" />
          <feColorMatrix in="d-blue" type="matrix" values={keep("b")} result="c-blue" />

          {/* screen, not add: the three channels never overlap, so screen
              recombines them exactly while keeping the alpha sane */}
          <feBlend in="c-red" in2="c-green" mode="screen" result="rg" />
          <feBlend in="rg" in2="c-blue" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
