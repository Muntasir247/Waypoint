import { ImageResponse } from "next/og";

export const alt = "Waypoint | Tech Lead Task Assignment & Tracking";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "60px 80px",
        backgroundColor: "#0f172a",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top branding badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            backgroundColor: "#4f46e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: "32px",
          }}
        >
          🧭
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              fontSize: "36px",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#f8fafc",
            }}
          >
            Waypoint
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#818cf8",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Precision Engineering Command
          </span>
        </div>
      </div>

      {/* Main Headline & Description */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "960px",
        }}
      >
        <h1
          style={{
            fontSize: "52px",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            margin: 0,
          }}
        >
          Built for tech leads who need to assign work wisely and ship on time.
        </h1>
        <p
          style={{
            fontSize: "24px",
            lineHeight: 1.4,
            color: "#94a3b8",
            margin: 0,
          }}
        >
          Smart assignment heuristics • Real-time capacity balance • Gamified scoring ledger
        </p>
      </div>

      {/* Bottom Colorful Pills matching Notion-like theme */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            backgroundColor: "#4338ca",
            color: "#e0e7ff",
            padding: "8px 18px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            display: "flex",
          }}
        >
          ✨ Smart Allocation
        </div>
        <div
          style={{
            backgroundColor: "#065f46",
            color: "#d1fae5",
            padding: "8px 18px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            display: "flex",
          }}
        >
          📊 Capacity Tracking
        </div>
        <div
          style={{
            backgroundColor: "#7c2d12",
            color: "#ffedd5",
            padding: "8px 18px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            display: "flex",
          }}
        >
          ⚖️ Scoring Ledger
        </div>
        <div
          style={{
            backgroundColor: "#701a75",
            color: "#fae8ff",
            padding: "8px 18px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            display: "flex",
          }}
        >
          🚀 Multi-View Kanban & Gantt
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
