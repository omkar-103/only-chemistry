"use client";
/**
 * ChemicalContentRenderer
 * ─────────────────────────────────────────────────────────────────────────────
 * Read-only renderer for ChemDraw chemical content (SVG or PNG).
 * Displays the chemistry structure on a SOLID WHITE background regardless
 * of surrounding page theme — required for chemical readability.
 *
 * Includes an interactive click-to-preview lightbox modal with:
 *  - Zoom In (+)
 *  - Zoom Out (−)
 *  - Reset (↺)
 *  - Close (×) & Backdrop click to dismiss
 *  - Read-only: no editor or download tools exposed to students
 *
 * Used in:
 *  - Student exam attempt page
 *  - Admin exam preview
 *  - Admin question detail view
 *  - Results / review pages
 */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChemicalContent } from "@/types";
import { ZoomIn, ZoomOut, RotateCcw, X, Maximize2 } from "lucide-react";

interface ChemicalContentRendererProps {
  content: ChemicalContent;
  /** Max width in CSS. Defaults to "100%" */
  maxWidth?: string;
  /** Max height in CSS (e.g. "80px" for options, "180px" for questions) */
  maxHeight?: string;
  /** Set to true when rendering inside an answer option card for compact alignment */
  isOption?: boolean;
  /** Additional class names for the outer container */
  className?: string;
  /** If true, show a small "ChemDraw" label above the structure */
  showLabel?: boolean;
  /** Enable clickable modal preview (defaults to true) */
  allowZoom?: boolean;
}

export function ChemicalContentRenderer({
  content,
  maxWidth,
  maxHeight,
  isOption = false,
  className = "",
  showLabel = false,
  allowZoom = true,
}: ChemicalContentRendererProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key to close modal and body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setZoom(1);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!content?.renderedUrl) return null;

  const defaultMaxHeight = isOption ? "80px" : "180px";
  const effectiveMaxHeight = maxHeight || defaultMaxHeight;
  const effectiveMaxWidth = maxWidth || (isOption ? "320px" : "100%");

  const handleOpenModal = (e: React.MouseEvent) => {
    if (!allowZoom) return;
    e.stopPropagation();
    e.preventDefault();
    setZoom(1);
    setIsOpen(true);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsOpen(false);
    setZoom(1);
  };

  return (
    <>
      <div
        className={`chemical-content-block ${className}`}
        style={{
          maxWidth: effectiveMaxWidth,
          margin: isOption ? "0.25rem 0 0" : "0.5rem 0",
          display: isOption ? "inline-block" : "block",
        }}
      >
        {showLabel && !isOption && (
          <p
            style={{
              fontSize: "0.65rem",
              color: "#888",
              marginBottom: "0.25rem",
              fontFamily: "monospace",
              letterSpacing: "0.05em",
            }}
          >
            ChemDraw · {content.renderedFormat?.toUpperCase()}
          </p>
        )}

        {/* Solid white-background chemical display container */}
        <div
          onClick={handleOpenModal}
          title={allowZoom ? "Click to view enlarged chemical structure" : undefined}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: isOption ? "0.375rem" : "0.5rem",
            padding: isOption ? "0.375rem 0.625rem" : "0.625rem 0.875rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "100%",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            cursor: allowZoom ? "zoom-in" : "default",
            position: "relative",
          }}
          className={
            allowZoom
              ? "group/chem-preview hover:border-primary/50 hover:shadow-md transition-all"
              : ""
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.renderedUrl}
            alt={content.altText || "Chemical structure"}
            style={{
              maxHeight: effectiveMaxHeight,
              maxWidth: "100%",
              width: "auto",
              height: "auto",
              display: "block",
              objectFit: "contain",
            }}
            loading="lazy"
          />

          {/* Subtle expand hint icon on hover */}
          {allowZoom && (
            <div className="absolute right-1 bottom-1 opacity-0 group-hover/chem-preview:opacity-100 transition-opacity bg-black/60 text-white rounded p-0.5 pointer-events-none">
              <Maximize2 className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Zoomable Lightbox Modal ── */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => handleClose()}
          >
            {/* Modal Dialog Container */}
            <div
              className="relative flex flex-col max-w-5xl w-full max-h-[92vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Bar with Info & Controls */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate max-w-[280px] sm:max-w-md">
                      {content.altText || "Chemical Structure Preview"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">
                      ChemDraw · {content.renderedFormat?.toUpperCase()} · High Resolution
                    </p>
                  </div>
                </div>

                {/* Zoom & Close Toolbar */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center bg-background border border-border rounded-lg p-0.5 shadow-xs">
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5}
                      title="Zoom Out (−)"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-mono font-medium px-2 min-w-[52px] text-center select-none text-foreground">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      disabled={zoom >= 3.0}
                      title="Zoom In (+)"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      title="Reset Zoom (100%)"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-l border-border ml-0.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => handleClose()}
                    title="Close (Esc)"
                    className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-xs"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* White Background Viewport for Structure */}
              <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-muted/20 min-h-[300px]">
                <div
                  className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm flex items-center justify-center transition-transform duration-150 ease-out"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={content.renderedUrl}
                    alt={content.altText || "Enlarged chemical structure"}
                    className="max-h-[60vh] max-w-[80vw] w-auto h-auto object-contain select-none pointer-events-none"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Bottom Footer Hint */}
              <div className="px-5 py-2.5 border-t border-border bg-muted/20 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Use <span className="font-semibold text-foreground">+</span> and{" "}
                  <span className="font-semibold text-foreground">−</span> to adjust zoom · Press{" "}
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background border border-border rounded">
                    Esc
                  </kbd>{" "}
                  or click outside to close
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default ChemicalContentRenderer;
