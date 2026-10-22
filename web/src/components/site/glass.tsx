"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

/** The id `.glass[data-lens]` in globals.css points its backdrop filter at. */
const LENS_ID = "site-lens";

/**
 * Whether this browser paints an SVG filter used as a backdrop filter.
 *
 * Only Chromium does. Firefox and Safari parse `backdrop-filter: url()` and
 * then draw nothing through it, so `[data-lens]` is set only when this says
 * yes. Read through `useSyncExternalStore`, as /labs/prism does: the server has
 * no `CSS` object and the answer never changes, so the server snapshot is the
 * plain blur everywhere and Chromium upgrades on hydration.
 */
const subscribe = () => () => {};
const clientSnapshot = () => CSS.supports("backdrop-filter", `url(#${LENS_ID})`);
const serverSnapshot = () => false;

export function useSupportsLens() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

interface Size {
  width: number;
  height: number;
}

/** How far each colour channel is pushed at the rim, in px. The spread is the fringe. */
const SCALE = { red: 13, green: 10, blue: 7 } as const;

/**
 * The frost, in px of standard deviation, about the blur the plain fallback
 * uses. It lives inside the filter rather than after `url()` in the CSS: written
 * as `url(#site-lens) blur(16px)`, the blur was not applied in Chromium, and
 * the headline scrolling under the bar showed through sharp, refracted into
 * its lower band (2026-10-22, side by side with the plain fallback).
 */
const FROST = 16;

/** Keeps one colour channel and drops the other two, alpha intact. */
const KEEP = {
  red: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
  green: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
  blue: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
} as const;

/**
 * The displacement map for a capsule of this size, as a data URI.
 *
 * Red drives the horizontal shift and green the vertical; 0x80 means "leave
 * this pixel where it is". A lens bends hardest at its rim and not at all
 * through the middle, so each axis is flat except for a band at the edges.
 * The bands follow the shape: horizontally they are as wide as the round end
 * caps, vertically a third of the height, which is all a 64px bar has.
 */
function lensMap({ width, height }: Size) {
  const capStop = Math.min(0.2, height / 2 / width).toFixed(4);
  const capEnd = (1 - Number(capStop)).toFixed(4);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    "<defs>" +
    '<linearGradient id="x" x1="0" y1="0" x2="1" y2="0">' +
    `<stop offset="0" stop-color="#ff0000"/><stop offset="${capStop}" stop-color="#800000"/>` +
    `<stop offset="${capEnd}" stop-color="#800000"/><stop offset="1" stop-color="#000000"/>` +
    "</linearGradient>" +
    '<linearGradient id="y" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#00ff00"/><stop offset="0.32" stop-color="#008000"/>' +
    '<stop offset="0.68" stop-color="#008000"/><stop offset="1" stop-color="#000000"/>' +
    "</linearGradient>" +
    "</defs>" +
    '<rect width="100%" height="100%" fill="url(#x)"/>' +
    '<rect width="100%" height="100%" fill="url(#y)" style="mix-blend-mode:screen"/>' +
    "</svg>";
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Tracks an element's rounded size, so the map is rebuilt only when it really changes. */
function useElementSize(target: RefObject<HTMLElement | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    const element = target.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      const width = Math.round(box ? box.inlineSize : entry.contentRect.width);
      const height = Math.round(box ? box.blockSize : entry.contentRect.height);
      setSize((previous) =>
        previous?.width === width && previous?.height === height
          ? previous
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);

  return size;
}

/**
 * The SVG filter behind `.glass[data-lens]`: the backdrop bent at the rim,
 * each colour channel by a slightly different amount, then recombined.
 * Rendered once, hidden, sized to the element it is measured from.
 */
export function GlassLens({ measure }: { measure: RefObject<HTMLElement | null> }) {
  const size = useElementSize(measure);
  if (!size || size.width === 0 || size.height === 0) return null;

  const map = lensMap(size);
  const channels = ["red", "green", "blue"] as const;

  return (
    <svg aria-hidden focusable="false" className="pointer-events-none absolute h-0 w-0">
      <defs>
        {/* The region is the element's own box, so the stretched map lines up
            with its edges. Nothing needs sampling from outside it: every band
            in the map pulls inward, the way the rim of a convex lens does. */}
        <filter
          id={LENS_ID}
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          {/* duplicate: the blur would otherwise pull transparency in from
              outside the box and darken the rim */}
          <feGaussianBlur in="SourceGraphic" stdDeviation={FROST} edgeMode="duplicate" result="frost" />
          <feImage result="map" preserveAspectRatio="none" href={map} />
          {channels.map((channel) => (
            <feDisplacementMap
              key={channel}
              in="frost"
              in2="map"
              scale={SCALE[channel]}
              xChannelSelector="R"
              yChannelSelector="G"
              result={`bent-${channel}`}
            />
          ))}
          {channels.map((channel) => (
            <feColorMatrix
              key={channel}
              in={`bent-${channel}`}
              type="matrix"
              values={KEEP[channel]}
              result={`only-${channel}`}
            />
          ))}
          {/* screen, not add: the channels never overlap, so screen puts them
              back together exactly and keeps the alpha sane */}
          <feBlend in="only-red" in2="only-green" mode="screen" result="red-green" />
          <feBlend in="red-green" in2="only-blue" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
