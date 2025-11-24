"use client";

import { useState } from "react";
import { Search, Plus, Film } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("movienight_token");
      const response = await fetch(
        `/api/movies?q=${encodeURIComponent(searchQuery)}&limit=12`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      const data = await response.json();
      setMovies(data.data || []);
    } catch (err) {
      console.error("Error searching movies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (movieId: string) => {
    setAdding(movieId);
    try {
      const token = localStorage.getItem("movienight_token");
      await fetch("/api/watch/desire", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ movieId }),
      });
    } catch (err) {
      console.error("Error adding to watchlist:", err);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-4">
            Discover Movies
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Search for movies and add them to your watchlist
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search
                size={20}
                className="absolute left-4 top-3 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search movies, actors, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold disabled:opacity-50 sm:whitespace-nowrap"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {/* Movies Grid */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                {/* Poster */}
                <div className="w-full h-64 bg-secondary flex items-center justify-center overflow-hidden relative group">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film size={60} className="text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleAddToWatchlist(movie.id)}
                      disabled={adding === movie.id}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={18} />
                      {adding === movie.id ? "Adding..." : "Add to Watchlist"}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {movie.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {movie.year}
                      {movie.imdbRating && ` • ${movie.imdbRating}/10`}
                    </div>
                    {movie.genres.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-end">
                        {movie.genres.slice(0, 2).map((genre) => (
                          <span
                            key={genre}
                            className="px-2 py-1 text-xs rounded bg-primary/10 text-primary"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Film size={48} className="text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery ? "No movies found" : "Search for movies"}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try searching for a different movie"
                : "Enter a movie title to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
