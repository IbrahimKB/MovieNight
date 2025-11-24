"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Trash2 } from "lucide-react";

interface WatchlistItem {
  id: string;
  movieId: string;
  movie?: {
    id: string;
    title: string;
    year: number;
    poster?: string;
    genres?: string[];
  };
}

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("movienight_token")
      : null;

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        const res = await fetch("/api/watch/desire", { headers });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setWatchlist(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch watchlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [token]);

  const handleRemoveFromWatchlist = async (watchlistItemId: string) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await fetch(`/api/watch/desire?id=${watchlistItemId}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setWatchlist(watchlist.filter((item) => item.id !== watchlistItemId));
      }
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
    }
  };

  const MovieCard = ({ item }: { item: WatchlistItem }) => {
    const movie = item.movie;

    return (
      <div className="group">
        <div
          onClick={() => router.push(`/movies/${item.movieId}`)}
          className="relative bg-card border border-border rounded-lg overflow-hidden aspect-[3/4] flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all"
        >
          {movie?.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="text-center p-4">
              <Clapperboard className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{movie?.title}</p>
            </div>
          )}
        </div>
        <div className="mt-3 px-1">
          <p className="font-semibold text-sm truncate">{movie?.title}</p>
          <p className="text-xs text-muted-foreground">{movie?.year}</p>
          <button
            onClick={() => handleRemoveFromWatchlist(item.id)}
            className="mt-2 flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading your watchlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">My Watchlist</h1>
        <p className="text-muted-foreground">
          {watchlist.length} movie{watchlist.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {/* Watchlist Grid */}
      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {watchlist.map((item) => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Clapperboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Your watchlist is empty</p>
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
