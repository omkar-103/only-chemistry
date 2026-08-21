"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Send, Users, Tag, Megaphone, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import axios from "axios";
import { toast } from "@/hooks/useToast";

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "text-muted-foreground", bg: "bg-muted" },
  medium: { label: "Medium", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  high: { label: "High", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
};

const DEFAULT_FORM = {
  title: "", message: "", link: "",
  priority: "medium" as "low" | "medium" | "high",
  category: "",
};

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function AdminNotificationsPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingH, setLoadingH] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  const set = (k: keyof typeof DEFAULT_FORM, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    // Load categories
    axios.get("/api/admin/categories?limit=100")
      .then(r => setCategories(r.data.data || []))
      .catch(() => {});

    // Load recent broadcast history
    axios.get("/api/admin/notifications/history")
      .then(r => setHistory(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => {})
      .finally(() => setLoadingH(false));
  }, []);

  const sendBroadcast = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: "Title and message are required", variant: "error" });
      return;
    }
    setSending(true);
    try {
      const res = await axios.post("/api/admin/notifications/broadcast", {
        title: form.title,
        message: form.message,
        link: form.link || undefined,
        priority: form.priority,
        category: form.category || undefined,
      });
      toast({ title: res.data.message || "Announcement sent!", variant: "success" });
      const sentItem = { ...form, createdAt: new Date().toISOString(), _id: Date.now().toString() };
      setForm(DEFAULT_FORM);
      setHistory(h => [sentItem, ...h]);
    } catch (e: any) {
      toast({ title: e.response?.data?.message || "Send failed", variant: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-black text-foreground">Notifications</h1>
        <p className="text-muted-foreground text-sm">Broadcast announcements to students</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Broadcast Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-primary" />
              Send Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="notif-title"
              label="Title *"
              placeholder="e.g. New Exam Available!"
              value={form.title}
              onChange={e => set("title", e.target.value)}
            />

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Message *</label>
              <textarea
                rows={4}
                placeholder="Write your announcement message..."
                value={form.message}
                onChange={e => set("message", e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground outline-none focus:ring-2 ring-primary/30 resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">{form.message.length}/1000</p>
            </div>

            <Input
              id="notif-link"
              label="Action Link (optional)"
              placeholder="/exams/exam-id"
              value={form.link}
              onChange={e => set("link", e.target.value)}
            />

            {/* Priority + Target Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Priority</label>
                <div className="flex gap-1.5">
                  {(["low", "medium", "high"] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set("priority", p)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors",
                        form.priority === p
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Course / Category</label>
                <select
                  value={form.category}
                  onChange={e => set("category", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:ring-2 ring-primary/30"
                >
                  <option value="">All Categories (Broadcast)</option>
                  {categories.map(c => (
                    <option key={c._id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="gold"
                className="w-full gap-2"
                onClick={sendBroadcast}
                isLoading={sending}
                loadingText="Broadcasting..."
                id="send-broadcast-btn"
              >
                <Send className="h-4 w-4" />
                Send Announcement to Students
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Broadcast History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Broadcast History
              </span>
              <span className="text-xs font-normal text-muted-foreground">{history.length} sent</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingH ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                No broadcasts sent yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {history.map((h, i) => {
                  const pcfg = PRIORITY_CONFIG[h.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
                  return (
                    <div key={h._id || i} className="p-3 rounded-xl border border-border bg-card/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{h.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{h.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", pcfg.bg, pcfg.color)}>{pcfg.label}</span>
                            {h.category && <span className="text-[10px] text-muted-foreground">{h.category}</span>}
                            <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(h.createdAt)}</span>
                          </div>
                        </div>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
