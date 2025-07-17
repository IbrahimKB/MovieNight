import { useState, useEffect, useCallback } from "react";
import { Search, Film, Tv, Star, Calendar, Clock, Plus } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Skeleton } from "./skeleton";
import { Alert, AlertDescription } from "./alert";
import { PlatformLogo } from "./platform-logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MovieSearchResult {
  id: string;
  title: string;
  year: number;
  description: string;
  poster: string | null;
  mediaType: "movie" | "tv";
  rating: number;
  genres: string[];
  tmdbId: number;
}

interface SearchResponse {
  results: MovieSearchResult[];
  rateLimit: {
    remaining: number;
    resetTime: Date | null;
    isLimited: boolean;
  };
}

interface MovieSearchProps {
  onSelectMovie?: (movie: MovieSearchResult) => void;
  placeholder?: string;
  showSaveButton?: boolean;
  className?: string;
}

export default function MovieSearch({
  onSelectMovie,
  placeholder = "Search for movies and TV shows...",
  showSaveButton = false,
  className,
}: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<
    SearchResponse["rateLimit"] | null
  >(null);
  const { token } = useAuth();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/tmdb/search?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data: {
          success: boolean;
          data?: SearchResponse;
          error?: string;
        } = await response.json();

        if (data.success && data.data) {
          setResults(data.data.results);
          setRateLimitInfo(data.data.rateLimit);
        } else {
          setError(data.error || "Failed to search movies");
          setResults([]);
        }
      } catch (err) {
        setError("Network error. Please check your connection.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [token],
  );

  // Effect to trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Save movie to database
  const saveMovie = async (movie: MovieSearchResult) => {
    try {
      const response = await fetch("/api/tmdb/save-movie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.year,
          description: movie.description,
          poster: movie.poster,
          mediaType: movie.mediaType,
          rating: movie.rating,
          genres: movie.genres,
        }),
      });

      const data: { success: boolean; error?: string; message?: string } =
        await response.json();

      if (data.success) {
        toast.success(data.message || "Movie saved successfully");
      } else {
        toast.error(data.error || "Failed to save movie");
      }
    } catch (err) {
      toast.error("Failed to save movie");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Rate Limit Info */}
      {rateLimitInfo && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {rateLimitInfo.isLimited
              ? `Rate limited. Try again after ${rateLimitInfo.resetTime?.toLocaleTimeString()}`
              : `${rateLimitInfo.remaining} searches remaining`}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-24 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search Results */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((movie) => (
            <Card
              key={movie.id}
              className="hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => onSelectMovie?.(movie)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Poster */}
                  <div className="w-16 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {movie.mediaType === "movie" ? (
                          <Film className="h-6 w-6" />
                        ) : (
                          <Tv className="h-6 w-6" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight truncate">
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {movie.mediaType === "movie" ? (
                              <Film className="h-3 w-3" />
                            ) : (
                              <Tv className="h-3 w-3" />
                            )}
                            <span className="capitalize">
                              {movie.mediaType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{movie.year}</span>
                          </div>
                          {movie.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current text-yellow-500" />
                              <span>{movie.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      {showSaveButton && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveMovie(movie);
                          }}
                          className="h-8 px-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {movie.description}
                    </p>

                    {/* Platform & Genres */}
                    <div className="space-y-2 mt-2">
                      {/* Platform indicator */}
                      <div className="flex items-center gap-2">
                        <PlatformLogo
                          platform={
                            movie.mediaType === "tv" ? "TV" : "Theaters"
                          }
                          size="sm"
                        />
                        {movie.year && (
                          <Badge
                            variant="outline"
                            className="text-xs py-0 px-1.5"
                          >
                            {movie.year}
                          </Badge>
                        )}
                      </div>

                      {/* Genres */}
                      {movie.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {movie.genres.slice(0, 3).map((genre) => (
                            <Badge
                              key={genre}
                              variant="outline"
                              className="text-xs py-0 px-1.5"
                            >
                              {genre}
                            </Badge>
                          ))}
                          {movie.genres.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-xs py-0 px-1.5"
                            >
                              +{movie.genres.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && query.length >= 2 && results.length === 0 && !error && (
        <div className="text-center py-8 text-muted-foreground">
          <Film className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No movies or TV shows found for "{query}"</p>
          <p className="text-xs mt-1">
            Try adjusting your search terms or check the spelling
          </p>
        </div>
      )}
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
