"use client";
// ─────────────────────────────────────────────────────────────
// AboutSection — Editorial "Why OnlyChemistry?" statement
// RESPONSIVE FIX:
//   - Decorative formulas clipped inside container
//   - Body text grid: 1col mobile, 3col desktop
//   - No fixed widths on any element
// ─────────────────────────────────────────────────────────────
import { motion } from "framer-motion";

export default function AboutSection() {
  return (
    <section
      id="about"
      style={{
        background: "var(--neo-bg)",
        padding: "4rem 0",
        borderBottom: "4px solid #000",
        fontFamily: "var(--font-neo)",
        width: "100%",
        overflowX: "clip",
      }}
    >
      <div
        style={{
          maxWidth: "88rem",
          margin: "0 auto",
          padding: "0 1.25rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          style={{
            background: "#000",
            border: "4px solid #000",
            boxShadow: "10px 10px 0 #FFD93D",
            padding: "clamp(1.5rem, 5vw, 3.5rem)",
            position: "relative",
            overflow: "hidden", /* clips the decorative formulas */
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Decorative background formulas — absolute inside overflow:hidden parent */}
          {["H₂O", "NaCl", "C₆H₆", "→"].map((f, i) => (
            <div
              key={i}
              aria-hidden="true"
              style={{
                position: "absolute",
                fontSize: [70, 52, 80, 90][i],
                fontWeight: 900,
                color: "rgba(255,217,61,0.07)",
                userSelect: "none",
                pointerEvents: "none",
                top: ["8%", "50%", "-8%", "55%"][i],
                right: ["-1%", "6%", "38%", "-3%"][i],
                transform: `rotate(${[-8, 6, 14, -20][i]}deg)`,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {f}
            </div>
          ))}

          {/* Main editorial statement */}
          <p
            style={{
              fontSize: "clamp(1.4rem, 5vw, 2.8rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 1.1,
              color: "#fff",
              marginBottom: "2rem",
              position: "relative",
              zIndex: 1,
            }}
          >
            Chemistry isn&apos;t hard.
            <br />
            <span
              style={{
                background: "#FFD93D",
                color: "#000",
                padding: "0 8px",
                display: "inline-block",
              }}
            >
              Bad preparation
            </span>{" "}
            is.
          </p>

          {/* Three-column body — responsive via injected style */}
          <style>{`
            .about-pillars {
              display: grid;
              grid-template-columns: 1fr;
              gap: 1.25rem;
              position: relative;
              z-index: 1;
              width: 100%;
            }
            @media (min-width: 640px) {
              .about-pillars { grid-template-columns: repeat(3, 1fr); }
            }
          `}</style>
          <div className="about-pillars">
            {[
              {
                head: "Expert-Curated Content",
                body: "Every question, every explanation, and every mock test is crafted by chemistry professionals who have mastered competitive exam patterns.",
              },
              {
                head: "Exam-Grade Security",
                body: "Fullscreen enforcement, tab monitoring, and auto-submission — the closest simulation to the real exam environment you can get online.",
              },
              {
                head: "Built for Serious Students",
                body: "OnlyChemistry doesn't offer everything for everyone. It offers everything a chemistry student needs — structured, focused and effective.",
              },
            ].map((item) => (
              <div key={item.head} style={{ minWidth: 0 }}>
                <h3
                  style={{
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#FFD93D",
                    marginBottom: "0.5rem",
                  }}
                >
                  {item.head}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.75)",
                    lineHeight: 1.65,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Since 2024 badge — safely positioned inside overflow:hidden */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "1rem",
              right: "1.25rem",
              background: "#FFD93D",
              border: "3px solid #fff",
              padding: "5px 12px",
              fontWeight: 800,
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              transform: "rotate(2deg)",
              zIndex: 2,
            }}
          >
            Since 2024
          </div>
        </motion.div>
      </div>
    </section>
  );
}
