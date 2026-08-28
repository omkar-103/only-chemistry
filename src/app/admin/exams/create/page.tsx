"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Save,
  BookOpen, Settings, ListChecks, Eye, Upload, X, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { examStep1Schema, examStep2Schema, type ExamStep1Input, type ExamStep2Input } from "@/lib/validators/schemas";
import { EXAM_CATEGORIES, ROUTES, CURRENCY_SYMBOL } from "@/constants";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { ChemicalContent } from "@/types";
import { ChemDrawUploader } from "@/components/ui/ChemDrawUploader";
import { ChemicalContentRenderer } from "@/components/ui/ChemicalContentRenderer";
import { Atom, FileCode } from "lucide-react";

// ── Step metadata ──────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Exam Details", icon: BookOpen },
  { id: 2, label: "Settings",     icon: Settings },
  { id: 3, label: "Questions",    icon: ListChecks },
  { id: 4, label: "Preview",      icon: Eye },
] as const;

// ── Question shape (includes image & ChemDraw chemical content) ──
interface QuestionForm {
  questionText: string;
  questionImage?: string;   // Cloudinary URL
  questionChemicalContents?: ChemicalContent[]; // ChemDraw structures
  questionType: "single" | "multiple" | "truefalse";
  options: { id: string; text: string; image?: string; chemicalContent?: ChemicalContent }[];
  correctAnswers: string[];
  marks: number;
  negativeMarks: number;
  explanation: string;
  order: number;
}

const emptyQuestion = (): QuestionForm => ({
  questionText: "",
  questionImage: undefined,
  questionChemicalContents: [],
  questionType: "single",
  options: [
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ],
  correctAnswers: [],
  marks: 4,
  negativeMarks: 1,
  explanation: "",
  order: 0,
});

// ── Inline image uploader ──────────────────────────────────────
function QuickImageUpload({
  value,
  onChange,
  label,
  id,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  label: string;
  id: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Only image files allowed", variant: "error" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Image must be under 5MB", variant: "error" }); return; }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await axios.post("/api/upload", {
            file: reader.result,
            fileName: file.name,
            folder: "rhg-exam-portal/questions",
          });
          onChange(res.data.data?.secure_url || res.data.data?.url);
        } catch {
          toast({ title: "Upload failed", description: "Check Cloudinary settings", variant: "error" });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  }, [onChange]);

  if (value) {
    return (
      <div className="relative mt-2 rounded-lg overflow-hidden border border-border group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt={label} className="w-full max-h-40 object-contain bg-muted/30" />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="absolute top-1.5 right-1.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <label htmlFor={id} className={cn(
      "flex items-center gap-2 px-3 py-2 mt-1.5 rounded-lg border-2 border-dashed border-border cursor-pointer",
      "hover:border-primary/60 hover:bg-primary/5 transition-colors text-xs text-muted-foreground",
      uploading && "opacity-60 pointer-events-none"
    )}>
      {uploading ? (
        <><div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span>Uploading...</span></>
      ) : (
        <><Upload className="h-3.5 w-3.5" /><span>{label}</span></>
      )}
      <input id={id} type="file" accept="image/*" onChange={handleFile} className="sr-only" disabled={uploading} />
    </label>
  );
}

// ── Page component ─────────────────────────────────────────────
export default function CreateExamPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [step1Data, setStep1Data] = useState<ExamStep1Input | null>(null);
  const [step2Data, setStep2Data] = useState<ExamStep2Input | null>(null);

  // ── ChemDraw Modal State ───────────────────────────────────
  const [chemModalOpen, setChemModalOpen] = useState(false);
  const [chemModalTarget, setChemModalTarget] = useState<{
    type: "question" | "option";
    optId?: string;
    existingIdx?: number;
    initialValue?: ChemicalContent;
  } | null>(null);

  // ── Forms ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const step1Form = useForm<ExamStep1Input>({
    resolver: zodResolver(examStep1Schema) as any,
    defaultValues: {
      accessType: "free",
      visibleTo: [],
      isFree: true,
      price: 0,
      passingPercentage: 40,
      negativeMarkingEnabled: false,
      maxAttempts: 1,
      resultVisibility: "score_only",
      showExplanations: false,
      allowReattempt: false,
      difficulty: "medium",
      status: "draft",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const step2Form = useForm<ExamStep2Input>({
    resolver: zodResolver(examStep2Schema) as any,
    defaultValues: {
      totalDuration: 60,
      autoDistributeTime: true,
      shuffleQuestions: false,
      shuffleOptions: false,
    },
  });

  const accessType = step1Form.watch("accessType") || "free";
  const visibleTo = step1Form.watch("visibleTo") || [];

  const toggleVisibleTo = (catValue: string) => {
    const current = step1Form.getValues("visibleTo") || [];
    const updated = current.includes(catValue)
      ? current.filter((c) => c !== catValue)
      : [...current, catValue];
    step1Form.setValue("visibleTo", updated, { shouldValidate: true });
  };

  // ── Step handlers ──────────────────────────────────────────
  const handleStep1 = (data: ExamStep1Input) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleStep2 = (data: ExamStep2Input) => {
    setStep2Data(data);
    setStep(3);
  };

  // ── Question helpers ───────────────────────────────────────
  const updateQuestion = (field: keyof QuestionForm, value: unknown) => {
    setQuestions(prev =>
      prev.map((q, i) => i === currentQIdx ? { ...q, [field]: value } : q)
    );
  };

  const updateOptionImage = (optId: string, imageUrl: string | undefined) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === currentQIdx
          ? { ...q, options: q.options.map(o => o.id === optId ? { ...o, image: imageUrl } : o) }
          : q
      )
    );
  };

  // ── ChemDraw Content Helpers ───────────────────────────────
  const addQuestionChemContent = (content: ChemicalContent) => {
    const q = questions[currentQIdx];
    const currentList = q.questionChemicalContents || [];
    updateQuestion("questionChemicalContents", [...currentList, content]);
  };

  const updateQuestionChemContent = (index: number, content: ChemicalContent) => {
    const q = questions[currentQIdx];
    const currentList = [...(q.questionChemicalContents || [])];
    currentList[index] = content;
    updateQuestion("questionChemicalContents", currentList);
  };

  const removeQuestionChemContent = (index: number) => {
    const q = questions[currentQIdx];
    const currentList = (q.questionChemicalContents || []).filter((_, idx) => idx !== index);
    updateQuestion("questionChemicalContents", currentList);
  };

  const setOptionChemContent = (optId: string, content: ChemicalContent | undefined) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === currentQIdx
          ? { ...q, options: q.options.map(o => o.id === optId ? { ...o, chemicalContent: content } : o) }
          : q
      )
    );
  };

  const toggleCorrectAnswer = (optId: string, qType: string) => {
    const q = questions[currentQIdx];
    let newAnswers: string[];
    if (qType === "single" || qType === "truefalse") {
      newAnswers = [optId];
    } else {
      newAnswers = q.correctAnswers.includes(optId)
        ? q.correctAnswers.filter(a => a !== optId)
        : [...q.correctAnswers, optId];
    }
    updateQuestion("correctAnswers", newAnswers);
  };

  const addQuestion = () => {
    const newQ = { ...emptyQuestion(), order: questions.length };
    setQuestions(prev => [...prev, newQ]);
    setCurrentQIdx(questions.length);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    setCurrentQIdx(Math.max(0, idx - 1));
  };

  const switchQuestionType = (t: "single" | "multiple" | "truefalse") => {
    updateQuestion("questionType", t);
    updateQuestion("correctAnswers", []);
    if (t === "truefalse") {
      updateQuestion("options", [{ id: "T", text: "True" }, { id: "F", text: "False" }]);
    } else if (currentQ.questionType === "truefalse") {
      updateQuestion("options", [
        { id: "A", text: "" }, { id: "B", text: "" },
        { id: "C", text: "" }, { id: "D", text: "" },
      ]);
    }
  };

  // ── Validation ─────────────────────────────────────────────
  const validateQuestions = (): string | null => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return `Question ${i + 1}: Question text is required`;
      if (q.options.some(o => !o.text.trim() && !o.image && !o.chemicalContent)) {
        return `Question ${i + 1}: All options must have text, an image, or a chemical structure`;
      }
      if (q.correctAnswers.length === 0) {
        return `Question ${i + 1}: Please select at least one correct answer`;
      }
      if (q.marks <= 0) {
        return `Question ${i + 1}: Positive marks must be greater than 0`;
      }
      if (q.negativeMarks < 0 || q.negativeMarks > q.marks) {
        return `Question ${i + 1}: Negative marks cannot exceed positive marks (${q.marks})`;
      }
    }
    return null;
  };

  // ── Save / Publish ─────────────────────────────────────────
  const handleSave = async (publishStatus: "draft" | "published") => {
    const qErr = validateQuestions();
    if (qErr) { toast({ title: "Validation Error", description: qErr, variant: "error" }); return; }
    if (!step1Data || !step2Data) {
      toast({ title: "Missing data", description: "Please complete all steps first", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...step1Data,
        ...step2Data,
        status: publishStatus,    // ← explicitly set here, overrides schema default
        questions: questions.map((q, idx) => ({ ...q, order: idx })),
      };

      const response = await axios.post("/api/exams", payload);

      if (response.data.success) {
        toast({
          title: publishStatus === "published" ? "🎉 Exam Published!" : "📝 Saved as Draft",
          description: publishStatus === "published"
            ? "Students can now see and attempt this exam."
            : "Exam saved as draft. Publish when ready.",
          variant: "success",
        });
        router.push(ROUTES.ADMIN.EXAMS);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || "Please try again";
      toast({ title: "Save failed", description: msg, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const currentQ = questions[currentQIdx];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Create Exam</h1>
          <p className="text-muted-foreground text-sm">Build a new examination step by step</p>
        </div>
        <Button variant="outline" onClick={() => router.push(ROUTES.ADMIN.EXAMS)}>Cancel</Button>
      </div>

      {/* ── Step Indicator ── */}
      <div className="bg-card p-3 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const current = step === s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => { if (done) setStep(s.id); }}
                  disabled={!done && !current}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all w-full text-left",
                    current
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs ring-2 ring-primary/30"
                      : done
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                        : "bg-muted/60 text-muted-foreground opacity-70"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                    current ? "bg-primary-foreground/20 text-primary-foreground" : done ? "bg-emerald-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {done ? "✓" : s.id}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <div className="text-xs font-semibold truncate">{s.label}</div>
                    <div className="text-[10px] opacity-70 truncate">{current ? "Current step" : done ? "Completed" : "Pending"}</div>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-0.5 w-3 sm:w-6 mx-1 shrink-0 rounded-full", done ? "bg-emerald-500" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════════════
            STEP 1 — Exam Details
        ══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader><CardTitle>Exam Details</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-4" id="exam-step1-form">
                  <div className="grid sm:grid-cols-2 gap-4">

                    {/* Title */}
                    <div className="sm:col-span-2">
                      <Input
                        id="exam-title"
                        label="Exam Title"
                        placeholder="e.g., JEE Main Chemistry Mock Test 1"
                        error={step1Form.formState.errors.title?.message}
                        required
                        {...step1Form.register("title")}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Category <span className="text-destructive">*</span>
                      </label>
                      <select
                        id="exam-category"
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...step1Form.register("category")}
                      >
                        <option value="">Select Category</option>
                        {EXAM_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      {step1Form.formState.errors.category && (
                        <p className="text-xs text-destructive mt-1">⚠ {step1Form.formState.errors.category.message}</p>
                      )}
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Difficulty <span className="text-destructive">*</span>
                      </label>
                      <select
                        id="exam-difficulty"
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...step1Form.register("difficulty")}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    {/* Subject */}
                    <Input
                      id="exam-subject"
                      label="Subject"
                      placeholder="e.g., Physical Chemistry"
                      required
                      {...step1Form.register("subject")}
                      error={step1Form.formState.errors.subject?.message}
                    />

                    {/* Passing Percentage */}
                    <Input
                      id="exam-passing"
                      label="Passing Percentage"
                      type="number"
                      min={0}
                      max={100}
                      {...step1Form.register("passingPercentage", { valueAsNumber: true })}
                      error={step1Form.formState.errors.passingPercentage?.message}
                    />

                    {/* Max Attempts */}
                    <Input
                      id="exam-attempts"
                      label="Max Attempts"
                      type="number"
                      min={1}
                      max={10}
                      {...step1Form.register("maxAttempts", { valueAsNumber: true })}
                      error={step1Form.formState.errors.maxAttempts?.message}
                    />

                    {/* Description */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Description <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        id="exam-description"
                        rows={3}
                        placeholder="Describe what this exam covers..."
                        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        {...step1Form.register("description")}
                      />
                      {step1Form.formState.errors.description && (
                        <p className="text-xs text-destructive mt-1">⚠ {step1Form.formState.errors.description.message}</p>
                      )}
                    </div>

                    {/* Access Type & Visibility */}
                    <div className="sm:col-span-2 p-4 rounded-xl bg-muted/50 border border-border space-y-4">
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">Access Type & Student Visibility</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Control whether this exam is free for all students or restricted to specific assigned exam categories.
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <label
                          className={cn(
                            "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                            accessType === "free"
                              ? "border-primary bg-primary/10 shadow-xs"
                              : "border-border hover:bg-muted/40"
                          )}
                        >
                          <input
                            type="radio"
                            name="accessTypeRadio"
                            value="free"
                            checked={accessType === "free"}
                            onChange={() => {
                              step1Form.setValue("accessType", "free", { shouldValidate: true });
                              step1Form.setValue("isFree", true);
                              step1Form.setValue("price", 0);
                            }}
                            className="mt-0.5 w-4 h-4 accent-primary"
                          />
                          <div>
                            <div className="text-sm font-semibold text-foreground">Free Exam</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Accessible to all registered students without category restrictions
                            </div>
                          </div>
                        </label>

                        <label
                          className={cn(
                            "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                            accessType === "restricted"
                              ? "border-primary bg-primary/10 shadow-xs"
                              : "border-border hover:bg-muted/40"
                          )}
                        >
                          <input
                            type="radio"
                            name="accessTypeRadio"
                            value="restricted"
                            checked={accessType === "restricted"}
                            onChange={() => {
                              step1Form.setValue("accessType", "restricted", { shouldValidate: true });
                              step1Form.setValue("isFree", false);
                              const currentCat = step1Form.getValues("category");
                              const curVis = step1Form.getValues("visibleTo") || [];
                              if (curVis.length === 0 && currentCat) {
                                step1Form.setValue("visibleTo", [currentCat], { shouldValidate: true });
                              }
                            }}
                            className="mt-0.5 w-4 h-4 accent-primary"
                          />
                          <div>
                            <div className="text-sm font-semibold text-foreground">Restricted Exam</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Accessible only to students with matching assigned exam categories
                            </div>
                          </div>
                        </label>
                      </div>

                      {accessType === "restricted" && (
                        <div className="pt-3 space-y-2.5 border-t border-border">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                              Visible To <span className="text-destructive">*</span>
                            </label>
                            <span className="text-[11px] text-muted-foreground">
                              {visibleTo.length} categor{visibleTo.length === 1 ? "y" : "ies"} selected
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select which student exam groups can view and attempt this exam:
                          </p>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {EXAM_CATEGORIES.map((cat) => {
                              const isChecked = visibleTo.includes(cat.value);
                              return (
                                <button
                                  key={cat.value}
                                  type="button"
                                  onClick={() => toggleVisibleTo(cat.value)}
                                  className={cn(
                                    "flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all",
                                    isChecked
                                      ? "border-primary bg-primary/15 text-primary font-semibold"
                                      : "border-border hover:border-primary/40 text-foreground bg-background"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0",
                                      isChecked
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/50"
                                    )}
                                  >
                                    {isChecked && "✓"}
                                  </div>
                                  <span className="truncate">{cat.icon} {cat.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          {step1Form.formState.errors.visibleTo && (
                            <p className="text-xs text-destructive mt-1">
                              ⚠ {step1Form.formState.errors.visibleTo.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Result & Options */}
                    <div className="sm:col-span-2 p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                      <h3 className="font-semibold text-sm text-foreground">Result & Options</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Result Visibility</label>
                          <select
                            id="result-visibility"
                            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            {...step1Form.register("resultVisibility")}
                          >
                            <option value="score_only">Score Only</option>
                            <option value="full">Full Review</option>
                            <option value="hidden">Hidden</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2 pt-1">
                          {([
                            { id: "neg-marking",    field: "negativeMarkingEnabled", label: "Enable Negative Marking" },
                            { id: "show-explain",   field: "showExplanations",       label: "Show Explanations" },
                            { id: "allow-reattempt",field: "allowReattempt",         label: "Allow Reattempt" },
                          ] as const).map(opt => (
                            <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                id={opt.id}
                                {...step1Form.register(opt.field)}
                                className="w-4 h-4 accent-primary"
                              />
                              <span className="text-sm">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="gold" size="lg" className="gap-2" id="step1-next">
                      Next: Settings <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 2 — Timing & Settings
        ══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader><CardTitle>Timing & Settings</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-4" id="exam-step2-form">
                  <Input
                    id="total-duration"
                    label="Total Duration (minutes)"
                    type="number"
                    min={1}
                    max={360}
                    required
                    {...step2Form.register("totalDuration", { valueAsNumber: true })}
                    error={step2Form.formState.errors.totalDuration?.message}
                  />

                  <div className="space-y-2">
                    {([
                      { id: "auto-time",  field: "autoDistributeTime",  label: "Auto-distribute time per question" },
                      { id: "shuffle-q",  field: "shuffleQuestions",     label: "Shuffle question order" },
                      { id: "shuffle-o",  field: "shuffleOptions",       label: "Shuffle answer options" },
                    ] as const).map(opt => (
                      <label key={opt.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border cursor-pointer hover:bg-muted/80 transition-colors">
                        <input
                          type="checkbox"
                          id={opt.id}
                          {...step2Form.register(opt.field)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
                      <ChevronLeft className="h-4 w-4" />Back
                    </Button>
                    <Button type="submit" variant="gold" size="lg" className="gap-2" id="step2-next">
                      Next: Questions <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 3 — Questions Editor
        ══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="flex gap-4">

              {/* Sidebar: question list */}
              <div className="w-36 shrink-0">
                <div className="space-y-1 max-h-[540px] overflow-y-auto pr-1">
                  {questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentQIdx(i)}
                      id={`q-nav-${i + 1}`}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all",
                        currentQIdx === i
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80",
                        q.correctAnswers.length > 0 && currentQIdx !== i && "border-l-2 border-green-500"
                      )}
                    >
                      <div className="font-bold flex items-center gap-1">
                        Q{i + 1}
                        {q.questionChemicalContents && q.questionChemicalContents.length > 0 && <Atom className="h-3 w-3 opacity-75 text-amber-300" />}
                        {q.questionImage && <ImageIcon className="h-3 w-3 opacity-60" />}
                      </div>
                      <div className="truncate opacity-70">{q.questionText || "(empty)"}</div>
                    </button>
                  ))}
                  <Button variant="outline" size="sm" onClick={addQuestion} className="w-full gap-1 mt-2" id="add-question">
                    <Plus className="h-3 w-3" />Add Q
                  </Button>
                </div>
              </div>

              {/* Question editor */}
              <Card className="flex-1 min-w-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Question {currentQIdx + 1} of {questions.length}</CardTitle>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(currentQIdx)}
                        className="text-destructive hover:text-destructive gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />Remove
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentQ && (
                    <>
                      {/* Question Type */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Question Type</label>
                        <div className="flex gap-2 flex-wrap">
                          {(["single", "multiple", "truefalse"] as const).map(t => (
                            <button
                              key={t}
                              type="button"
                              id={`type-${t}`}
                              onClick={() => switchQuestionType(t)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                                currentQ.questionType === t
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border text-muted-foreground hover:border-primary"
                              )}
                            >
                              {t === "single" ? "Single Correct" : t === "multiple" ? "Multiple Correct" : "True/False"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Question Text */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Question Text <span className="text-destructive">*</span>
                        </label>
                        <textarea
                          id={`q-text-${currentQIdx}`}
                          rows={3}
                          placeholder="Enter your question here..."
                          value={currentQ.questionText}
                          onChange={e => updateQuestion("questionText", e.target.value)}
                          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                      </div>

                      {/* Question Media: Image & ChemDraw Chemical Structures */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-foreground">
                            Question Media &amp; Chemistry Diagrams <span className="text-muted-foreground text-xs">(optional)</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
                              onClick={() => {
                                setChemModalTarget({ type: "question" });
                                setChemModalOpen(true);
                              }}
                            >
                              <Atom className="h-3.5 w-3.5" />
                              + Add ChemDraw Content
                            </Button>
                          </div>
                        </div>

                        {/* ChemDraw Chemical Structures List (Question Level) */}
                        {currentQ.questionChemicalContents && currentQ.questionChemicalContents.length > 0 && (
                          <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border">
                            <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                              <span>ChemDraw Structures ({currentQ.questionChemicalContents.length})</span>
                              <span className="text-[10px] text-muted-foreground">Original CDXML preserved</span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2.5">
                              {currentQ.questionChemicalContents.map((chem, chemIdx) => (
                                <div
                                  key={chemIdx}
                                  className="relative group p-2.5 rounded-lg border border-border bg-card hover:border-primary/50 transition-all flex flex-col items-center"
                                >
                                  <div className="w-full flex items-center justify-between text-[11px] font-medium text-muted-foreground mb-1">
                                    <span className="truncate max-w-[140px] font-semibold text-foreground">
                                      {chem.altText || `Structure #${chemIdx + 1}`}
                                    </span>
                                    <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-muted">
                                      {chem.renderedFormat}
                                    </span>
                                  </div>

                                  {/* White background chemical container */}
                                  <div className="bg-white p-2 rounded border border-gray-200 w-full flex items-center justify-center min-h-[90px]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={chem.renderedUrl}
                                      alt={chem.altText || "Chemical structure"}
                                      className="max-h-24 max-w-full object-contain"
                                    />
                                  </div>

                                  <div className="w-full flex items-center justify-end gap-1.5 mt-2 pt-1.5 border-t border-border/50">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                                      onClick={() => {
                                        setChemModalTarget({
                                          type: "question",
                                          existingIdx: chemIdx,
                                          initialValue: chem,
                                        });
                                        setChemModalOpen(true);
                                      }}
                                    >
                                      Replace
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-[10px] px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => removeQuestionChemContent(chemIdx)}
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Answer Options */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-foreground">
                            Options — <span className="text-muted-foreground text-xs">click the circle to mark correct</span>
                          </label>
                          {currentQ.questionType === "multiple" && (
                            <span className="text-xs text-muted-foreground">Select all correct answers</span>
                          )}
                        </div>
                        <div className="space-y-3">
                          {currentQ.options.map((opt, optIdx) => {
                            const isCorrect = currentQ.correctAnswers.includes(opt.id);
                            return (
                              <div
                                key={opt.id}
                                className={cn(
                                  "p-3 rounded-xl border-2 transition-all space-y-2.5",
                                  isCorrect
                                    ? "border-green-500 bg-green-50/60 dark:bg-green-900/10"
                                    : "border-border bg-card"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleCorrectAnswer(opt.id, currentQ.questionType)}
                                    id={`correct-${currentQIdx}-${optIdx}`}
                                    className={cn(
                                      "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                                      isCorrect
                                        ? "bg-green-500 border-green-500 text-white"
                                        : "border-muted-foreground/40 text-muted-foreground hover:border-primary"
                                    )}
                                  >
                                    {opt.id}
                                  </button>
                                  <input
                                    type="text"
                                    placeholder={`Option ${opt.id} text`}
                                    value={opt.text}
                                    id={`opt-${currentQIdx}-${opt.id}`}
                                    onChange={e =>
                                      updateQuestion(
                                        "options",
                                        currentQ.options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o)
                                      )
                                    }
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                  />
                                  {/* ChemDraw action for this option */}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] gap-1 shrink-0 border-primary/30 text-primary hover:bg-primary/5"
                                    onClick={() => {
                                      setChemModalTarget({
                                        type: "option",
                                        optId: opt.id,
                                        initialValue: opt.chemicalContent,
                                      });
                                      setChemModalOpen(true);
                                    }}
                                  >
                                    <Atom className="h-3 w-3" />
                                    {opt.chemicalContent ? "Edit ChemDraw" : "+ ChemDraw"}
                                  </Button>
                                </div>

                                {/* Option ChemDraw Chemical Structure Preview */}
                                {opt.chemicalContent && (
                                  <div className="p-2 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 max-w-full">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="bg-white p-1.5 rounded border border-gray-200 shrink-0 flex items-center justify-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={opt.chemicalContent.renderedUrl}
                                          alt={opt.chemicalContent.altText || `Option ${opt.id} structure`}
                                          className="max-h-16 max-w-[180px] w-auto h-auto object-contain"
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                                          {opt.chemicalContent.altText || `Option ${opt.id} Structure`}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-mono">
                                          {opt.chemicalContent.renderedFormat} · ChemDraw
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => {
                                          setChemModalTarget({
                                            type: "option",
                                            optId: opt.id,
                                            initialValue: opt.chemicalContent,
                                          });
                                          setChemModalOpen(true);
                                        }}
                                      >
                                        Replace
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                                        onClick={() => setOptionChemContent(opt.id, undefined)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Marks */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Marks</label>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={currentQ.marks}
                            id={`marks-${currentQIdx}`}
                            onChange={e => updateQuestion("marks", parseFloat(e.target.value) || 1)}
                            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Negative Marks</label>
                          <input
                            type="number"
                            min={0}
                            step={0.25}
                            value={currentQ.negativeMarks}
                            id={`neg-${currentQIdx}`}
                            onChange={e => updateQuestion("negativeMarks", parseFloat(e.target.value) || 0)}
                            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Explanation (optional)</label>
                        <textarea
                          rows={2}
                          placeholder="Explain the correct answer..."
                          value={currentQ.explanation}
                          id={`explain-${currentQIdx}`}
                          onChange={e => updateQuestion("explanation", e.target.value)}
                          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3 justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ChevronLeft className="h-4 w-4" />Back
              </Button>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {questions.filter(q => q.correctAnswers.length > 0).length}/{questions.length} questions complete
                </p>
                <Button variant="gold" onClick={() => {
                  const err = validateQuestions();
                  if (err) { toast({ title: "Fix questions first", description: err, variant: "error" }); return; }
                  setStep(4);
                }} className="gap-2" id="step3-next">
                  Preview <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 4 — Preview & Publish
        ══════════════════════════════════════════════════════ */}
        {step === 4 && step1Data && step2Data && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview & Publish</CardTitle></CardHeader>
              <CardContent className="space-y-5">

                {/* Info Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <h3 className="font-semibold text-sm">Exam Info</h3>
                    {([
                      ["Title",      step1Data.title],
                      ["Category",   step1Data.category],
                      ["Subject",    step1Data.subject],
                      ["Difficulty", step1Data.difficulty],
                      ["Price",      step1Data.isFree ? "Free" : `${CURRENCY_SYMBOL}${(step1Data.price / 100).toFixed(2)}`],
                      ["Passing",    `${step1Data.passingPercentage}%`],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{k}:</span>
                        <span className="font-medium capitalize">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <h3 className="font-semibold text-sm">Settings</h3>
                    {([
                      ["Duration",         `${step2Data.totalDuration} min`],
                      ["Questions",        String(questions.length)],
                      ["Total Marks",      String(questions.reduce((s, q) => s + q.marks, 0))],
                      ["Shuffle Questions",step2Data.shuffleQuestions ? "Yes" : "No"],
                      ["Negative Marking", step1Data.negativeMarkingEnabled ? "Yes" : "No"],
                      ["Result Visibility",step1Data.resultVisibility.replace("_", " ")],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{k}:</span>
                        <span className="font-medium capitalize">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Questions Preview */}
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className="font-semibold text-sm mb-3">Questions Preview</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {questions.map((q, i) => (
                      <div key={i} className="p-3.5 rounded-lg bg-card border border-border space-y-2.5">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-xs text-muted-foreground w-6 shrink-0 pt-0.5">Q{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{q.questionText || "(empty)"}</p>

                            {/* ChemDraw Chemical Structures Preview */}
                            {q.questionChemicalContents && q.questionChemicalContents.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {q.questionChemicalContents.map((chem, chemIdx) => (
                                  <ChemicalContentRenderer
                                    key={chemIdx}
                                    content={chem}
                                    showLabel
                                  />
                                ))}
                              </div>
                            )}

                            {q.questionImage && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={q.questionImage} alt="question" className="mt-1.5 max-h-24 rounded-md object-contain" />
                            )}
                          </div>
                          <span className={cn(
                            "text-xs font-medium shrink-0",
                            q.correctAnswers.length > 0 ? "text-green-600" : "text-red-500"
                          )}>
                            {q.correctAnswers.length > 0 ? `✓ ${q.marks}m` : "No answer"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-8">
                          {q.options.map(opt => (
                            <div key={opt.id} className={cn(
                              "p-2 rounded-md space-y-1 text-xs",
                              q.correctAnswers.includes(opt.id)
                                ? "bg-green-100/70 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-300 dark:border-green-800"
                                : "bg-muted text-muted-foreground"
                            )}>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{opt.id}.</span>
                                <span className="truncate">{opt.text || (opt.chemicalContent ? "[ChemDraw Structure]" : opt.image ? "[Image]" : "(empty)")}</span>
                              </div>
                              {opt.chemicalContent && (
                                <div className="mt-1">
                                  <ChemicalContentRenderer content={opt.chemicalContent} isOption />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />Edit Questions
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleSave("draft")}
                      isLoading={saving}
                      loadingText="Saving..."
                      id="save-draft"
                    >
                      <Save className="h-4 w-4 mr-1.5" />Save as Draft
                    </Button>
                    <Button
                      variant="gold"
                      onClick={() => handleSave("published")}
                      isLoading={saving}
                      loadingText="Publishing..."
                      id="publish-exam"
                    >
                      Publish Exam
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ChemDraw Upload Modal ── */}
      {chemModalOpen && (
        <ChemDrawUploader
          isOpen={chemModalOpen}
          title={
            chemModalTarget?.type === "option"
              ? `ChemDraw Structure for Option ${chemModalTarget.optId}`
              : "Add ChemDraw Structure to Question"
          }
          initialValue={chemModalTarget?.initialValue}
          onClose={() => {
            setChemModalOpen(false);
            setChemModalTarget(null);
          }}
          onInsert={(content) => {
            if (chemModalTarget?.type === "question") {
              if (chemModalTarget.existingIdx !== undefined) {
                updateQuestionChemContent(chemModalTarget.existingIdx, content);
              } else {
                addQuestionChemContent(content);
              }
            } else if (chemModalTarget?.type === "option" && chemModalTarget.optId) {
              setOptionChemContent(chemModalTarget.optId, content);
            }
            setChemModalOpen(false);
            setChemModalTarget(null);
          }}
        />
      )}
    </div>
  );
}
