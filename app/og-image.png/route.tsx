/**
 * app/og-image.png/route.tsx
 *
 * Generates the Open Graph / Twitter card preview image at build time.
 * Served at /og-image.png — referenced by layout.tsx metadata.
 *
 * 1200×630px — standard OG image dimensions.
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d1f22 0%, #0f2d32 40%, #0a1a1d 100%)",
          fontFamily: "Georgia, serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(31,189,204,0.18) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Shield icon */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            background: "rgba(31,189,204,0.15)",
            border: "2px solid rgba(31,189,204,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1fbdcc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#f0fafb",
            marginBottom: 16,
            lineHeight: 1,
          }}
        >
          AllergEats
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: "rgba(161,220,226,0.85)",
            letterSpacing: "-0.01em",
            marginBottom: 48,
            fontFamily: "sans-serif",
          }}
        >
          Eat safely with food allergies
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {["Find Safe Restaurants", "Scan Any Menu", "Know Before You Order"].map((text) => (
            <div
              key={text}
              style={{
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(31,189,204,0.12)",
                border: "1px solid rgba(31,189,204,0.3)",
                color: "#7ddde6",
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              {text}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            color: "rgba(100,180,190,0.6)",
            fontSize: 18,
            fontFamily: "sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          allergeats.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
