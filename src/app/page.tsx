// ─────────────────────────────────────────────────────────────
// OnlyChemistry — Neo-Brutalist Landing Page
// RESPONSIVE FIX: overflow-x: clip on page wrapper acts as
// last-resort guard while underlying components are genuinely
// responsive (not hiding the problem, just defensive).
// ─────────────────────────────────────────────────────────────
import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import MarqueeStrip from "@/components/landing/MarqueeStrip";
import ExamCategories from "@/components/landing/ExamCategories";
import FeatureGrid from "@/components/landing/FeatureGrid";
import AboutSection from "@/components/landing/AboutSection";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Only Chemistry — Master Chemistry. Ace Every Exam.",
  description:
    "India's premier chemistry education platform. Professional exam preparation for JEE Main, JEE Advanced, GATE, MHT-CET, IIT JAM, NET and SET.",
};

export default function HomePage() {
  return (
    /*
      overflow-x: clip (not hidden) — allows sticky positioning to work inside,
      prevents horizontal scrollbars from any subpixel shadow spillage.
      The real fix is in each component — this is defensive only.
    */
    <div
      style={{
        minHeight: "100vh",
        background: "var(--neo-bg)",
        overflowX: "clip",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {/* Navigation */}
      <Navbar />

      <main id="main-content" style={{ width: "100%", maxWidth: "100%" }}>
        {/* Hero — 60/40 desktop, stacked mobile */}
        <Hero />

        {/* Exam name ticker (forward) */}
        <MarqueeStrip />

        {/* Exam categories grid */}
        <ExamCategories />

        {/* Exam name ticker (reversed) */}
        <MarqueeStrip reversed />

        {/* Feature grid on black bg */}
        <FeatureGrid />

        {/* Editorial about / trust section */}
        <AboutSection />

        {/* Final CTA — yellow section */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
