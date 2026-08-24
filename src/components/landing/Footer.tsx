"use client";
// ─────────────────────────────────────────────────────────────
// Footer — Neo-Brutalist footer
// RESPONSIVE FIX:
//   Mobile:  single column (stacked)
//   Desktop: multi-column grid
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { ROUTES } from "@/constants";

const FOOTER_COLS = [
  {
    heading: "Exams",
    links: [
      { label: "JEE Main",     href: `${ROUTES.STUDENT.EXAMS}?category=JEE%20Main` },
      { label: "JEE Advanced", href: `${ROUTES.STUDENT.EXAMS}?category=JEE%20Advanced` },
      { label: "GATE",         href: `${ROUTES.STUDENT.EXAMS}?category=GATE` },
      { label: "MHT-CET",      href: `${ROUTES.STUDENT.EXAMS}?category=MHT-CET` },
      { label: "CSIR NET",     href: `${ROUTES.STUDENT.EXAMS}?category=CSIR%20NET` },
      { label: "UGC NET",      href: `${ROUTES.STUDENT.EXAMS}?category=UGC%20NET` },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Login",    href: ROUTES.LOGIN },
      { label: "Register", href: ROUTES.REGISTER },
      { label: "Exams",    href: ROUTES.STUDENT.EXAMS },
      { label: "Videos",   href: ROUTES.STUDENT.VIDEOS },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use",   href: "/terms" },
      { label: "Contact",        href: "mailto:support@onlychemistry.com" },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer
      style={{
        background: "#000",
        borderTop: "4px solid #FFD93D",
        fontFamily: "var(--font-neo)",
        padding: "3rem 0 1.75rem",
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
        {/* Responsive footer columns */}
        <style>{`
          .footer-top {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }
          @media (min-width: 560px) {
            .footer-top { grid-template-columns: repeat(2, 1fr); }
          }
          @media (min-width: 900px) {
            .footer-top { grid-template-columns: 1.5fr repeat(3, 1fr); }
          }
        `}</style>
        <div className="footer-top">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                textDecoration: "none",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  background: "#FFD93D",
                  border: "2px solid #fff",
                  padding: "3px 5px",
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                <FlaskConical size={18} color="#000" strokeWidth={2.5} />
              </div>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: "1rem",
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                Only<span style={{ color: "#FFD93D" }}>Chemistry</span>
              </span>
            </Link>
            <p
              style={{
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.65,
                maxWidth: 240,
              }}
            >
              India&apos;s premier chemistry education platform. Expert preparation for JEE, GATE, NET &amp; more.
            </p>
          </div>

          {/* Nav columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading} style={{ minWidth: 0 }}>
              <h4
                style={{
                  fontWeight: 800,
                  fontSize: "0.65rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#FFD93D",
                  marginBottom: "0.75rem",
                }}
              >
                {col.heading}
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.55)",
                        textDecoration: "none",
                        transition: "color 100ms",
                        display: "block",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#FFD93D")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: "1.25rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", margin: 0 }}>
            © {new Date().getFullYear()} Only Chemistry. All rights reserved.
          </p>
          <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", margin: 0 }}>
            Website created by Omkar Parelkar.
          </p>
        </div>
      </div>
    </footer>
  );
}
