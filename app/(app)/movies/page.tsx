"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface Movie {
  id: string;
  title: string;
  year: number;
  genres: string[];
  poster?: string;
  description: string;
  imdbRating?: number;
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingToWatchlist, setAddingToWatchlist] = useState<string | null>(null);

  const fetchMovies = async (query = "") => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("movienight_token");
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      params.append("limit", "50");

      const res = await fetch(`/api/movies?${params}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch movies");
        return;
      }

      setMovies(data.data || []);
    } catch (err) {
      setError("An error occurred");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovies(search);
  };

  const handleAddToWatchlist = async (movieId: string) => {
    setAddingToWatchlist(movieId);
    try {
      const token = localStorage.getItem("movienight_token");
      const res = await fetch("/api/watch/desire", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ movieId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Success",
          description: "Added to watchlist",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add to watchlist",
          variant: "error",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "An error occurred while adding to watchlist",
        variant: "error",
      });
    } finally {
      setAddingToWatchlist(null);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Discover Movies</h1>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search movies..."
          className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-center py-8">
          Loading movies...
        </p>
      ) : movies.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No movies found
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors"
            >
              {movie.poster && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{movie.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  ({movie.year})
                </p>

                {movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {movie.genres.slice(0, 3).map((genre, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {movie.imdbRating && (
                  <p className="text-sm mb-3">
                    <span className="font-medium">IMDb:</span>{" "}
                    {movie.imdbRating}/10
                  </p>
                )}

                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {movie.description}
                </p>

                <button
                  onClick={() => handleAddToWatchlist(movie.id)}
                  disabled={addingToWatchlist === movie.id}
                  className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToWatchlist === movie.id ? "Adding..." : "Add to Watchlist"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
