"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Trophy, CreditCard, MessageSquare, PlayCircle, ArrowRight, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { ROUTES, CURRENCY_SYMBOL } from "@/constants";
import axios from "axios";

const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper: safely extract array from any response shape
  const toArr = (resp: any): any[] => {
    const d = resp?.data?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data; // nested { data: { data: [] } }
    return [];
  };

  useEffect(() => {
    Promise.all([
      axios.get("/api/exams?limit=3&status=published"),
      axios.get("/api/results?limit=3"),
    ]).then(([exams, results]) => {
      setRecentExams(toArr(exams));
      setRecentResults(toArr(results));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { label: "Browse Exams", href: ROUTES.STUDENT.EXAMS, icon: BookOpen, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "My Results", href: ROUTES.STUDENT.RESULTS, icon: Trophy, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { label: "Learning Videos", href: ROUTES.STUDENT.VIDEOS, icon: PlayCircle, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    { label: "My Doubts", href: ROUTES.STUDENT.DOUBTS, icon: MessageSquare, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    { label: "Payments", href: ROUTES.STUDENT.PAYMENTS, icon: CreditCard, color: "bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Welcome */}
      <motion.div variants={fadeUp} className="rounded-2xl bg-gradient-to-r from-navy-800 to-navy-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">Welcome back,</p>
            <h1 className="text-2xl font-display font-black">
              {user?.name} 👋
            </h1>
            <p className="text-white/70 text-sm mt-2">
              Ready to continue your chemistry preparation?
            </p>
          </div>
          <div className="hidden sm:block text-white/10 text-6xl font-display font-black">
            CH₄
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Link href={ROUTES.STUDENT.EXAMS}>
            <Button variant="gold" size="sm">
              Browse Exams
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={ROUTES.STUDENT.RESULTS}>
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
              My Results
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={fadeUp}>
        <h2 className="text-lg font-display font-bold text-foreground mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div className="p-4 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${link.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-foreground">{link.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Available Exams + Recent Results */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Available Exams */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Available Exams</CardTitle>
              <Link href={ROUTES.STUDENT.EXAMS}>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl skeleton" />
                ))
              ) : recentExams.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">No exams available yet</p>
              ) : (
                recentExams.map((exam: any) => (
                  <Link key={exam._id} href={`${ROUTES.STUDENT.EXAMS}/${exam._id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{exam.title}</p>
                        <p className="text-xs text-muted-foreground">{exam.category} • {exam.questions?.length || exam.questionCount || 0} Qs</p>
                      </div>
                      <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${exam.isFree ? "badge-free" : "badge-paid"}`}>
                        {exam.isFree ? "Free" : `${CURRENCY_SYMBOL}${(exam.price / 100).toFixed(0)}`}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Results */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Results</CardTitle>
              <Link href={ROUTES.STUDENT.RESULTS}>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl skeleton" />
                ))
              ) : recentResults.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No results yet. Take your first exam!</p>
                  <Link href={ROUTES.STUDENT.EXAMS}>
                    <Button variant="outline" size="sm" className="mt-3">Browse Exams</Button>
                  </Link>
                </div>
              ) : (
                recentResults.map((result: any) => (
                  <Link key={result._id} href={ROUTES.EXAM.RESULT(result._id)}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${result.isPassed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {result.percentage}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{result.examId?.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {result.timeTakenMinutes} mins
                        </p>
                      </div>
                      <Star className={`h-4 w-4 ${result.isPassed ? "text-gold-500" : "text-muted-foreground/30"}`} />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
