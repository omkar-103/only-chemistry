"use client";
// ─────────────────────────────────────────────────────────────
// MarqueeStrip — Neo-Brutalist scrolling exam ticker
// Black background, white/yellow text, CSS-only animation
// Respects prefers-reduced-motion via CSS
// ─────────────────────────────────────────────────────────────

interface MarqueeStripProps {
  reversed?: boolean;
}

const ITEMS = [
  "JEE Main",
  "JEE Advanced",
  "GATE",
  "MHT-CET",
  "CSIR NET",
  "UGC NET",
  "SET",
];

export default function MarqueeStrip({ reversed = false }: MarqueeStripProps) {
  // Duplicate items so the loop is seamless
  const doubled = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div
      aria-hidden="true"
      style={{
        background: "#000",
        borderTop: "4px solid #000",
        borderBottom: "4px solid #000",
        overflow: "hidden",
        padding: "14px 0",
        fontFamily: "var(--font-neo)",
      }}
    >
      <div
        className={reversed ? "neo-marquee-track-reverse" : "neo-marquee-track"}
        style={{ display: "flex", gap: 0 }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              whiteSpace: "nowrap",
              fontWeight: 800,
              fontSize: "1rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: i % 2 === 0 ? "#fff" : "#FFD93D",
              padding: "0 1.5rem",
            }}
          >
            {item}
            <span style={{ color: "#FFD93D", fontWeight: 900 }}>★</span>
          </span>
        ))}
      </div>
    </div>
  );
}
