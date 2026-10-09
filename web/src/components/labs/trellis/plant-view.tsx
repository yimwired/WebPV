import { memo, useLayoutEffect, useRef, type CSSProperties } from "react";

import { DETAIL_AT, type Plant } from "./plant";
import type { Piece } from "./weave";

interface PlantViewProps {
  plant: Plant;
  /** em, the origin of its letter in the design */
  x: number;
  y: number;
  /** stems go behind the letters; leaves, roses and the crossings that pass in front go over them */
  layer: "back" | "front";
  /** front only: the stretches of vine that cross a letter in front of it */
  pieces?: Piece[];
  dying: boolean;
  /** ms added to every start time, so a word put in at once grows left to right */
  offset: number;
  /** flips between two values to replay the shake when a pointer passes */
  rustle?: "a" | "b";
}

const timing = (at: number, duration?: number) =>
  ({
    "--at": `${Math.round(at)}ms`,
    ...(duration === undefined ? {} : { "--dur": `${Math.round(duration)}ms` }),
  }) as CSSProperties;

/**
 * One character's plant, half of it. The back and front halves of the same
 * plant are separate elements on either side of the text, so the letters really
 * do sit between the stems and the flowers; both carry the same wind, so they
 * move as one.
 *
 * Memoised because typing re-renders the stage on every key, and a plant that
 * was already grown must not be touched.
 */
export const PlantView = memo(function PlantView({ plant, x, y, layer, pieces, dying, offset, rustle }: PlantViewProps) {
  const { bounds } = plant;
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const svgRef = useRef<SVGSVGElement>(null);
  const mountedAt = useRef<number | null>(null);

  // A crossing that appears after the plant mounted (a letter typed under an
  // old vine) is pushed back by the time since, so it shows already drawn
  // rather than growing a second time.
  useLayoutEffect(() => {
    const now = performance.now();
    mountedAt.current ??= now;
    const late = now - mountedAt.current;
    svgRef.current?.querySelectorAll<SVGElement>("[data-piece]:not([data-placed])").forEach((el) => {
      el.style.setProperty("--late", `${Math.round(late)}ms`);
      el.dataset.placed = "";
    });
  }, [pieces]);

  const wrapper = {
    left: `${x}em`,
    top: `${y}em`,
    transformOrigin: `${plant.root.x}em ${plant.root.y}em`,
    "--sway": `${plant.swaySeconds.toFixed(2)}s`,
    "--sway-at": `${plant.swayOffset.toFixed(2)}s`,
    "--offset": `${offset}ms`,
  } as CSSProperties;

  return (
    <div
      className="tr-plant"
      style={wrapper}
      data-dying={dying ? "" : undefined}
      data-layer={layer}
      data-rustle={rustle}
    >
      <svg
        ref={svgRef}
        viewBox={`${bounds.minX} ${bounds.minY} ${width} ${height}`}
        style={{ left: `${bounds.minX}em`, top: `${bounds.minY}em`, width: `${width}em`, height: `${height}em` }}
        aria-hidden
        focusable="false"
      >
        {layer === "back" ? (
          plant.vines.map((vine, i) => (
            <g key={`v${i}`}>
              <path className="tr-vine" d={vine.d} pathLength={1} style={timing(vine.delay, vine.duration)} />
              {vine.thorns ? (
                <path className="tr-thorns" d={vine.thorns} style={timing(vine.delay + vine.duration * 0.6)} />
              ) : null}
            </g>
          ))
        ) : (
          <>
            {pieces?.map((piece) => (
              <g key={piece.key} data-piece="" style={timing(piece.delay, piece.duration)}>
                <path className="tr-front" d={piece.d} pathLength={1} />
              </g>
            ))}
            {plant.leaves.map((leaf, i) => (
              <g key={`l${i}`} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}>
                <g className="tr-leaf" style={timing(leaf.delay)}>
                  <path d={leaf.d} />
                  <path className="tr-rib" d={leaf.rib} />
                </g>
              </g>
            ))}
            {plant.buds.map((bud, i) => (
              <g key={`b${i}`} transform={`translate(${bud.x} ${bud.y})`}>
                <path className="tr-bud" d={bud.d} style={timing(bud.delay)} />
              </g>
            ))}
            {plant.roses.map((rose, i) => (
              <g key={`r${i}`} transform={`translate(${rose.x} ${rose.y})`}>
                <g className="tr-rose" style={timing(rose.delay)}>
                  <path className="tr-head" d={rose.d} />
                  {rose.detail ? (
                    <path className="tr-detail" d={rose.detail} pathLength={1} style={timing(rose.delay + DETAIL_AT)} />
                  ) : null}
                </g>
              </g>
            ))}
          </>
        )}
      </svg>
    </div>
  );
});
