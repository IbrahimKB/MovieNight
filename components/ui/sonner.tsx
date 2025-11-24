"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// -------------------------------------------------------
// INTERNAL SONNER TOAST COMPONENT (REACT ONLY)
// -------------------------------------------------------

const toastVariants = cva(
  "fixed flex items-center gap-3 px-4 py-3 rounded-md shadow-md z-50 transition-all",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-white",
        success: "bg-green-600 text-white",
        error: "bg-red-600 text-white",
        warning: "bg-yellow-500 text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ title, description, variant, open = true, onOpenChange, className, ...props }, ref) => {
    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
        onClick={() => onOpenChange?.(false)}
      >
        <div className="flex flex-col">
          {title && <p className="font-bold">{title}</p>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>
      </div>
    );
  }
);

Toast.displayName = "Toast";

// -------------------------------------------------------
// PROVIDER + VIEWPORT
// -------------------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ToastViewport() {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none" />
  );
}

export const ToastTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="font-semibold">{children}</p>
);

export const ToastDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm opacity-80">{children}</p>
);

export const ToastClose = () => null;
