"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, XCircle, Clock, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CURRENCY_SYMBOL, ROUTES } from "@/constants";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import Link from "next/link";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/payments")
      .then((r) => setPayments(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.amount, 0);

  const successCount = payments.filter((p) => p.status === "paid").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-black text-foreground">Payment History</h1>
        <p className="text-muted-foreground text-sm">All your exam purchases and transactions</p>
      </div>

      {!loading && payments.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-navy-800 to-navy-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 text-white/5 text-9xl font-black font-display leading-none">₹</div>
          <p className="text-white/70 text-sm mb-1">Total Spent</p>
          <p className="text-4xl font-display font-black">
            {CURRENCY_SYMBOL}{(totalSpent / 100).toLocaleString("en-IN")}
          </p>
          <p className="text-white/60 text-xs mt-2">
            {successCount} successful {successCount === 1 ? "purchase" : "purchases"}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl skeleton" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-14">
              <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-foreground">No purchases yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Browse exams and purchase access to get started
              </p>
              <Link href={ROUTES.STUDENT.EXAMS}>
                <Button variant="gold" className="mt-4 gap-2">
                  <BookOpen className="h-4 w-4" />
                  Browse Exams
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {payments.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/50"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs",
                      p.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : p.status === "failed"
                        ? "bg-red-500/10 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                        : "bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                    )}
                  >
                    {p.status === "paid" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : p.status === "failed" ? (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {p.examId?.title || "Exam Purchase"}
                      </p>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        p.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20"
                          : p.status === "failed"
                          ? "bg-red-500/10 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20"
                      )}>
                        {p.status === "paid" ? "SUCCESSFUL" : p.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy, hh:mm a") : ""}
                    </p>
                    {p.razorpayPaymentId && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/80 px-1.5 py-0.5 rounded border border-border/50">
                          ID: {p.razorpayPaymentId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-base font-bold",
                        p.status === "paid"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : p.status === "failed"
                          ? "text-red-500 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {CURRENCY_SYMBOL}{(p.amount / 100).toFixed(2)}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                      Razorpay Online
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
