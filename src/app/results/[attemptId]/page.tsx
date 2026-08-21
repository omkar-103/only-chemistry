"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Trophy,
  RotateCcw, ArrowLeft, Download, FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES, CURRENCY_SYMBOL } from "@/constants";
import axios from "axios";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/results/${attemptId}`)
      .then((r) => setResult(r.data.data))
      .catch(() => router.push(ROUTES.STUDENT.RESULTS))
      .finally(() => setLoading(false));
  }, [attemptId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!result) return null;

  const { attempt, exam, totalCorrect, totalWrong, totalUnattempted, questions: resultQuestions } = result;
  const scorePercent = attempt.percentage || 0;
  const passed = attempt.isPassed;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          <span className="font-display font-black text-foreground">Only Chemistry</span>
        </div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "rounded-2xl p-8 text-center text-white",
            passed
              ? "bg-gradient-to-br from-green-600 to-emerald-800"
              : "bg-gradient-to-br from-red-600 to-rose-800"
          )}
        >
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-10 w-10" />
          </div>
          <p className="text-white/80 text-sm mb-1">{exam?.title}</p>
          <h1 className="text-5xl font-display font-black mb-2">{scorePercent}%</h1>
          <p className="text-2xl font-bold mb-1">
            {attempt.score}/{attempt.totalMarks} marks
          </p>
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm mt-2",
            passed ? "bg-green-500/30 text-white" : "bg-red-500/30 text-white"
          )}>
            {passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {passed ? "PASSED" : "FAILED"}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Correct", value: totalCorrect, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", icon: CheckCircle2 },
            { label: "Wrong", value: totalWrong, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", icon: XCircle },
            { label: "Skipped", value: totalUnattempted, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-800/50", icon: MinusCircle },
            { label: "Time", value: `${attempt.timeTakenMinutes}m`, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", icon: Clock },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className={stat.bg}>
                <CardContent className="pt-4 pb-4 text-center">
                  <Icon className={cn("h-6 w-6 mx-auto mb-1", stat.color)} />
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Question Review (if visibility allows) */}
        {exam?.resultVisibility === "full" && resultQuestions && (
          <Card>
            <CardHeader>
              <CardTitle>Answer Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resultQuestions.map((rq: any, idx: number) => (
                <div key={idx} className={cn(
                  "p-4 rounded-xl border-2",
                  rq.isCorrect ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10"
                    : rq.selectedOptions?.length === 0 ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/20"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10"
                )}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground shrink-0">Q{idx + 1}</span>
                    <p className="text-sm text-foreground font-medium">{rq.question?.questionText}</p>
                  </div>

                  {/* Selected Options */}
                  {rq.selectedOptions?.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Your Answer: {rq.question?.options
                        ?.filter((o: any) => rq.selectedOptions.includes(o.id))
                        ?.map((o: any) => o.text)
                        ?.join(", ")}
                    </p>
                  )}

                  {/* Correct Answers */}
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Correct: {rq.question?.options
                      ?.filter((o: any) => rq.question?.correctAnswers?.includes(o.id))
                      ?.map((o: any) => o.text)
                      ?.join(", ")}
                  </p>

                  {/* Explanation */}
                  {exam.showExplanations && rq.question?.explanation && (
                    <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        <strong>Explanation:</strong> {rq.question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={ROUTES.STUDENT.RESULTS} className="flex-1">
            <Button variant="outline" size="lg" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              All Results
            </Button>
          </Link>
          <Link href={ROUTES.STUDENT.EXAMS} className="flex-1">
            <Button variant="default" size="lg" className="w-full gap-2">
              Browse More Exams
            </Button>
          </Link>
          {exam?.allowReattempt && (
            <Link href={ROUTES.EXAM.INSTRUCTIONS(exam._id)} className="flex-1">
              <Button variant="gold" size="lg" className="w-full gap-2">
                <RotateCcw className="h-4 w-4" />
                Reattempt
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
