"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
}

export const PullToRefresh = ({
  onRefresh,
  children,
  threshold = 80,
}: PullToRefreshProps) => {
  const { pullDistance, isRefreshing, scrollElementRef } = usePullToRefresh({
    threshold,
    onRefresh,
  });

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={scrollElementRef}
      className="relative overflow-y-auto overflow-x-hidden"
    >
      {/* Pull Indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none"
        style={{
          height: Math.max(pullDistance, 0),
        }}
      >
        <motion.div
          animate={{
            rotate: isRefreshing ? 360 : progress * 180,
          }}
          transition={{
            rotate: { duration: 0.5, repeat: isRefreshing ? Infinity : 0 },
          }}
          className="mt-2"
        >
          <RefreshCw
            size={24}
            className={
              progress > 0.5 || isRefreshing ? "text-primary" : "text-muted"
            }
          />
        </motion.div>
      </motion.div>

      {/* Content with padding to account for pull */}
      <motion.div
        style={{
          paddingTop: Math.max(pullDistance, 0),
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
