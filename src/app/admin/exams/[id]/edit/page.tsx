"use client";

/**
 * /admin/exams/[id]/edit
 * Pre-populated 4-step exam editor. Loads existing exam data on mount,
 * hydrates all form state, then saves via PUT /api/exams/[id].
 * Works for both draft and published exams.
 */

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Save,
  BookOpen, Settings, ListChecks, Eye, Upload, X, Image as ImageIcon, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { examStep1Schema, examStep2Schema, type ExamStep1Input, type ExamStep2Input } from "@/lib/validators/schemas";
import { EXAM_CATEGORIES, ROUTES, CURRENCY_SYMBOL } from "@/constants";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

// ── Step metadata ──────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Exam Details", icon: BookOpen },
  { id: 2, label: "Settings",     icon: Settings },
  { id: 3, label: "Questions",    icon: ListChecks },
  { id: 4, label: "Preview",      icon: Eye },
] as const;

// ── Question shape ─────────────────────────────────────────────
interface QuestionForm {
  questionText:  string;
  questionImage?: string;
  questionType:  "single" | "multiple" | "truefalse";
  options:       { id: string; text: string; image?: string }[];
  correctAnswers: string[];
  marks:         number;
  negativeMarks: number;
  explanation:   string;
  order:         number;
}

const emptyQuestion = (): QuestionForm => ({
  questionText: "",
  questionImage: undefined,
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
  value, onChange, label, id,
}: { value?: string; onChange: (url: string | undefined) => void; label: string; id: string }) {
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
          const res = await axios.post("/api/upload", { file: reader.result, fileName: file.name, folder: "rhg-exam-portal/questions" });
          onChange(res.data.data?.secure_url || res.data.data?.url);
        } catch {
          toast({ title: "Upload failed", description: "Check Cloudinary settings", variant: "error" });
        } finally { setUploading(false); }
      };
      reader.readAsDataURL(file);
    } catch { setUploading(false); }
  }, [onChange]);

  if (value) {
    return (
      <div className="relative mt-2 rounded-lg overflow-hidden border border-border group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt={label} className="w-full max-h-40 object-contain bg-muted/30" />
        <button type="button" onClick={() => onChange(undefined)}
          className="absolute top-1.5 right-1.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
      {uploading
        ? <><div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span>Uploading...</span></>
        : <><Upload className="h-3.5 w-3.5" /><span>{label}</span></>}
      <input id={id} type="file" accept="image/*" onChange={handleFile} className="sr-only" disabled={uploading} />
    </label>
  );
}

// ── Page component ─────────────────────────────────────────────
export default function EditExamPage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();

  const [step, setStep]               = useState(1);
  const [questions, setQuestions]     = useState<QuestionForm[]>([emptyQuestion()]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [step1Data, setStep1Data]     = useState<ExamStep1Input | null>(null);
  const [step2Data, setStep2Data]     = useState<ExamStep2Input | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const step1Form = useForm<ExamStep1Input>({
    resolver: zodResolver(examStep1Schema) as any,
    defaultValues: {
      isFree: true, price: 0, passingPercentage: 40,
      negativeMarkingEnabled: false, maxAttempts: 1,
      resultVisibility: "score_only", showExplanations: false,
      allowReattempt: false, difficulty: "medium", status: "draft",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const step2Form = useForm<ExamStep2Input>({
    resolver: zodResolver(examStep2Schema) as any,
    defaultValues: {
      totalDuration: 60, autoDistributeTime: true,
      shuffleQuestions: false, shuffleOptions: false,
    },
  });

  const isFree = step1Form.watch("isFree");

  // ── Hydrate forms from existing exam data ──────────────────
  useEffect(() => {
    axios.get(`/api/exams/${id}`)
      .then(r => {
        const e = r.data.data;

        // Hydrate step1 form
        step1Form.reset({
          title:                  e.title               ?? "",
          description:            e.description         ?? "",
          category:               e.category            ?? "",
          subject:                e.subject             ?? "",
          difficulty:             e.difficulty          ?? "medium",
          isFree:                 e.isFree              ?? true,
          price:                  e.price               ?? 0,
          passingPercentage:      e.passingPercentage   ?? 40,
          maxAttempts:            e.maxAttempts         ?? 1,
          negativeMarkingEnabled: e.negativeMarkingEnabled ?? false,
          resultVisibility:       e.resultVisibility    ?? "score_only",
          showExplanations:       e.showExplanations    ?? false,
          allowReattempt:         e.allowReattempt      ?? false,
          status:                 e.status              ?? "draft",
        });

        // Hydrate step2 form
        step2Form.reset({
          totalDuration:       e.totalDuration        ?? 60,
          autoDistributeTime:  e.autoDistributeTime   ?? true,
          shuffleQuestions:    e.shuffleQuestions     ?? false,
          shuffleOptions:      e.shuffleOptions       ?? false,
        });

        // Hydrate step1Data & step2Data so Preview (step 4) works immediately
        setStep1Data({
          title: e.title, description: e.description, category: e.category,
          subject: e.subject, difficulty: e.difficulty, isFree: e.isFree,
          price: e.price, passingPercentage: e.passingPercentage,
          maxAttempts: e.maxAttempts, negativeMarkingEnabled: e.negativeMarkingEnabled,
          resultVisibility: e.resultVisibility, showExplanations: e.showExplanations,
          allowReattempt: e.allowReattempt, status: e.status,
        });
        setStep2Data({
          totalDuration: e.totalDuration, autoDistributeTime: e.autoDistributeTime,
          shuffleQuestions: e.shuffleQuestions, shuffleOptions: e.shuffleOptions,
        });

        // Hydrate questions — map DB shape → QuestionForm shape
        if (Array.isArray(e.questions) && e.questions.length > 0) {
          setQuestions(e.questions.map((q: any, idx: number) => ({
            questionText:   q.questionText  ?? "",
            questionImage:  q.questionImage,
            questionType:   q.questionType  ?? "single",
            options:        Array.isArray(q.options) ? q.options.map((o: any) => ({
              id:    o.id   ?? o._id ?? String(o.label ?? "A"),
              text:  o.text ?? "",
              image: o.image,
            })) : [
              { id: "A", text: "" }, { id: "B", text: "" },
              { id: "C", text: "" }, { id: "D", text: "" },
            ],
            correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers : [],
            marks:          q.marks          ?? 4,
            negativeMarks:  q.negativeMarks  ?? 1,
            explanation:    q.explanation    ?? "",
            order:          q.order          ?? idx,
          })));
        }
      })
      .catch(() => { toast({ title: "Failed to load exam", variant: "error" }); router.push(ROUTES.ADMIN.EXAMS); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Step handlers ──────────────────────────────────────────
  const handleStep1 = (data: ExamStep1Input) => { setStep1Data(data); setStep(2); };
  const handleStep2 = (data: ExamStep2Input) => { setStep2Data(data); setStep(3); };

  // ── Question helpers ───────────────────────────────────────
  const updateQuestion = (field: keyof QuestionForm, value: unknown) => {
    setQuestions(prev => prev.map((q, i) => i === currentQIdx ? { ...q, [field]: value } : q));
  };

  const updateOptionImage = (optId: string, imageUrl: string | undefined) => {
    setQuestions(prev => prev.map((q, i) =>
      i === currentQIdx
        ? { ...q, options: q.options.map(o => o.id === optId ? { ...o, image: imageUrl } : o) }
        : q
    ));
  };

  const toggleCorrectAnswer = (optId: string, qType: string) => {
    const q = questions[currentQIdx];
    const newAnswers = (qType === "single" || qType === "truefalse")
      ? [optId]
      : q.correctAnswers.includes(optId)
        ? q.correctAnswers.filter(a => a !== optId)
        : [...q.correctAnswers, optId];
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
    } else if (currentQ?.questionType === "truefalse") {
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
      if (q.options.some(o => !o.text.trim() && !o.image)) return `Question ${i + 1}: All options must have text or an image`;
      if (q.correctAnswers.length === 0) return `Question ${i + 1}: Please select at least one correct answer`;
    }
    return null;
  };

  // ── Save — uses PUT instead of POST ───────────────────────
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
        status: publishStatus,
        questions: questions.map((q, idx) => ({ ...q, order: idx })),
      };
      // ↑ PUT to existing exam — this is the key difference from the create page
      const response = await axios.put(`/api/exams/${id}`, payload);
      if (response.data.success || response.data.data) {
        toast({
          title: publishStatus === "published" ? "🎉 Exam Published!" : "📝 Draft Updated",
          description: publishStatus === "published"
            ? "Students can now see and attempt this exam."
            : "Exam saved as draft. Publish when ready.",
          variant: "success",
        });
        router.push(`/admin/exams/${id}`);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast({ title: "Save failed", description: err.response?.data?.message || "Please try again", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const currentQ = questions[currentQIdx];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/exams/${id}`}>
            <Button variant="ghost" size="icon-sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-black text-foreground">Edit Exam</h1>
            <p className="text-muted-foreground text-sm">Update exam details, questions, and settings</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push(`/admin/exams/${id}`)}>Cancel</Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done    = step > s.id;
          const current = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                current ? "bg-primary text-primary-foreground"
                  : done ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-1", done ? "bg-green-500" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ══ STEP 1 — Exam Details ══ */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader><CardTitle>Exam Details</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-4" id="exam-step1-form">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Input id="exam-title" label="Exam Title" placeholder="e.g., JEE Main Chemistry Mock Test 1"
                        error={step1Form.formState.errors.title?.message} required {...step1Form.register("title")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Category <span className="text-destructive">*</span></label>
                      <select id="exam-category" className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...step1Form.register("category")}>
                        <option value="">Select Category</option>
                        {EXAM_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      {step1Form.formState.errors.category && <p className="text-xs text-destructive mt-1">⚠ {step1Form.formState.errors.category.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Difficulty <span className="text-destructive">*</span></label>
                      <select id="exam-difficulty" className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...step1Form.register("difficulty")}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <Input id="exam-subject" label="Subject" placeholder="e.g., Physical Chemistry" required {...step1Form.register("subject")} error={step1Form.formState.errors.subject?.message} />
                    <Input id="exam-passing" label="Passing Percentage" type="number" min={0} max={100} {...step1Form.register("passingPercentage", { valueAsNumber: true })} error={step1Form.formState.errors.passingPercentage?.message} />
                    <Input id="exam-attempts" label="Max Attempts" type="number" min={1} max={10} {...step1Form.register("maxAttempts", { valueAsNumber: true })} error={step1Form.formState.errors.maxAttempts?.message} />
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1.5">Description <span className="text-destructive">*</span></label>
                      <textarea id="exam-description" rows={3} placeholder="Describe what this exam covers..." className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" {...step1Form.register("description")} />
                      {step1Form.formState.errors.description && <p className="text-xs text-destructive mt-1">⚠ {step1Form.formState.errors.description.message}</p>}
                    </div>
                    <div className="sm:col-span-2 p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                      <h3 className="font-semibold text-sm text-foreground">Pricing</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="is-free" {...step1Form.register("isFree")} className="w-4 h-4 accent-primary" />
                        <span className="text-sm">This exam is free</span>
                      </label>
                      {!isFree && (
                        <Input id="exam-price" label={`Price (in paise, e.g., 19900 = ${CURRENCY_SYMBOL}199)`} type="number" min={0}
                          {...step1Form.register("price", { valueAsNumber: true })}
                          hint={`${CURRENCY_SYMBOL}${((step1Form.watch("price") ?? 0) / 100).toFixed(2)}`}
                          error={step1Form.formState.errors.price?.message} />
                      )}
                    </div>
                    <div className="sm:col-span-2 p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                      <h3 className="font-semibold text-sm text-foreground">Result & Options</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Result Visibility</label>
                          <select id="result-visibility" className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...step1Form.register("resultVisibility")}>
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
                              <input type="checkbox" id={opt.id} {...step1Form.register(opt.field)} className="w-4 h-4 accent-primary" />
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

        {/* ══ STEP 2 — Timing & Settings ══ */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader><CardTitle>Timing & Settings</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-4" id="exam-step2-form">
                  <Input id="total-duration" label="Total Duration (minutes)" type="number" min={1} max={360} required
                    {...step2Form.register("totalDuration", { valueAsNumber: true })}
                    error={step2Form.formState.errors.totalDuration?.message} />
                  <div className="space-y-2">
                    {([
                      { id: "auto-time", field: "autoDistributeTime",  label: "Auto-distribute time per question" },
                      { id: "shuffle-q", field: "shuffleQuestions",     label: "Shuffle question order" },
                      { id: "shuffle-o", field: "shuffleOptions",       label: "Shuffle answer options" },
                    ] as const).map(opt => (
                      <label key={opt.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border cursor-pointer hover:bg-muted/80 transition-colors">
                        <input type="checkbox" id={opt.id} {...step2Form.register(opt.field)} className="w-4 h-4 accent-primary" />
                        <span className="text-sm text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2"><ChevronLeft className="h-4 w-4" />Back</Button>
                    <Button type="submit" variant="gold" size="lg" className="gap-2" id="step2-next">Next: Questions <ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ══ STEP 3 — Questions Editor ══ */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="flex gap-4">
              {/* Sidebar */}
              <div className="w-36 shrink-0">
                <div className="space-y-1 max-h-[540px] overflow-y-auto pr-1">
                  {questions.map((q, i) => (
                    <button key={i} onClick={() => setCurrentQIdx(i)} id={`q-nav-${i + 1}`}
                      className={cn("w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all",
                        currentQIdx === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
                        q.correctAnswers.length > 0 && currentQIdx !== i && "border-l-2 border-green-500")}>
                      <div className="font-bold flex items-center gap-1">Q{i + 1}{q.questionImage && <ImageIcon className="h-3 w-3 opacity-60" />}</div>
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
                      <Button variant="ghost" size="sm" onClick={() => removeQuestion(currentQIdx)} className="text-destructive hover:text-destructive gap-1">
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
                            <button key={t} type="button" id={`type-${t}`} onClick={() => switchQuestionType(t)}
                              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                                currentQ.questionType === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary")}>
                              {t === "single" ? "Single Correct" : t === "multiple" ? "Multiple Correct" : "True/False"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Question Text */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Question Text <span className="text-destructive">*</span></label>
                        <textarea id={`q-text-${currentQIdx}`} rows={3} placeholder="Enter your question here..." value={currentQ.questionText}
                          onChange={e => updateQuestion("questionText", e.target.value)}
                          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
                      </div>

                      {/* Question Image */}
                      <div>
                        <label className="block text-sm font-medium text-foreground">Question Image <span className="text-muted-foreground text-xs">(optional)</span></label>
                        <QuickImageUpload id={`q-img-${currentQIdx}`} label="Upload image for this question" value={currentQ.questionImage} onChange={url => updateQuestion("questionImage", url)} />
                      </div>

                      {/* Options */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-foreground">Options — <span className="text-muted-foreground text-xs">click the circle to mark correct</span></label>
                          {currentQ.questionType === "multiple" && <span className="text-xs text-muted-foreground">Select all correct answers</span>}
                        </div>
                        <div className="space-y-2">
                          {currentQ.options.map((opt, optIdx) => {
                            const isCorrect = currentQ.correctAnswers.includes(opt.id);
                            return (
                              <div key={opt.id} className={cn("p-2.5 rounded-lg border-2 transition-all space-y-2", isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-border")}>
                                <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => toggleCorrectAnswer(opt.id, currentQ.questionType)} id={`correct-${currentQIdx}-${optIdx}`}
                                    className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                                      isCorrect ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/40 text-muted-foreground")}>
                                    {opt.id}
                                  </button>
                                  <input type="text" placeholder={`Option ${opt.id} text`} value={opt.text} id={`opt-${currentQIdx}-${opt.id}`}
                                    onChange={e => updateQuestion("options", currentQ.options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                                  {opt.image && <ImageIcon className="h-4 w-4 text-primary shrink-0" />}
                                </div>
                                <QuickImageUpload id={`opt-img-${currentQIdx}-${opt.id}`} label={`Add image to Option ${opt.id}`} value={opt.image} onChange={url => updateOptionImage(opt.id, url)} />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Marks */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Marks</label>
                          <input type="number" min={0} step={0.5} value={currentQ.marks} id={`marks-${currentQIdx}`}
                            onChange={e => updateQuestion("marks", parseFloat(e.target.value) || 1)}
                            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Negative Marks</label>
                          <input type="number" min={0} step={0.25} value={currentQ.negativeMarks} id={`neg-${currentQIdx}`}
                            onChange={e => updateQuestion("negativeMarks", parseFloat(e.target.value) || 0)}
                            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Explanation (optional)</label>
                        <textarea rows={2} placeholder="Explain the correct answer..." value={currentQ.explanation} id={`explain-${currentQIdx}`}
                          onChange={e => updateQuestion("explanation", e.target.value)}
                          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3 justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ChevronLeft className="h-4 w-4" />Back</Button>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">{questions.filter(q => q.correctAnswers.length > 0).length}/{questions.length} questions complete</p>
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

        {/* ══ STEP 4 — Preview & Save ══ */}
        {step === 4 && step1Data && step2Data && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview & Save</CardTitle></CardHeader>
              <CardContent className="space-y-5">
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
                      ["Duration",          `${step2Data.totalDuration} min`],
                      ["Questions",         String(questions.length)],
                      ["Total Marks",       String(questions.reduce((s, q) => s + q.marks, 0))],
                      ["Shuffle Questions", step2Data.shuffleQuestions ? "Yes" : "No"],
                      ["Negative Marking",  step1Data.negativeMarkingEnabled ? "Yes" : "No"],
                      ["Result Visibility", step1Data.resultVisibility.replace("_", " ")],
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
                  <h3 className="font-semibold text-sm mb-3">Questions ({questions.length})</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {questions.map((q, i) => (
                      <div key={i} className="p-3 rounded-lg bg-card border border-border space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-xs text-muted-foreground w-6 shrink-0 pt-0.5">Q{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{q.questionText || "(empty)"}</p>
                            {q.questionImage && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={q.questionImage} alt="question" className="mt-1.5 max-h-24 rounded-md object-contain" />
                            )}
                          </div>
                          <span className={cn("text-xs font-medium shrink-0", q.correctAnswers.length > 0 ? "text-green-600" : "text-red-500")}>
                            {q.correctAnswers.length > 0 ? `✓ ${q.marks}m` : "No answer"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 ml-8">
                          {q.options.map(opt => (
                            <div key={opt.id} className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded-md",
                              q.correctAnswers.includes(opt.id) ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground")}>
                              <span className="font-bold">{opt.id}.</span>
                              <span className="truncate">{opt.text || (opt.image ? "[Image]" : "(empty)")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="gap-2"><ChevronLeft className="h-4 w-4" />Edit Questions</Button>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => handleSave("draft")} isLoading={saving} loadingText="Saving..." id="save-draft">
                      <Save className="h-4 w-4 mr-1.5" />Save as Draft
                    </Button>
                    <Button variant="gold" onClick={() => handleSave("published")} isLoading={saving} loadingText="Publishing..." id="publish-exam">
                      Publish Exam
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
