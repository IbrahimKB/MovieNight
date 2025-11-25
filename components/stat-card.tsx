"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FC, SVGProps } from "react";

type IconType = FC<SVGProps<SVGSVGElement>>;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  trend?: string;
  color?: string;
  index?: number;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "text-primary",
  index = 0,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={cn(
        "relative group",
        "rounded-lg border border-border bg-card p-4 sm:p-6",
        "hover:border-primary/50 hover:shadow-lg transition-all duration-300",
        "touch-manipulation active:scale-95",
        className,
      )}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 space-y-3 sm:space-y-4">
        {/* Header with icon and title */}
        <div className="flex items-start justify-between">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
          <div className={cn("p-2 rounded-lg bg-muted/30", color)}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        {/* Value - Large and prominent */}
        <div>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.1, duration: 0.3 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
          >
            {value}
          </motion.div>
        </div>

        {/* Trend/description text */}
        {trend && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
            {trend}
          </p>
        )}
      </div>

      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 border-primary/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]" />
    </motion.div>
  );
}
