"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Clapperboard } from "lucide-react";

interface WatchedMovie {
  id: string;
  movieId: string;
  watchedAt: string;
  movie?: {
    id: string;
    title: string;
    year: number;
    poster?: string;
  };
}

export default function WatchHistoryPage() {
  const router = useRouter();
  const [watchHistory, setWatchHistory] = useState<WatchedMovie[]>([]);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("movienight_token")
      : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  useEffect(() => {
    const fetchWatchHistory = async () => {
      try {
        const res = await fetch("/api/watch/history", { headers });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          // Sort by date descending (most recent first)
          const sorted = data.data.sort(
            (a: WatchedMovie, b: WatchedMovie) =>
              new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime(),
          );
          setWatchHistory(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch watch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchHistory();
  }, [token]);

  // Group by date
  const groupedByDate = watchHistory.reduce(
    (acc, movie) => {
      const date = new Date(movie.watchedAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(movie);
      return acc;
    },
    {} as Record<string, WatchedMovie[]>,
  );

  const MovieItem = ({ movie }: { movie: WatchedMovie }) => (
    <button
      onClick={() => router.push(`/movies/${movie.movieId}`)}
      className="flex gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all text-left group"
    >
      {/* Poster */}
      <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden">
        {movie.movie?.poster ? (
          <img
            src={movie.movie.poster}
            alt={movie.movie.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-background flex items-center justify-center">
            <Clapperboard className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="font-semibold group-hover:text-primary transition-colors">
          {movie.movie?.title}
        </p>
        <p className="text-sm text-muted-foreground">{movie.movie?.year}</p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock size={12} />
          {new Date(movie.watchedAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Arrow */}
      <div className="flex items-center">
        <svg
          className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading watch history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Watch History</h1>
        <p className="text-muted-foreground">
          {watchHistory.length} movie{watchHistory.length !== 1 ? "s" : ""}{" "}
          watched
        </p>
      </div>

      {/* Timeline */}
      {watchHistory.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([date, movies]) => (
            <div key={date}>
              <h2 className="text-lg font-bold mb-4 sticky top-20 bg-background/50 backdrop-blur py-2">
                {date}
              </h2>
              <div className="space-y-2">
                {movies.map((movie) => (
                  <MovieItem key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            You haven't watched any movies yet
          </p>
          <button
            onClick={() => router.push("/movies")}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Browse Movies
          </button>
        </div>
      )}
    </div>
  );
}
