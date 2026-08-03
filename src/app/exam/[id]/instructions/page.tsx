"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield, Monitor, RefreshCw, Copy, EyeOff, AlertTriangle,
  CheckCircle2, Clock, BookOpen, ArrowRight, FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { ROUTES } from "@/constants";

interface Params { params: Promise<{ id: string }> }

export default function ExamInstructionsPage({ params }: Params) {
  const router = useRouter();
  const [examId, setExamId] = useState<string>("");
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setExamId(id);
      axios.get(`/api/exams/${id}`)
        .then((r) => setExam(r.data.data))
        .catch(() => router.push(ROUTES.STUDENT.EXAMS))
        .finally(() => setLoading(false));
    });
  }, [params, router]);

  const handleStartExam = async () => {
    if (!agreed) return;
    setStarting(true);
    try {
      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      router.push(ROUTES.EXAM.ATTEMPT(examId));
    } catch {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const RULES = [
    { icon: <Monitor className="h-5 w-5" />, title: "Fullscreen Required", desc: "Exam must be taken in fullscreen mode. Exiting fullscreen will count as a violation." },
    { icon: <Shield className="h-5 w-5" />, title: "No Tab Switching", desc: "Switching tabs or minimizing the browser is monitored. 2nd violation = auto-submission." },
    { icon: <RefreshCw className="h-5 w-5" />, title: "No Page Refresh", desc: "Do not refresh or reload the page during the exam. Your progress is auto-saved." },
    { icon: <Copy className="h-5 w-5" />, title: "No Copy/Paste", desc: "Copy, paste, right-click, and keyboard shortcuts are disabled during the exam." },
    { icon: <EyeOff className="h-5 w-5" />, title: "No Developer Tools", desc: "Opening browser developer tools is monitored and will trigger violations." },
    { icon: <AlertTriangle className="h-5 w-5" />, title: "Auto-Submission", desc: "The exam will auto-submit when time expires or after repeated violations." },
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <FlaskConical className="h-8 w-8 text-primary" />
            <span className="font-display font-black text-xl text-foreground">RHGConsultancyService</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-foreground mb-2">
            Exam Instructions
          </h1>
          {exam && (
            <p className="text-muted-foreground">
              {exam.title} • {exam.category} • {exam.questionCount || exam.questions?.length} Questions • {exam.totalDuration} Minutes
            </p>
          )}
        </motion.div>

        {/* Exam Info Cards */}
        {exam && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              { icon: <BookOpen className="h-5 w-5" />, label: "Questions", value: exam.questionCount || exam.questions?.length || 0 },
              { icon: <Clock className="h-5 w-5" />, label: "Duration", value: `${exam.totalDuration} min` },
              { icon: <CheckCircle2 className="h-5 w-5" />, label: "Passing", value: `${exam.passingPercentage}%` },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl bg-card border border-border text-center">
                <div className="flex items-center justify-center text-primary mb-1">{item.icon}</div>
                <p className="text-lg font-display font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Rules */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Exam Rules & Security Guidelines
              </h2>
              <div className="space-y-4">
                {RULES.map((rule) => (
                  <div key={rule.title} className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                    <div className="text-primary shrink-0 mt-0.5">{rule.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rule.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Question Types */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-display font-bold text-foreground mb-4">Question Palette Guide</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { color: "bg-slate-400", label: "Not Visited", desc: "Not opened yet" },
                  { color: "bg-red-500", label: "Unanswered", desc: "Visited, not answered" },
                  { color: "bg-green-500", label: "Answered", desc: "Response saved" },
                  { color: "bg-purple-500", label: "Marked for Review", desc: "Flagged for later" },
                  { color: "bg-yellow-500", label: "Current", desc: "Active question (ring)" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                    <div className={`w-7 h-7 rounded-md ${item.color} shrink-0 flex items-center justify-center text-white text-xs font-bold`}>1</div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Agreement + Start */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-primary cursor-pointer"
            />
            <span className="text-sm text-foreground leading-relaxed">
              I have read and understood all the instructions. I agree to follow the exam rules and understand that any violations may result in auto-submission of my exam. I confirm that I will not use any unfair means during the examination.
            </span>
          </label>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => router.back()}
            >
              ← Go Back
            </Button>
            <Button
              variant="gold"
              size="lg"
              className="flex-1"
              disabled={!agreed || starting}
              onClick={handleStartExam}
              id="start-exam"
              isLoading={starting}
              loadingText="Starting..."
            >
              Start Exam
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
