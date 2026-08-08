"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, BookOpen, TrendingUp, Award } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, Cell, AreaChart, Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import axios from "axios";

const COLORS = ["#d4af37", "#192a6c", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b", "#3b82f6"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-semibold text-foreground border-b border-border/50 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span>{entry.name}:</span>
            <span className="font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm">Detailed performance insights and platform activity trends</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl text-xs text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-gold-500" />
          <span>Real-time aggregation active</span>
        </div>
      </div>

      {/* Daily Signups */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Daily Registrations</CardTitle>
          <CardDescription>New student signups over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.dailySignups || []}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#d4af37" strokeWidth={2.5} fillOpacity={1} fill="url(#goldGradient)" name="Signups" activeDot={{ r: 6, fill: "#d4af37" }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Exam Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Top Exams Performance</CardTitle>
          <CardDescription>Attempts, average score percentage, and pass rate across exams</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.examPerformance || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="examTitle" tick={{ fontSize: 10 }} width={140} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgScore" name="Avg Score (%)" fill="#d4af37" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="passRate" name="Pass Rate (%)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distribution & Top Students */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Category-wise Attempts</CardTitle>
            <CardDescription>Distribution of student attempts per subject category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.categoryStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalAttempts" name="Attempts" radius={[6, 6, 0, 0]} barSize={24}>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-gold-500" />
              Top Performing Students
            </CardTitle>
            <CardDescription>Ranked by overall average score percentage</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.topStudents?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No student performance data yet</p>
            ) : (
              <div className="space-y-3">
                {(data?.topStudents || []).map((s: any, i: number) => (
                  <div key={s._id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      style={{ backgroundColor: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{s.studentName}</p>
                      <p className="text-xs text-muted-foreground">{s.totalAttempts} exam attempts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gold-500">{s.avgScore}%</p>
                      <p className="text-xs text-green-600 font-medium">{s.passedCount} passed</p>
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

