"use client";
// ─────────────────────────────────────────────────────────────
// FeatureGrid — Everything You Need to Succeed
// RESPONSIVE FIX:
//   Mobile:  1 column
//   Tablet:  2 columns
//   Desktop: 3 columns
// Cards use min-width:0, no auto-fill that forces overflow
// ─────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import {
  BookOpen,
  FlaskConical,
  BarChart3,
  PlayCircle,
  TrendingUp,
  MessageSquare,
} from "lucide-react";

const FEATURES = [
  {
    icon: <BookOpen size={23} strokeWidth={2.5} />,
    title: "Comprehensive Study Material",
    desc: "From NCERT fundamentals to advanced competitive level. Structured topic-wise for every major exam.",
    bg: "#FFD93D",
  },
  {
    icon: <FlaskConical size={23} strokeWidth={2.5} />,
    title: "Topic-Wise Practice",
    desc: "Thousands of questions with detailed solutions. Organised by chapter, difficulty and exam pattern.",
    bg: "#fff",
  },
  {
    icon: <BarChart3 size={23} strokeWidth={2.5} />,
    title: "Mock Tests",
    desc: "Realistic exam patterns with full-length mock tests. Anti-cheat fullscreen mode with auto-submission.",
    bg: "#C4B5FD",
  },
  {
    icon: <PlayCircle size={23} strokeWidth={2.5} />,
    title: "Video Lectures",
    desc: "Concepts explained by expert chemistry faculty. Accessible by assigned course category.",
    bg: "#fff",
  },
  {
    icon: <TrendingUp size={23} strokeWidth={2.5} />,
    title: "Performance Tracking",
    desc: "Detailed score reports, question-wise analysis and time management insights to help you improve.",
    bg: "#FFD93D",
  },
  {
    icon: <MessageSquare size={23} strokeWidth={2.5} />,
    title: "Expert Doubt Support",
    desc: "Private doubt resolution system. Submit your chemistry questions and get personalised expert answers.",
    bg: "#FF6B6B",
  },
] as const;

export default function FeatureGrid() {
  return (
    <section
      id="features"
      style={{
        background: "#000",
        padding: "3.5rem 0",
        fontFamily: "var(--font-neo)",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: "88rem",
          margin: "0 auto",
          padding: "0 1.375rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Section header */}
        <div style={{ marginBottom: "2.75rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.385rem",
              border: "2.2px solid #000",
              borderRadius: "9999px",
              background: "#FFD93D",
              fontFamily: "var(--font-neo)",
              fontWeight: 700,
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.25rem 0.65rem",
              boxShadow: "2px 2px 0 #000",
              marginBottom: "0.65rem",
            }}
          >
            ✦ Features
          </div>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4.5vw, 3.15rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              lineHeight: 1,
              color: "#fff",
            }}
          >
            Everything You Need
            <br />
            <span style={{ color: "#FFD93D" }}>To Succeed.</span>
          </h2>
        </div>

        {/* Responsive feature grid */}
        <style>{`
          .feature-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
            width: 100%;
          }
          @media (min-width: 560px) {
            .feature-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (min-width: 900px) {
            .feature-grid { grid-template-columns: repeat(3, 1fr); }
          }
        `}</style>
        <div className="feature-grid">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              style={{
                background: feat.bg,
                border: "3px solid #fff",
                boxShadow: "5px 5px 0 #fff",
                padding: "1.35rem",
                minWidth: 0,
                boxSizing: "border-box",
                transition: "transform 120ms ease, box-shadow 120ms ease",
              }}
              whileHover={{ y: -5, boxShadow: "10px 12px 0 #fff" }}
            >
              {/* Icon block */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 43,
                  height: 43,
                  border: "2px solid #000",
                  background: "#000",
                  marginBottom: "0.9rem",
                  boxShadow: "2px 2px 0 #000",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {feat.icon}
              </div>

              <h3
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(0.78rem, 2vw, 0.9rem)",
                  letterSpacing: "-0.01em",
                  textTransform: "uppercase",
                  color: "#000",
                  marginBottom: "0.35rem",
                  lineHeight: 1.2,
                }}
              >
                {feat.title}
              </h3>
              <p
                style={{
                  fontSize: "0.73rem",
                  fontWeight: 500,
                  color: "#222",
                  lineHeight: 1.6,
                }}
              >
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
