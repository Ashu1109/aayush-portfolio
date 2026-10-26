import { CONTACT } from "@/lib/resume";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Aayush Kumar · Full Stack AI Engineer";

export default async function Image() {
  const sprite = await readFile(join(process.cwd(), "app/icon.png"), "base64");

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          background: "#0b130e",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "flex-end",
          padding: "72px 80px",
          position: "relative",
          width: "100%",
        }}
      >
        <img
          alt=""
          height={260}
          src={`data:image/png;base64,${sprite}`}
          style={{ position: "absolute", right: 72, top: 48 }}
          width={260}
        />
        <div
          style={{
            color: "#a4cd79",
            display: "flex",
            fontSize: 26,
            letterSpacing: "0.35em",
          }}
        >
          FULL STACK AI ENGINEER
        </div>
        <div
          style={{
            color: "#edecda",
            display: "flex",
            fontSize: 124,
            fontWeight: 700,
            lineHeight: 1.02,
            marginTop: 18,
          }}
        >
          {CONTACT.name}
        </div>
        <div
          style={{
            color: "#9ea899",
            display: "flex",
            fontSize: 30,
            lineHeight: 1.4,
            marginTop: 28,
          }}
        >
          FilmOS / LoglineOS / Multi-agent platforms
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
              background: "#a4cd79",
              borderRadius: 999,
              display: "flex",
              height: 14,
              width: 14,
            }}
          />
          <div style={{ color: "#707b70", display: "flex", fontSize: 24 }}>
            aayush-portfolio-flax.vercel.app
          </div>
        </div>
      </div>
    ),
    size
  );
}
