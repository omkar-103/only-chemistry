"use client";
// ─────────────────────────────────────────────────────────────
// Navbar — Neo-Brutalist navigation
// RESPONSIVE FIX: hamburger at <1024px (lg), not <768px (md)
// No inline gridTemplateColumns or fixed widths
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { ROUTES } from "@/constants";

const NAV_LINKS = [
  { label: "Exams",          href: "#categories" },
  { label: "Courses",        href: "#features" },
  { label: "Study Material", href: "#features" },
  { label: "Practice",       href: "#categories" },
  { label: "About",          href: "#about" },
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--neo-bg)",
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
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              textDecoration: "none",
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <div
              style={{
                background: "#FFD93D",
                border: "3px solid #000",
                padding: "3px 5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FlaskConical size={20} color="#000" strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontWeight: 900,
                fontSize: "clamp(0.95rem, 2.5vw, 1.2rem)",
                letterSpacing: "-0.02em",
                color: "#000",
                whiteSpace: "nowrap",
              }}
            >
              Only<span style={{ color: "#FFD93D", WebkitTextStroke: "0.5px #000" }}>Chemistry</span>
            </span>
          </Link>

          {/* Desktop nav links — ONLY visible at ≥1024px */}
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex"
            style={{ alignItems: "center", gap: "0.1rem", flex: 1, justifyContent: "center" }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "#000",
                  textDecoration: "none",
                  padding: "6px 9px",
                  transition: "background 100ms",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FFD93D")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA — ONLY visible at ≥1024px */}
          <div
            className="hidden lg:flex"
            style={{ alignItems: "center", gap: "0.5rem", flexShrink: 0 }}
          >
            <Link
              href={ROUTES.LOGIN}
              style={{
                fontWeight: 700,
                fontSize: "0.78rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#000",
                textDecoration: "none",
                padding: "7px 12px",
                border: "2px solid transparent",
                transition: "border-color 100ms",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#000")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
            >
              Login
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="neo-btn neo-btn-primary"
              style={{ fontSize: "0.78rem", padding: "7px 16px" }}
            >
              Get Started →
            </Link>
          </div>

          {/* Mobile hamburger — visible at <1024px */}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden"
            style={{
              width: 44,
              height: 44,
              border: "3px solid #000",
              background: open ? "#FFD93D" : "#fff",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              flexShrink: 0,
              boxShadow: "2px 2px 0 #000",
              transition: "background 100ms",
            }}
          >
            <span
              style={{
                display: "block", width: 20, height: 2.5, background: "#000",
                transition: "transform 150ms, opacity 150ms",
                transform: open ? "translateY(7.5px) rotate(45deg)" : "none",
              }}
            />
            <span
              style={{
                display: "block", width: 20, height: 2.5, background: "#000",
                transition: "opacity 150ms",
                opacity: open ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block", width: 20, height: 2.5, background: "#000",
                transition: "transform 150ms",
                transform: open ? "translateY(-7.5px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </header>

      {/* Mobile menu panel — full viewport width, no overflow */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal={open}
        className="lg:hidden"
        style={{
          position: "fixed",
          top: 68,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99,
          background: "var(--neo-bg)",
          borderTop: "4px solid #000",
          overflowY: "auto",
          overflowX: "hidden",
          display: open ? "flex" : "none",
          flexDirection: "column",
          padding: "1rem",
          gap: "0.5rem",
          fontFamily: "var(--font-neo)",
        }}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              width: "100%",
              fontWeight: 800,
              fontSize: "1.3rem",
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: "#000",
              textDecoration: "none",
              padding: "14px 16px",
              border: "3px solid #000",
              background: "#fff",
              boxShadow: "3px 3px 0 #000",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FFD93D"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            {link.label}
          </a>
        ))}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
          <Link
            href={ROUTES.LOGIN}
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              width: "100%",
              fontWeight: 800,
              fontSize: "1.3rem",
              textTransform: "uppercase",
              color: "#000",
              textDecoration: "none",
              padding: "14px 16px",
              border: "3px solid #000",
              background: "#fff",
              boxShadow: "3px 3px 0 #000",
              boxSizing: "border-box",
            }}
          >
            Login
          </Link>
          <Link
            href={ROUTES.REGISTER}
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              width: "100%",
              fontWeight: 800,
              fontSize: "1.3rem",
              textTransform: "uppercase",
              color: "#000",
              textDecoration: "none",
              padding: "14px 16px",
              border: "3px solid #000",
              background: "#FFD93D",
              boxShadow: "3px 3px 0 #000",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            Get Started →
          </Link>
        </div>
      </div>
    </>
  );
}
