"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, BookOpen, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import axios from "axios";

const COLORS = ["#d4af37", "#192a6c", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b", "#3b82f6"];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/admin/analytics")
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm">Detailed performance insights</p>
      </div>

      {/* Daily Signups */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Registrations</CardTitle>
          <CardDescription>New student signups in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.dailySignups || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: "8px" }} labelFormatter={v => `Date: ${v}`} />
              <Line type="monotone" dataKey="count" stroke="#d4af37" strokeWidth={2.5} dot={false} name="Signups" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Exam Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Exams Performance</CardTitle>
          <CardDescription>Attempts, average score, and pass rate</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.examPerformance || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="examTitle" tick={{ fontSize: 10 }} width={130} />
              <Tooltip contentStyle={{ borderRadius: "8px" }} />
              <Bar dataKey="avgScore" name="Avg Score (%)" fill="#d4af37" radius={[0, 4, 4, 0]} />
              <Bar dataKey="passRate" name="Pass Rate (%)" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category-wise Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.categoryStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: "8px" }} />
                <Bar dataKey="totalAttempts" name="Attempts" radius={[4, 4, 0, 0]}>
                  {(data?.categoryStats || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Students</CardTitle>
            <CardDescription>By average score</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.topStudents?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No data yet</p>
            ) : (
              <div className="space-y-3">
                {(data?.topStudents || []).map((s: any, i: number) => (
                  <div key={s._id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: `${COLORS[i]}20`, color: COLORS[i] }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.studentName}</p>
                      <p className="text-xs text-muted-foreground">{s.totalAttempts} attempts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gold-500">{s.avgScore}%</p>
                      <p className="text-xs text-green-600">{s.passedCount} passed</p>
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
