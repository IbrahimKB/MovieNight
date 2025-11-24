"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Basic tooltip context
 */
const TooltipContext = React.createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

/**
 * Provider — wraps tooltip triggers + content
 */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  );
}

/**
 * Trigger — element that toggles tooltip
 */
export function TooltipTrigger({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error("TooltipTrigger must be inside <TooltipProvider>");

  return (
    <div
      className={cn("inline-block", className)}
      onMouseEnter={() => ctx.setOpen(true)}
      onMouseLeave={() => ctx.setOpen(false)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Content — the tooltip bubble
 */
export function TooltipContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error("TooltipContent must be inside <TooltipProvider>");

  if (!ctx.open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 px-3 py-2 rounded-md text-sm bg-black text-white shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
