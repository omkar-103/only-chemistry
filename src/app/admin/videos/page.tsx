"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, PlayCircle, Trash2, Eye, EyeOff, ExternalLink, HardDrive, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EXAM_CATEGORIES } from "@/constants";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { DemoOverlay } from "@/components/ui/DemoOverlay";

const DEFAULT_FORM = {
  title: "",
  description: "",
  category: "",
  youtubeLink: "",
  googleDriveLink: "",
  duration: "",
  isVisible: true,
  displayOrder: 0,
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });

  const fetchVideos = () => {
    setLoading(true);
    axios
      .get("/api/videos")
      .then((r) => setVideos(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const field = (key: string, val: string | boolean | number) =>
    setForm((p) => ({ ...p, [key]: val }));

  const saveVideo = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "error" });
      return;
    }
    if (!form.category) {
      toast({ title: "Category is required", variant: "error" });
      return;
    }
    if (!form.youtubeLink && !form.googleDriveLink) {
      toast({ title: "At least one video link (YouTube or Drive) is required", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      await axios.post("/api/videos", form);
      toast({ title: "Video added successfully!", variant: "success" });
      setShowForm(false);
      setForm({ ...DEFAULT_FORM });
      fetchVideos();
    } catch (e: any) {
      toast({ title: e.response?.data?.message || "Save failed", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/videos/${id}`);
      setVideos((prev) => prev.filter((v) => v._id !== id));
      toast({ title: "Video deleted", variant: "success" });
    } catch {
      toast({ title: "Delete failed", variant: "error" });
    }
  };

  const toggleVisibility = async (v: any) => {
    try {
      await axios.put(`/api/videos/${v._id}`, { isVisible: !v.isVisible });
      setVideos((prev) =>
        prev.map((vid) => (vid._id === v._id ? { ...vid, isVisible: !vid.isVisible } : vid))
      );
      toast({ title: v.isVisible ? "Video hidden from students" : "Video visible to students", variant: "success" });
    } catch {
      toast({ title: "Update failed", variant: "error" });
    }
  };

  const getYouTubeThumbnail = (url: string) => {
    const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]+)/);
    return match?.[1] ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative space-y-5">
      {/* ── Demo overlay – covers the page; do NOT remove or modify existing code below ── */}
      <DemoOverlay
        title="Video Management Disabled"
        description={
          <>
            <p>
              Video uploads require a configured video storage service.
            </p>
            <p className="mt-2">
              Connect a supported storage provider before uploading or managing
              videos.
            </p>
          </>
        }
      />
      {/* ── Existing UI (untouched) ────────────────────────────────────────────── */}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Learning Videos</h1>
          <p className="text-muted-foreground text-sm">{videos.length} video{videos.length !== 1 ? "s" : ""} published</p>
        </div>
        <Button
          variant="gold"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1.5"
          id="add-video-btn"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Video"}
        </Button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <h3 className="font-bold text-foreground">Add New Video</h3>
                <p className="text-sm text-muted-foreground">Add a YouTube or Google Drive video for students</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    id="v-title"
                    label="Video Title"
                    placeholder="e.g., Organic Chemistry Basics"
                    required
                    value={form.title}
                    onChange={(e) => field("title", e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Category <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="v-category"
                      value={form.category}
                      onChange={(e) => field("category", e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select Category</option>
                      {EXAM_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                      <option value="General">General Chemistry</option>
                    </select>
                  </div>
                  <Input
                    id="v-youtube"
                    label="YouTube Link"
                    placeholder="https://youtube.com/watch?v=..."
                    value={form.youtubeLink}
                    onChange={(e) => field("youtubeLink", e.target.value)}
                    hint="Recommended — will show thumbnail automatically"
                  />
                  <Input
                    id="v-drive"
                    label="Google Drive Link"
                    placeholder="https://drive.google.com/file/..."
                    value={form.googleDriveLink}
                    onChange={(e) => field("googleDriveLink", e.target.value)}
                  />
                  <Input
                    id="v-duration"
                    label="Duration (optional)"
                    placeholder="e.g., 45:30"
                    value={form.duration}
                    onChange={(e) => field("duration", e.target.value)}
                  />
                  <Input
                    id="v-order"
                    label="Display Order"
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) => field("displayOrder", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description (optional)</label>
                  <textarea
                    id="v-desc"
                    rows={2}
                    placeholder="Brief description of what this video covers..."
                    value={form.description}
                    onChange={(e) => field("description", e.target.value)}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="v-visible"
                    checked={form.isVisible}
                    onChange={(e) => field("isVisible", e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">Visible to students immediately</span>
                </label>

                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button
                    variant="gold"
                    onClick={saveVideo}
                    isLoading={saving}
                    loadingText="Saving..."
                    id="save-video"
                  >
                    Save Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Videos Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl skeleton" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16">
          <PlayCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No videos yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first video to get started</p>
          <Button variant="gold" className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add First Video
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => {
            const thumb = v.youtubeLink ? getYouTubeThumbnail(v.youtubeLink) : null;
            return (
              <motion.div
                key={v._id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn("overflow-hidden transition-all", !v.isVisible && "opacity-60")}>
                  {/* Thumbnail */}
                  <div className="relative h-36 bg-gradient-to-br from-navy-800 to-navy-600 overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <PlayCircle className="h-10 w-10 text-white/30" />
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {v.youtubeLink && (
                        <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold flex items-center gap-1">
                          <Video className="h-2.5 w-2.5" />YT
                        </span>
                      )}
                      {v.googleDriveLink && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1">
                          <HardDrive className="h-2.5 w-2.5" />Drive
                        </span>
                      )}
                    </div>
                    {!v.isVisible && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <EyeOff className="h-8 w-8 text-white/60" />
                      </div>
                    )}
                    {v.duration && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px]">
                        {v.duration}
                      </div>
                    )}
                  </div>

                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground line-clamp-1">{v.title}</p>
                        <p className="text-xs text-muted-foreground">{v.category}</p>
                      </div>
                    </div>
                    {v.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{v.description}</p>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {v.youtubeLink && (
                        <a href={v.youtubeLink} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon-sm" title="Open YouTube">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={v.isVisible ? "Hide from students" : "Show to students"}
                        onClick={() => toggleVisibility(v)}
                        id={`toggle-${v._id}`}
                      >
                        {v.isVisible ? (
                          <Eye className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Delete video"
                        onClick={() => deleteVideo(v._id)}
                        id={`delete-${v._id}`}
                        className="ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
