"use client";
// ─────────────────────────────────────────────────────────────
// FinalCTA — Giant yellow section with strong call to action
// RESPONSIVE FIX:
//   - Decorative stickers clipped inside section (overflow:hidden)
//   - Buttons stack vertically on small screens
//   - Typography uses clamp()
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants";

export default function FinalCTA() {
  return (
    <section
      style={{
        background: "#FFD93D",
        borderTop: "4px solid #000",
        borderBottom: "4px solid #000",
        padding: "3.5rem 0",
        fontFamily: "var(--font-neo)",
        position: "relative",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Decorative stickers — clipped by overflow:hidden */}
      {["H₂O", "⚗️", "★", "NaCl", "⚛️"].map((s, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            fontSize: [55, 44, 64, 44, 55][i],
            fontWeight: 900,
            color: "rgba(0,0,0,0.06)",
            userSelect: "none",
            pointerEvents: "none",
            top: ["6%", "50%", "12%", "62%", "4%"][i],
            left: ["-2%", "3%", "88%", "80%", "48%"][i],
            transform: `rotate(${[-10, 8, 15, -6, 20][i]}deg)`,
            whiteSpace: "nowrap",
          }}
        >
          {s}
        </div>
      ))}

      <div
        style={{
          maxWidth: "88rem",
          margin: "0 auto",
          padding: "0 1.25rem",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              border: "2px solid #000",
              borderRadius: "9999px",
              background: "#000",
              color: "#FFD93D",
              fontFamily: "var(--font-neo)",
              fontWeight: 700,
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.25rem 0.65rem",
              boxShadow: "2px 2px 0 #000",
              marginBottom: "0.9rem",
            }}
          >
            🚀 Ready to begin?
          </div>

          {/* Headline */}
          <h2
            style={{
              fontSize: "clamp(1.8rem, 7.2vw, 5.4rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              lineHeight: 0.95,
              color: "#000",
              marginBottom: "1.1rem",
            }}
          >
            <span style={{ display: "block" }}>Ready to Master</span>
            <span style={{ display: "block" }}>Chemistry?</span>
          </h2>

          {/* Three-phrase tagline */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "clamp(0.5rem, 2vw, 1.5rem)",
              marginBottom: "2rem",
            }}
          >
            {["Prepare Smarter.", "Practice Harder.", "Perform Better."].map((line) => (
              <span
                key={line}
                style={{
                  fontWeight: 700,
                  fontSize: "clamp(0.78rem, 2vw, 0.9rem)",
                  letterSpacing: "0.03em",
                  color: "#000",
                  whiteSpace: "nowrap",
                }}
              >
                {line}
              </span>
            ))}
          </div>

          {/* CTA buttons — responsive stacking */}
          <style>{`
            .cta-buttons {
              display: flex;
              gap: 0.75rem;
              justify-content: center;
              flex-wrap: wrap;
              width: 100%;
            }
            .cta-btn-primary, .cta-btn-secondary {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-family: var(--font-neo);
              font-weight: 700;
              font-size: clamp(0.72rem, 2vw, 0.9rem);
              letter-spacing: 0.05em;
              text-transform: uppercase;
              border: 3px solid #000;
              box-shadow: 3px 3px 0 #000;
              padding: 10px 20px;
              text-decoration: none;
              cursor: pointer;
              transition: transform 100ms, box-shadow 100ms;
              white-space: nowrap;
            }
            .cta-btn-primary { background: #000; color: #fff; }
            .cta-btn-secondary { background: #FFD93D; color: #000; }
            .cta-btn-primary:hover, .cta-btn-secondary:hover {
              transform: translateY(-2px);
              box-shadow: 6px 6px 0 #000;
            }
            @media (max-width: 400px) {
              .cta-btn-primary, .cta-btn-secondary {
                width: 100%;
              }
            }
          `}</style>
          <div className="cta-buttons">
            <Link href={ROUTES.REGISTER} className="cta-btn-primary">
              Start Your Journey →
            </Link>
            <a href="#categories" className="cta-btn-secondary">
              Explore Exams
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
