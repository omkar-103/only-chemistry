"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, ExternalLink, Video, HardDrive, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EXAM_CATEGORIES } from "@/constants";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { DemoOverlay } from "@/components/ui/DemoOverlay";

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [preview, setPreview] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ ...(category && { category }) });
    axios.get(`/api/videos?${params}`)
      .then(r => setVideos(r.data.data || []))
      .catch(console.error).finally(() => setLoading(false));
  }, [category]);

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/);
    return match?.[1] || "";
  };

  return (
    <div className="relative space-y-5 min-h-[60vh]">
      {/* ── Demo overlay – covers the page; do NOT remove or modify existing code below ── */}
      <DemoOverlay
        title="Video Library Unavailable"
        description={
          <>
            <p>
              Video streaming has been disabled because a video storage service
              has not been configured.
            </p>
            <p className="mt-2">
              Connect a supported video storage provider (Cloudinary, Supabase
              Storage, AWS S3, etc.) to enable learning videos.
            </p>
          </>
        }
      />
      {/* ── Existing UI (untouched) ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-display font-black text-foreground">Learning Videos</h1>
        <p className="text-muted-foreground text-sm">Expert chemistry lectures and study materials</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button onClick={() => setCategory("")} className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors", !category ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary")}>All</button>
        {EXAM_CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)} className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap", category === cat.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary")}>{cat.icon} {cat.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-52 rounded-xl skeleton"/>)}</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16"><PlayCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No videos available yet</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v, i) => {
            const ytId = v.youtubeLink ? getYouTubeId(v.youtubeLink) : "";
            return (
              <motion.div key={v._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => setPreview(v)}>
                  <div className="relative h-40 bg-gradient-to-br from-navy-800 to-navy-600 overflow-hidden">
                    {ytId ? (
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full"><PlayCircle className="h-12 w-12 text-white/30" /></div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <PlayCircle className="h-14 w-14 text-white" />
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">{v.category}</span>
                    </div>
                    {v.duration && <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs">{v.duration}</div>}
                  </div>
                  <CardContent className="pt-3 pb-4">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{v.title}</h3>
                    {v.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>}
                    <div className="flex gap-2 mt-2">
                      {v.youtubeLink && <span className="flex items-center gap-1 text-[10px] text-red-500"><Video className="h-3 w-3" />YouTube</span>}
                      {v.googleDriveLink && <span className="flex items-center gap-1 text-[10px] text-blue-500"><HardDrive className="h-3 w-3" />Drive</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Video Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card rounded-2xl border border-border max-w-2xl w-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground">{preview.title}</h3>
                  <p className="text-xs text-muted-foreground">{preview.category}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setPreview(null)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-4 space-y-4">
                {preview.youtubeLink && (() => {
                  const ytId = getYouTubeId(preview.youtubeLink);
                  return ytId ? (
                    <div className="aspect-video rounded-xl overflow-hidden">
                      <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
                    </div>
                  ) : null;
                })()}
                {preview.description && <p className="text-sm text-muted-foreground">{preview.description}</p>}
                <div className="flex gap-2">
                  {preview.youtubeLink && <a href={preview.youtubeLink} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-1.5"><Video className="h-4 w-4 text-red-500" />Open on YouTube</Button></a>}
                  {preview.googleDriveLink && <a href={preview.googleDriveLink} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-1.5"><HardDrive className="h-4 w-4 text-blue-500" />Open on Drive</Button></a>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
