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
            <div className="space-y-2">
              {payments.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      p.status === "paid"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : p.status === "failed"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-yellow-100 dark:bg-yellow-900/30"
                    )}
                  >
                    {p.status === "paid" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : p.status === "failed" ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {p.examId?.title || "Exam Purchase"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy, hh:mm a") : ""}
                    </p>
                    {p.razorpayPaymentId && (
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {p.razorpayPaymentId}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        p.status === "paid"
                          ? "text-green-600"
                          : p.status === "failed"
                          ? "text-red-500"
                          : "text-yellow-600"
                      )}
                    >
                      {CURRENCY_SYMBOL}{(p.amount / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{p.status}</p>
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
