"use client";

import { useState, useCallback } from "react";
import { ToastVariant } from "@/components/ui/toast";

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  open?: boolean;
}

let toastQueue: ToastItem[] = [];
let listeners: Array<(toasts: ToastItem[]) => void> = [];

function notify(listeners: Array<(t: ToastItem[]) => void>, toasts: ToastItem[]) {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(params: Omit<ToastItem, "id" | "open">) {
  const id = Math.random().toString(36).substring(2);
  const newToast: ToastItem = { ...params, id, open: true };
  toastQueue = [...toastQueue, newToast];
  notify(listeners, toastQueue);

  const duration = params.duration ?? 4000;
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    notify(listeners, toastQueue);
  }, duration);
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const subscribe = useCallback(() => {
    const listener = (t: ToastItem[]) => setToasts(t);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  // Subscribe on mount
  useState(() => {
    return subscribe();
  });

  return { toasts, toast };
}
