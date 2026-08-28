"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, AlertTriangle, ChevronLeft, ChevronRight,
  Flag, Trash2, Send, X, FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { IQuestion } from "@/types";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils/cn";
import axios from "axios";
import { ChemicalContentRenderer } from "@/components/ui/ChemicalContentRenderer";

interface Params { params: Promise<{ id: string }> }

type QuestionStatus = "not_visited" | "unanswered" | "answered" | "marked" | "answered_marked";

interface ResponseState {
  [questionId: string]: {
    selectedOptions:   string[];
    isMarkedForReview: boolean;
    status:            QuestionStatus;
    timeTakenSeconds:  number;
    visitCount?:       number;
    answerChanged?:    boolean;
    visitedAt?:        Date;
    answeredAt?:       Date;
    startTime?:        Date;
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const PALETTE_COLORS: Record<QuestionStatus, string> = {
  not_visited: "bg-slate-400 hover:bg-slate-500 text-white",
  unanswered: "bg-red-500 hover:bg-red-600 text-white",
  answered: "bg-green-500 hover:bg-green-600 text-white",
  marked: "bg-purple-500 hover:bg-purple-600 text-white",
  answered_marked: "bg-purple-500 hover:bg-purple-600 text-white",
};

export default function ExamAttemptPage({ params }: Params) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [examId, setExamId] = useState<string>("");
  const [attemptId, setAttemptId] = useState<string>("");
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [examData, setExamData] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<ResponseState>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningCount, setWarningCount] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const loginTimeRef    = useRef(new Date());
  const timerRef        = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef     = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef(Date.now());
  const handleSubmitRef = useRef<(...args: any[]) => Promise<void>>(() => Promise.resolve());

  // ── Load Exam ────────────────────────────────────────────────
  useEffect(() => {
    params.then(({ id }) => {
      setExamId(id);
      axios.post(`/api/exams/${id}/start`)
        .then((r) => {
          const { attemptId, questions, totalDuration, startedAt } = r.data.data;
          setAttemptId(attemptId);
          setQuestions(questions);
          setExamData(r.data.data);

          const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
          const totalSeconds = totalDuration * 60;
          setTimeLeft(Math.max(0, totalSeconds - elapsed));

          const initial: ResponseState = {};
          questions.forEach((q: IQuestion) => {
            initial[q._id as string] = {
              selectedOptions: [],
              isMarkedForReview: false,
              status: "not_visited",
              timeTakenSeconds: 0,
            };
          });

          if (r.data.data.responses) {
            r.data.data.responses.forEach((resp: any) => {
              const qId = resp.questionId;
              if (initial[qId]) {
                initial[qId].selectedOptions = resp.selectedOptions || [];
                initial[qId].isMarkedForReview = resp.isMarkedForReview;
                initial[qId].status = resp.selectedOptions?.length > 0
                  ? (resp.isMarkedForReview ? "answered_marked" : "answered")
                  : resp.isMarkedForReview ? "marked" : "unanswered";
                initial[qId].timeTakenSeconds = resp.timeTakenSeconds || 0;
              }
            });
          }

          setResponses(initial);
        })
        .catch((err) => {
          const msg = err.response?.data?.message || "You do not have access to this exam.";
          router.push(ROUTES.STUDENT.EXAMS);
        })
        .finally(() => setLoading(false));
    });
  }, [params, router]);

  // ── Timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0 || !attemptId) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true, false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [attemptId, timeLeft]);

  // ── Security ─────────────────────────────────────────────────
  const handleAutoSubmit = useCallback((reason: string) => {
    setWarningMessage(`Your exam is being automatically submitted: ${reason.replace(/_/g, " ")}.`);
    setShowWarning(true);
    setTimeout(() => handleSubmitRef.current(true, true, reason), 2500);
  }, []);

  const handleViolation = useCallback((_type: string, count: number, message: string) => {
    setWarningCount(count);
    setWarningMessage(message);
    setShowWarning(true);
    if (!message.includes("automatically submitted")) {
      setTimeout(() => setShowWarning(false), 6000);
    }
  }, []);

  const { requestFullscreen } = useExamSecurity({
    examId,
    attemptId,
    onAutoSubmit: handleAutoSubmit,
    onViolation:  handleViolation,
  });

  useEffect(() => {
    if (!attemptId || !examId) return;
    const t = setTimeout(() => requestFullscreen(), 800);
    return () => clearTimeout(t);
  }, [attemptId, examId, requestFullscreen]);

  // ── Navigation ────────────────────────────────────────────────
  const goToQuestion = (idx: number) => {
    saveCurrentResponse();
    setCurrentIdx(idx);
    questionStartTime.current = Date.now();

    const q = questions[idx];
    if (q) {
      const qId = q._id as string;
      setResponses(prev => {
        const existing = prev[qId] || { selectedOptions: [], isMarkedForReview: false, status: "unanswered" as QuestionStatus, timeTakenSeconds: 0 };
        return {
          ...prev,
          [qId]: {
            ...existing,
            status: existing.status === "not_visited" ? "unanswered" : existing.status,
            visitCount: ((existing as any).visitCount || 0) + 1,
            visitedAt: (existing as any).visitedAt || new Date(),
          } as any,
        };
      });
    }
    setShowPalette(false);
  };

  // ── Response Handling ─────────────────────────────────────────
  const saveCurrentResponse = useCallback(async () => {
    const q = questions[currentIdx];
    if (!q || !attemptId) return;

    const qId = q._id as string;
    const resp = responses[qId];
    const timeTaken = Math.floor((Date.now() - questionStartTime.current) / 1000);

    try {
      await axios.post(`/api/exams/${examId}/save-response`, {
        attemptId,
        questionId: qId,
        selectedOptions: resp?.selectedOptions || [],
        isMarkedForReview: resp?.isMarkedForReview || false,
        timeTakenSeconds: (resp?.timeTakenSeconds || 0) + timeTaken,
      });
    } catch {
      // Silent fail
    }
  }, [questions, currentIdx, responses, attemptId, examId]);

  useEffect(() => {
    autoSaveRef.current = setInterval(saveCurrentResponse, 30000);
    return () => clearInterval(autoSaveRef.current!);
  }, [saveCurrentResponse]);

  const handleOptionSelect = (optionId: string, questionType: string) => {
    const q = questions[currentIdx];
    if (!q) return;
    const qId = q._id as string;

    setResponses((prev) => {
      const existing  = prev[qId]?.selectedOptions || [];
      let newSelected: string[];

      if (questionType === "single" || questionType === "truefalse") {
        newSelected = [optionId];
      } else {
        newSelected = existing.includes(optionId)
          ? existing.filter((o) => o !== optionId)
          : [...existing, optionId];
      }

      const isMarked   = prev[qId]?.isMarkedForReview || false;
      const hadAnswer  = existing.length > 0;
      const status: QuestionStatus = newSelected.length > 0
        ? isMarked ? "answered_marked" : "answered"
        : isMarked ? "marked" : "unanswered";

      return {
        ...prev,
        [qId]: {
          ...prev[qId],
          selectedOptions: newSelected,
          status,
          answerChanged: hadAnswer,
          answeredAt: newSelected.length > 0 ? new Date() : prev[qId]?.answeredAt,
        } as any,
      };
    });
  };

  const handleMarkReview = () => {
    const q = questions[currentIdx];
    if (!q) return;
    const qId = q._id as string;

    setResponses((prev) => {
      const current = prev[qId];
      const newMarked = !current.isMarkedForReview;
      const hasAnswer = current.selectedOptions.length > 0;
      const status: QuestionStatus = hasAnswer
        ? newMarked ? "answered_marked" : "answered"
        : newMarked ? "marked" : "unanswered";

      return { ...prev, [qId]: { ...current, isMarkedForReview: newMarked, status } };
    });
  };

  const handleClearResponse = () => {
    const q = questions[currentIdx];
    if (!q) return;
    const qId = q._id as string;
    setResponses((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], selectedOptions: [], status: "unanswered" },
    }));
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (isTimedOut = false, isAutoSubmit = false, submissionReason = "manual") => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitConfirm(false);

    try {
      await saveCurrentResponse();

      const ua = navigator.userAgent;
      const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Unknown";
      const device  = /Mobile|Android|iPhone/.test(ua) ? "Mobile" : "Desktop";
      const os      = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : "Unknown";

      const allResponses = Object.entries(responses).map(([questionId, resp]) => ({
        questionId,
        selectedOptions:   resp.selectedOptions,
        timeTakenSeconds:  resp.timeTakenSeconds,
        isMarkedForReview: resp.isMarkedForReview,
        visitCount:        (resp as any).visitCount || 1,
        answerChanged:     (resp as any).answerChanged || false,
        startTime:         (resp as any).startTime,
        endTime:           new Date(),
        visitedAt:         (resp as any).visitedAt,
        answeredAt:        (resp as any).answeredAt,
      }));

      await axios.post(`/api/exams/${examId}/submit`, {
        attemptId,
        responses:         allResponses,
        isTimedOut,
        isAutoSubmit,
        submissionReason:  isAutoSubmit ? submissionReason : isTimedOut ? "time_up" : "manual",
        timeRemainingSeconds: timeLeft,
        sessionMetadata: {
          browser, device, os,
          userAgent: ua,
          loginTime: loginTimeRef.current,
        },
      });

      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      router.push(ROUTES.EXAM.RESULT(attemptId));
    } catch (error) {
      console.error("Submit failed:", error);
      setIsSubmitting(false);
    }
  };

  handleSubmitRef.current = handleSubmit;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const currentResponse = responses[currentQuestion?._id as string];
  const answeredCount = Object.values(responses).filter((r) => r.selectedOptions.length > 0).length;
  const markedCount = Object.values(responses).filter((r) => r.isMarkedForReview).length;
  const isTimeCritical = timeLeft < 180;
  const isTimeLow = timeLeft < 600;

  return (
    <div className="h-screen flex flex-col bg-muted/20 exam-fullscreen overflow-hidden">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="bg-navy-900 text-white shrink-0 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-5 w-5 text-gold-400 hidden sm:block" />
          <div className="min-w-0">
            <p className="text-xs text-white/60">Only Chemistry</p>
            <p className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[400px]">
              {examData?.examTitle || "Exam"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm transition-colors",
              isTimeCritical
                ? "bg-red-600 text-white animate-pulse shadow-md shadow-red-500/20"
                : isTimeLow
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-navy-700 text-gold-400"
            )}
            title={isTimeCritical ? "Critical time remaining!" : isTimeLow ? "Under 10 minutes remaining" : "Time remaining"}
          >
            <Clock className={cn("h-4 w-4", isTimeCritical && "animate-spin")} />
            <span>{formatTime(timeLeft)}</span>
            {isTimeLow && (
              <span className="hidden md:inline-block text-[10px] uppercase font-sans tracking-wider px-1.5 py-0.5 rounded bg-black/30">
                {isTimeCritical ? "Critical" : "Low Time"}
              </span>
            )}
          </div>
          <span className="text-xs text-white/60 hidden sm:block">
            {user?.name}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10 lg:hidden"
            onClick={() => setShowPalette(!showPalette)}
          >
            <span className="text-xs font-bold">Palette</span>
          </Button>
        </div>
      </header>

      {/* ── Warning Banner ──────────────────────────────────── */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500 text-white px-4 py-2 flex items-center justify-between shrink-0"
          >
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {warningMessage}
            </div>
            <button onClick={() => setShowWarning(false)}>
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Question Panel ──────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Question Progress */}
          <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
            <span className="text-sm font-medium text-foreground">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">{answeredCount} Answered</span>
              <span className="text-red-500 font-medium">
                {questions.length - answeredCount} Remaining
              </span>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {currentQuestion && (
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Marks info */}
                <div className="flex items-center gap-3 mb-4 text-xs">
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                    +{currentQuestion.marks} marks
                  </span>
                  {currentQuestion.negativeMarks > 0 && (
                    <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                      -{currentQuestion.negativeMarks} negative
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                    {currentQuestion.questionType === "single" ? "Single Correct" :
                     currentQuestion.questionType === "multiple" ? "Multiple Correct" : "True/False"}
                  </span>
                </div>

                {/* Question Text */}
                <div className="mb-6 p-4 rounded-xl bg-card border border-border">
                  <p className="text-base font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.questionText}
                  </p>

                  {/* ChemDraw Chemical Structures */}
                  {Array.isArray(currentQuestion.questionChemicalContents) && currentQuestion.questionChemicalContents.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {currentQuestion.questionChemicalContents.map((chem, chemIdx) => (
                        <ChemicalContentRenderer
                          key={chemIdx}
                          content={chem}
                        />
                      ))}
                    </div>
                  )}

                  {currentQuestion.questionImage && (
                    <img
                      src={currentQuestion.questionImage}
                      alt="Question diagram"
                      className="mt-3 max-h-64 rounded-lg object-contain border border-border"
                    />
                  )}
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, optIdx) => {
                    const isSelected = currentResponse?.selectedOptions.includes(option.id);
                    return (
                      <motion.button
                        key={option.id}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleOptionSelect(option.id, currentQuestion.questionType)}
                        className={cn(
                          "w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200",
                          isSelected
                            ? "border-primary bg-primary/10 dark:bg-primary/20"
                            : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                        )}
                        id={`option-${optIdx}`}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-sm",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 text-muted-foreground"
                        )}>
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <div className="flex-1">
                          {option.text && (
                            <p className={cn(
                              "text-sm leading-relaxed",
                              isSelected ? "text-foreground font-medium" : "text-foreground"
                            )}>
                              {option.text}
                            </p>
                          )}
                          {option.chemicalContent && (
                            <div className="mt-1">
                              <ChemicalContentRenderer content={option.chemicalContent} isOption />
                            </div>
                          )}
                          {option.image && (
                            <img src={option.image} alt={`Option ${optIdx + 1}`} className="mt-2 max-h-32 rounded object-contain" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Bottom Navigation ──────────────────────────────── */}
          <div className="bg-card border-t border-border px-4 py-3 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkReview}
                className={cn(
                  "gap-1.5 text-xs",
                  currentResponse?.isMarkedForReview && "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                )}
                id="mark-review"
              >
                <Flag className="h-3.5 w-3.5" />
                {currentResponse?.isMarkedForReview ? "Unmark" : "Mark for Review"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearResponse}
                className="text-xs text-muted-foreground gap-1.5"
                id="clear-response"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIdx === 0}
                onClick={() => goToQuestion(currentIdx - 1)}
                id="prev-question"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              {currentIdx === questions.length - 1 ? (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => setShowSubmitConfirm(true)}
                  className="gap-1.5"
                  id="submit-exam"
                >
                  <Send className="h-4 w-4" />
                  Submit Exam
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => goToQuestion(currentIdx + 1)}
                  id="next-question"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* ── Right Palette ─────────────────────────────────── */}
        <aside className={cn(
          "w-56 border-l border-border bg-card flex-col",
          "hidden lg:flex",
          showPalette && "flex fixed right-0 top-[88px] bottom-0 z-20 shadow-xl"
        )}>
          <div className="p-3 border-b border-border">
            <p className="text-xs font-bold text-foreground">Question Palette</p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />Answered</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />Not Ans.</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />Marked</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" />Not Visited</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 palette-scroll">
            <div className="grid grid-cols-4 gap-1.5">
              {questions.map((q, idx) => {
                const qId = q._id as string;
                const status = responses[qId]?.status || "not_visited";
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={qId}
                    onClick={() => goToQuestion(idx)}
                    id={`palette-${idx + 1}`}
                    className={cn(
                      "w-9 h-9 rounded-lg text-xs font-bold transition-all duration-150",
                      PALETTE_COLORS[status],
                      isCurrent && "ring-2 ring-gold-400 ring-offset-1 ring-offset-card scale-110"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-border space-y-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between"><span>Answered:</span><span className="font-medium text-green-600">{answeredCount}</span></div>
              <div className="flex justify-between"><span>Marked:</span><span className="font-medium text-purple-600">{markedCount}</span></div>
              <div className="flex justify-between"><span>Remaining:</span><span className="font-medium text-red-500">{questions.length - answeredCount}</span></div>
            </div>
            <Button
              variant="gold"
              size="sm"
              className="w-full text-xs gap-1.5"
              onClick={() => setShowSubmitConfirm(true)}
            >
              <Send className="h-3 w-3" />
              Submit
            </Button>
          </div>
        </aside>
      </div>

      {/* ── Submit Confirmation Modal ────────────────────────── */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                  <Send className="h-5 w-5 text-gold-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Submit Exam?</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>

              <div className="space-y-1 mb-5 text-sm">
                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Total Questions</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <span className="text-green-700 dark:text-green-400">Answered</span>
                  <span className="font-medium text-green-700 dark:text-green-400">{answeredCount}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <span className="text-red-700 dark:text-red-400">Unanswered</span>
                  <span className="font-medium text-red-700 dark:text-red-400">{questions.length - answeredCount}</span>
                </div>
                {markedCount > 0 && (
                  <div className="flex justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <span className="text-purple-700 dark:text-purple-400">Marked for Review</span>
                    <span className="font-medium text-purple-700 dark:text-purple-400">{markedCount}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSubmitConfirm(false)}
                >
                  Continue Exam
                </Button>
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={() => handleSubmit(false, false)}
                  isLoading={isSubmitting}
                  loadingText="Submitting..."
                  id="confirm-submit"
                >
                  Submit Now
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
