"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { Layout } from "./data";
import type { Plan } from "./plan";
import { metres } from "./plan";

/**
 * The plan itself. The viewBox is the room in centimetres with a margin for
 * the dimension lines, so nothing here converts anything: a 240 cm counter is
 * 240 units wide, and two rooms of different sizes are drawn to the same scale
 * as each other without a scale factor anywhere in the file.
 */

// Centimetres of paper around the room, where the dimensions are written.
// Wide enough for the figure beside the vertical line: at 110 the "4.20 ม."
// ran off the viewBox and the sheet showed "20 ม." instead.
const MARGIN = 165;

/** Wall thickness in centimetres, drawn outside the floor. */
const WALL = 9;

const INK = "#23262b";
const PENCIL = "#2f5fa8";
const RED = "#a8341f";

interface SheetProps {
  layout: Layout;
  plan: Plan;
}

/** A dimension line: two ticks, a rule between them and the figure above it. */
function Dimension({
  from,
  to,
  at,
  vertical = false,
  label,
  colour = PENCIL,
}: {
  from: number;
  to: number;
  at: number;
  vertical?: boolean;
  label: string;
  colour?: string;
}) {
  const a = vertical ? { x: at, y: from } : { x: from, y: at };
  const b = vertical ? { x: at, y: to } : { x: to, y: at };
  const tick = 14;

  return (
    <g stroke={colour} fill={colour}>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      {[a, b].map((point, i) => (
        <line
          key={i}
          x1={vertical ? point.x - tick : point.x}
          y1={vertical ? point.y : point.y - tick}
          x2={vertical ? point.x + tick : point.x}
          y2={vertical ? point.y : point.y + tick}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <text
        x={vertical ? at - 16 : (from + to) / 2}
        y={vertical ? (from + to) / 2 : at - 16}
        fontSize={26}
        textAnchor="middle"
        dominantBaseline={vertical ? "auto" : "auto"}
        stroke="none"
        transform={
          vertical
            ? `rotate(-90 ${at - 16} ${(from + to) / 2})`
            : undefined
        }
      >
        {label}
      </text>
    </g>
  );
}

export function Sheet({ layout, plan }: SheetProps) {
  const reduced = useReducedMotion() ?? false;
  const { width, depth } = plan.room;
  const tight = plan.walkway < plan.wanted;

  // where the walkway is measured, clear of the furniture below it
  const gapFrom = layout.anchor.depth;
  const gapTo = depth - layout.facing.depth;

  return (
    <svg
      viewBox={`${-MARGIN} ${-MARGIN} ${width + MARGIN * 2} ${depth + MARGIN * 2}`}
      className="block h-auto w-full"
      role="img"
      aria-label={`ผังห้อง ${layout.name} กว้าง ${metres(width)} เมตร ลึก ${metres(depth)} เมตร`}
    >
      <defs>
        {/* 50 cm graph paper, the ruling a working drawing is sketched on */}
        <pattern
          id="draft-grid"
          width={50}
          height={50}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 50 0 L 0 0 0 50"
            fill="none"
            stroke="#cfc9b8"
            strokeWidth={0.8}
          />
        </pattern>
      </defs>

      <rect
        x={-MARGIN}
        y={-MARGIN}
        width={width + MARGIN * 2}
        height={depth + MARGIN * 2}
        fill="url(#draft-grid)"
      />

      {/* The room. The wall is drawn outside the floor rather than centred on
          it, because the dimensions on a plan are internal: a piece standing
          against the left wall belongs at x = 0, not at x = half a wall. */}
      <motion.rect
        data-room={`${width}x${depth}`}
        x={-WALL / 2}
        y={-WALL / 2}
        width={width + WALL}
        height={depth + WALL}
        fill="#fdfcf8"
        stroke={INK}
        strokeWidth={WALL}
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      />

      {plan.placed.map((piece) => {
        // A label goes inside the piece it names when it can be read there and
        // under it when it cannot. Thai advances about 0.55 of the type size,
        // so the size that fits is arithmetic rather than a guess, and below
        // 15 units the name is smaller than the dimensions beside it.
        const fitted = Math.min(24, (piece.width - 16) / (piece.name.length * 0.55));
        const inside = fitted >= 13 && piece.depth >= 58;
        const size = inside ? fitted : 20;

        // Under the piece, unless the piece is against the bottom wall, where
        // under it is off the floor and onto the paper: the wardrobe's name was
        // printed outside the room it stands in.
        const room = 44;
        const below = piece.y + piece.depth + room <= depth;
        const x = inside ? piece.x + piece.width / 2 : piece.x + 4;
        const y = inside
          ? piece.y + piece.depth / 2 - 2
          : below
            ? piece.y + piece.depth + 30
            : piece.y - room + 10;

        return (
          <g key={piece.name}>
            <rect
              data-piece={piece.name}
              x={piece.x}
              y={piece.y}
              width={piece.width}
              height={piece.depth}
              fill="#ffffff"
              stroke={INK}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={x}
              y={y}
              fontSize={size}
              textAnchor={inside ? "middle" : "start"}
              fill={INK}
            >
              {piece.name}
            </text>
            <text
              x={x}
              y={y + size + 4}
              fontSize={size - 3}
              textAnchor={inside ? "middle" : "start"}
              fill={PENCIL}
            >
              {piece.width} x {piece.depth}
            </text>
          </g>
        );
      })}

      {/* the gap between the two pieces that face each other, which is the
          number the whole page is about */}
      {gapTo > gapFrom && (
        <Dimension
          vertical
          from={gapFrom}
          to={gapTo}
          at={width - 60}
          colour={tight ? RED : PENCIL}
          label={`${Math.round(plan.walkway)} ซม.`}
        />
      )}

      <Dimension
        from={0}
        to={width}
        at={-45}
        label={`${metres(width)} ม.`}
      />
      <Dimension
        vertical
        from={0}
        to={depth}
        at={-45}
        label={`${metres(depth)} ม.`}
      />
    </svg>
  );
}
