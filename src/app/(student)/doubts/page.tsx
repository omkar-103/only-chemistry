"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, X, Send, ChevronDown, ChevronUp,
  Image as ImageIcon, Loader2, CheckCircle2, Clock,
  Trash2, UploadCloud, Copy, Check, Sparkles, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXAM_CATEGORIES } from "@/constants";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";

/* ── Small image uploader component ──────────────────────── */
function ImageUploader({
  value, onChange, folder = "rhg-exam-portal/doubts", label = "Attach Image",
}: {
  value: string; onChange: (url: string) => void; folder?: string; label?: string;
}) {
  const inputRef                  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(value || "");

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!["image/png","image/jpeg","image/jpg","image/webp"].includes(file.type)) {
      toast({ title: "Only PNG, JPG, WEBP allowed", variant: "error" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Max file size is 5 MB", variant: "error" }); return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setPreview(base64);
        const res = await axios.post("/api/upload", { file: base64, folder });
        if (res.data.success) {
          onChange(res.data.data.url);
          toast({ title: "Image uploaded!", variant: "success" });
        } else {
          toast({ title: res.data.message || "Upload failed", variant: "error" });
          setPreview(value || "");
        }
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      toast({ title: e.response?.data?.message || "Upload failed", variant: "error" });
      setPreview(value || "");
    } finally {
      setUploading(false);
    }
  };

  const remove = () => { setPreview(""); onChange(""); if (inputRef.current) inputRef.current.value = ""; };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="attachment" className="max-h-40 rounded-xl border border-border object-contain" />
          <button
            onClick={remove} type="button"
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()} type="button" disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          {uploading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            : <><UploadCloud className="h-4 w-4" /> {label}</>
          }
        </button>
      )}
    </div>
  );
}

export default function DoubtsPage() {
  const [doubts, setDoubts]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ category: "", title: "", description: "", image: "" });

  const fetchDoubts = () => {
    setLoading(true);
    axios.get("/api/doubts")
      .then(r => setDoubts(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchDoubts(); }, []);

  const submitDoubt = async () => {
    if (!form.category || !form.title || !form.description) {
      toast({ title: "Please fill all required fields", variant: "error" }); return;
    }
    setSaving(true);
    try {
      await axios.post("/api/doubts", form);
      toast({ title: "Doubt submitted!", description: "Our experts will reply soon.", variant: "success" });
      setShowForm(false);
      setForm({ category: "", title: "", description: "", image: "" });
      fetchDoubts();
    } catch (e: any) {
      toast({ title: e.response?.data?.message || "Submit failed", variant: "error" });
    } finally {
      setSaving(false); }
  };

  const pendingCount  = doubts.filter(d => d.status === "pending").length;
  const answeredCount = doubts.filter(d => d.status === "answered").length;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">My Doubts</h1>
          <p className="text-muted-foreground text-sm">
            {pendingCount > 0 ? `${pendingCount} pending · ` : ""}{answeredCount} answered
          </p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setShowForm(!showForm)} id="ask-doubt" className="gap-1.5">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Ask a Doubt"}
        </Button>
      </div>

      {/* Submit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-primary/20">
              <CardHeader><CardTitle className="text-base">Submit Your Doubt</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Category <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="doubt-category"
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select Topic</option>
                      {EXAM_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      <option value="General Chemistry">General Chemistry</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Input
                    id="doubt-title"
                    label="Subject/Title"
                    placeholder="Brief title of your doubt"
                    required
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Describe Your Doubt <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="doubt-desc"
                    rows={4}
                    placeholder="Explain your doubt in detail. Include the problem statement, what you've tried, and what's confusing you..."
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>

                {/* Image attachment */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Attach Image <span className="text-muted-foreground text-xs">(optional — diagram, screenshot, etc.)</span>
                  </label>
                  {/* ── Demo: upload button visible but non-interactive ── */}
                  <div className="pointer-events-none opacity-50 select-none">
                    <ImageUploader
                      value={form.image}
                      onChange={url => setForm(p => ({ ...p, image: url }))}
                      label="Upload Diagram / Screenshot"
                    />
                  </div>
                  {/* ── Storage unavailable notice (demo only) ── */}
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-50/60 dark:bg-amber-900/15 px-3 py-2.5">
                    <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
                    <div className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      <span className="font-semibold">Image uploads are currently unavailable</span>{" "}
                      because file storage has not been configured.{" "}
                      <span className="text-amber-600 dark:text-amber-500">
                        You can continue submitting text-only doubts in the demo.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setForm({ category: "", title: "", description: "", image: "" }); }}>
                    Cancel
                  </Button>
                  <Button variant="gold" size="sm" isLoading={saving} loadingText="Submitting..." onClick={submitDoubt} className="gap-1.5" id="submit-doubt">
                    <Send className="h-3.5 w-3.5" /> Submit Doubt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doubts list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      ) : doubts.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No doubts yet</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Ask your first doubt using the button above</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {doubts.map((doubt, i) => (
            <motion.div key={doubt._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={cn("overflow-hidden border", doubt.status === "answered" ? "border-green-500/20" : "border-border")}>
                {/* Doubt header */}
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(expanded === doubt._id ? null : doubt._id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      doubt.status === "answered" ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"
                    )}>
                      {doubt.status === "answered"
                        ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                        : <Clock className="h-4 w-4 text-orange-500" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{doubt.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground/60">
                          {format(new Date(doubt.createdAt), "d MMM yyyy")}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium capitalize">
                          {doubt.category}
                        </span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-bold capitalize",
                          doubt.status === "answered"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-500"
                        )}>
                          {doubt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expanded === doubt._id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {expanded === doubt._id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 pt-0 space-y-4 border-t border-border">
                        {/* Student's doubt */}
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Question</p>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-3">
                            {doubt.description}
                          </p>
                          {doubt.image && (
                            <img
                              src={doubt.image}
                              alt="Doubt attachment"
                              className="mt-3 max-h-64 rounded-xl border border-border object-contain"
                            />
                          )}
                        </div>

                        {/* Admin reply */}
                        {doubt.status === "answered" && doubt.reply ? (
                          <div className="rounded-xl border border-green-500/30 bg-gradient-to-b from-green-50/80 to-green-50/30 dark:from-green-950/20 dark:to-green-900/10 p-4 relative shadow-sm">
                            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-green-500/15">
                              <div className="flex items-center gap-1.5">
                                <span className="p-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                                  <Sparkles className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">
                                  Verified Expert Answer
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(doubt.reply);
                                  toast({ title: "Answer copied to clipboard!", variant: "success" });
                                }}
                                className="h-7 text-[11px] gap-1 text-green-700 dark:text-green-300 border-green-500/30 hover:bg-green-100 dark:hover:bg-green-900/40"
                              >
                                <Copy className="h-3 w-3" /> Copy Answer
                              </Button>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pt-1">
                              {doubt.reply}
                            </p>
                            {doubt.replyImage && (
                              <img
                                src={doubt.replyImage}
                                alt="Expert attachment"
                                className="mt-3 max-h-64 rounded-xl border border-green-500/20 object-contain shadow-sm"
                              />
                            )}
                            {doubt.repliedAt && (
                              <p className="text-[11px] text-muted-foreground/60 mt-3 pt-2 border-t border-green-500/10 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground/50" />
                                Replied {format(new Date(doubt.repliedAt), "d MMM yyyy, h:mm a")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                            <Clock className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
                            <p className="text-sm text-muted-foreground">Awaiting expert reply...</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">Usually within 24 hours</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
