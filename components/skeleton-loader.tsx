"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  count?: number;
  width?: string;
  height?: string;
  circle?: boolean;
  aspect?: "square" | "video" | "portrait";
}

const aspectRatios = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
};

export const Skeleton = ({
  className,
  count = 1,
  width = "w-full",
  height = "h-12",
  circle = false,
  aspect,
}: SkeletonProps) => {
  const skeletons = Array.from({ length: count });

  const baseClass = cn(
    "bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse",
    circle && "rounded-full",
    !circle && "rounded-lg",
    aspect && aspectRatios[aspect],
    !aspect && [width, height],
    className,
  );

  return (
    <div className="space-y-2">
      {skeletons.map((_, index) => (
        <motion.div
          key={index}
          className={baseClass}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ))}
    </div>
  );
};

export const MovieCardSkeleton = () => (
  <div className="rounded-lg overflow-hidden">
    <Skeleton aspect="portrait" />
    <div className="p-3 space-y-2">
      <Skeleton height="h-4" className="w-3/4" />
      <Skeleton height="h-3" className="w-1/2" />
    </div>
  </div>
);

export const MovieGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <MovieCardSkeleton key={i} />
    ))}
  </div>
);

export const ListItemSkeleton = () => (
  <div className="flex gap-4 items-start p-4 border-b border-border last:border-0">
    <Skeleton width="w-16" height="h-16" aspect="square" />
    <div className="flex-1 space-y-2">
      <Skeleton height="h-4" className="w-3/4" />
      <Skeleton height="h-3" className="w-1/2" />
      <Skeleton height="h-3" className="w-2/3" />
    </div>
  </div>
);

export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-0">
    {Array.from({ length: count }).map((_, i) => (
      <ListItemSkeleton key={i} />
    ))}
  </div>
);
