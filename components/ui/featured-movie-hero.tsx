"use client";

import { motion } from "framer-motion";
import { Bookmark, Plus, Play, Star, Users } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FeaturedMovieHeroProps {
  movie: {
    id: string;
    title: string;
    year: number;
    genres?: string[];
    description?: string;
    poster?: string;
    backdrop?: string;
    imdbRating?: number;
  };
  friendsWatched?: number;
  userRating?: number;
  isInWatchlist?: boolean;
  onWatch?: () => void;
  onAddToWatchlist?: () => void;
  onSuggest?: () => void;
  isLoading?: boolean;
  className?: string;
}

export default function FeaturedMovieHero({
  movie,
  friendsWatched = 0,
  userRating,
  isInWatchlist = false,
  onWatch,
  onAddToWatchlist,
  onSuggest,
  isLoading = false,
  className,
}: FeaturedMovieHeroProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Use backdrop or poster as fallback
  const backdropImage = movie.backdrop || movie.poster;

  // Generate gradient if no image
  const generateGradient = () => {
    const colors = [
      "from-blue-600 to-blue-900",
      "from-purple-600 to-purple-900",
      "from-pink-600 to-pink-900",
      "from-green-600 to-green-900",
      "from-red-600 to-red-900",
    ];
    const hash = movie.id.charCodeAt(0) % colors.length;
    return colors[hash];
  };

  return (
    <motion.div
      className={cn(
        "relative w-full overflow-hidden rounded-xl",
        "aspect-[16/9] md:aspect-[21/9]",
        "group",
        className
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Backdrop Image or Gradient */}
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-500",
          isHovered && "scale-105"
        )}
      >
        {backdropImage ? (
          <img
            src={backdropImage}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              "w-full h-full bg-gradient-to-br",
              generateGradient()
            )}
          />
        )}
      </div>

      {/* Dark Overlay Gradient (bottom to top) */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent",
          "group-hover:from-black/80 group-hover:via-black/40",
          "transition-colors duration-300"
        )}
      />

      {/* Glow Border on Hover */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: "inset 0 0 30px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.2)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:p-8">
        {/* Content */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Title and Metadata */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white">
              {movie.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base">
              <span className="text-gray-300">{movie.year}</span>

              {movie.imdbRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-200">{movie.imdbRating.toFixed(1)}</span>
                </div>
              )}

              {friendsWatched > 0 && (
                <div className="flex items-center gap-1 text-blue-300">
                  <Users className="h-4 w-4" />
                  <span>{friendsWatched} watched</span>
                </div>
              )}

              {userRating && (
                <Badge className="bg-green-600/80 hover:bg-green-600">
                  Your: {userRating}★
                </Badge>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {movie.genres.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {movie.description && (
            <motion.p
              className="text-sm sm:text-base text-gray-300 line-clamp-2 sm:line-clamp-3 max-w-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {movie.description}
            </motion.p>
          )}

          {/* Action Buttons */}
          <motion.div
            className="flex flex-wrap gap-2 sm:gap-3 pt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {onWatch && (
              <Button
                onClick={onWatch}
                disabled={isLoading}
                className={cn(
                  "bg-primary hover:bg-primary/90 text-white",
                  "gap-2 min-h-10 sm:min-h-11",
                  "hover:shadow-lg hover:shadow-primary/50"
                )}
              >
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Watch Now</span>
                <span className="sm:hidden">Watch</span>
              </Button>
            )}

            {onAddToWatchlist && (
              <Button
                onClick={onAddToWatchlist}
                disabled={isLoading}
                variant={isInWatchlist ? "default" : "outline"}
                className={cn(
                  "gap-2 min-h-10 sm:min-h-11",
                  isInWatchlist
                    ? "bg-primary/30 border-primary/50"
                    : "border-white/30 hover:border-primary/50 hover:bg-white/10"
                )}
              >
                <Bookmark
                  className="h-4 w-4"
                  fill={isInWatchlist ? "currentColor" : "none"}
                />
                <span className="hidden sm:inline">
                  {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                </span>
                <span className="sm:hidden">{isInWatchlist ? "Added" : "Add"}</span>
              </Button>
            )}

            {onSuggest && (
              <Button
                onClick={onSuggest}
                disabled={isLoading}
                variant="outline"
                className={cn(
                  "gap-2 min-h-10 sm:min-h-11",
                  "border-white/30 hover:border-primary/50 hover:bg-white/10"
                )}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Suggest</span>
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
