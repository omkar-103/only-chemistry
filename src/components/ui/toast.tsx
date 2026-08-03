"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils/cn";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = {
  default: "bg-card border border-border shadow-lg",
  success: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 shadow-lg",
  error: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 shadow-lg",
  warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 shadow-lg",
  info: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 shadow-lg",
};

export type ToastVariant = keyof typeof toastVariants;

const ToastIcons: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />,
  error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />,
  info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />,
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & { variant?: ToastVariant }
>(({ className, variant = "default", children, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(
      "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl p-4 pr-8 transition-all",
      "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
      "data-[state=open]:animate-fade-in data-[state=closed]:opacity-0",
      toastVariants[variant],
      className
    )}
    {...props}
  >
    {ToastIcons[variant]}
    <div className="flex-1">{children}</div>
    <ToastPrimitives.Close className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent">
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  </ToastPrimitives.Root>
));
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
};
