"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, User, BookOpen, Trophy, Clock,
  AlertTriangle, CheckCircle2, XCircle, BarChart2,
  CreditCard, Monitor, Globe, TrendingUp, Award, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import axios from "axios";
import Link from "next/link";
import { format } from "date-fns";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#6366f1", "#06b6d4", "#ec4899"];

/* ── Stat card ────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color = "text-primary", sub }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-black text-foreground">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground/60">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Question analysis table ──────────────────────────────── */
function QuestionTable({ responses, examTitle }: { responses: any[]; examTitle: string }) {
  if (!responses?.length) return <p className="text-sm text-muted-foreground">No question data available.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left">
            {["Q#","Status","Time Spent","Marks","Neg. Marks","Visited","Changed","Review"].map(h => (
              <th key={h} className="py-2 px-2 text-muted-foreground font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {responses.map((r, i) => (
            <tr key={i} className={cn("border-b border-border/50 hover:bg-muted/20", r.isCorrect ? "bg-green-50/30 dark:bg-green-900/10" : r.selectedOptions?.length ? "bg-red-50/30 dark:bg-red-900/10" : "")}>
              <td className="py-2 px-2 font-bold">{r.questionNo || i+1}</td>
              <td className="py-2 px-2">
                {r.selectedOptions?.length === 0
                  ? <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold">Skipped</span>
                  : r.isCorrect
                  ? <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3"/>Correct</span>
                  : <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold flex items-center gap-0.5"><XCircle className="h-3 w-3"/>Wrong</span>
                }
              </td>
              <td className="py-2 px-2 text-muted-foreground">{r.timeTakenSeconds ? `${r.timeTakenSeconds}s` : "—"}</td>
              <td className="py-2 px-2 font-bold text-green-600">{r.marksAwarded > 0 ? `+${r.marksAwarded}` : r.marksAwarded ?? "—"}</td>
              <td className="py-2 px-2 text-red-500">{r.negativeMarks > 0 ? `-${r.negativeMarks}` : "—"}</td>
              <td className="py-2 px-2">{r.visitCount ?? 1}</td>
              <td className="py-2 px-2">{r.answerChanged ? "✅" : "—"}</td>
              <td className="py-2 px-2">{r.isMarkedForReview ? "🚩" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StudentAnalyticsPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [downloading, setDownloading]     = useState(false);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/admin/students/${id}/analytics`)
      .then(r => {
        setData(r.data.data);
        if (r.data.data.examHistory?.length > 0) setActiveAttempt(r.data.data.examHistory[0]);
      })
      .catch(() => router.push("/admin/students"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const { default: jsPDF }     = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const canvas  = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf     = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w       = pdf.internal.pageSize.getWidth();
      const h       = (canvas.height * w) / canvas.width;

      // Add branding header
      pdf.setFillColor(10, 20, 60); // navy
      pdf.rect(0, 0, w, 20, "F");
      pdf.setTextColor(212, 175, 55); // gold
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("RHGConsultancyService — Student Performance Report", 10, 13);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(`Generated: ${new Date().toLocaleString("en-IN")}`, w - 10, 13, { align: "right" });

      // Add image (multi-page if needed)
      const pageH = pdf.internal.pageSize.getHeight() - 25;
      let yPos    = 25;
      let remaining = h;
      let sourceY = 0;

      while (remaining > 0) {
        const sliceH   = Math.min(remaining, pageH);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = (sliceH * canvas.width) / w;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceCanvas.height, 0, 0, sliceCanvas.width, sliceCanvas.height);
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, yPos, w, sliceH);
        remaining -= sliceH;
        sourceY   += sliceCanvas.height;
        if (remaining > 0) { pdf.addPage(); yPos = 5; }
      }

      pdf.save(`${data.student.name.replace(/ /g,"_")}_report.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
  if (!data) return null;

  const { student, stats, examHistory, payments } = data;

  /* ── Chart data ───────────────────────────────────── */
  const scoreDistData = [
    { name: "Correct",   value: activeAttempt?.correctCount   || 0 },
    { name: "Incorrect", value: activeAttempt?.incorrectCount || 0 },
    { name: "Skipped",   value: activeAttempt?.skippedCount   || 0 },
  ].filter(d => d.value > 0);

  const timePerQ = (activeAttempt?.responses || [])
    .slice(0, 20)
    .map((r: any, i: number) => ({
      name:  `Q${r.questionNo || i+1}`,
      time:  r.timeTakenSeconds || 0,
      marks: r.marksAwarded || 0,
    }));

  const scoreHistory = examHistory.map((a: any, i: number) => ({
    name:  `Attempt ${examHistory.length - i}`,
    score: a.percentage,
    pass:  a.isPassed ? 100 : 0,
  })).reverse();

  const radarData = [
    { subject: "Score",       A: activeAttempt?.percentage || 0 },
    { subject: "Speed",       A: Math.min(100, activeAttempt?.totalQuestions ? Math.round(100 - (activeAttempt.timeTakenMinutes / (activeAttempt.totalQuestions * 1.5)) * 100) : 50) },
    { subject: "Accuracy",    A: activeAttempt?.totalQuestions ? Math.round(((activeAttempt.correctCount || 0) / activeAttempt.totalQuestions) * 100) : 0 },
    { subject: "Completion",  A: activeAttempt?.totalQuestions ? Math.round((((activeAttempt.correctCount || 0) + (activeAttempt.incorrectCount || 0)) / activeAttempt.totalQuestions) * 100) : 0 },
    { subject: "Discipline",  A: Math.max(0, 100 - (activeAttempt?.totalViolations || 0) * 10) },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Top actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/admin/students">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Students
          </Button>
        </Link>
        <Button
          variant="gold" size="sm" className="gap-1.5"
          onClick={handleDownloadPDF}
          isLoading={downloading}
          loadingText="Generating PDF..."
          id="download-pdf"
        >
          <Download className="h-4 w-4" /> Download PDF Report
        </Button>
      </div>

      {/* ── Printable content ──────────────────────────────────── */}
      <div ref={printRef} className="space-y-6">
        {/* Student header */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-black shrink-0">
                {student.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-display font-black text-foreground">{student.name}</h1>
                <p className="text-muted-foreground text-sm">{student.email}</p>
                {student.phone && <p className="text-muted-foreground text-sm">{student.phone}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium capitalize">
                    {student.category || "All Categories"}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold",
                    student.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                    {student.isActive ? "Active" : "Inactive"}
                  </span>
                  {student.lastLogin && (
                    <span className="text-xs text-muted-foreground/60">
                      Last login: {format(new Date(student.lastLogin), "d MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Exams"  value={stats.totalAttempts}     icon={BookOpen}       />
          <StatCard label="Passed"       value={stats.passedAttempts}    icon={CheckCircle2}   color="text-green-600"  />
          <StatCard label="Failed"       value={stats.failedAttempts}    icon={XCircle}        color="text-red-500"    />
          <StatCard label="Pass Rate"    value={`${stats.passPercentage}%`} icon={TrendingUp}  color="text-blue-600"   />
          <StatCard label="Avg. Score"   value={`${stats.avgScore}%`}    icon={BarChart2}      color="text-purple-600" />
          <StatCard label="Time Spent"   value={`${stats.totalExamTimeMins}m`} icon={Clock}   color="text-orange-500" />
        </div>

        {/* Exam selector + current attempt details */}
        {examHistory.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-bold text-foreground">Exam-wise Analysis</h2>
                <select
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground outline-none focus:ring-2 ring-primary/30"
                  onChange={e => {
                    const a = examHistory.find((x: any) => x.attemptId === e.target.value);
                    if (a) setActiveAttempt(a);
                  }}
                  value={activeAttempt?.attemptId || ""}
                >
                  {examHistory.map((a: any, i: number) => (
                    <option key={a.attemptId} value={a.attemptId}>
                      {a.examTitle} — {a.submittedAt ? format(new Date(a.submittedAt), "d MMM yyyy") : "In Progress"}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {activeAttempt && (
                <div className="space-y-6">
                  {/* Attempt summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-2xl font-black text-foreground">{activeAttempt.score}/{activeAttempt.totalMarks}</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className={cn("text-2xl font-black", activeAttempt.isPassed ? "text-green-600" : "text-red-500")}>
                        {activeAttempt.percentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">{activeAttempt.isPassed ? "PASSED ✅" : "FAILED ❌"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-2xl font-black text-foreground">{activeAttempt.timeTakenMinutes}m</p>
                      <p className="text-xs text-muted-foreground">Time Taken</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className={cn("text-2xl font-black", activeAttempt.totalViolations > 0 ? "text-red-500" : "text-green-600")}>
                        {activeAttempt.totalViolations}
                      </p>
                      <p className="text-xs text-muted-foreground">Violations</p>
                    </div>
                  </div>

                  {/* Violation details */}
                  {activeAttempt.totalViolations > 0 && (
                    <div className="p-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                      <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" /> Security Violations
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Tab Switches: <strong className="text-red-600">{activeAttempt.tabSwitchCount}</strong></span>
                        <span>Fullscreen Exits: <strong className="text-red-600">{activeAttempt.fullscreenExitCount}</strong></span>
                        {activeAttempt.isAutoSubmitted && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">Auto-Submitted ({activeAttempt.submissionReason})</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Session info */}
                  {activeAttempt.sessionMetadata?.browser && (
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5"/>{activeAttempt.sessionMetadata.browser}</span>
                      <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5"/>{activeAttempt.sessionMetadata.device} · {activeAttempt.sessionMetadata.os}</span>
                      {activeAttempt.sessionMetadata.ip && <span>IP: {activeAttempt.sessionMetadata.ip}</span>}
                    </div>
                  )}

                  {/* Charts row */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    {/* Pie — correct/wrong/skipped */}
                    <div>
                      <p className="text-sm font-bold text-foreground mb-3">Answer Distribution</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={scoreDistData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                            {scoreDistData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Radar — performance dimensions */}
                    <div>
                      <p className="text-sm font-bold text-foreground mb-3">Performance Profile</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar chart — time per question */}
                  {timePerQ.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-foreground mb-3">Time Spent Per Question (seconds)</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={timePerQ}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="time" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Score history line chart */}
                  {scoreHistory.length > 1 && (
                    <div>
                      <p className="text-sm font-bold text-foreground mb-3">Score History Across Attempts</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={scoreHistory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Score %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Question analysis table */}
                  <div>
                    <p className="text-sm font-bold text-foreground mb-3">Question-level Analysis</p>
                    <QuestionTable responses={activeAttempt.responses} examTitle={activeAttempt.examTitle} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment history */}
        {payments.length > 0 && (
          <Card>
            <CardHeader><h2 className="font-bold text-foreground">Payment History</h2></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left">
                    {["Exam","Amount","Status","Date"].map(h => (
                      <th key={h} className="py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p._id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-medium text-foreground text-xs">{p.examTitle}</td>
                        <td className="py-2.5 px-3 font-bold text-foreground text-xs">₹{p.amount}</td>
                        <td className="py-2.5 px-3 text-xs">
                          <span className={cn("px-2 py-0.5 rounded-full font-bold",
                            p.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">
                          {format(new Date(p.createdAt), "d MMM yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PDF footer watermark */}
        <div className="text-center text-xs text-muted-foreground/40 py-4">
          RHGConsultancyService · Confidential Student Report · {new Date().toLocaleDateString("en-IN")}
        </div>
      </div>
    </motion.div>
  );
}
