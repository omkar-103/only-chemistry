"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Search, BellOff,
  BookOpen, Trophy, CreditCard, MessageSquare, PlayCircle,
  Shield, Star, Megaphone, AlertCircle, Info, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import axios from "axios";
import { toast } from "@/hooks/useToast";
import Link from "next/link";
import { DemoBanner } from "@/components/ui/DemoOverlay";

/* ── Type & display configs ────────────────────────────────── */
const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  registration: { icon: Star, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30", label: "Welcome" },
  email_verified: { icon: CheckCheck, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", label: "Verified" },
  payment_success: { icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", label: "Payment" },
  exam_purchased: { icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Exam" },
  exam_published: { icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30", label: "New Exam" },
  doubt_replied: { icon: MessageSquare, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30", label: "Doubt" },
  new_video: { icon: PlayCircle, color: "text-pink-600", bg: "bg-pink-100 dark:bg-pink-900/30", label: "Video" },
  password_changed: { icon: Shield, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", label: "Security" },
  exam_reminder: { icon: Bell, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Reminder" },
  result_published: { icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Result" },
  announcement: { icon: Megaphone, color: "text-cyan-600", bg: "bg-cyan-100 dark:bg-cyan-900/30", label: "Announcement" },
  system: { icon: Info, color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-900/30", label: "System" },
};

const PRIORITY_CONFIG = {
  critical: { label: "Critical", badge: "bg-red-500/10 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-500/30 shadow-xs", ring: "border-red-500/40 shadow-red-500/5 shadow-md" },
  high: { label: "High", badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/30", ring: "border-amber-500/40" },
  medium: { label: "Medium", badge: "bg-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-500/20", ring: "border-blue-500/30" },
  low: { label: "Low", badge: "bg-slate-500/10 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400 border border-slate-500/20", ring: "" },
};

const FILTER_TYPES = [
  { value: "", label: "All" },
  { value: "exam_published", label: "New Exams" },
  { value: "result_published", label: "Results" },
  { value: "payment_success", label: "Payments" },
  { value: "doubt_replied", label: "Doubts" },
  { value: "new_video", label: "Videos" },
  { value: "announcement", label: "Announcements" },
];

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showUnread, setShowUnread] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    axios.get("/api/notifications?limit=100")
      .then(r => {
        const d = r.data.data;
        setNotifications(Array.isArray(d?.notifications) ? d.notifications : Array.isArray(d) ? d : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await axios.patch(`/api/notifications/${id}`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await axios.patch("/api/notifications");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast({ title: "All notifications marked as read", variant: "success" });
    } catch {
      toast({ title: "Failed to update", variant: "error" });
    }
  };

  const filtered = notifications.filter(n => {
    if (showUnread && n.isRead) return false;
    if (typeFilter && n.type !== typeFilter) return false;
    if (priorityFilter && n.priority !== priorityFilter) return false;
    if (search && !n.title?.toLowerCase().includes(search.toLowerCase()) &&
      !n.message?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const criticalCount = notifications.filter(n => !n.isRead && n.priority === "critical").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-3xl mx-auto">
      {/* ── Demo Banner: top-of-page warning, sidebar stays fully usable ── */}
      <DemoBanner
        title="Notifications are currently disabled"
        description="Real-time notifications require backend communication services and infrastructure that are not configured in this demo environment."
      />
      {/* ── Existing UI: fully visible, all interactions blocked via pointer-events-none ── */}
      <div className="space-y-5 pointer-events-none select-none opacity-75">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Notifications</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-muted-foreground text-sm">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold">
                <AlertCircle className="h-3 w-3" /> {criticalCount} critical
              </span>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search notifications..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
          id="notif-search"
        />
        <div className="flex gap-2">
          <Button
            variant={showUnread ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnread(v => !v)}
            className="gap-1.5 shrink-0"
            id="notif-unread-filter"
          >
            <Bell className="h-3.5 w-3.5" />
            Unread
            {unreadCount > 0 && (
              <span className="bg-destructive text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Priority filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { value: "", label: "All Priorities" },
          { value: "critical", label: "🔴 Critical" },
          { value: "high", label: "🟠 High" },
          { value: "medium", label: "🟡 Medium" },
          { value: "low", label: "🟢 Low" },
        ].map(p => (
          <button
            key={p.value}
            onClick={() => setPriorityFilter(p.value)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
              priorityFilter === p.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_TYPES.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
              typeFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No notifications found</p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              {search || typeFilter || priorityFilter || showUnread ? "Try adjusting your filters" : "You're all caught up!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG["system"];
            const priCfg = PRIORITY_CONFIG[n.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.low;
            const Icon = cfg.icon;
            const isHigh = n.priority === "critical" || n.priority === "high";

            return (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
              >
                <Card className={cn(
                  "overflow-hidden transition-all duration-200 hover:shadow-md border",
                  !n.isRead && isHigh ? priCfg.ring : "",
                  !n.isRead && "border-primary/20 bg-primary/[0.02]"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative", cfg.bg)}>
                        <Icon className={cn("h-5 w-5", cfg.color)} />
                        {!n.isRead && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-background"></span>
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className={cn("text-sm font-semibold leading-snug", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                                {n.title}
                              </p>
                              {/* Priority badge */}
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", priCfg.badge)}>
                                {priCfg.label}
                              </span>
                              {/* Type badge */}
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", cfg.bg, cfg.color)}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                            <p className="text-[11px] text-muted-foreground/50 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>

                          {/* Mark read only — no delete */}
                          {!n.isRead && (
                            <button
                              onClick={() => markAsRead(n._id)}
                              title="Mark as read"
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors shrink-0"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Link */}
                        {n.link && (
                          <Link href={n.link} className="inline-block mt-1.5 text-xs text-primary hover:underline font-medium">
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Results count */}
      {filtered.length > 0 && (
        <p className="text-xs text-center text-muted-foreground/60">
          Showing {filtered.length} of {notifications.length} notifications
        </p>
      )}
      </div>{/* end pointer-events-none wrapper */}
    </motion.div>
  );
}
