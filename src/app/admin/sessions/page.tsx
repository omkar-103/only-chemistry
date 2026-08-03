"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Monitor, Globe, AlertTriangle, Clock, User, BookOpen,
  RefreshCw, Wifi, WifiOff, Activity, Shield, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import axios from "axios";
import { format, formatDistanceToNow } from "date-fns";

function StatBadge({ label, value, color = "" }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border text-center">
      <p className={cn("text-2xl font-black", color || "text-foreground")}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function SessionMonitoringPage() {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await axios.get("/api/admin/sessions");
      setData(res.data.data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchSessions, 30_000); // every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  const { activeExams = [], recentStudents = [], summary = {} } = data || {};

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Session Monitoring</h1>
          <p className="text-muted-foreground text-sm">
            Live view of active exams and online students
            <span className="ml-2 text-muted-foreground/60">
              · Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setAutoRefresh(v => !v)}
            id="auto-refresh"
          >
            {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {autoRefresh ? "Auto Refresh ON" : "Auto Refresh OFF"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchSessions} id="manual-refresh">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatBadge label="Active Exams"      value={summary.totalActive  || 0}  color="text-green-600" />
        <StatBadge label="Online Students"   value={summary.totalRecent  || 0}  color="text-blue-600"  />
        <StatBadge label="With Violations"   value={summary.withViolations || 0} color="text-red-500"  />
      </div>

      {/* ── Active Exams ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <h2 className="font-bold text-foreground">Active Exams ({activeExams.length})</h2>
          </div>
        </CardHeader>
        <CardContent>
          {activeExams.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">No exams in progress right now</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 px-2 text-muted-foreground font-medium text-xs">Student</th>
                    <th className="py-3 px-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">Exam</th>
                    <th className="py-3 px-2 text-muted-foreground font-medium text-xs">Progress</th>
                    <th className="py-3 px-2 text-muted-foreground font-medium text-xs">Time</th>
                    <th className="py-3 px-2 text-muted-foreground font-medium text-xs">Device</th>
                    <th className="py-3 px-2 text-muted-foreground font-medium text-xs text-center">Violations</th>
                  </tr>
                </thead>
                <tbody>
                  {activeExams.map((session: any) => {
                    const progress = session.totalQuestions > 0
                      ? Math.round((session.answeredCount / session.totalQuestions) * 100)
                      : 0;
                    const isRisk = session.totalViolations > 0;
                    const isTimeLow = session.timeRemaining < 10;

                    return (
                      <tr key={session.attemptId}
                        className={cn("border-b border-border/50 hover:bg-muted/20 transition-colors",
                          isRisk && "bg-red-50/30 dark:bg-red-900/10"
                        )}>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                              {session.studentName?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate max-w-[120px]">{session.studentName}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{session.studentEmail}</p>
                              {session.ip !== "unknown" && (
                                <p className="text-[10px] text-muted-foreground/60">{session.ip}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 hidden sm:table-cell">
                          <p className="text-xs font-medium max-w-[140px] truncate">{session.examTitle}</p>
                          <p className="text-[10px] text-muted-foreground">{session.examCategory}</p>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {session.answeredCount}/{session.totalQuestions}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className={cn("text-xs font-bold", isTimeLow ? "text-red-500 animate-pulse" : "text-foreground")}>
                              {session.timeRemaining}m left
                            </p>
                            <p className="text-[10px] text-muted-foreground">{session.elapsedMinutes}m elapsed</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Globe className="h-3 w-3 shrink-0" />
                            <span>{session.browser}</span>
                            <Monitor className="h-3 w-3 shrink-0 ml-1" />
                            <span>{session.device}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {session.totalViolations > 0 ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold flex items-center gap-1">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                {session.totalViolations}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {session.tabSwitchCount}T · {session.fullscreenExitCount}F
                              </span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold flex items-center gap-1 justify-center">
                              <Shield className="h-2.5 w-2.5" /> Clean
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recently Online Students ─────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="font-bold text-foreground">Recently Online Students ({recentStudents.length})</h2>
            <span className="text-xs text-muted-foreground">(last 30 minutes)</span>
          </div>
        </CardHeader>
        <CardContent>
          {recentStudents.length === 0 ? (
            <div className="py-8 text-center">
              <User className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No students active in the last 30 minutes</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentStudents.map((s: any) => (
                <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      Active {s.idleMinutes === 0 ? "just now" : `${s.idleMinutes}m ago`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-refresh note */}
      {autoRefresh && (
        <p className="text-xs text-center text-muted-foreground/50">
          Dashboard auto-refreshes every 30 seconds
        </p>
      )}
    </motion.div>
  );
}
