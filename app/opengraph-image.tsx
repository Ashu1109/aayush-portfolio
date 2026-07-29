import { ImageResponse } from "next/og";
import { CONTACT } from "@/lib/resume";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Aayush Kumar · Full Stack AI Engineer";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          background: "#09090b",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "flex-end",
          padding: "72px 80px",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#fbbf24",
            display: "flex",
            fontSize: 26,
            letterSpacing: "0.35em",
          }}
        >
          FULL STACK AI ENGINEER
        </div>
        <div
          style={{
            color: "#fafafa",
            display: "flex",
            fontSize: 148,
            fontWeight: 700,
            lineHeight: 1.02,
            marginTop: 18,
          }}
        >
          {CONTACT.name.toUpperCase()}
        </div>
        <div
          style={{
            color: "#a1a1aa",
            display: "flex",
            fontSize: 30,
            lineHeight: 1.4,
            marginTop: 28,
          }}
        >
          Multi-agent systems · Event-driven platforms · Chat with my AI resume
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 14,
            marginTop: 40,
          }}
        >
          <div
            style={{
              background: "#fbbf24",
              borderRadius: 999,
              display: "flex",
              height: 14,
              width: 14,
            }}
          />
          <div style={{ color: "#71717a", display: "flex", fontSize: 24 }}>
            aayush-portfolio-flax.vercel.app
          </div>
        </div>
      </div>
    ),
    size
  );
}
