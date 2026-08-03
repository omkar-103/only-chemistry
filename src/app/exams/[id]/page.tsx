"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen, Clock, Users, Star, Shield, ChevronRight,
  CheckCircle2, Lock, ArrowLeft, Award, Target, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENCY_SYMBOL, DIFFICULTY_CONFIG, ROUTES } from "@/constants";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

declare global {
  interface Window { Razorpay: any; }
}

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, isAuthenticated } = useAuthStore();

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/exams/${id}`)
      .then(r => setExam(r.data.data))
      .catch(() => setError("Exam not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/exams/${id}`);
      return;
    }
    setError("");
    setPurchasing(true);
    try {
      // 1. Create order
      const orderRes = await axios.post("/api/payments/create-order", { examId: id });
      const { orderId, amount, currency, isDemoMode, keyId } = orderRes.data.data;

      // 2. Demo mode — skip Razorpay UI, verify instantly
      if (isDemoMode) {
        const verifyRes = await axios.post("/api/payments/verify", {
          razorpay_order_id:   orderId,
          razorpay_payment_id: `demo_pay_${Date.now()}`,
          razorpay_signature:  `demo_sig_${Date.now()}`,
          examId: id,
        });
        if (verifyRes.data.success) {
          setExam((prev: any) => ({ ...prev, isPurchased: true }));
          router.push(ROUTES.EXAM.INSTRUCTIONS(id));
        }
        return;
      }

      // 3. Load Razorpay SDK
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.head.appendChild(s);
        });
      }

      // 4. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "RHGConsultancyService",
        description: exam.title,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await axios.post("/api/payments/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              examId: id,
            });
            if (verifyRes.data.success) {
              setExam((prev: any) => ({ ...prev, isPurchased: true }));
              router.push(ROUTES.EXAM.INSTRUCTIONS(id));
            }
          } catch {
            setError("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => setPurchasing(false),
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#d4af37" },
      });
      rzp.open();
    } catch (e: any) {
      setError(e.response?.data?.message || "Payment failed. Please try again.");
      setPurchasing(false);
    }
  };

  const handleStartFree = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/exams/${id}`);
      return;
    }
    router.push(ROUTES.EXAM.INSTRUCTIONS(id));
  };

  // ── Loading skeleton ─────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="h-64 skeleton rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 px-6">
        <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Exam Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || "This exam doesn't exist or has been removed."}</p>
        <Link href={ROUTES.STUDENT.EXAMS}>
          <Button variant="default"><ArrowLeft className="h-4 w-4 mr-2" />Back to Exams</Button>
        </Link>
      </div>
    );
  }

  const diff = DIFFICULTY_CONFIG[exam.difficulty as keyof typeof DIFFICULTY_CONFIG];
  const isPurchased = user?.purchasedExams?.includes(id);
  const canAccess = exam.isFree || isPurchased;
  const priceINR = exam.isFree ? 0 : (exam.price / 100);

  const stats = [
    { icon: BookOpen, label: "Questions", value: exam.questionCount ?? exam.questions?.length ?? 0 },
    { icon: Clock, label: "Duration", value: `${exam.totalDuration} min` },
    { icon: Users, label: "Attempts", value: exam.attemptCount ?? 0 },
    { icon: Target, label: "Passing", value: `${exam.passingPercentage}%` },
    { icon: Award, label: "Max Attempts", value: exam.maxAttempts ?? 1 },
    { icon: Zap, label: "Difficulty", value: diff?.label ?? exam.difficulty },
  ];

  const features = [
    "Detailed performance analytics after submission",
    exam.showExplanations ? "Full explanations for all answers" : "Score report on completion",
    exam.negativeMarkingEnabled ? `Negative marking: -${exam.negativeMarks ?? 0.25} per wrong answer` : "No negative marking",
    exam.shuffleQuestions ? "Questions shuffled for fairness" : "Fixed question order",
    "Auto-save every 30 seconds",
    "Proctored environment — tab switch monitoring",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back button */}
      <Link href={ROUTES.STUDENT.EXAMS}>
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />Back to Exams
        </Button>
      </Link>

      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="overflow-hidden">
          {/* Banner */}
          <div className="relative h-40 sm:h-52 bg-gradient-to-br from-navy-900 via-navy-700 to-navy-800 overflow-hidden">
            {exam.thumbnail ? (
              <img src={exam.thumbnail} alt={exam.title} className="w-full h-full object-cover opacity-60" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-20 w-20 text-white/10" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                {exam.category}
              </span>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm",
                exam.isFree ? "bg-green-500/80 text-white" : "bg-gold-500/90 text-navy-900"
              )}>
                {exam.isFree ? "FREE" : `₹${priceINR}`}
              </span>
            </div>
            {/* Difficulty */}
            <div className="absolute top-4 right-4">
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-white/20", diff?.color)}>
                {diff?.label}
              </span>
            </div>
          </div>

          <CardContent className="pt-5 pb-6">
            <h1 className="text-xl sm:text-2xl font-display font-black text-foreground leading-tight mb-2">
              {exam.title}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              {exam.description}
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="text-center p-2.5 rounded-xl bg-muted/50">
                    <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-xs font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            {canAccess ? (
              <Button
                variant="gold"
                size="lg"
                className="w-full gap-2 text-base font-bold"
                onClick={handleStartFree}
                id="start-exam-btn"
              >
                <Shield className="h-5 w-5" />
                {isPurchased ? "Start Exam" : "Start Free Exam"}
                <ChevronRight className="h-5 w-5" />
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full gap-2 text-base font-bold"
                  onClick={handlePurchase}
                  isLoading={purchasing}
                  loadingText="Opening payment..."
                  id="purchase-exam-btn"
                >
                  <Lock className="h-5 w-5" />
                  Buy Now — {CURRENCY_SYMBOL}{priceINR}
                  <ChevronRight className="h-5 w-5" />
                </Button>
                {error && (
                  <p className="text-xs text-destructive text-center">{error}</p>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Secure payment via Razorpay · One-time purchase · Instant access
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Features & what's included */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* What's included */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-5 pb-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                What&apos;s Included
              </h2>
              <ul className="space-y-2.5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Exam rules */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="pt-5 pb-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Exam Rules
              </h2>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <Star className="h-4 w-4 text-gold-500 mt-0.5 shrink-0" />
                  Use a desktop/laptop for best experience
                </li>
                <li className="flex items-start gap-2.5">
                  <Star className="h-4 w-4 text-gold-500 mt-0.5 shrink-0" />
                  Do not switch tabs or minimize the window
                </li>
                <li className="flex items-start gap-2.5">
                  <Star className="h-4 w-4 text-gold-500 mt-0.5 shrink-0" />
                  Ensure stable internet connection before starting
                </li>
                <li className="flex items-start gap-2.5">
                  <Star className="h-4 w-4 text-gold-500 mt-0.5 shrink-0" />
                  {exam.maxAttempts > 1
                    ? `You have ${exam.maxAttempts} attempts for this exam`
                    : "Only 1 attempt allowed — choose your time wisely"}
                </li>
                {exam.startDate && (
                  <li className="flex items-start gap-2.5">
                    <Star className="h-4 w-4 text-gold-500 mt-0.5 shrink-0" />
                    Available from {new Date(exam.startDate).toLocaleDateString("en-IN")}
                  </li>
                )}
                {exam.endDate && (
                  <li className="flex items-start gap-2.5">
                    <Star className="h-4 w-4 text-gold-500 mt-0.5 shrink-0" />
                    Expires on {new Date(exam.endDate).toLocaleDateString("en-IN")}
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Subject info */}
      {exam.subject && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-5 pb-4">
              <h2 className="font-bold text-foreground mb-2">Subject</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {exam.subject}
              </span>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
