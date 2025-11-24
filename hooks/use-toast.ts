// Minimal unified toast hook using our custom components/ui/use-toast.tsx

import { toast as baseToast } from "@/components/ui/use-toast";

// The app expects useToast() to return { toast }
export function useToast() {
  return { toast: baseToast };
}

// Basic type placeholders to satisfy any imports
export type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
};

export type ToastActionElement = null;

// Re-export toast for direct imports
export const toast = baseToast;
