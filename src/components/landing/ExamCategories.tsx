"use client";
// ─────────────────────────────────────────────────────────────
// ExamCategories — Neo-Brutalist exam card grid
// RESPONSIVE FIX:
//   Mobile:  1 column
//   Tablet:  2 columns
//   Desktop: 3 columns (max)
// Uses EXAM_CATEGORIES from constants — no hardcoded data
// EXAM_CATEGORIES shape: { value, label, color, icon }
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { motion } from "framer-motion";
import { EXAM_CATEGORIES, ROUTES } from "@/constants";

const DESCRIPTIONS: Record<string, string> = {
  "JEE Main":     "Engineering entrance — 90 questions, 3h",
  "JEE Advanced": "IIT admission — most rigorous level",
  "GATE":         "Graduate aptitude — M.Tech / PSU gateway",
  "MHT-CET":      "Maharashtra state engineering & pharmacy",
  "CSIR NET":     "National eligibility — JRF + lectureship",
  "UGC NET":      "University grants — assistant professor",
  "SET":          "State eligibility test — college lecturers",
};

export default function ExamCategories() {
  return (
    <section
      id="categories"
      style={{
        background: "var(--neo-bg)",
        padding: "4rem 0",
        borderBottom: "4px solid #000",
        fontFamily: "var(--font-neo)",
        width: "100%",
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
        {/* Section header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              border: "3px solid #000",
              borderRadius: "9999px",
              background: "#FFD93D",
              fontFamily: "var(--font-neo)",
              fontWeight: 700,
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.3rem 0.75rem",
              boxShadow: "2px 2px 0 #000",
              marginBottom: "0.75rem",
            }}
          >
            📋 Exam Catalogue
          </div>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              lineHeight: 1,
              color: "#000",
            }}
          >
            Exams We{" "}
            <span
              style={{
                background: "#FFD93D",
                border: "4px solid #000",
                padding: "0 8px",
                boxShadow: "4px 4px 0 #000",
                display: "inline-block",
              }}
            >
              Cover
            </span>
          </h2>
        </div>

        {/* Responsive exam grid */}
        <style>{`
          .exam-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
            width: 100%;
          }
          @media (min-width: 480px) {
            .exam-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (min-width: 900px) {
            .exam-grid { grid-template-columns: repeat(3, 1fr); }
          }
        `}</style>
        <div className="exam-grid">
          {EXAM_CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              style={{ minWidth: 0 }}
            >
              <Link
                href={`${ROUTES.STUDENT.EXAMS}?category=${encodeURIComponent(cat.value)}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  style={{
                    background: "#fff",
                    border: "4px solid #000",
                    boxShadow: "6px 6px 0 #000",
                    padding: "1.25rem",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "10px 11px 0 #000";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "none";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 6px 0 #000";
                  }}
                >
                  {/* Icon tile */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 48,
                      height: 48,
                      border: "3px solid #000",
                      background: "#FFD93D",
                      fontSize: "1.4rem",
                      marginBottom: "0.75rem",
                      boxShadow: "2px 2px 0 #000",
                      flexShrink: 0,
                    }}
                  >
                    {cat.icon}
                  </div>

                  <h3
                    style={{
                      fontWeight: 900,
                      fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
                      letterSpacing: "-0.01em",
                      textTransform: "uppercase",
                      color: "#000",
                      marginBottom: "0.35rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {cat.label}
                  </h3>

                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: "#444",
                      lineHeight: 1.5,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {DESCRIPTIONS[cat.value] ?? "Expert exam preparation"}
                  </p>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      borderBottom: "2px solid #000",
                      paddingBottom: "1px",
                      color: "#000",
                    }}
                  >
                    Explore →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
