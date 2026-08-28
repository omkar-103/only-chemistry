"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, CheckCircle2, AlertCircle, FileCode, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { ChemicalContent } from "@/types";
import { cn } from "@/lib/utils/cn";

interface ChemDrawUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: ChemicalContent) => void;
  initialValue?: ChemicalContent;
  title?: string;
}

export function ChemDrawUploader({
  isOpen,
  onClose,
  onInsert,
  initialValue,
  title = "Add ChemDraw Content",
}: ChemDrawUploaderProps) {
  const [cdxmlFile, setCdxmlFile] = useState<File | null>(null);
  const [displayFile, setDisplayFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialValue?.renderedUrl || null);
  const [previewFormat, setPreviewFormat] = useState<"svg" | "png">(initialValue?.renderedFormat || "svg");
  const [altText, setAltText] = useState<string>(initialValue?.altText || "");
  const [uploading, setUploading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const cdxmlInputRef = useRef<HTMLInputElement>(null);
  const displayInputRef = useRef<HTMLInputElement>(null);

  const handleCdxmlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".cdxml")) {
      toast({
        title: "Invalid file extension",
        description: "Source file should have a .cdxml extension.",
        variant: "error",
      });
      return;
    }
    setCdxmlFile(file);
    setErrorDetails(null);
  };

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    const isSvg = name.endsWith(".svg") || file.type === "image/svg+xml";
    const isPng = name.endsWith(".png") || file.type === "image/png";

    if (!isSvg && !isPng) {
      toast({
        title: "Unsupported display format",
        description: "Please upload an SVG (preferred) or PNG exported from ChemDraw.",
        variant: "error",
      });
      return;
    }

    setDisplayFile(file);
    setPreviewFormat(isSvg ? "svg" : "png");
    setErrorDetails(null);

    // Create local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  };

  const handleSubmit = async () => {
    if (!displayFile && !initialValue) {
      toast({
        title: "Display file required",
        description: "Please upload an SVG or PNG exported from ChemDraw.",
        variant: "error",
      });
      return;
    }

    // If we're keeping initialValue without changing files
    if (!displayFile && initialValue) {
      onInsert({
        ...initialValue,
        altText: altText || initialValue.altText || "Chemical Structure",
      });
      onClose();
      return;
    }

    setUploading(true);
    setErrorDetails(null);

    try {
      const formData = new FormData();
      if (cdxmlFile) {
        formData.append("cdxmlFile", cdxmlFile);
      }
      if (displayFile) {
        formData.append("displayFile", displayFile);
      }
      formData.append("folder", "rhg-exam-portal/chemical");

      const res = await axios.post("/api/upload-chemical", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data?.data) {
        const uploadedData: ChemicalContent = {
          ...res.data.data,
          altText: altText.trim() || (cdxmlFile?.name ? cdxmlFile.name.replace(/\.cdxml$/i, "") : "Chemical Structure"),
        };

        toast({
          title: "ChemDraw content uploaded",
          description: `Structure saved (${uploadedData.renderedFormat.toUpperCase()}) with canonical CDXML.`,
          variant: "success",
        });

        onInsert(uploadedData);
        onClose();
      } else {
        throw new Error(res.data?.message || "Upload failed");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Failed to upload ChemDraw content.";
      const action = err.response?.data?.action;
      setErrorDetails(action ? `${errMsg} - ${action}` : errMsg);
      toast({
        title: "Upload Failed",
        description: errMsg,
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileCode className="h-5 w-5 text-primary" />
                {title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload ChemDraw CDXML source &amp; exported SVG/PNG display asset
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Guide box */}
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground space-y-1.5">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Recommended ChemDraw Workflow
              </div>
              <ol className="list-decimal list-inside text-muted-foreground space-y-0.5 pl-1">
                <li>Create your chemical structure/reaction in ChemDraw Desktop</li>
                <li><strong className="text-foreground">File &rarr; Save As</strong> &rarr; <span className="font-mono text-[11px] text-primary">.cdxml</span> (preserves original source)</li>
                <li><strong className="text-foreground">File &rarr; Save As</strong> &rarr; <span className="font-mono text-[11px] text-primary">.svg</span> (preferred) or <span className="font-mono text-[11px] text-primary">.png</span> (display asset)</li>
              </ol>
            </div>

            {/* Upload fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* CDXML File Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  1. ChemDraw Source (.cdxml) <span className="text-primary font-normal">(Recommended)</span>
                </label>
                <div
                  onClick={() => cdxmlInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-muted/40 flex flex-col items-center justify-center min-h-[110px]",
                    cdxmlFile || initialValue?.sourceData
                      ? "border-emerald-500/60 bg-emerald-500/5"
                      : "border-border"
                  )}
                >
                  <input
                    ref={cdxmlInputRef}
                    type="file"
                    accept=".cdxml,application/xml,text/xml"
                    className="hidden"
                    onChange={handleCdxmlChange}
                  />
                  {cdxmlFile ? (
                    <div className="space-y-1">
                      <FileCode className="h-6 w-6 text-emerald-500 mx-auto" />
                      <p className="text-xs font-medium text-foreground truncate max-w-[180px]">{cdxmlFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(cdxmlFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : initialValue?.sourceData ? (
                    <div className="space-y-1">
                      <FileCode className="h-6 w-6 text-emerald-500 mx-auto" />
                      <p className="text-xs font-medium text-foreground">Preserved CDXML Source</p>
                      <p className="text-[10px] text-muted-foreground">Click to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-muted-foreground">
                      <Upload className="h-6 w-6 mx-auto opacity-70" />
                      <p className="text-xs font-medium">Choose .cdxml file</p>
                      <p className="text-[10px] opacity-70">Canonical Chemistry XML</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Display File Upload (SVG / PNG) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  2. Display Asset (.svg / .png) <span className="text-destructive">*</span>
                </label>
                <div
                  onClick={() => displayInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-muted/40 flex flex-col items-center justify-center min-h-[110px]",
                    displayFile || previewUrl
                      ? "border-primary/60 bg-primary/5"
                      : "border-border"
                  )}
                >
                  <input
                    ref={displayInputRef}
                    type="file"
                    accept=".svg,image/svg+xml,.png,image/png"
                    className="hidden"
                    onChange={handleDisplayChange}
                  />
                  {displayFile ? (
                    <div className="space-y-1">
                      <ImageIcon className="h-6 w-6 text-primary mx-auto" />
                      <p className="text-xs font-medium text-foreground truncate max-w-[180px]">{displayFile.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {previewFormat} · {(displayFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : previewUrl ? (
                    <div className="space-y-1">
                      <ImageIcon className="h-6 w-6 text-primary mx-auto" />
                      <p className="text-xs font-medium text-foreground">Current Display Image</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {previewFormat} · Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-muted-foreground">
                      <Upload className="h-6 w-6 mx-auto opacity-70" />
                      <p className="text-xs font-medium">Choose .svg or .png</p>
                      <p className="text-[10px] opacity-70">SVG preferred for crispness</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description / Alt text */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Description / Formula Label <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Reaction mechanism of nucleophilic addition, Benzene ring..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Live preview with MANDATORY white background */}
            {previewUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Display Preview (Solid White Background)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-mono uppercase">
                    {previewFormat}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-center">
                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs max-h-56 max-w-full flex items-center justify-center overflow-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="ChemDraw Preview"
                      className="max-h-48 max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorDetails && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorDetails}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <Button variant="outline" size="sm" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="gold"
                size="sm"
                onClick={handleSubmit}
                isLoading={uploading}
                loadingText="Processing..."
                disabled={!displayFile && !initialValue}
              >
                {initialValue ? "Update Structure" : "Insert Chemical Structure"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ChemDrawUploader;
