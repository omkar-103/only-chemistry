"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, BookOpen, BarChart3, TrendingUp,
  MessageSquare, Eye, Clock, Award, Tag
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { IDashboardStats } from "@/types";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  color: string;
}

function StatCard({ title, value, icon, change, color }: StatCardProps) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-border/80 relative overflow-hidden group">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
              <p className="text-2xl font-display font-black text-foreground tracking-tight">{value}</p>
              {change ? (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-1">
                  <TrendingUp className="h-2.5 w-2.5" />
                  <span>{change}</span>
                </div>
              ) : (
                <div className="h-4" />
              )}
            </div>
            <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110 shadow-xs", color)}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/admin/dashboard")
      .then((r) => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Active", value: stats?.activeStudents || 0 },
    { name: "Inactive", value: (stats?.totalStudents || 0) - (stats?.activeStudents || 0) },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href={ROUTES.ADMIN.EXAM_CREATE}>
          <Button variant="gold">+ Create Exam</Button>
        </Link>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents?.toLocaleString() || "0"}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100 dark:bg-blue-900/30"
          change="+12% this month"
        />
        <StatCard
          title="Active Students"
          value={stats?.activeStudents?.toLocaleString() || "0"}
          icon={<Eye className="h-5 w-5 text-green-600" />}
          color="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          title="Total Exams"
          value={stats?.totalExams?.toLocaleString() || "0"}
          icon={<BookOpen className="h-5 w-5 text-purple-600" />}
          color="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatCard
          title="Published Exams"
          value={stats?.publishedExams?.toLocaleString() || "0"}
          icon={<Award className="h-5 w-5 text-gold-600" />}
          color="bg-gold-100 dark:bg-gold-900/30"
        />
        <StatCard
          title="Exam Attempts"
          value={stats?.examAttempts?.toLocaleString() || "0"}
          icon={<BarChart3 className="h-5 w-5 text-orange-600" />}
          color="bg-orange-100 dark:bg-orange-900/30"
        />
        <StatCard
          title="Avg. Score"
          value={`${stats?.averageScore || 0}%`}
          icon={<Award className="h-5 w-5 text-rose-600" />}
          color="bg-rose-100 dark:bg-rose-900/30"
        />
        <StatCard
          title="Pending Doubts"
          value={stats?.pendingDoubts || "0"}
          icon={<MessageSquare className="h-5 w-5 text-yellow-600" />}
          color="bg-yellow-100 dark:bg-yellow-900/30"
        />
        <StatCard
          title="Categories"
          value={stats?.totalCategories?.toLocaleString() || "0"}
          icon={<Tag className="h-5 w-5 text-teal-600" />}
          color="bg-teal-100 dark:bg-teal-900/30"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Student Growth Chart */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Student Registrations</CardTitle>
              <CardDescription>New student signups over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats?.studentGrowth || []}>
                  <defs>
                    <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#192a6c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#192a6c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [value, "Students"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="#192a6c"
                    strokeWidth={2.5}
                    fill="url(#studentGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Student Activity Pie */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle>Student Activity</CardTitle>
              <CardDescription>Active vs inactive (last 7 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#d4af37" : "#e2e8f0"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full bg-gold-500" />
                  <span className="text-muted-foreground">Active ({stats?.activeStudents})</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <span className="text-muted-foreground">Inactive ({(stats?.totalStudents || 0) - (stats?.activeStudents || 0)})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Exam Attempts Chart */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Exam Attempts</CardTitle>
            <CardDescription>Student exam activity per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.studentGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }} />
                <Bar dataKey="students" fill="#192a6c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Students */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Students</CardTitle>
              <CardDescription>Latest registered students</CardDescription>
            </div>
            <Link href={ROUTES.ADMIN.STUDENTS}>
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!stats?.recentStudents || stats.recentStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No students yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentStudents.map((student: any) => (
                  <div key={student._id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {student.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {student.assignedCategories?.length > 0 ? (
                          student.assignedCategories.slice(0, 2).map((cat: string) => (
                            <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No categories</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(student.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
