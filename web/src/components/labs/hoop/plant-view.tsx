import { memo, type CSSProperties } from "react";
import type { Plant } from "./plant";

interface PlantViewProps {
  plant: Plant;
  /** em from the start of the line */
  x: number;
  /** which half to draw: stems and most leaves sit behind the letters, roses in front */
  layer: "back" | "front";
  dying: boolean;
  /** ms added to every start time, so a name filled in at once grows left to right */
  offset: number;
}

const at = (ms: number) => ({ "--at": `${Math.round(ms)}ms` }) as CSSProperties;

/**
 * One character's plant, half of it. The back and front halves of the same
 * plant are separate elements on either side of the text, so the letters really
 * do sit between the stems and the flowers; both carry the same sway, so they
 * move as one.
 *
 * Memoised because typing re-renders the stage on every key, and a plant that
 * was already grown must not be touched: its props only change when the text
 * before it does, or when it starts to wither.
 */
export const PlantView = memo(function PlantView({ plant, x, layer, dying, offset }: PlantViewProps) {
  const { bounds } = plant;
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  const wrapper = {
    left: `${x}em`,
    transformOrigin: `${plant.root.x}em ${plant.root.y}em`,
    "--sway": `${plant.swaySeconds.toFixed(2)}s`,
    "--sway-at": `${plant.swayOffset.toFixed(2)}s`,
    "--offset": `${offset}ms`,
  } as CSSProperties;

  return (
    <div className="hoop-plant" style={wrapper} data-dying={dying ? "" : undefined} data-layer={layer}>
      <svg
        viewBox={`${bounds.minX} ${bounds.minY} ${width} ${height}`}
        style={{
          left: `${bounds.minX}em`,
          top: `${bounds.minY}em`,
          width: `${width}em`,
          height: `${height}em`,
        }}
        aria-hidden
        focusable="false"
      >
        {layer === "back" ? (
          <>
            {plant.vines.map((vine, i) => (
              <path key={`v${i}`} className="hoop-vine" d={vine.d} pathLength={1} style={at(vine.delay)} />
            ))}
            {plant.leaves.map((leaf, i) =>
              leaf.front ? null : (
                <g key={`l${i}`} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}>
                  <path className="hoop-leaf" d={leaf.d} style={at(leaf.delay)} />
                </g>
              ),
            )}
          </>
        ) : (
          <>
            {plant.leaves.map((leaf, i) =>
              leaf.front ? (
                <g key={`l${i}`} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}>
                  <path className="hoop-leaf" d={leaf.d} style={at(leaf.delay)} />
                </g>
              ) : null,
            )}
            {plant.buds.map((bud, i) => (
              <g key={`b${i}`} transform={`translate(${bud.x} ${bud.y})`}>
                <path className="hoop-bud" d={bud.d} style={at(bud.delay)} />
              </g>
            ))}
            {plant.roses.map((rose, i) => (
              <g key={`r${i}`} transform={`translate(${rose.x} ${rose.y})`}>
                <g className="hoop-rose" style={at(rose.delay)}>
                  <path d={rose.d} />
                  {rose.detail ? (
                    <path className="hoop-detail" d={rose.detail} pathLength={1} style={at(rose.delay + 380)} />
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
