"use client";
// ─────────────────────────────────────────────────────────────
// HeroChemistryVisual — Neo-Brutalist chemistry poster
// RESPONSIVE FIX: Single SVG viewBox — scales perfectly at any size
// All artwork in SVG coordinate space. No fixed pixel containers.
// ─────────────────────────────────────────────────────────────

export default function HeroChemistryVisual() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100%",
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        background: "#FFFDF5",
      }}
    >
      <svg
        viewBox="0 0 420 520"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          fontFamily: "monospace",
        }}
      >
        {/* ── Faded background H₂O watermark ─────────────────── */}
        <text
          x="230" y="110"
          fontSize="90"
          fontWeight="900"
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="1.5"
          fontFamily="Arial Black, sans-serif"
          letterSpacing="-4"
        >
          H₂O
        </text>

        {/* ── Flask card (top-left area) ──────────────────────── */}
        {/* Card background */}
        <rect x="14" y="12" width="162" height="210" fill="#000" />
        <rect x="10" y="8" width="162" height="210" fill="#fff" stroke="#000" strokeWidth="4" />

        {/* Flask neck */}
        <rect x="63" y="30" width="28" height="52" rx="2" fill="#FFFDF5" stroke="#000" strokeWidth="2.5" />
        {/* Stopper */}
        <rect x="57" y="24" width="40" height="10" rx="2" fill="#FFD93D" stroke="#000" strokeWidth="2.5" />
        {/* Graduation marks */}
        <line x1="91" y1="40" x2="97" y2="40" stroke="#000" strokeWidth="1.5" />
        <line x1="91" y1="53" x2="100" y2="53" stroke="#000" strokeWidth="1.5" />
        <line x1="91" y1="66" x2="97" y2="66" stroke="#000" strokeWidth="1.5" />
        <text x="102" y="43" fontSize="7" fill="#000">50</text>
        <text x="102" y="56" fontSize="7" fill="#000">25</text>

        {/* Flask body */}
        <path
          d="M63 82 L30 158 Q28 168 40 168 L114 168 Q126 168 124 158 L91 82 Z"
          fill="#FFFDF5" stroke="#000" strokeWidth="2.5"
        />
        {/* Liquid */}
        <path
          d="M42 152 Q55 142 77 140 Q100 138 112 150 L114 168 L40 168 Z"
          fill="#FFD93D" stroke="none"
        />
        <path d="M42 152 Q77 138 112 150" stroke="#000" strokeWidth="1.5" fill="none" />
        {/* Bubbles */}
        <circle cx="62" cy="155" r="3.5" fill="none" stroke="#000" strokeWidth="1.5" />
        <circle cx="80" cy="148" r="2.5" fill="none" stroke="#000" strokeWidth="1.5" />
        <circle cx="94" cy="157" r="2" fill="none" stroke="#000" strokeWidth="1.5" />
        {/* Body measurements */}
        <line x1="124" y1="120" x2="116" y2="120" stroke="#000" strokeWidth="1.5" />
        <line x1="124" y1="138" x2="116" y2="138" stroke="#000" strokeWidth="1.5" />
        <text x="126" y="123" fontSize="7" fill="#000">100</text>
        <text x="126" y="141" fontSize="7" fill="#000">200</text>
        {/* Label */}
        <text x="77" y="188" fontSize="9" fill="#000" textAnchor="middle" fontWeight="700" letterSpacing="1">
          ERLENMEYER
        </text>
        <text x="77" y="200" fontSize="8" fill="#000" textAnchor="middle" fontWeight="600" letterSpacing="0.5">
          FLASK
        </text>

        {/* ── H₂O sticker (top-right, rotated 4°) ─────────────── */}
        <g transform="translate(258, 18) rotate(4, 50, 20)">
          <rect x="4" y="4" width="110" height="48" fill="#000" />
          <rect x="0" y="0" width="110" height="48" fill="#FFD93D" stroke="#000" strokeWidth="3.5" />
          <text x="55" y="33" fontSize="28" fontWeight="900" fill="#000" textAnchor="middle">H₂O</text>
        </g>

        {/* ── Molecule diagram (middle-right area) ─────────────── */}
        <g transform="translate(234, 80) rotate(-2, 80, 48)">
          <rect x="4" y="4" width="168" height="100" fill="#000" />
          <rect x="0" y="0" width="168" height="100" fill="#fff" stroke="#000" strokeWidth="3.5" />
          {/* Atoms */}
          <circle cx="26" cy="50" r="14" fill="#FFD93D" stroke="#000" strokeWidth="2" />
          <circle cx="80" cy="26" r="14" fill="#FF6B6B" stroke="#000" strokeWidth="2" />
          <circle cx="80" cy="74" r="14" fill="#C4B5FD" stroke="#000" strokeWidth="2" />
          <circle cx="134" cy="50" r="14" fill="#FFD93D" stroke="#000" strokeWidth="2" />
          {/* Bonds */}
          <line x1="40" y1="44" x2="66" y2="32" stroke="#000" strokeWidth="2.5" />
          <line x1="40" y1="56" x2="66" y2="68" stroke="#000" strokeWidth="2.5" />
          <line x1="94" y1="32" x2="120" y2="44" stroke="#000" strokeWidth="2.5" />
          <line x1="94" y1="68" x2="120" y2="56" stroke="#000" strokeWidth="2.5" />
          {/* Labels */}
          <text x="22" y="54" fontSize="10" fontWeight="900" fill="#000">C</text>
          <text x="75" y="30" fontSize="10" fontWeight="900" fill="#000">O</text>
          <text x="75" y="78" fontSize="10" fontWeight="900" fill="#000">H</text>
          <text x="129" y="54" fontSize="10" fontWeight="900" fill="#000">N</text>
          <text x="84" y="92" fontSize="8" fill="#000" textAnchor="middle" fontWeight="700" letterSpacing="1">MOLECULE</text>
        </g>

        {/* ── NaCl sticker ─────────────────────────────────────── */}
        <g transform="translate(296, 194) rotate(-5, 54, 26)">
          <rect x="4" y="4" width="108" height="52" fill="#000" />
          <rect x="0" y="0" width="108" height="52" fill="#fff" stroke="#000" strokeWidth="3.5" />
          <text x="54" y="34" fontSize="24" fontWeight="900" fill="#000" textAnchor="middle">NaCl</text>
        </g>

        {/* ── H₂SO₄ sticker ────────────────────────────────────── */}
        <g transform="translate(256, 268) rotate(3, 64, 26)">
          <rect x="4" y="4" width="130" height="52" fill="#000" />
          <rect x="0" y="0" width="130" height="52" fill="#C4B5FD" stroke="#000" strokeWidth="3.5" />
          <text x="65" y="34" fontSize="22" fontWeight="900" fill="#000" textAnchor="middle">H₂SO₄</text>
        </g>

        {/* ── Benzene ring card (lower-left) ───────────────────── */}
        <g transform="translate(10, 232) rotate(2, 64, 74)">
          <rect x="4" y="4" width="128" height="138" fill="#000" />
          <rect x="0" y="0" width="128" height="138" fill="#fff" stroke="#000" strokeWidth="3.5" />
          {/* Hexagon */}
          <polygon
            points="64,18 96,36 96,72 64,90 32,72 32,36"
            fill="none" stroke="#000" strokeWidth="2.5"
          />
          {/* Dashed inner circle */}
          <circle cx="64" cy="54" r="22" fill="none" stroke="#000" strokeWidth="2" strokeDasharray="5 3" />
          <text x="64" y="112" fontSize="12" fontWeight="900" fill="#000" textAnchor="middle">C₆H₆</text>
          <text x="64" y="128" fontSize="9" fontWeight="700" fill="#000" textAnchor="middle" letterSpacing="1">BENZENE</text>
        </g>

        {/* ── CH₃COOH sticker ──────────────────────────────────── */}
        <g transform="translate(148, 268) rotate(-3, 66, 24)">
          <rect x="3" y="3" width="132" height="48" fill="#000" />
          <rect x="0" y="0" width="132" height="48" fill="#fff" stroke="#000" strokeWidth="3" />
          <text x="66" y="30" fontSize="17" fontWeight="900" fill="#000" textAnchor="middle">CH₃COOH</text>
        </g>

        {/* ── Periodic table tiles (lower-right) ──────────────── */}
        <g transform="translate(214, 336) rotate(1, 102, 88)">
          {[
            { n:"1", sym:"H",  name:"Hydrogen",  x:0,   y:0   },
            { n:"6", sym:"C",  name:"Carbon",    x:54,  y:0   },
            { n:"7", sym:"N",  name:"Nitrogen",  x:108, y:0   },
            { n:"8", sym:"O",  name:"Oxygen",    x:0,   y:58  },
            { n:"11",sym:"Na", name:"Sodium",    x:54,  y:58  },
            { n:"17",sym:"Cl", name:"Chlorine",  x:108, y:58  },
          ].map((el) => (
            <g key={el.sym} transform={`translate(${el.x}, ${el.y})`}>
              <rect x="1" y="1" width="50" height="55" fill="#000" />
              <rect x="0" y="0" width="50" height="55" fill="#fff" stroke="#000" strokeWidth="2.5" />
              <text x="4" y="12" fontSize="7" fontWeight="700" fill="#555">{el.n}</text>
              <text x="25" y="34" fontSize="18" fontWeight="900" fill="#000" textAnchor="middle">{el.sym}</text>
              <text x="25" y="48" fontSize="5.5" fontWeight="600" fill="#333" textAnchor="middle">{el.name}</text>
            </g>
          ))}
        </g>

        {/* ── Bohr atom model (lower-center) ───────────────────── */}
        <g transform="translate(120, 344) rotate(-2, 62, 72)">
          <rect x="4" y="4" width="120" height="120" fill="#000" />
          <rect x="0" y="0" width="120" height="120" fill="#fff" stroke="#000" strokeWidth="3.5" />
          {/* Nucleus */}
          <circle cx="60" cy="60" r="10" fill="#FF6B6B" stroke="#000" strokeWidth="2" />
          <text x="60" y="64" fontSize="7" fontWeight="900" fill="#fff" textAnchor="middle">6p</text>
          {/* Orbits */}
          <ellipse cx="60" cy="60" rx="32" ry="14" stroke="#000" strokeWidth="1.5" fill="none" transform="rotate(-30, 60, 60)" />
          <ellipse cx="60" cy="60" rx="32" ry="14" stroke="#000" strokeWidth="1.5" fill="none" transform="rotate(30, 60, 60)" />
          <ellipse cx="60" cy="60" rx="32" ry="14" stroke="#000" strokeWidth="1.5" fill="none" />
          {/* Electrons */}
          <circle cx="92" cy="60" r="4" fill="#FFD93D" stroke="#000" strokeWidth="1.5" />
          <circle cx="44" cy="34" r="4" fill="#FFD93D" stroke="#000" strokeWidth="1.5" />
          <circle cx="44" cy="86" r="4" fill="#FFD93D" stroke="#000" strokeWidth="1.5" />
          <text x="60" y="108" fontSize="8" fontWeight="700" fill="#000" textAnchor="middle" letterSpacing="0.5">CARBON ATOM</text>
        </g>

        {/* ── Decorative stars ─────────────────────────────────── */}
        <text x="200" y="80" fontSize="22" fontWeight="900" fill="#FFD93D" stroke="#000" strokeWidth="0.8" transform="rotate(15, 200, 80)">★</text>
        <text x="214" y="240" fontSize="16" fontWeight="900" fill="#FFD93D" stroke="#000" strokeWidth="0.8" transform="rotate(-10, 214, 240)">✦</text>
        <text x="398" y="340" fontSize="18" fontWeight="900" fill="#FFD93D" stroke="#000" strokeWidth="0.8" transform="rotate(20, 398, 340)">★</text>

        {/* ── Arrow accent ─────────────────────────────────────── */}
        <text x="185" y="190" fontSize="28" fontWeight="900" fill="#000" transform="rotate(-12, 185, 190)">→</text>
      </svg>
    </div>
  );
}
