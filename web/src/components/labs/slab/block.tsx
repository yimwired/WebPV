"use client";

import type { CSSProperties, ReactNode } from "react";
import { COLOR, LINE, shadow } from "./theme";

interface BlockProps {
  children: ReactNode;
  /** fill. Accents are surfaces here, never letters */
  background?: string;
  /** how far the flat shadow is thrown */
  offset?: number;
  border?: number;
  radius?: number;
  className?: string;
  style?: CSSProperties;
  tilt?: number;
}

/**
 * The one shape this page is built out of: a hard border, a flat offset
 * shadow, no blur anywhere.
 *
 * Kept as a component rather than a utility class because the shadow and the
 * border have to move together. A block with a 4px border and a 3px shadow
 * reads as a rendering error, and that pairing is easy to get wrong by hand
 * fifteen times across one page.
 */
export function Block({
  children,
  background = COLOR.paper,
  offset = 6,
  border = LINE.thick,
  radius = 0,
  className,
  style,
  tilt,
}: BlockProps) {
  return (
    <div
      className={className}
      style={{
        background,
        border: `${border}px solid ${COLOR.ink}`,
        borderRadius: radius,
        boxShadow: shadow(offset, offset),
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Every control travels 5px onto its own shadow when pressed.
 *
 * The travel matches the shadow offset exactly, so the control lands where the
 * shadow was and the shadow goes to zero. Any other distance leaves a gap or a
 * sliver and reads as a bug rather than a press.
 *
 * The offset is a fixed 5 and the classes are static on purpose: `:active`
 * cannot be expressed as an inline style, and Tailwind only emits the classes
 * it can see in the source, so a per-instance offset would silently produce a
 * control with a shadow and no travel.
 */
const PRESS =
  "inline-flex items-center justify-center font-extrabold shadow-[5px_5px_0_0_#0d0d0d] " +
  "transition-[transform,box-shadow] duration-75 " +
  "active:translate-x-[5px] active:translate-y-[5px] active:shadow-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 " +
  "disabled:opacity-45 disabled:shadow-none disabled:translate-x-[5px] disabled:translate-y-[5px] " +
  "motion-reduce:transition-none";

/** Same geometry, already in the pressed position. For a chosen toggle. */
const PRESS_HELD =
  "inline-flex items-center justify-center font-extrabold shadow-none " +
  "translate-x-[5px] translate-y-[5px] " +
  "focus-visible:outline-2 focus-visible:outline-offset-4";

interface PressProps {
  children: ReactNode;
  background?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
  /** a toggle that is currently chosen sits down on its shadow and stays there */
  held?: boolean;
  disabled?: boolean;
  pressedState?: boolean;
}

export function Press({
  children,
  background = COLOR.paper,
  className,
  style,
  onClick,
  href,
  ariaLabel,
  held = false,
  disabled = false,
  pressedState,
}: PressProps) {
  const shared = {
    className: `${held ? PRESS_HELD : PRESS} ${className ?? ""}`,
    style: {
      background,
      border: `${LINE.thick}px solid ${COLOR.ink}`,
      color: COLOR.ink,
      outlineColor: COLOR.ink,
      ...style,
    } as CSSProperties,
  };

  if (href) {
    return (
      <a href={href} aria-label={ariaLabel} {...shared}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={pressedState}
      disabled={disabled}
      {...shared}
    >
      {children}
    </button>
  );
}
