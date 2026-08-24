"use client";
// ─────────────────────────────────────────────────────────────
// StatsStrip — Bold Neo-Brutalist statistics bar
// RESPONSIVE FIX: 3 columns on desktop, 2+1 layout on mobile
// ─────────────────────────────────────────────────────────────

const STATS = [
  { value: "50,000+", label: "Students Trust Us" },
  { value: "4.9 / 5", label: "Student Rating" },
  { value: "1,000+",  label: "Hours of Content" },
] as const;

export default function StatsStrip() {
  return (
    <div
      style={{
        border: "4px solid #000",
        boxShadow: "5px 5px 0 #000",
        background: "#fff",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {/* Injected responsive rule — avoids inline vs Tailwind conflict */}
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          width: 100%;
        }
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .stats-grid .stat-cell:last-child {
            grid-column: 1 / -1;
            border-top: 4px solid #000;
            border-right: none !important;
          }
        }
      `}</style>
      <div className="stats-grid">
        {STATS.map((stat, i) => (
          <div
            key={stat.value}
            className="stat-cell"
            style={{
              borderRight: i < STATS.length - 1 ? "4px solid #000" : "none",
              padding: "clamp(10px, 3vw, 18px) 8px",
              textAlign: "center",
              fontFamily: "var(--font-neo)",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: "clamp(1.1rem, 4vw, 1.8rem)",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "#000",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "clamp(0.55rem, 1.4vw, 0.65rem)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 4,
                color: "#000",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
