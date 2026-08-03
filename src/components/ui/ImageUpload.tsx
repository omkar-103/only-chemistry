"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import axios from "axios";

interface ImageUploadProps {
  value?: string;          // current image URL
  onChange: (url: string, publicId: string) => void;
  onRemove?: () => void;
  folder?: string;         // Cloudinary folder
  label?: string;
  className?: string;
  previewHeight?: string;  // tailwind h-* class
  accept?: string;
  disabled?: boolean;
}

type UploadStatus = "idle" | "uploading" | "done" | "error";

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  folder = "rhg-exam-portal/questions",
  label = "Upload Image",
  className,
  previewHeight = "h-40",
  accept = "image/png,image/jpeg,image/jpg,image/webp",
  disabled = false,
}: ImageUploadProps) {
  const inputRef           = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError]  = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const upload = useCallback(async (file: File) => {
    // Client-side validation
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large (max ${MAX_MB}MB)`);
      setStatus("error");
      return;
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only PNG, JPG, WEBP allowed");
      setStatus("error");
      return;
    }

    setError("");
    setStatus("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await axios.post("/api/upload", formData, {
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 90));
        },
      });
      setProgress(100);
      setStatus("done");
      onChange(res.data.data.url, res.data.data.publicId);
    } catch (err: any) {
      setError(err.response?.data?.message || "Upload failed");
      setStatus("error");
    }
  }, [folder, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const handleRemove = () => {
    setStatus("idle");
    setProgress(0);
    setError("");
    onRemove?.();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}

      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden",
          previewHeight,
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "opacity-50 pointer-events-none",
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !value && status !== "uploading" && inputRef.current?.click()}
      >
        {/* Preview */}
        {value && status !== "uploading" ? (
          <div className="relative w-full h-full group">
            <img src={value} alt="Uploaded" className="w-full h-full object-contain bg-muted/30" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="px-3 py-1.5 rounded-lg bg-white text-xs font-medium text-gray-800 hover:bg-gray-100"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-medium"
              >
                <X className="h-3 w-3 inline mr-1" />Remove
              </button>
            </div>
          </div>
        ) : status === "uploading" ? (
          /* Progress */
          <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <div className="w-full max-w-[160px]">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
          </div>
        ) : (
          /* Idle / Error */
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4 cursor-pointer select-none">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              status === "error" ? "bg-destructive/10" : "bg-primary/10"
            )}>
              {status === "error"
                ? <AlertCircle className="h-5 w-5 text-destructive" />
                : <Upload className="h-5 w-5 text-primary" />
              }
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-foreground">
                {isDragging ? "Drop to upload" : "Click or drag & drop"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, WEBP up to 5MB</p>
              {status === "error" && (
                <p className="text-[11px] text-destructive mt-1">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* Done checkmark */}
        <AnimatePresence>
          {status === "done" && value && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
            >
              <CheckCircle2 className="h-4 w-4 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  );
}
