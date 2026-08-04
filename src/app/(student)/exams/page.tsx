"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, Filter, BookOpen, Clock, Users, ChevronDown,
  Star, Lock, CheckCircle2, PlayCircle, SlidersHorizontal,
  Trophy, Zap, BarChart2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DIFFICULTY_CONFIG, EXAM_CATEGORIES, CURRENCY_SYMBOL, ROUTES } from "@/constants";
import { cn } from "@/lib/utils/cn";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/useToast";

const DIFFICULTIES = ["easy", "medium", "hard"];
const SORT_OPTIONS = [
  { value: "newest",    label: "Newest First" },
  { value: "oldest",    label: "Oldest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc",label: "Price: High to Low" },
  { value: "popular",  label: "Most Popular" },
];

function ExamCard({ exam, isPurchased }: { exam: any; isPurchased: boolean }) {
  const diff = DIFFICULTY_CONFIG[exam.difficulty as keyof typeof DIFFICULTY_CONFIG];
  const priceINR = exam.isFree ? 0 : Math.round(exam.price / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="group"
    >
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:border-primary/40 border-border/70 bg-card">
        {/* Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-navy-900/90 via-navy-800 to-navy-900 flex items-center justify-center overflow-hidden">
          {exam.thumbnail ? (
            <img src={exam.thumbnail} alt={exam.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-gold-400/80">
              <BookOpen className="h-12 w-12" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">{exam.category}</span>
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
            {exam.isFree ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">FREE</span>
            ) : isPurchased ? (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">Purchased</span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-gold-500 text-white text-[10px] font-bold uppercase shadow-sm">{CURRENCY_SYMBOL}{priceINR}</span>
            )}
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm", diff?.bg, diff?.color)}>
              {diff?.label}
            </span>
          </div>

          {/* Attempt count */}
          {(exam.attemptCount ?? 0) > 0 && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px]">
              <Users className="h-2.5 w-2.5" />
              {exam.attemptCount}
            </div>
          )}
        </div>

        <CardContent className="flex-1 flex flex-col p-4 gap-3">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {exam.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exam.description}</p>
          </div>

          {/* Meta Information Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-primary" />{exam.totalQuestions || 0} Questions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />{exam.totalDuration || 0} mins
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-gold-500" />{exam.totalMarks || 100} Marks
            </span>
            <span className="flex items-center gap-1">
              <BarChart2 className="h-3 w-3 text-green-500" />{exam.passingPercentage}% to pass
            </span>
          </div>

          {/* Category tag */}
          <div className="flex items-center justify-between">
            <span className="self-start px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-muted-foreground">
              {exam.category}
            </span>
            {exam.negativeMarking && (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                Negative Marking
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-auto pt-1">
            {exam.isFree || isPurchased ? (
              <Link href={`/exam/${exam._id}/instructions`} className="block">
                <Button variant="gold" size="sm" className="w-full gap-1.5">
                  <PlayCircle className="h-3.5 w-3.5" />
                  {exam.isFree ? "Start Free Exam" : "Start Exam"}
                </Button>
              </Link>
            ) : (
              <Link href={`/exams/${exam._id}`} className="block">
                <Button variant="default" size="sm" className="w-full gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Purchase — {CURRENCY_SYMBOL}{priceINR}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ExamsPage() {
  const { user } = useAuthStore();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 12;

  const purchasedExams: string[] = user?.purchasedExams as any[] || [];

  const fetchExams = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: LIMIT.toString(),
      status: "published",
      ...(search && { search }),
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      ...(freeOnly && { isFree: "true" }),
      ...(sort && { sort }),
    });
    axios.get(`/api/exams?${params}`)
      .then(r => {
        const d = r.data.data;
        setExams(Array.isArray(d) ? d : []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, category, difficulty, freeOnly, sort]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, category, difficulty, freeOnly, sort]);

  const totalPages = Math.ceil(total / LIMIT);
  const activeFilterCount = [category, difficulty, freeOnly].filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Exam Library</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Loading..." : `${total} exam${total !== 1 ? "s" : ""} available`}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Trophy className="h-3.5 w-3.5 text-gold-500" />
          {purchasedExams.length} purchased
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          id="exam-search"
          placeholder="Search exams, topics, categories..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(v => !v)}
            className="gap-1.5 shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-primary-foreground text-primary rounded-full text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground outline-none focus:ring-2 ring-primary/30 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-2xl border border-border bg-card/60 space-y-4"
        >
          {/* Category */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory("")}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  !category ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                )}
              >All</button>
              {EXAM_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value === category ? "" : cat.value)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    category === cat.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                  )}
                >{cat.icon} {cat.label}</button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Difficulty</p>
            <div className="flex gap-2">
              {["", ...DIFFICULTIES].map(d => {
                const cfg = d ? DIFFICULTY_CONFIG[d as keyof typeof DIFFICULTY_CONFIG] : null;
                return (
                  <button
                    key={d || "all"}
                    onClick={() => setDifficulty(d)}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors",
                      difficulty === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                    )}
                  >{d || "All"}</button>
                );
              })}
            </div>
          </div>

          {/* Free only */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFreeOnly(v => !v)}
              className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                freeOnly ? "bg-green-500 text-white border-green-500" : "border-border hover:border-green-400 text-muted-foreground"
              )}
            >
              <Zap className="h-3 w-3" />
              Free Exams Only
            </button>
            {(category || difficulty || freeOnly) && (
              <button
                onClick={() => { setCategory(""); setDifficulty(""); setFreeOnly(false); }}
                className="text-xs text-destructive hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Category quick-pills (always visible) */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {EXAM_CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value === category ? "" : cat.value)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors",
              category === cat.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >{cat.icon} {cat.label}</button>
        ))}
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 skeleton rounded-2xl" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="py-20 text-center">
          <BookOpen className="h-14 w-14 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-foreground font-semibold">No exams found</p>
          <p className="text-muted-foreground text-sm mt-1">
            {search || category || difficulty || freeOnly ? "Try adjusting your filters" : "No exams published yet"}
          </p>
          {(search || category || difficulty || freeOnly) && (
            <Button variant="outline" size="sm" className="mt-4"
              onClick={() => { setSearch(""); setCategory(""); setDifficulty(""); setFreeOnly(false); }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {exams.map(exam => (
            <ExamCard
              key={exam._id}
              exam={exam}
              isPurchased={purchasedExams.includes(exam._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} exams
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
              return (
                <Button key={p} variant={page === p ? "default" : "outline"} size="sm"
                  className="w-8 h-8 p-0" onClick={() => setPage(p)}>
                  {p}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
