import { ImageResponse } from "next/og";
import { withCounts } from "@/lib/counts";
import { SITE_HOST } from "@/lib/site";

export const alt = "Nuttapon Yimnoi (Film), websites you can try before you hire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// `output: "export"` needs image routes pinned static too.
export const dynamic = "force-static";

// The midnight zone's tokens (`.dark` in globals.css) as hex, since the card is
// drawn outside the page and cannot read them: 16.3:1 for the ink, 8.65:1 for
// the muted lines, 9.90:1 for the gold.
const MIDNIGHT = "#0D1734";
const PEARL = "#F7F6F1";
const MUTED = "#AAB6CD";
const GOLD = "#E3BD70";
const LINE = "rgba(255,255,255,0.10)";

/**
 * Share card. Flat background and one accent, matching the site: a link
 * preview that promises a gradient the page does not have is a small lie.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: MIDNIGHT,
          color: PEARL,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "24px",
            color: MUTED,
          }}
        >
          <div>Nuttapon Yimnoi (Film)</div>
          <div>Bangkok</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "76px",
              fontWeight: 600,
              letterSpacing: "-2px",
              lineHeight: 1.08,
            }}
          >
            I build websites you can try before you hire me.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: `1px solid ${LINE}`,
            paddingTop: "28px",
            fontSize: "26px",
            color: MUTED,
          }}
        >
          <div style={{ display: "flex", gap: "36px" }}>
            <div>{withCounts("{labs} live examples")}</div>
            <div>{withCounts("From {fromPrice} THB")}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{ width: "10px", height: "10px", backgroundColor: GOLD }}
            />
            <div>{SITE_HOST}</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
