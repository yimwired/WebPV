import { ImageResponse } from "next/og";

export const alt = "Film — Builder of bots, tools & content";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(720px 420px at 18% 0%, rgba(99,102,241,0.28), transparent 65%), radial-gradient(720px 420px at 88% 100%, rgba(34,211,238,0.20), transparent 65%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              backgroundColor: "#fafafa",
              color: "#09090b",
              fontSize: "30px",
              fontWeight: 700,
            }}
          >
            F
          </div>
          <div style={{ fontSize: "30px", color: "rgba(250,250,250,0.75)" }}>
            Film
          </div>
        </div>

        <div
          style={{
            marginTop: "48px",
            fontSize: "84px",
            fontWeight: 700,
            letterSpacing: "-3px",
            lineHeight: 1.05,
          }}
        >
          I build things that ship.
        </div>

        <div
          style={{
            marginTop: "28px",
            fontSize: "32px",
            color: "rgba(250,250,250,0.6)",
          }}
        >
          Trading systems · AI assistants · Dashboards · Content
        </div>

        <div
          style={{
            marginTop: "56px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "4px",
              borderRadius: "2px",
              backgroundImage:
                "linear-gradient(90deg, #818cf8, #67e8f9, #c4b5fd)",
            }}
          />
          <div style={{ fontSize: "26px", color: "rgba(250,250,250,0.5)" }}>
            webpv.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
