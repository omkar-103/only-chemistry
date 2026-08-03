"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MAX_TAB_SWITCHES } from "@/constants";
import axios from "axios";

const MAX_FULLSCREEN_VIOLATIONS = 3;

interface UseExamSecurityOptions {
  examId:       string;
  attemptId:    string;
  onAutoSubmit: (reason: string) => void;
  onViolation:  (type: string, count: number, message: string) => void;
}

interface SecurityState {
  tabSwitchCount:       number;
  fullscreenExitCount:  number;
  isFullscreen:         boolean;
  totalViolations:      number;
  sidePanelCount:       number;
  blurCount:            number;
}

export function useExamSecurity({
  examId,
  attemptId,
  onAutoSubmit,
  onViolation,
}: UseExamSecurityOptions) {
  const [securityState, setSecurityState] = useState<SecurityState>({
    tabSwitchCount:      0,
    fullscreenExitCount: 0,
    isFullscreen:        typeof document !== "undefined" ? !!document.fullscreenElement : false,
    totalViolations:     0,
    sidePanelCount:      0,
    blurCount:           0,
  });

  const tabSwitchRef       = useRef(0);
  const fullscreenRef      = useRef(0);
  const sidePanelRef       = useRef(0);
  const blurRef            = useRef(0);
  const isSubmittingRef    = useRef(false);
  const lastFSExitTime     = useRef(0); // debounce rapid duplicate events
  // Baseline viewport width recorded when the exam starts.
  // The Chrome Gemini side panel shrinks window.innerWidth by ~350-450px.
  // NOTE: Chrome does NOT expose a side-panel API to web pages.
  // The resize heuristic is the best available browser-level detection.
  const baselineWidthRef   = useRef<number>(typeof window !== "undefined" ? window.innerWidth : 1280);
  const lastBlurTime       = useRef(0); // debounce blur events

  // ── Log violation to server ─────────────────────────────────
  const logViolation = useCallback(async (type: string) => {
    if (!examId || !attemptId) return 0;
    try {
      const res = await axios.post(`/api/exams/${examId}/log-violation`, {
        attemptId,
        type,
        count: 1,
      });
      return res.data.data?.violationCount ?? 0;
    } catch {
      return 0;
    }
  }, [examId, attemptId]);

  // ── Enter Fullscreen ────────────────────────────────────────
  const requestFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) return; // already in fullscreen
      await document.documentElement.requestFullscreen();
    } catch {
      // Browser may block if not triggered by user gesture
    }
  }, []);

  // ── Exit Fullscreen ─────────────────────────────────────────
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch { /* ignore */ }
  }, []);

  // ── Tab Switch Detection ────────────────────────────────────
  useEffect(() => {
    if (!examId) return;

    const handleVisibilityChange = async () => {
      if (!document.hidden || isSubmittingRef.current) return;

      tabSwitchRef.current += 1;
      const count = tabSwitchRef.current;

      setSecurityState(prev => ({
        ...prev,
        tabSwitchCount:  count,
        totalViolations: prev.totalViolations + 1,
      }));

      await logViolation("tab_switch");

      const msg = count >= MAX_TAB_SWITCHES
        ? `Tab switching limit reached (${count}/${MAX_TAB_SWITCHES}). Auto-submitting.`
        : `Tab switch detected (${count}/${MAX_TAB_SWITCHES}). Do not switch tabs.`;

      onViolation("tab_switch", count, msg);

      if (count >= MAX_TAB_SWITCHES && !isSubmittingRef.current) {
        isSubmittingRef.current = true;
        onAutoSubmit("tab_switch");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [examId, logViolation, onAutoSubmit, onViolation]);

  // ── Fullscreen Detection + Auto Re-Enter + 3-Strike ────────
  useEffect(() => {
    if (!examId) return;

    const handleFullscreenChange = async () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setSecurityState(prev => ({ ...prev, isFullscreen: isNowFullscreen }));

      if (isNowFullscreen || isSubmittingRef.current) return;

      // Debounce — ignore events within 800ms of the last one
      const now = Date.now();
      if (now - lastFSExitTime.current < 800) return;
      lastFSExitTime.current = now;

      fullscreenRef.current += 1;
      const count = fullscreenRef.current;

      setSecurityState(prev => ({
        ...prev,
        fullscreenExitCount: count,
        totalViolations:     prev.totalViolations + 1,
      }));

      await logViolation("fullscreen_exit");

      if (count >= MAX_FULLSCREEN_VIOLATIONS) {
        // 3rd strike — auto submit immediately
        const msg = `Warning ${count} of ${MAX_FULLSCREEN_VIOLATIONS}: Maximum violations reached. Your examination has been automatically submitted.`;
        onViolation("fullscreen_exit", count, msg);
        if (!isSubmittingRef.current) {
          isSubmittingRef.current = true;
          onAutoSubmit("fullscreen_exit");
        }
      } else {
        // 1st or 2nd strike — warn and try to re-enter
        const msgs: Record<number, string> = {
          1: `Warning 1 of ${MAX_FULLSCREEN_VIOLATIONS}: You have exited fullscreen. Returning to fullscreen automatically. Repeated violations will automatically submit your examination.`,
          2: `Warning 2 of ${MAX_FULLSCREEN_VIOLATIONS}: This is your second violation. Please remain in fullscreen mode.`,
        };
        onViolation("fullscreen_exit", count, msgs[count] || `Fullscreen violation ${count}`);

        // Auto re-enter fullscreen after a short delay
        setTimeout(() => {
          if (!isSubmittingRef.current) {
            requestFullscreen();
          }
        }, 500);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [examId, logViolation, onAutoSubmit, onViolation, requestFullscreen]);

  // ── ESC / F11 Key Interception ──────────────────────────────
  useEffect(() => {
    if (!examId) return;

    const handleKeydown = async (e: KeyboardEvent) => {
      // Block F11 (browser fullscreen toggle)
      if (e.key === "F11") {
        e.preventDefault();
        return;
      }

      // Block dev tools shortcuts
      if (
        e.key === "F12" ||
        (e.ctrlKey && ["c", "v", "a", "u", "p", "s"].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        await logViolation("copy_paste");
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [examId, logViolation]);

  // ── Copy/Paste/Right-click Prevention ─────────────────────
  useEffect(() => {
    if (!examId) return;

    const preventCopy = (e: Event) => { e.preventDefault(); };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation("right_click");
    };

    document.addEventListener("copy",        preventCopy);
    document.addEventListener("cut",         preventCopy);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("copy",        preventCopy);
      document.removeEventListener("cut",         preventCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [examId, logViolation]);

  // ── DevTools Detection (size heuristic) ────────────────────
  useEffect(() => {
    if (!examId) return;

    let devToolsOpen = false;
    const threshold  = 160;

    const detectDevTools = () => {
      const isOpen = (window.outerWidth - window.innerWidth) > threshold ||
                     (window.outerHeight - window.innerHeight) > threshold;
      if (isOpen && !devToolsOpen) {
        devToolsOpen = true;
        logViolation("devtools");
      } else if (!isOpen) {
        devToolsOpen = false;
      }
    };

    const interval = setInterval(detectDevTools, 2000);
    return () => clearInterval(interval);
  }, [examId, logViolation]);

  // ── Network Disconnect ──────────────────────────────────────
  useEffect(() => {
    if (!examId) return;
    const handleOffline = () => logViolation("network_disconnect");
    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, [examId, logViolation]);

  // ── Viewport Width Shrink (Gemini/AI Side Panel Detection) ──
  //
  // Chrome's Gemini side panel reduces window.innerWidth by ~350-450px.
  // We detect any shrink > 200px from the recorded baseline as a potential
  // side-panel open event.
  //
  // LIMITATION: This is a heuristic. It cannot definitively identify
  // which tool caused the resize. A student with a narrow monitor or
  // manual resize could trigger a false positive. It CANNOT be blocked;
  // only detected and warned about.
  useEffect(() => {
    if (!examId) return;

    // Capture baseline when the effect runs (exam is active)
    baselineWidthRef.current = window.innerWidth;

    const handleResize = async () => {
      if (isSubmittingRef.current) return;
      const shrink = baselineWidthRef.current - window.innerWidth;
      // Side panel opens cause a sudden shrink > 200px
      if (shrink > 200) {
        sidePanelRef.current += 1;
        const count = sidePanelRef.current;

        setSecurityState(prev => ({
          ...prev,
          sidePanelCount:  count,
          totalViolations: prev.totalViolations + 1,
        }));

        await logViolation("side_panel");

        onViolation(
          "side_panel",
          count,
          `⚠ AI/browser side panel detected (violation ${count}). Close all side panels and keep the exam window maximised.`,
        );
      } else {
        // Width restored — update baseline
        baselineWidthRef.current = Math.max(baselineWidthRef.current, window.innerWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [examId, logViolation, onViolation]);

  // ── Window Blur (focus lost to side panel or other apps) ────
  //
  // When a student clicks inside the Gemini side panel, the window may
  // momentarily lose focus. This is a secondary, unreliable signal but
  // adds depth to the detection when combined with the resize heuristic.
  //
  // LIMITATION: System notifications, OS popups, and screen-savers can
  // also trigger blur. Treat as informational, not auto-submit.
  useEffect(() => {
    if (!examId) return;

    const handleBlur = async () => {
      if (isSubmittingRef.current) return;

      // Debounce — ignore events within 1s of the last one
      const now = Date.now();
      if (now - lastBlurTime.current < 1000) return;
      lastBlurTime.current = now;

      blurRef.current += 1;
      const count = blurRef.current;

      setSecurityState(prev => ({
        ...prev,
        blurCount:       count,
        totalViolations: prev.totalViolations + 1,
      }));

      await logViolation("blur");

      onViolation(
        "blur",
        count,
        `⚠ Exam window lost focus (${count} time${count > 1 ? "s" : ""}). Stay on the exam window.`,
      );
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [examId, logViolation, onViolation]);

  return {
    securityState,
    requestFullscreen,
    exitFullscreen,
    tabSwitchRef,
    fullscreenRef,
    sidePanelRef,
    blurRef,
    isSubmittingRef,
  };
}
