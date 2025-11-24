"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clapperboard, X } from "lucide-react";

interface Movie {
  id: string;
  title: string;
  year: number;
  poster?: string;
  genres?: string[];
  imdbRating?: number;
}

export default function MoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allGenres, setAllGenres] = useState<string[]>([]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("movienight_token")
      : null;

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        const res = await fetch("/api/movies", { headers });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setMovies(data.data);
          setFilteredMovies(data.data);

          // Extract unique genres
          const genres = new Set<string>();
          data.data.forEach((movie: Movie) => {
            movie.genres?.forEach((g) => genres.add(g));
          });
          setAllGenres(Array.from(genres).sort());
        }
      } catch (error) {
        console.error("Failed to fetch movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [token]);

  // Filter movies based on search and genre
  useEffect(() => {
    let results = movies;

    if (searchQuery) {
      results = results.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          movie.year.toString().includes(searchQuery),
      );
    }

    if (selectedGenre) {
      results = results.filter((movie) =>
        movie.genres?.includes(selectedGenre),
      );
    }

    setFilteredMovies(results);
  }, [searchQuery, selectedGenre, movies]);

  const MovieCard = ({ movie }: { movie: Movie }) => (
    <button
      onClick={() => router.push(`/movies/${movie.id}`)}
      className="rounded-lg overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20"
    >
      <div className="relative bg-card border border-border rounded-lg overflow-hidden aspect-[3/4] flex items-center justify-center">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="text-center p-4">
            <Clapperboard className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{movie.title}</p>
          </div>
        )}

        {/* Rating badge */}
        {movie.imdbRating && (
          <div className="absolute top-2 right-2 bg-primary/90 rounded-lg px-2 py-1 text-xs font-bold text-primary-foreground">
            {movie.imdbRating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <p className="font-semibold text-sm truncate">{movie.title}</p>
        <p className="text-xs text-muted-foreground">{movie.year}</p>
      </div>
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Browse Movies</h1>
        <p className="text-muted-foreground">
          Explore thousands of films to add to your watchlist
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-3.5 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search by title or year..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Genre Filter Chips */}
      {allGenres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedGenre === null
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground hover:border-primary/50"
            }`}
          >
            All Genres
          </button>
          {allGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGenre === genre
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:border-primary/50"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading movies...</p>
        </div>
      ) : filteredMovies.length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Found {filteredMovies.length} movie
            {filteredMovies.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Clapperboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No movies found matching your criteria
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedGenre(null);
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
