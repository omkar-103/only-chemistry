"use client";

import { motion } from "framer-motion";
import { Lock, FlaskConical } from "lucide-react";
import { ReactNode } from "react";

/* ─────────────────────────────────────────────────────────────
   DemoOverlay
   Usage (fullscreen – hides underlying page):
     <DemoOverlay title="..." description="..." />

   Usage (transparent – page visible but disabled):
     <DemoOverlay
       variant="transparent"
       title="..."
       description="..."
     />
───────────────────────────────────────────────────────────── */

interface DemoOverlayProps {
  /** "fullscreen" covers the page entirely (videos). Default. */
  variant?: "fullscreen" | "transparent";
  title: string;
  description: ReactNode;
  icon?: ReactNode;
}

export function DemoOverlay({
  variant = "fullscreen",
  title,
  description,
  icon,
}: DemoOverlayProps) {
  const isFullscreen = variant === "fullscreen";

  return (
    /* Backdrop */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={[
        "fixed inset-0 z-50 flex items-center justify-center",
        isFullscreen
          ? /* solid dark-blue backdrop that fully hides content */
            "bg-[hsl(222_47%_6%/0.97)] backdrop-blur-md"
          : /* semi-transparent – page visible underneath */
            "bg-[hsl(222_47%_6%/0.60)] backdrop-blur-sm",
      ].join(" ")}
      /* Swallow all pointer events so nothing underneath is clickable */
      style={{ pointerEvents: "all" }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-4 max-w-md w-full"
      >
        {/* Glow ring behind the card */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-navy-500/25 to-gold-500/10 blur-2xl -z-10 scale-110"
        />

        {/* Card surface */}
        <div
          className="
            rounded-3xl border border-white/10
            bg-white/5 backdrop-blur-xl
            shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)]
            p-8 text-center
          "
        >
          {/* Demo badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/15 border border-gold-400/25 text-gold-300 text-[11px] font-semibold tracking-widest uppercase mb-6">
            <FlaskConical className="h-3 w-3" />
            Demo Mode
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-white/8 border border-white/10 text-white/70 shadow-inner">
            {icon ?? <Lock className="h-7 w-7" />}
          </div>

          {/* Heading */}
          <h2 className="text-xl font-display font-black text-white mb-3 leading-tight">
            {title}
          </h2>

          {/* Body text */}
          <div className="text-white/55 text-sm leading-relaxed space-y-2">
            {typeof description === "string" ? (
              <p>{description}</p>
            ) : (
              description
            )}
          </div>

          {/* Decorative divider */}
          <div className="mt-6 h-px w-16 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <p className="mt-4 text-[11px] text-white/25 tracking-wide">
            Configure the required service to unlock this feature
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
