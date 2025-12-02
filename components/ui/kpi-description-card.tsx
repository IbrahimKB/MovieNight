"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KPIDescriptionProps {
  title: string;
  description: string;
  details?: ReactNode;
  className?: string;
}

export default function KPIDescription({
  title,
  description,
  details,
  className,
}: KPIDescriptionProps) {
  return (
    <div
      className={cn(
        "h-full w-full flex flex-col justify-between p-4",
        className,
      )}
    >
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-foreground">{description}</p>
      </div>

      {details && (
        <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1">
          {details}
        </div>
      )}
    </div>
  );
}
