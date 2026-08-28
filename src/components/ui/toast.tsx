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
  default: "bg-card border border-border shadow-lg text-foreground",
  success: "bg-green-50 border-green-300 dark:bg-green-900 dark:border-green-700 shadow-lg text-green-900 dark:text-green-50",
  error:   "bg-red-50   border-red-300   dark:bg-red-900   dark:border-red-700   shadow-lg text-red-900   dark:text-red-50",
  warning: "bg-amber-50 border-amber-300 dark:bg-amber-900 dark:border-amber-700 shadow-lg text-amber-900 dark:text-amber-50",
  info:    "bg-blue-50  border-blue-300  dark:bg-blue-900  dark:border-blue-700  shadow-lg text-blue-900  dark:text-blue-50",
};

export type ToastVariant = keyof typeof toastVariants;

/** Description text uses a slightly muted tone that still contrasts on the variant background */
const toastDescriptionColor: Record<ToastVariant, string> = {
  default: "text-muted-foreground",
  success: "text-green-800 dark:text-green-200",
  error:   "text-red-800   dark:text-red-200",
  warning: "text-amber-800 dark:text-amber-200",
  info:    "text-blue-800  dark:text-blue-200",
};

const ToastIcons: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle   className="h-5 w-5 text-green-600 dark:text-green-300 shrink-0" />,
  error:   <AlertCircle   className="h-5 w-5 text-red-600   dark:text-red-300   shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300 shrink-0" />,
  info:    <Info          className="h-5 w-5 text-blue-600  dark:text-blue-300  shrink-0" />,
};

// Context so children (ToastTitle, ToastDescription) can read the variant
const ToastVariantContext = React.createContext<ToastVariant>("default");

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & { variant?: ToastVariant }
>(({ className, variant = "default", children, ...props }, ref) => (
  <ToastVariantContext.Provider value={variant}>
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
      <ToastPrimitives.Close className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10">
        <X className="h-4 w-4" />
      </ToastPrimitives.Close>
    </ToastPrimitives.Root>
  </ToastVariantContext.Provider>
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
>(({ className, ...props }, ref) => {
  const variant = React.useContext(ToastVariantContext);
  return (
    <ToastPrimitives.Description
      ref={ref}
      className={cn("text-sm mt-1", toastDescriptionColor[variant], className)}
      {...props}
    />
  );
});
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
};
