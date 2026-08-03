"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Clock, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, passed: 0, avgScore: 0 });

  useEffect(() => {
    axios
      .get("/api/results?limit=50")
      .then((r) => {
        const data = r.data.data || [];
        setResults(data);
        const passed = data.filter((item: any) => item.isPassed).length;
        const avgScore =
          data.length > 0
            ? Math.round(
                data.reduce((a: number, item: any) => a + (item.percentage || 0), 0) /
                  data.length
              )
            : 0;
        setStats({ total: data.length, passed, avgScore });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-black text-foreground">My Results</h1>
        <p className="text-muted-foreground text-sm">Track your exam performance over time</p>
      </div>

      {/* Stats */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Exams Taken", value: stats.total, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Passed", value: stats.passed, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
            { label: "Avg Score", value: `${stats.avgScore}%`, color: "text-gold-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          ].map((s) => (
            <div key={s.label} className={cn("p-4 rounded-2xl text-center", s.bg)}>
              <p className={cn("text-2xl font-display font-black", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl skeleton" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-14">
              <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-foreground font-semibold">No results yet</p>
              <p className="text-sm text-muted-foreground mt-1">Take an exam to see your performance here</p>
              <Link href={ROUTES.STUDENT.EXAMS}>
                <Button variant="gold" className="mt-4 gap-2">
                  <BookOpen className="h-4 w-4" />
                  Browse Exams
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((r, i) => (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={ROUTES.EXAM.RESULT(r._id)}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer group">
                      {/* Score bubble */}
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold",
                          r.isPassed
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        <span className="text-lg leading-none">{r.percentage ?? 0}%</span>
                        <span className="text-[10px] font-medium mt-0.5">{r.isPassed ? "PASS" : "FAIL"}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {r.examId?.title || "Exam"}
                        </p>
                        <p className="text-xs text-muted-foreground">{r.examId?.category}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {r.timeTakenMinutes ?? 0} min
                          </span>
                          <span>
                            {r.submittedAt
                              ? format(new Date(r.submittedAt), "dd MMM yyyy")
                              : ""}
                          </span>
                        </div>
                      </div>

                      {/* Pass/Fail icon */}
                      <div className="shrink-0">
                        {r.isPassed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
