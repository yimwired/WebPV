"use client";

import {
  LANE_DROP,
  SCENE_BOX,
  type Borrowed,
  type Piece,
  type Side,
} from "./data";
import { castFor, type Light } from "./light";

/**
 * The picture. Its viewBox is the scene in decimetres, so a 3.2 m column is 32
 * units tall and its shadow is however many units the trigonometry in light.ts
 * returns. Nothing here converts anything, and nothing here decides anything:
 * every shadow is drawn from a Cast, and the table and the note beside the
 * picture are drawn from the same ones.
 *
 * The sun is drawn at the angle it is set to rather than parked in a corner,
 * which is what lets a test read the light out of the picture instead of
 * being told what it is. When the sphere passes in front of it, it passes in
 * front of it.
 */

const { width: W, height: H, ground: G } = SCENE_BOX;

/** How far off the scene's centre the sun sits, in decimetres. */
const SUN_DISTANCE = 54;

/** A shadow band lies this deep on the ground from this camera. */
const BAND_DEPTH = 5;

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const away = (side: Side) => (side === "left" ? 1 : -1);

/** The ground line this object stands on, which is its row. */
const groundOf = (piece: Piece) => G + piece.lane * LANE_DROP;

/** Which way the light rakes across a surface. */
const litBy = (side: Side) => `url(#umbra-stone-${side})`;
const shadeBy = (side: Side) => `url(#umbra-shade-${side})`;

interface SceneProps {
  light: Light;
  pieces: Piece[];
  borrowed: Borrowed;
  /** the light the borrowed object is actually lit by, once corrected or not */
  borrowedLight: Light;
}

function Shape({ piece, side }: { piece: Piece; side: Side }) {
  const base = groundOf(piece);
  const top = base - piece.height;

  if (piece.shape === "sphere") {
    const radius = piece.width / 2;
    return (
      <circle
        cx={piece.x + radius}
        cy={base - (piece.lift ?? 0)}
        r={radius}
        fill={litBy(side)}
      />
    );
  }

  if (piece.shape === "column") {
    return (
      <g fill={litBy(side)}>
        <rect x={piece.x} y={top} width={piece.width} height={piece.height} />
        <rect
          x={piece.x - 1.4}
          y={top - 1.6}
          width={piece.width + 2.8}
          height={1.6}
        />
      </g>
    );
  }

  if (piece.shape === "door") {
    const jamb = 1.8;
    return (
      <g>
        <rect
          x={piece.x}
          y={top}
          width={piece.width}
          height={piece.height}
          fill={litBy(side)}
        />
        {/* the opening, which is a brighter sky than the one it stands in */}
        <rect
          x={piece.x + jamb}
          y={top + jamb}
          width={piece.width - jamb * 2}
          height={piece.height - jamb}
          fill="#8fc6e6"
        />
      </g>
    );
  }

  if (piece.shape === "chair") {
    const seat = top + piece.height * 0.45;
    return (
      <g fill={litBy(side)}>
        <rect x={piece.x} y={seat} width={piece.width} height={1.1} />
        <rect x={piece.x} y={top} width={1.2} height={piece.height * 0.45} />
        <rect x={piece.x + 0.6} y={seat} width={1} height={piece.height * 0.55} />
        <rect
          x={piece.x + piece.width - 1.6}
          y={seat}
          width={1}
          height={piece.height * 0.55}
        />
      </g>
    );
  }

  if (piece.shape === "lamp") {
    const shadeHeight = piece.height * 0.3;
    return (
      <g fill={litBy(side)}>
        <polygon
          points={`${piece.x + 1},${top + shadeHeight} ${piece.x + piece.width - 1},${top + shadeHeight} ${piece.x + piece.width - 2.4},${top} ${piece.x + 2.4},${top}`}
        />
        <rect
          x={piece.x + piece.width / 2 - 0.5}
          y={top + shadeHeight}
          width={1}
          height={piece.height - shadeHeight}
        />
        <rect
          x={piece.x + piece.width / 2 - 2.2}
          y={base - 0.8}
          width={4.4}
          height={0.8}
        />
      </g>
    );
  }

  const potHeight = piece.height * 0.4;
  return (
    <g fill={litBy(side)}>
      <circle
        cx={piece.x + piece.width / 2}
        cy={top + potHeight}
        r={piece.width / 2}
      />
      <circle
        cx={piece.x + piece.width * 0.25}
        cy={top + potHeight * 1.6}
        r={piece.width * 0.3}
      />
      <polygon
        points={`${piece.x + 1.2},${base - potHeight} ${piece.x + piece.width - 1.2},${base - potHeight} ${piece.x + piece.width - 2.2},${base} ${piece.x + 2.2},${base}`}
      />
    </g>
  );
}

function ShadowOf({ piece, light }: { piece: Piece; light: Light }) {
  const cast = castFor(piece, light);
  const base = groundOf(piece);

  if (cast.ellipse) {
    return (
      <ellipse
        data-shadow={piece.id}
        cx={cast.ellipse.cx}
        cy={base + cast.ellipse.ry * 0.6}
        rx={cast.ellipse.rx}
        ry={cast.ellipse.ry}
        fill={shadeBy(light.side)}
      />
    );
  }

  return (
    <rect
      data-shadow={piece.id}
      x={cast.from}
      y={base}
      width={cast.to - cast.from}
      height={BAND_DEPTH}
      rx={1}
      fill={shadeBy(light.side)}
    />
  );
}

export function Scene({ light, pieces, borrowed, borrowedLight }: SceneProps) {
  const sun = {
    x:
      W / 2 -
      away(light.side) * SUN_DISTANCE * Math.cos(radians(light.elevation)),
    y: G - SUN_DISTANCE * Math.sin(radians(light.elevation)),
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      data-scene={`${W}x${H}`}
      data-ground={G}
      data-elevation={light.elevation}
      data-side={light.side}
      role="img"
      aria-label={`ฉากจำลอง แสงทำมุม ${light.elevation} องศาเหนือขอบฟ้า มาจากด้าน${light.side === "left" ? "ซ้าย" : "ขวา"}`}
    >
      <defs>
        <linearGradient id="umbra-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d3763" />
          <stop offset="58%" stopColor="#4c74a6" />
          <stop offset="100%" stopColor="#d8a074" />
        </linearGradient>
        <linearGradient id="umbra-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c99f77" />
          <stop offset="100%" stopColor="#8a6544" />
        </linearGradient>
        {(["left", "right"] as Side[]).map((side) => (
          <linearGradient
            key={side}
            id={`umbra-stone-${side}`}
            x1={side === "left" ? "0" : "1"}
            y1="0"
            x2={side === "left" ? "1" : "0"}
            y2="0"
          >
            <stop offset="0%" stopColor="#f4e9da" />
            <stop offset="52%" stopColor="#cbb097" />
            <stop offset="100%" stopColor="#5d4c3b" />
          </linearGradient>
        ))}
        {(["left", "right"] as Side[]).map((side) => (
          <linearGradient
            key={side}
            id={`umbra-shade-${side}`}
            x1={side === "left" ? "0" : "1"}
            y1="0"
            x2={side === "left" ? "1" : "0"}
            y2="0"
          >
            <stop offset="0%" stopColor="#22305a" stopOpacity="0.66" />
            <stop offset="100%" stopColor="#22305a" stopOpacity="0.12" />
          </linearGradient>
        ))}
        <radialGradient id="umbra-sun">
          <stop offset="0%" stopColor="#fff3d8" />
          <stop offset="55%" stopColor="#ffd79a" />
          <stop offset="100%" stopColor="#ffd79a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width={W} height={G} fill="url(#umbra-sky)" />
      <circle cx={sun.x} cy={sun.y} r="8.5" fill="url(#umbra-sun)" />
      <circle data-sun cx={sun.x} cy={sun.y} r="3.4" fill="#fff6e2" />

      <rect x="0" y={G} width={W} height={H - G} fill="url(#umbra-sand)" />
      <line x1="0" y1={G} x2={W} y2={G} stroke="#6f5238" strokeWidth="0.4" />

      {/* every shadow on its own row, or three of them read as one sheet */}
      {pieces.map((piece) => (
        <ShadowOf key={piece.id} piece={piece} light={light} />
      ))}
      <ShadowOf piece={borrowed} light={borrowedLight} />

      {pieces.map((piece) => (
        <g
          key={piece.id}
          data-piece={piece.id}
          data-height={piece.height}
          data-width={piece.width}
          data-lift={piece.lift ?? 0}
        >
          <Shape piece={piece} side={light.side} />
        </g>
      ))}
      <g
        data-piece={borrowed.id}
        data-height={borrowed.height}
        data-width={borrowed.width}
        data-lift={borrowed.lift ?? 0}
        data-borrowed
      >
        <Shape piece={borrowed} side={borrowedLight.side} />
      </g>
    </svg>
  );
}
