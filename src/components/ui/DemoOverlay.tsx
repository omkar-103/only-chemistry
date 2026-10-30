"use client";

import { motion } from "framer-motion";
import { Lock, FlaskConical, AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

/* ─────────────────────────────────────────────────────────────
   DemoOverlay
   Covers ONLY the content area — positioned absolutely inside
   its nearest `position: relative` ancestor (the page root div).
   The sidebar is never covered.

   Usage (dark — hides content, for videos):
     <DemoOverlay title="..." description="..." />

   Usage (transparent — content dimmed but visible, for payments):
     <DemoOverlay variant="transparent" title="..." description="..." />
───────────────────────────────────────────────────────────── */

interface DemoOverlayProps {
  /** "fullscreen" = dark backdrop (videos). "transparent" = dimmed backdrop. Default: "fullscreen" */
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
    /* Positioned ABSOLUTE so it only covers the page content container,
       never the sidebar or any layout chrome outside this component's parent. */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={[
        /* absolute — constrained to the nearest relative ancestor (the page div) */
        "absolute inset-0 z-10 flex items-center justify-center rounded-xl",
        isFullscreen
          ? "bg-[hsl(222_47%_6%/0.96)] backdrop-blur-md"
          : "bg-[hsl(222_47%_6%/0.55)] backdrop-blur-sm",
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

/* ─────────────────────────────────────────────────────────────
   DemoBanner
   A non-blocking top-of-page warning strip used when the UI
   should remain visible but interactions are disabled.
   The existing page content sits below the banner, wrapped in
   pointer-events-none by the consuming page.
───────────────────────────────────────────────────────────── */

interface DemoBannerProps {
  title: string;
  description: ReactNode;
}

export function DemoBanner({ title, description }: DemoBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="
        flex items-start gap-4 rounded-2xl border
        border-amber-400/40 bg-amber-50/80 dark:bg-amber-900/20
        backdrop-blur-sm px-5 py-4
        shadow-[0_2px_16px_-4px_rgba(217,119,6,0.15)]
      "
      /* The banner itself must remain interactive (not swallowed by parent's pointer-events-none) */
      style={{ pointerEvents: "auto" }}
    >
      {/* Icon */}
      <div className="mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-900/40 border border-amber-300/50 dark:border-amber-700/50">
        <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300 leading-tight">
            {title}
          </p>
          <span className="px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-800/50 text-amber-700 dark:text-amber-400 text-[10px] font-semibold tracking-widest uppercase border border-amber-300/50 dark:border-amber-700/50">
            Demo Mode
          </span>
        </div>
        <div className="text-xs text-amber-700/80 dark:text-amber-400/70 leading-relaxed">
          {typeof description === "string" ? <p>{description}</p> : description}
        </div>
      </div>
    </motion.div>
  );
}
