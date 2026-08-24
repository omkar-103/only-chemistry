"use client";
// ─────────────────────────────────────────────────────────────
// Hero — Neo-Brutalist asymmetric hero
// RESPONSIVE FIX:
//   - Mobile (<768px): stacked, full-width, chemistry below CTA
//   - Tablet (768–1023px): single-col with chemistry visual
//   - Desktop (≥1024px): CSS grid 3fr 2fr, side-by-side
//
// ROOT-CAUSE FIX: Removed inline gridTemplateColumns that was
//   overriding the Tailwind lg:grid-cols class. The grid is now
//   controlled purely by CSS classes via a <style> element.
//
// h1 uses clamp(36px, 10vw, 110px) — fits at 320px.
// Block-level spans for deliberate line breaks on all screens.
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants";
import HeroChemistryVisual from "./HeroChemistryVisual";
import StatsStrip from "./StatsStrip";

const EXAMS = ["JEE Main", "JEE Advanced", "GATE", "MHT-CET", "CSIR NET", "UGC NET", "SET"];

export default function Hero() {
  return (
    <section
      className="neo-grid-bg hero-section"
      style={{
        paddingTop: "2.5rem",
        paddingBottom: "2.5rem",
        borderBottom: "4px solid #000",
        fontFamily: "var(--font-neo)",
        overflowX: "clip",
        width: "100%",
      }}
    >
      {/*
        ── Responsive grid styles ─────────────────────────────
        Injected via <style> to avoid inline-style vs Tailwind
        class conflict (inline style always wins in specificity).
        Mobile:  1 column
        Desktop: 3fr 2fr two-column side by side
      */}
      <style>{`
        .hero-inner {
          max-width: 88rem;
          margin: 0 auto;
          padding: 0 1.25rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
        }
        .hero-visual-desktop {
          display: none;
        }
        @media (min-width: 1024px) {
          .hero-inner {
            grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
            gap: 2.5rem;
            min-height: calc(100vh - 64px);
          }
          .hero-visual-desktop {
            display: block;
          }
          .hero-visual-mobile {
            display: none !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .hero-inner {
            grid-template-columns: 1fr;
            max-width: 640px;
          }
        }
      `}</style>

      <div className="hero-inner">
        {/* ── LEFT — Text content ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{ minWidth: 0, width: "100%" }}
        >
          {/* Badge sticker */}
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
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0.3rem 0.75rem",
              boxShadow: "2px 2px 0 #000",
              marginBottom: "1.25rem",
              maxWidth: "100%",
            }}
          >
            ⚗️ India&apos;s Premier Chemistry Platform
          </div>

          {/* Hero headline — block spans for controlled line breaks */}
          <h1
            style={{
              fontSize: "clamp(38px, 10vw, 110px)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              marginBottom: "1rem",
              color: "#000",
              wordBreak: "keep-all",
              overflowWrap: "normal",
            }}
          >
            <span style={{ display: "block" }}>Master</span>
            <span style={{ display: "block" }}>Chemistry.</span>
            <span
              style={{
                display: "inline-block",
                background: "#FFD93D",
                border: "4px solid #000",
                boxShadow: "5px 5px 0 #000",
                padding: "0 10px",
                marginTop: "0.1em",
                lineHeight: 1.05,
              }}
            >
              Ace Every
            </span>
            <span style={{ display: "block" }}>Exam.</span>
          </h1>

          {/* Supporting copy */}
          <p
            style={{
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "#333",
              lineHeight: 1.6,
              marginBottom: "0.75rem",
              maxWidth: "100%",
            }}
          >
            Professional exam preparation for:
          </p>

          {/* Exam badges — flex-wrap ensures no overflow */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.4rem",
              marginBottom: "1.5rem",
              maxWidth: "100%",
            }}
          >
            {EXAMS.map((exam) => (
              <span
                key={exam}
                style={{
                  border: "2px solid #000",
                  background: "#fff",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  boxShadow: "2px 2px 0 #000",
                  whiteSpace: "nowrap",
                }}
              >
                {exam}
              </span>
            ))}
          </div>

          {/* CTA buttons — responsive flex-wrap */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
              maxWidth: "100%",
            }}
          >
            <Link
              href={ROUTES.REGISTER}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-neo)",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: "#FFD93D",
                color: "#000",
                border: "4px solid #000",
                boxShadow: "4px 4px 0 #000",
                padding: "10px 20px",
                textDecoration: "none",
                transition: "transform 100ms, box-shadow 100ms",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "6px 6px 0 #000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "4px 4px 0 #000";
              }}
            >
              Start Your Journey →
            </Link>
            <a
              href="#categories"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-neo)",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: "#fff",
                color: "#000",
                border: "4px solid #000",
                boxShadow: "4px 4px 0 #000",
                padding: "10px 20px",
                textDecoration: "none",
                transition: "transform 100ms, box-shadow 100ms",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "6px 6px 0 #000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "4px 4px 0 #000";
              }}
            >
              Browse Exams
            </a>
          </div>

          {/* Stats strip */}
          <StatsStrip />

          {/* Mobile/Tablet chemistry visual — below stats, inside left column */}
          <div
            className="hero-visual-mobile"
            style={{
              marginTop: "1.5rem",
              border: "4px solid #000",
              boxShadow: "6px 6px 0 #000",
              background: "#FFFDF5",
              aspectRatio: "420 / 520",
              width: "100%",
              maxWidth: "420px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <HeroChemistryVisual />
          </div>
        </motion.div>

        {/* ── RIGHT — Chemistry visual (desktop only) ────────── */}
        <motion.div
          className="hero-visual-desktop"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
          style={{
            border: "4px solid #000",
            boxShadow: "10px 10px 0 #000",
            background: "#FFFDF5",
            position: "relative",
            overflow: "hidden",
            aspectRatio: "420 / 520",
            width: "100%",
            alignSelf: "center",
          }}
        >
          <HeroChemistryVisual />
        </motion.div>
      </div>
    </section>
  );
}
