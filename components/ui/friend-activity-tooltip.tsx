"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, Users } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FriendActivity {
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  rating?: number;
  watchedAt?: string;
}

interface FriendActivityTooltipProps {
  friends: FriendActivity[];
  isVisible: boolean;
  totalCount?: number;
  className?: string;
}

export default function FriendActivityTooltip({
  friends,
  isVisible,
  totalCount,
  className,
}: FriendActivityTooltipProps) {
  if (!friends || friends.length === 0) {
    return null;
  }

  const displayCount = totalCount || friends.length;
  const displayedFriends = friends.slice(0, 5);
  const remainingCount = Math.max(0, displayCount - displayedFriends.length);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
            "z-50 pointer-events-none",
            className
          )}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Tooltip Card */}
          <div
            className={cn(
              "bg-card/95 backdrop-blur-md border border-primary/30",
              "rounded-lg shadow-lg shadow-primary/20",
              "p-3 sm:p-4 min-w-[200px] sm:min-w-[280px] max-w-[320px]",
              "animate-glow-pulse"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-primary/20">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Friends Watched
                {displayCount > 1 && ` (${displayCount})`}
              </span>
            </div>

            {/* Friends List */}
            <div className="space-y-2">
              {displayedFriends.map((friend, index) => (
                <motion.div
                  key={friend.userId}
                  className="flex items-start gap-2 py-1.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="h-6 w-6 rounded-full object-cover border border-primary/30"
                      />
                    ) : (
                      <div
                        className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center",
                          "bg-primary/20 border border-primary/30",
                          "text-xs font-semibold text-primary"
                        )}
                      >
                        {(friend.name || friend.username)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {friend.name || friend.username}
                    </p>

                    <div className="flex items-center gap-1.5">
                      {/* Rating */}
                      {friend.rating && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3",
                                i < Math.round(friend.rating!)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-600"
                              )}
                            />
                          ))}
                        </div>
                      )}

                      {/* Date */}
                      {friend.watchedAt && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(friend.watchedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Show more indicator */}
            {remainingCount > 0 && (
              <motion.div
                className="pt-2 mt-2 border-t border-primary/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs text-muted-foreground">
                  +{remainingCount} more friend{remainingCount > 1 ? "s" : ""}
                </p>
              </motion.div>
            )}
          </div>

          {/* Arrow pointer */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-2 h-2 bg-card/95 border-r border-b border-primary/30 rotate-45 translate-y-[-1px]" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
