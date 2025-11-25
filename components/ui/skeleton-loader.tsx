"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MoviePosterSkeletonProps {
  className?: string;
  count?: number;
}

/**
 * MoviePoster Skeleton Loader
 * Mimics a movie poster (2:3 aspect ratio) with shimmer animation
 */
export function MoviePosterSkeleton({
  className,
}: Omit<MoviePosterSkeletonProps, "count">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted aspect-[2/3]",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </div>
  );
}

/**
 * Movie Card Skeleton Loader
 * Full card with poster, title, and rating skeleton
 */
export function MovieCardSkeleton({ className }: Omit<MoviePosterSkeletonProps, "count">) {
  return (
    <div
      className={cn(
        "space-y-3 p-3 rounded-lg border border-primary/10 bg-card",
        className
      )}
    >
      {/* Poster skeleton */}
      <MoviePosterSkeleton />

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
      </div>

      {/* Rating skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-3 bg-muted rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Movie Grid Skeleton Loader
 * Multiple skeleton cards in a grid layout
 */
export function MovieGridSkeleton({ count = 4 }: MoviePosterSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * List Item Skeleton Loader
 * For movie lists with title and metadata
 */
export function ListItemSkeleton({ className }: Omit<MoviePosterSkeletonProps, "count">) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-primary/10",
        className
      )}
    >
      {/* Poster thumbnail */}
      <div className="w-12 h-16 bg-muted rounded animate-pulse flex-shrink-0" />

      {/* Text content */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
      </div>

      {/* Action placeholder */}
      <div className="h-8 w-8 bg-muted rounded animate-pulse flex-shrink-0" />
    </div>
  );
}

/**
 * Feed Skeleton Loader
 * For activity feeds with multiple list items
 */
export function FeedSkeleton({ count = 3 }: MoviePosterSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Card Section Skeleton
 * For dashboard sections with header and content
 */
export function CardSectionSkeleton({ title = true }: { title?: boolean }) {
  return (
    <div className="space-y-4 rounded-lg border border-primary/10 bg-card p-6">
      {title && (
        <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
      )}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
