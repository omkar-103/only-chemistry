"use client";

/**
 * /admin/exams/[id]/preview
 * Read-only exam preview that mirrors the student exam experience.
 * Does NOT create any attempt or record any responses.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Flag, Eye, BookOpen,
  Clock, ArrowLeft, AlertTriangle, CheckCircle2, FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import axios from "axios";
import Link from "next/link";

type QuestionStatus = "not_visited" | "visited" | "answered" | "marked" | "answered_marked";

const PALETTE_COLORS: Record<QuestionStatus, string> = {
  not_visited:    "bg-slate-400 text-white",
  visited:        "bg-yellow-400 text-white",
  answered:       "bg-green-500 text-white",
  marked:         "bg-purple-500 text-white",
  answered_marked:"bg-blue-500 text-white",
};

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
}

export default function ExamPreviewPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();

  const [exam, setExam]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [phase, setPhase]       = useState<"instructions" | "exam">("instructions");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionStatus>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string[]>>({});
  const [markedReview, setMarkedReview]       = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [agreed, setAgreed]     = useState(false);

  useEffect(() => {
    axios.get(`/api/exams/${id}?preview=true`)
      .then(r => {
        const e = r.data.data;
        // admin preview fetches the full exam including questions
        setExam(e);
        setTimeLeft((e.totalDuration || 60) * 60);
      })
      .catch(() => router.push(`/admin/exams/${id}`))
      .finally(() => setLoading(false));
  }, [id, router]);

  // Timer (cosmetic only — not submitted)
  useEffect(() => {
    if (phase !== "exam" || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  const q      = exam?.questions?.[currentIdx];
  const total  = exam?.questions?.length || 0;
  const isLow  = timeLeft < 300;

  const markStatus = (idx: number, status: QuestionStatus) => {
    setQuestionStates(p => ({ ...p, [idx]: status }));
  };

  const handleSelect = (optId: string) => {
    const cur = selectedOptions[currentIdx] || [];
    const qType = q?.questionType;
    let next: string[];
    if (qType === "single" || qType === "truefalse") {
      next = cur.includes(optId) ? [] : [optId];
    } else {
      next = cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId];
    }
    setSelectedOptions(p => ({ ...p, [currentIdx]: next }));
    const isMarked = markedReview[currentIdx];
    markStatus(currentIdx, next.length > 0 ? (isMarked ? "answered_marked" : "answered") : (isMarked ? "marked" : "visited"));
  };

  const toggleMark = () => {
    const cur = !markedReview[currentIdx];
    setMarkedReview(p => ({ ...p, [currentIdx]: cur }));
    const hasAnswer = (selectedOptions[currentIdx] || []).length > 0;
    markStatus(currentIdx, hasAnswer ? (cur ? "answered_marked" : "answered") : (cur ? "marked" : "visited"));
  };

  const goTo = (idx: number) => {
    // Mark current as visited if not already
    if (!questionStates[currentIdx] || questionStates[currentIdx] === "not_visited") {
      markStatus(currentIdx, "visited");
    }
    setCurrentIdx(idx);
    if (!questionStates[idx]) markStatus(idx, "visited");
  };

  const answeredCount = Object.values(questionStates).filter(s => s === "answered" || s === "answered_marked").length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  if (!exam) return null;

  /* ── INSTRUCTIONS PHASE ─────────────────────────────────── */
  if (phase === "instructions") {
    return (
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        {/* Preview badge */}
        <div className="max-w-3xl mx-auto mb-4">
          <Link href={`/admin/exams`}>
            <Button variant="ghost" size="sm" className="gap-1.5 mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Exams
            </Button>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl text-yellow-700 dark:text-yellow-400 text-sm font-medium mb-6">
            <Eye className="h-4 w-4 shrink-0" />
            <strong>Admin Preview Mode</strong> — This is a read-only preview. No responses are recorded.
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FlaskConical className="h-8 w-8 text-primary" />
              <span className="font-display font-black text-xl text-foreground">RHGConsultancyService</span>
            </div>
            <h1 className="text-2xl font-display font-black text-foreground mb-2">Exam Instructions</h1>
            <p className="text-muted-foreground">{exam.title}</p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Questions", value: exam.questions?.length || 0, icon: BookOpen },
              { label: "Duration",  value: `${exam.totalDuration} min`, icon: Clock },
              { label: "Passing",   value: `${exam.passingPercentage}%`, icon: CheckCircle2 },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-2xl bg-card border border-border text-center">
                <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-black text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Rules */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h2 className="font-bold text-foreground">Exam Rules</h2>
            {[
              "The exam will enter fullscreen mode automatically.",
              "Exiting fullscreen will trigger a warning. 3 violations = auto-submit.",
              "Tab switching is monitored. Do not switch tabs.",
              "Copy, paste, and right-click are disabled.",
              "Your answers are auto-saved every 30 seconds.",
              "The exam auto-submits when time expires.",
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                {rule}
              </div>
            ))}
          </div>

          {/* Agreement */}
          <label className="flex items-center gap-3 cursor-pointer p-4 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="w-5 h-5 accent-primary"
              id="agree-rules"
            />
            <span className="text-sm text-foreground font-medium">
              I have read and agree to all exam rules and conditions.
            </span>
          </label>

          <Button
            variant="gold" size="lg" className="w-full gap-2 text-base font-bold"
            disabled={!agreed}
            onClick={() => setPhase("exam")}
            id="preview-start"
          >
            <Eye className="h-5 w-5" /> Preview Exam
          </Button>
        </div>
      </div>
    );
  }

  /* ── EXAM PHASE ─────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col bg-muted/20 overflow-hidden">
      {/* Preview warning bar */}
      <div className="bg-yellow-500 text-yellow-950 text-xs font-bold px-4 py-1.5 text-center flex items-center justify-center gap-2 shrink-0">
        <Eye className="h-3.5 w-3.5" /> ADMIN PREVIEW — Read-only mode. Responses not saved.
      </div>

      {/* Top bar */}
      <header className="bg-navy-900 text-white shrink-0 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-5 w-5 text-gold-400 hidden sm:block" />
          <div>
            <p className="text-xs text-white/60">RHGConsultancyService — Preview</p>
            <p className="text-sm font-semibold truncate max-w-[300px]">{exam.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm",
            isLow ? "bg-red-500 animate-pulse" : "bg-navy-700")}>
            <Clock className="h-4 w-4" />{formatTime(timeLeft)}
          </div>
          <Link href="/admin/exams">
            <Button variant="outline" size="sm" className="text-xs">Exit Preview</Button>
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Question panel */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Progress bar */}
          <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
            <span className="text-sm font-medium">Question {currentIdx + 1} of {total}</span>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">{answeredCount} Answered</span>
              <span className="text-red-500">{total - answeredCount} Remaining</span>
            </div>
          </div>

          {/* Question content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {q && (
              <motion.div key={currentIdx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                {/* Marks */}
                <div className="flex items-center gap-3 mb-4 text-xs">
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                    +{q.marks} marks
                  </span>
                  {q.negativeMarks > 0 && (
                    <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                      -{q.negativeMarks} negative
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                    {q.questionType === "single" ? "Single Correct" : q.questionType === "multiple" ? "Multiple Correct" : "True/False"}
                  </span>
                </div>

                {/* Question text */}
                <div className="mb-6 p-4 rounded-xl bg-card border border-border">
                  <p className="text-base font-medium text-foreground leading-relaxed whitespace-pre-wrap">{q.questionText}</p>
                  {q.questionImage && (
                    <img src={q.questionImage} alt="Question" className="mt-3 max-h-64 rounded-lg object-contain border border-border" />
                  )}
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {q.options?.map((opt: any, oi: number) => {
                    const isSelected = (selectedOptions[currentIdx] || []).includes(opt.id);
                    return (
                      <motion.button
                        key={opt.id}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect(opt.id)}
                        className={cn(
                          "w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                          isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-sm",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 text-muted-foreground"
                        )}>
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{opt.text}</p>
                          {opt.image && <img src={opt.image} alt={`Option ${oi+1}`} className="mt-2 max-h-32 rounded object-contain" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom nav */}
          <div className="bg-card border-t border-border px-4 py-3 flex items-center justify-between gap-2 shrink-0">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs", markedReview[currentIdx] && "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20")}
                onClick={toggleMark} id="preview-mark">
                <Flag className="h-3.5 w-3.5" /> {markedReview[currentIdx] ? "Unmark" : "Mark Review"}
              </Button>
              <Button variant="outline" size="sm" className="text-xs"
                onClick={() => { setSelectedOptions(p => ({ ...p, [currentIdx]: [] })); markStatus(currentIdx, "visited"); }}>
                Clear
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentIdx === 0}
                onClick={() => goTo(currentIdx - 1)} id="prev-q">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant={currentIdx === total - 1 ? "gold" : "default"} size="sm"
                onClick={() => currentIdx < total - 1 ? goTo(currentIdx + 1) : undefined} id="next-q">
                {currentIdx === total - 1 ? "Finish Preview" : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </main>

        {/* Question palette */}
        <aside className="hidden lg:flex w-64 bg-card border-l border-border flex-col">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Question Palette</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {/* Legend */}
            <div className="grid grid-cols-2 gap-1 mb-3">
              {Object.entries(PALETTE_COLORS).map(([status, cls]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold", cls)}>1</div>
                  <span className="text-[10px] text-muted-foreground capitalize">{status.replace("_"," ")}</span>
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: total }).map((_, i) => {
                const st = questionStates[i] || "not_visited";
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={cn("w-9 h-9 rounded-lg text-xs font-bold transition-all", PALETTE_COLORS[st],
                      currentIdx === i && "ring-2 ring-offset-1 ring-white scale-110")}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-3 border-t border-border space-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex justify-between"><span>Answered</span><span className="font-bold text-green-600">{answeredCount}</span></div>
            <div className="flex justify-between"><span>Marked</span><span className="font-bold text-purple-600">{Object.values(markedReview).filter(Boolean).length}</span></div>
            <div className="flex justify-between"><span>Not Visited</span><span className="font-bold">{total - Object.keys(questionStates).length}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
