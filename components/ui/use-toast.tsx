"use client";

import { Toast } from "@/components/ui/sonner";
import * as ReactDOM from "react-dom/client";

/**
 * A minimal toast helper compatible with your existing imports:
 * 
 *   import { toast } from "@/components/ui/use-toast"
 * 
 * Usage:
 *   toast({ title: "Hello", description: "World" })
 */
export function useToast() {
  function trigger({
    title,
    description,
    variant = "default",
  }: {
    title?: string;
    description?: string;
    variant?: "default" | "success" | "error" | "warning";
  }) {
    // Create container
    const container = document.createElement("div");
    document.body.appendChild(container);

    // React root
    const root = ReactDOM.createRoot(container);

    const handleClose = () => {
      root.unmount();
      container.remove();
    };

    root.render(
      <Toast
        title={title}
        description={description}
        variant={variant}
        open={true}
        onOpenChange={handleClose}
      />
    );

    return { dismiss: handleClose };
  }

  return { toast: trigger };
}

export const toast = (
  ...args: Parameters<ReturnType<typeof useToast>["toast"]>
) => {
  return useToast().toast(...args);
};
