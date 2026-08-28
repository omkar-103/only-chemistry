"use client";

/**
 * /admin/exams/[id]
 * Admin read-only detail view of an exam — shows all metadata,
 * settings, and every question with options and correct answers highlighted.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, BookOpen, Clock, Trophy, Tag, DollarSign,
  CheckCircle2, XCircle, Eye, Pencil, ToggleLeft, ToggleRight,
  Image as ImageIcon, Layers, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DIFFICULTY_CONFIG, CURRENCY_SYMBOL, ROUTES } from "@/constants";
import { cn } from "@/lib/utils/cn";
import axios from "axios";
import Link from "next/link";
import { toast } from "@/hooks/useToast";
import { ChemicalContentRenderer } from "@/components/ui/ChemicalContentRenderer";

export default function AdminExamViewPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();

  const [exam, setExam]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/exams/${id}`)
      .then(r => setExam(r.data.data))
      .catch(() => { toast({ title: "Exam not found", variant: "error" }); router.push(ROUTES.ADMIN.EXAMS); })
      .finally(() => setLoading(false));
  }, [id, router]);

  const toggleStatus = async () => {
    if (!exam) return;
    const newStatus = exam.status === "published" ? "draft" : "published";
    try {
      await axios.put(`/api/exams/${exam._id}`, { status: newStatus });
      setExam((prev: any) => ({ ...prev, status: newStatus }));
      toast({ title: `Exam ${newStatus}`, variant: "success" });
    } catch {
      toast({ title: "Failed to update status", variant: "error" });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  if (!exam) return null;

  const diff = DIFFICULTY_CONFIG[exam.difficulty as keyof typeof DIFFICULTY_CONFIG];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.EXAMS}>
            <Button variant="ghost" size="icon-sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-black text-foreground">{exam.title}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={cn("text-xs font-semibold", diff?.color)}>{diff?.label}</span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-muted-foreground text-xs">{exam.category}</span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold capitalize",
                exam.status === "published"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              )}>{exam.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/exams/${id}/preview`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Student Preview
            </Button>
          </Link>
          <Link href={`/admin/exams/${id}/edit`}>
            <Button variant="gold" size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit Exam
            </Button>
          </Link>
          <Button
            variant="outline" size="sm"
            onClick={toggleStatus}
            className={exam.status === "published" ? "text-yellow-600 border-yellow-300" : "text-green-600 border-green-300"}
          >
            {exam.status === "published"
              ? <><ToggleRight className="h-3.5 w-3.5 mr-1" /> Unpublish</>
              : <><ToggleLeft className="h-3.5 w-3.5 mr-1" /> Publish</>}
          </Button>
        </div>
      </div>

      {/* Description */}
      {exam.description && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{exam.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Questions",     value: exam.questions?.length ?? 0,        icon: Hash },
          { label: "Duration",      value: `${exam.totalDuration} min`,        icon: Clock },
          { label: "Total Marks",   value: exam.questions?.reduce((s: number, q: any) => s + (q.marks || 0), 0) ?? 0, icon: Trophy },
          { label: "Passing Score", value: `${exam.passingPercentage}%`,        icon: CheckCircle2 },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground leading-tight">{String(s.value)}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column info */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Exam details */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" />Exam Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Subject",     exam.subject],
              ["Category",    exam.category],
              ["Difficulty",  exam.difficulty],
              ["Max Attempts",exam.maxAttempts ?? 1],
              ["Pricing",     exam.isFree ? "Free" : `${CURRENCY_SYMBOL}${((exam.price ?? 0) / 100).toFixed(2)}`],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium capitalize">{String(v)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" />Settings</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Result Visibility",  (exam.resultVisibility ?? "score_only").replace("_", " ")],
              ["Negative Marking",   exam.negativeMarkingEnabled ? "Enabled" : "Disabled"],
              ["Show Explanations",  exam.showExplanations ? "Yes" : "No"],
              ["Shuffle Questions",  exam.shuffleQuestions ? "Yes" : "No"],
              ["Shuffle Options",    exam.shuffleOptions ? "Yes" : "No"],
              ["Allow Reattempt",    exam.allowReattempt ? "Yes" : "No"],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium capitalize">{String(v)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Questions ({exam.questions?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(exam.questions ?? []).map((q: any, i: number) => (
            <div key={q._id ?? i} className="rounded-xl border border-border p-4 space-y-3">
              {/* Question header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-7 shrink-0 pt-0.5">Q{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">{q.questionText}</p>

                    {/* Question ChemDraw Chemical Structures */}
                    {Array.isArray(q.questionChemicalContents) && q.questionChemicalContents.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {q.questionChemicalContents.map((chem: any, chemIdx: number) => (
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
                      <img src={q.questionImage} alt="Question" className="mt-2 max-h-40 rounded-lg object-contain border border-border" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">+{q.marks}m</span>
                  {q.negativeMarks > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold">-{q.negativeMarks}m</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs capitalize">
                    {q.questionType === "single" ? "Single" : q.questionType === "multiple" ? "Multiple" : "T/F"}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="grid sm:grid-cols-2 gap-2 ml-9">
                {(q.options ?? []).map((opt: any) => {
                  const isCorrect = (q.correctAnswers ?? []).includes(opt.id);
                  return (
                    <div key={opt.id} className={cn(
                      "flex items-start gap-2 p-2.5 rounded-lg border text-sm",
                      isCorrect
                        ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                        : "border-border bg-muted/40 text-muted-foreground"
                    )}>
                      <span className={cn("font-bold text-xs w-5 shrink-0 pt-0.5", isCorrect ? "text-green-600 dark:text-green-400" : "")}>
                        {opt.id}.
                      </span>
                      <div className="flex-1 min-w-0">
                        {opt.text && <span>{opt.text}</span>}
                        {opt.chemicalContent && (
                          <div className="mt-1">
                            <ChemicalContentRenderer content={opt.chemicalContent} isOption />
                          </div>
                        )}
                        {opt.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={opt.image} alt={`Option ${opt.id}`} className="mt-1.5 max-h-20 rounded object-contain" />
                        )}
                      </div>
                      {isCorrect
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        : <XCircle className="h-4 w-4 text-border shrink-0 mt-0.5" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="ml-9 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400">
                  <span className="font-semibold">Explanation: </span>{q.explanation}
                </div>
              )}
            </div>
          ))}

          {(!exam.questions || exam.questions.length === 0) && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-20" />
              No questions added yet.{" "}
              <Link href={`/admin/exams/${id}/edit`} className="text-primary hover:underline font-medium">Add questions →</Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
