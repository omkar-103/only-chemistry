"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, UserCheck, UserX, Mail, Phone, Calendar,
  BookOpen, Trophy, CreditCard, Clock, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CURRENCY_SYMBOL } from "@/constants";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";

export default function AdminStudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      axios.get(`/api/admin/students/${id}`),
      axios.get(`/api/results?studentId=${id}&limit=10`),
      axios.get(`/api/payments?studentId=${id}&limit=10`),
    ])
      .then(([s, a, p]) => {
        setStudent(s.data.data);
        setAttempts(a.data.data || []);
        setPayments(p.data.data || []);
      })
      .catch(() => router.push("/admin/students"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const toggleStatus = async () => {
    if (!student) return;
    setToggling(true);
    try {
      const r = await axios.patch(`/api/admin/students/${id}`, { action: "toggle-status" });
      setStudent((prev: any) => ({ ...prev, isActive: r.data.data.isActive }));
      toast({
        title: r.data.data.isActive ? "Student activated" : "Student suspended",
        variant: "success",
      });
    } catch {
      toast({ title: "Failed to update status", variant: "error" });
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 rounded skeleton" />
        <div className="h-40 rounded-2xl skeleton" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl skeleton" />
          <div className="h-64 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  const totalSpent = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const passedCount = attempts.filter((a) => a.isPassed).length;
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((a, r) => a + (r.percentage || 0), 0) / attempts.length)
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-4xl">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin/students")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Button>

      {/* Student Header */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-2xl font-black shrink-0">
              {student.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-display font-black text-foreground">{student.name}</h1>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    student.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {student.isActive ? "Active" : "Suspended"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{student.email}</span>
                {student.mobile && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{student.mobile}</span>}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {student.createdAt ? format(new Date(student.createdAt), "dd MMM yyyy") : "—"}
                </span>
                {student.lastLogin && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Last login {format(new Date(student.lastLogin), "dd MMM yyyy")}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant={student.isActive ? "outline" : "default"}
              size="sm"
              onClick={toggleStatus}
              isLoading={toggling}
              loadingText="Updating..."
              className={cn(
                "gap-2 shrink-0",
                student.isActive
                  ? "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : "bg-green-600 hover:bg-green-700 text-white"
              )}
              id="toggle-student-status"
            >
              {student.isActive ? (
                <><UserX className="h-4 w-4" />Suspend</>
              ) : (
                <><UserCheck className="h-4 w-4" />Activate</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Exams Taken", value: attempts.length, icon: BookOpen, color: "text-blue-600" },
          { label: "Passed", value: passedCount, icon: Trophy, color: "text-green-600" },
          { label: "Avg Score", value: `${avgScore}%`, icon: Shield, color: "text-primary" },
          { label: "Total Spent", value: `${CURRENCY_SYMBOL}${(totalSpent / 100).toFixed(0)}`, icon: CreditCard, color: "text-amber-600" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="p-4 rounded-xl border border-border bg-card text-center">
              <Icon className={cn("h-5 w-5 mx-auto mb-1", s.color)} />
              <p className={cn("text-xl font-display font-black", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Recent Exam Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No exam attempts yet</p>
            ) : (
              <div className="space-y-2">
                {attempts.slice(0, 6).map((a) => (
                  <div key={a._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm",
                        a.isPassed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      {a.percentage ?? 0}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {a.examId?.title || "Exam"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.submittedAt ? format(new Date(a.submittedAt), "dd MMM yyyy") : ""}
                        {" · "}{a.timeTakenMinutes ?? 0} min
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded shrink-0",
                        a.isPassed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      {a.isPassed ? "Pass" : "Fail"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No purchases yet</p>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 6).map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.examId?.title || "Exam"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy") : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-green-600">
                        {CURRENCY_SYMBOL}{(p.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
