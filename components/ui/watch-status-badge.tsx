"use client";

import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchStatusBadgeProps {
  isWatched: boolean;
  rating?: number;
  watchedDate?: string;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function WatchStatusBadge({
  isWatched,
  rating,
  watchedDate,
  className,
  showLabel = false,
  size = "md",
}: WatchStatusBadgeProps) {
  if (!isWatched) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const starSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg",
        "bg-green-600/20 border border-green-600/40",
        "backdrop-blur-sm",
        sizeClasses[size],
        className,
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      whileHover={{
        backgroundColor: "rgba(22, 163, 74, 0.3)",
        borderColor: "rgba(22, 163, 74, 0.6)",
      }}
    >
      {/* Checkmark Icon */}
      <motion.div
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150, delay: 0.1 }}
      >
        <Check className={cn("text-green-400", iconSizes[size])} />
      </motion.div>

      {/* Rating Stars */}
      {rating && (
        <>
          <div className="w-px h-4 bg-green-600/20" />
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  delay: 0.2 + i * 0.05,
                }}
              >
                {i < Math.round(rating) ? (
                  <Star
                    className={cn(
                      "fill-yellow-400 text-yellow-400",
                      starSizes[size],
                    )}
                  />
                ) : (
                  <Star className={cn("text-gray-600", starSizes[size])} />
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Label */}
      {showLabel && <span className="text-green-300 font-medium">Watched</span>}

      {/* Watched Date */}
      {watchedDate && (
        <span className="text-xs text-green-300/70">
          (
          {new Date(watchedDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
          )
        </span>
      )}
    </motion.div>
  );
}
