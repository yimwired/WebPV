"use client";

import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { LENS_ID, LENS_RGB_ID } from "./glass-filter";
import { modeFor, PANEL, type PanelMode } from "./theme";

export interface LayerState {
  refraction: boolean;
  chromatic: boolean;
  specular: boolean;
  adaptive: boolean;
}

export const ALL_LAYERS: LayerState = {
  refraction: true,
  chromatic: true,
  specular: true,
  adaptive: true,
};

/**
 * Whether this browser can run an SVG filter as a backdrop filter.
 *
 * Read through `useSyncExternalStore` rather than an effect: the server has no
 * `CSS` object, the answer never changes for the life of the page, and the
 * project's lint rules reject the `useEffect` + `setState` shape this would
 * otherwise take. The server snapshot is `false`, so the first paint is the
 * fallback everywhere and Chromium upgrades on hydration.
 */
const subscribe = () => () => {};
const clientSnapshot = () => CSS.supports("backdrop-filter", "url(#prism-lens)");
const serverSnapshot = () => false;

export function useSupportsSvgBackdrop() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

interface GlassSurfaceProps {
  children: ReactNode;
  /** mean luminance 0 to 255 of the backdrop under this panel */
  luma: number;
  layers: LayerState;
  /** corner radius in px, also used to round the specular rim */
  radius?: number;
  className?: string;
  style?: CSSProperties;
  /** where the light is coming from, in degrees, for the rim highlight */
  lightAngle?: number;
}

/**
 * One sheet of glass.
 *
 * Four things stack up here and each can be switched off from the page so a
 * visitor can see what it was doing:
 *
 * 1. refraction  - `url(#prism-lens)` bends the backdrop, hard at the rim
 * 2. chromatic   - `url(#prism-lens-rgb)` bends each channel differently
 * 3. specular    - a conic gradient ring, brightest toward `lightAngle`
 * 4. adaptive    - the sheet flips dark or light so the text keeps its contrast
 *
 * With all four off it is `blur()` and a flat fill, which is the frosted panel
 * everyone ships and the thing this lab exists to be compared against.
 */
export function GlassSurface({
  children,
  luma,
  layers,
  radius = 26,
  className,
  style,
  lightAngle = 135,
}: GlassSurfaceProps) {
  const supportsSvg = useSupportsSvgBackdrop();
  const mode: PanelMode = modeFor(luma, layers.adaptive);
  const tone = PANEL[mode];

  // Only ask for a filter the browser will actually paint through.
  const lens =
    supportsSvg && layers.refraction
      ? `url(#${layers.chromatic ? LENS_RGB_ID : LENS_ID}) `
      : "";

  // Blur carries the contrast floor, so it stays on in every combination: it
  // is what turns a bright speck behind the sheet into a local mean the tones
  // were solved against.
  // Saturation was 1.6 in the first pass and it pulled the neon behind the
  // Midnight Soi backdrop across the whole sheet as a pink smear. A lens
  // concentrates light, it does not repaint it, so the boost is small enough to
  // read as glass carrying colour rather than as a stain.
  const backdropFilter = `${lens}blur(28px) saturate(${layers.refraction ? 1.28 : 1.1})`;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: radius,
        background: `rgba(${tone.fill}, ${tone.alpha})`,
        backdropFilter,
        WebkitBackdropFilter: backdropFilter,
        color: tone.text,
        // Without the specular layer the sheet keeps a plain hairline, so the
        // panel still has an edge and the comparison stays about the highlight
        // rather than about whether there is a border at all.
        border: layers.specular ? "1px solid transparent" : `1px solid ${tone.hairline}`,
        boxShadow: layers.specular
          ? "0 24px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.10)"
          : "0 10px 30px rgba(0, 0, 0, 0.3)",
        ...style,
      }}
    >
      {layers.specular && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            padding: 1,
            background: `conic-gradient(from ${lightAngle}deg, ${tone.rim}, rgba(255,255,255,0.06) 90deg, ${tone.rim} 180deg, rgba(255,255,255,0.04) 280deg, ${tone.rim})`,
            // paint only the 1px ring, not the middle
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
            pointerEvents: "none",
          }}
        />
      )}
      {children}
    </div>
  );
}

/** Tones for whatever mode a panel is in, for children that need them. */
export function toneFor(luma: number, layers: LayerState) {
  return PANEL[modeFor(luma, layers.adaptive)];
}
