"use client";

import { useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { shouldReduceMotion, durations } from "@/lib/animations";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  color?: string; // e.g. "text-blue-500"
  index?: number;
  description?: ReactNode;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "text-primary",
  index = 0,
  description,
}: StatCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion()
          ? { duration: 0 }
          : { duration: 0.35, delay: index * 0.06 }
      }
      onClick={() => setIsFlipped(!isFlipped)}
      className={cn(
        "relative overflow-hidden p-4 rounded-xl border border-primary/10",
        "bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md",
        "transition-all cursor-pointer touch-manipulation active:scale-[0.98]",
        "flex flex-col justify-between min-h-36 sm:min-h-32",
        "perspective",
      )}
      style={{ perspective: "1000px" }}
    >
      {/* Flip Container */}
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 100,
          damping: 15,
        }}
        style={
          {
            transformStyle: "preserve-3d",
          } as any
        }
        className="w-full h-full flex flex-col justify-between"
      >
        {/* Front Side */}
        <div
          style={
            {
              backfaceVisibility: "hidden",
            } as any
          }
          className="w-full h-full flex flex-col justify-between"
        >
          {/* Decorative Gradient Overlay */}
          <div
            className={cn(
              "absolute inset-0 opacity-10 pointer-events-none",
              "bg-gradient-to-br from-primary/30 to-transparent",
            )}
          />

          {/* Header Row */}
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-xs font-medium text-muted-foreground">
              {title}
            </h3>

            {/* Icon Ring */}
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                "bg-primary/10 border border-primary/20",
                color,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>

          {/* Value */}
          <motion.p
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="text-3xl font-bold tracking-tight relative z-10"
          >
            {value}
          </motion.p>

          {/* Trend Footer */}
          {trend && (
            <p className="text-xs text-muted-foreground truncate relative z-10">
              {trend}
            </p>
          )}

          {/* Click to flip hint */}
          {description && (
            <p className="text-xs text-muted-foreground/60 text-right pt-1 relative z-10">
              Click to flip
            </p>
          )}
        </div>

        {/* Back Side */}
        {description && (
          <div
            style={
              {
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              } as any
            }
            className="w-full h-full flex flex-col justify-between absolute inset-0 p-4"
          >
            {/* Decorative Gradient Overlay */}
            <div
              className={cn(
                "absolute inset-0 opacity-10 pointer-events-none",
                "bg-gradient-to-br from-primary/30 to-transparent",
              )}
            />

            <div className="relative z-10 space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                About {title}
              </h3>
              <div className="text-sm leading-relaxed text-foreground line-clamp-3">
                {description}
              </div>
            </div>

            {/* Click to flip hint */}
            <p className="text-xs text-muted-foreground/60 text-center relative z-10">
              Click to flip back
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default StatCard;
