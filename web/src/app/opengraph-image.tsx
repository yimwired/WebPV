import { ImageResponse } from "next/og";
import { withCounts } from "@/lib/counts";
import { SITE_HOST } from "@/lib/site";

export const alt = "Nuttapon Yimnoi (Film), websites you can try before you hire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// `output: "export"` needs image routes pinned static too.
export const dynamic = "force-static";

const BRAND = "#f7a445";
const LINE = "rgba(250,250,250,0.14)";

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
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "24px",
            color: "rgba(250,250,250,0.55)",
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
            color: "rgba(250,250,250,0.6)",
          }}
        >
          <div style={{ display: "flex", gap: "36px" }}>
            <div>{withCounts("{labs} live examples")}</div>
            <div>{withCounts("From {fromPrice} THB")}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{ width: "10px", height: "10px", backgroundColor: BRAND }}
            />
            <div>{SITE_HOST}</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
