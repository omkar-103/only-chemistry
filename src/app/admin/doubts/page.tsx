"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, ChevronDown, ChevronUp, Send, Search,
  CheckCircle2, Clock, UploadCloud, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";

/* ── Inline Image Uploader ──────────────────────────────────── */
function ImageUploader({
  value, onChange, folder = "rhg-exam-portal/admin-replies",
}: { value: string; onChange: (url: string) => void; folder?: string }) {
  const inputRef                  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(value || "");

  const handleFile = async (file: File) => {
    if (!["image/png","image/jpeg","image/jpg","image/webp"].includes(file.type)) {
      toast({ title: "Only PNG, JPG, WEBP allowed", variant: "error" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Max 5 MB", variant: "error" }); return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      try {
        const res = await axios.post("/api/upload", { file: base64, folder });
        if (res.data.success) {
          onChange(res.data.data.url);
        } else {
          toast({ title: res.data.message || "Upload failed", variant: "error" });
          setPreview(value || "");
        }
      } catch (e: any) {
        toast({ title: e.response?.data?.message || "Upload failed", variant: "error" });
        setPreview(value || "");
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const remove = () => { setPreview(""); onChange(""); if (inputRef.current) inputRef.current.value = ""; };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="attachment" className="max-h-40 rounded-xl border border-border object-contain" />
          <button onClick={remove} type="button"
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} type="button" disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors text-sm">
          {uploading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            : <><UploadCloud className="h-4 w-4" /> Attach Image / Diagram</>
          }
        </button>
      )}
    </div>
  );
}

export default function AdminDoubtsPage() {
  const [doubts, setDoubts]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText]   = useState<Record<string, string>>({});
  const [replyImage, setReplyImage] = useState<Record<string, string>>({});
  const [replying, setReplying]     = useState<string | null>(null);

  const fetchDoubts = () => {
    setLoading(true);
    const params = new URLSearchParams({ ...(status !== "all" && { status }) });
    axios.get(`/api/doubts?${params}`)
      .then(r => setDoubts(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchDoubts(); }, [status]);

  const submitReply = async (doubtId: string) => {
    const reply = replyText[doubtId]?.trim();
    if (!reply) { toast({ title: "Reply cannot be empty", variant: "error" }); return; }
    setReplying(doubtId);
    try {
      await axios.post(`/api/doubts/${doubtId}/reply`, {
        reply,
        replyImage: replyImage[doubtId] || "",
      });
      setDoubts(prev => prev.map(d =>
        d._id === doubtId
          ? { ...d, status: "answered", reply, replyImage: replyImage[doubtId], repliedAt: new Date().toISOString() }
          : d
      ));
      setReplyText(prev  => ({ ...prev,  [doubtId]: "" }));
      setReplyImage(prev => ({ ...prev, [doubtId]: "" }));
      toast({ title: "Reply sent successfully!", variant: "success" });
    } catch {
      toast({ title: "Failed to send reply", variant: "error" });
    } finally { setReplying(null); }
  };

  const filtered = doubts.filter(d =>
    !search ||
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = doubts.filter(d => d.status === "pending").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Student Doubts</h1>
          <p className="text-muted-foreground text-sm">
            {pendingCount > 0 ? <span className="text-amber-600 font-semibold">{pendingCount} pending</span> : "All caught up!"}
            {" "}— answer and manage student questions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          id="doubt-search"
          placeholder="Search by title, student, or category..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          {(["pending", "answered", "all"] as const).map(s => (
            <Button key={s} variant={status === s ? "default" : "outline"} size="sm"
              onClick={() => setStatus(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No doubts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doubt => (
            <Card key={doubt._id} className="overflow-hidden">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                        doubt.status === "answered"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {doubt.status === "answered"
                          ? <><CheckCircle2 className="h-3 w-3" />Answered</>
                          : <><Clock className="h-3 w-3" />Pending</>
                        }
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{doubt.category}</span>
                      {doubt.image && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                          📎 Has Image
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{doubt.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      By <span className="font-medium">{doubt.studentId?.name || "Unknown Student"}</span>
                      {" · "}{doubt.createdAt ? format(new Date(doubt.createdAt), "dd MMM yyyy, hh:mm a") : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm"
                    onClick={() => setExpanded(expanded === doubt._id ? null : doubt._id)}
                    id={`expand-${doubt._id}`}>
                    {expanded === doubt._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {expanded === doubt._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-border space-y-4"
                    >
                      {/* Student's doubt */}
                      <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Student's Doubt:</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{doubt.description}</p>
                        {doubt.image && (
                          <img src={doubt.image} alt="Student attachment"
                            className="mt-3 max-h-64 rounded-xl border border-border object-contain" />
                        )}
                      </div>

                      {/* Existing reply */}
                      {doubt.reply && (
                        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">✓ Your Reply:</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{doubt.reply}</p>
                          {doubt.replyImage && (
                            <img src={doubt.replyImage} alt="Reply attachment"
                              className="mt-3 max-h-48 rounded-xl border border-green-200 object-contain" />
                          )}
                          {doubt.repliedAt && (
                            <p className="text-[10px] text-muted-foreground mt-2">
                              Replied {format(new Date(doubt.repliedAt), "dd MMM yyyy, hh:mm a")}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Reply form */}
                      {doubt.status !== "answered" && (
                        <div className="space-y-3">
                          <textarea
                            id={`reply-${doubt._id}`}
                            rows={4}
                            placeholder="Type your expert answer here... You can also include step-by-step explanation."
                            value={replyText[doubt._id] || ""}
                            onChange={e => setReplyText(prev => ({ ...prev, [doubt._id]: e.target.value }))}
                            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                          />
                          <div className="flex items-center justify-between gap-4">
                            {/* ── Demo: upload button visible but non-interactive ── */}
                            <div className="flex-1 space-y-2">
                              <div className="pointer-events-none opacity-50 select-none">
                                <ImageUploader
                                  value={replyImage[doubt._id] || ""}
                                  onChange={url => setReplyImage(prev => ({ ...prev, [doubt._id]: url }))}
                                />
                              </div>
                              {/* ── Storage unavailable notice (demo only) ── */}
                              <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-50/60 dark:bg-amber-900/15 px-3 py-2">
                                <span className="text-amber-500 text-sm leading-none mt-0.5">⚠</span>
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                                  <span className="font-semibold">Image uploads are disabled in this demo</span>{" "}
                                  because file storage has not been configured.
                                  Text-based doubt management will continue to work normally.
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="gold" size="sm"
                              onClick={() => submitReply(doubt._id)}
                              isLoading={replying === doubt._id}
                              loadingText="Sending..."
                              className="gap-2 shrink-0"
                              id={`send-reply-${doubt._id}`}
                            >
                              <Send className="h-3.5 w-3.5" /> Send Reply
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
