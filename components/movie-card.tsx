"use client";

import { motion } from "framer-motion";
import { Clapperboard, Bookmark, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    year: number;
    poster?: string;
    imdbRating?: number;
  };
  onAddToWatchlist?: (movieId: string) => Promise<void>;
  onSuggest?: (movieId: string) => void;
  inWatchlist?: boolean;
  showQuickActions?: boolean;
  className?: string;
}

export const MovieCard = ({
  movie,
  onAddToWatchlist,
  onSuggest,
  inWatchlist = false,
  showQuickActions = true,
  className,
}: MovieCardProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddToWatchlist) return;

    setIsLoading(true);
    try {
      await onAddToWatchlist(movie.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggest = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSuggest?.(movie.id);
  };

  // Generate gradient for movies without posters
  const generateGradient = (id: string) => {
    const colors = [
      "from-blue-600 to-blue-900",
      "from-purple-600 to-purple-900",
      "from-pink-600 to-pink-900",
      "from-green-600 to-green-900",
      "from-red-600 to-red-900",
      "from-yellow-600 to-yellow-900",
    ];
    const hash = id.charCodeAt(0) % colors.length;
    return colors[hash];
  };

  return (
    <motion.button
      onClick={() => router.push(`/movies/${movie.id}`)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "group cursor-pointer text-left rounded-lg overflow-hidden",
        "transition-all duration-300 hover:shadow-xl hover:shadow-primary/30",
        className
      )}
    >
      <div className="relative bg-card border border-border rounded-lg overflow-hidden aspect-[3/4] flex items-center justify-center">
        {/* Image or Gradient Placeholder */}
        {movie.poster ? (
          <>
            <img
              src={movie.poster}
              alt={movie.title}
              className={cn(
                "w-full h-full object-cover",
                "transition-transform duration-300 ease-out",
                isHovered && "scale-110"
              )}
              loading="lazy"
            />
          </>
        ) : (
          <div
            className={cn(
              "w-full h-full bg-gradient-to-br",
              generateGradient(movie.id),
              "flex flex-col items-center justify-center p-4"
            )}
          >
            <Clapperboard className="h-12 w-12 text-white/80 mb-2" />
            <p className="text-xs text-white/70 text-center">{movie.title}</p>
          </div>
        )}

        {/* Rating Badge */}
        {movie.imdbRating && (
          <motion.div
            className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-bold text-yellow-400 flex items-center gap-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            ⭐ {movie.imdbRating.toFixed(1)}
          </motion.div>
        )}

        {/* Quick Actions Overlay */}
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute inset-0 bg-black/60 backdrop-blur-sm",
              "flex flex-col items-center justify-center gap-3",
              "pointer-events-none group-hover:pointer-events-auto"
            )}
          >
            {onAddToWatchlist && (
              <motion.button
                onClick={handleAddToWatchlist}
                disabled={isLoading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "p-3 rounded-full transition-all",
                  inWatchlist
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/20 hover:bg-primary text-white",
                  "disabled:opacity-50 pointer-events-auto"
                )}
              >
                <Bookmark
                  size={20}
                  fill={inWatchlist ? "currentColor" : "none"}
                />
              </motion.button>
            )}

            {onSuggest && (
              <motion.button
                onClick={handleSuggest}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-full bg-white/20 hover:bg-primary text-white transition-all pointer-events-auto"
              >
                <Plus size={20} />
              </motion.button>
            )}
          </motion.div>
        )}
      </div>

      {/* Info Section */}
      <motion.div
        className="mt-3 px-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
          {movie.title}
        </p>
        <p className="text-xs text-muted-foreground">{movie.year}</p>
      </motion.div>
    </motion.button>
  );
};
