"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Search, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CURRENCY_SYMBOL } from "@/constants";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import { DemoOverlay } from "@/components/ui/DemoOverlay";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("paid");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchPayments = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      ...(status !== "all" && { status }),
    });
    axios
      .get(`/api/payments?${params}`)
      .then((r) => {
        const data = r.data.data || [];
        setPayments(data);
        setTotal(r.data.pagination?.total || 0);
        if (status === "paid") {
          setTotalRevenue(data.reduce((acc: number, p: any) => acc + (p.amount || 0), 0));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, [page, status]);

  const filtered = payments.filter(
    (p) =>
      !search ||
      p.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.studentId?.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.examId?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative space-y-5">
      {/* ── Demo overlay (transparent) – page visible but all interactions disabled ── */}
      <DemoOverlay
        variant="transparent"
        title="Payments Disabled"
        description={
          <>
            <p>
              Razorpay has not been configured for this demo.
            </p>
            <p className="mt-2">
              Connect Razorpay API keys and webhook configuration to enable
              payment collection and transaction management.
            </p>
          </>
        }
      />
      {/* ── Existing UI (untouched) ────────────────────────────────────────────── */}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Payments</h1>
          <p className="text-muted-foreground text-sm">{total} total transactions</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" id="export-payments">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Revenue Banner */}
      {status === "paid" && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-green-700 to-emerald-600 text-white relative overflow-hidden">
          <div className="absolute right-4 top-0 text-white/10 text-8xl font-black font-display leading-none">₹</div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="h-7 w-7" />
            </div>
            <div>
              <p className="text-white/70 text-sm">Total Revenue</p>
              <p className="text-3xl font-display font-black">
                {CURRENCY_SYMBOL}{(totalRevenue / 100).toLocaleString("en-IN")}
              </p>
              <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {total} successful transactions
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="payment-admin-search"
              placeholder="Search by student or exam..."
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2 flex-wrap">
              {(["paid", "created", "failed", "all"] as const).map((s) => (
                <Button
                  key={s}
                  variant={status === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatus(s); setPage(1); }}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No payments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Student", "Exam", "Amount", "Method", "Status", "Date"].map((h) => (
                      <th key={h} className="text-left py-3 px-2 text-muted-foreground font-medium first:pl-0 last:pr-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p._id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2 pl-0">
                        <p className="font-medium text-foreground">{p.studentId?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{p.studentId?.email}</p>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-foreground max-w-[160px] truncate">
                          {p.examId?.title || "Unknown Exam"}
                        </p>
                      </td>
                      <td className="py-3 px-2 font-bold text-green-600">
                        {CURRENCY_SYMBOL}{(p.amount / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground capitalize text-xs">
                        {p.paymentMethod || "razorpay"}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            p.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : p.status === "failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs pr-0">
                        {p.createdAt ? format(new Date(p.createdAt), "dd MMM yy, HH:mm") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / 20)}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 20 >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
