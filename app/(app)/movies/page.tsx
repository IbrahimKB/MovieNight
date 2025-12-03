"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Clapperboard, Loader2, Plus, Check } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { MovieCardSkeleton } from "@/components/ui/skeleton-loader";
import { AddMovieModal } from "@/components/add-movie-modal";
import { toast } from "@/components/ui/use-toast";
import FeaturedMovieHero from "@/components/ui/featured-movie-hero";
import { shouldReduceMotion } from "@/lib/animations";

interface Movie {
  id: string;
  title: string;
  year: number;
  poster?: string;
  genres?: string[];
  imdbRating?: number;
  tmdbId?: number;
}

interface Friend {
  id: string;
  name: string | null;
  username: string;
  avatar?: string;
}

const MOVIES_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function MoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [displayedMovies, setDisplayedMovies] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tmdbResults, setTmdbResults] = useState<Movie[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [addedMovieIds, setAddedMovieIds] = useState<Set<string>>(new Set());
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch trending movies from TMDB and friends
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, friendsRes] = await Promise.all([
          fetch("/api/movies/trending?page=1", {
            credentials: "include",
          }),
          fetch("/api/friends", {
            credentials: "include",
          }),
        ]);

        const moviesData = await moviesRes.json();
        const friendsData = await friendsRes.json();

        if (moviesData.success && Array.isArray(moviesData.data)) {
          setMovies(moviesData.data);
          setFilteredMovies(moviesData.data);
          setCurrentPage(1);
          setDisplayedMovies(moviesData.data.slice(0, MOVIES_PER_PAGE));
          setHasMore(moviesData.data.length > MOVIES_PER_PAGE);

          // Extract unique genres
          const genres = new Set<string>();
          moviesData.data.forEach((movie: Movie) => {
            movie.genres?.forEach((g) => genres.add(g));
          });
          setAllGenres(Array.from(genres).sort());

          // Track which movies are already in database
          const addedIds = new Set<string>(
            moviesData.data.map((m: Movie) => m.id),
          );
          setAddedMovieIds(addedIds);
        }

        if (friendsData.success && friendsData.data?.friends) {
          setFriends(
            friendsData.data.friends.map((f: any) => ({
              id: f.userId,
              name: f.name,
              username: f.username,
              avatar: f.avatar,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Live TMDB search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setTmdbResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/movies/search?q=${encodeURIComponent(searchQuery)}&page=1`,
          {
            credentials: "include",
          },
        );
        const data = await res.json();

        if (data.success && data.data) {
          const results = data.data.map((movie: Movie) => ({
            id: movie.id || `tmdb_${movie.tmdbId}`,
            tmdbId: movie.tmdbId,
            title: movie.title,
            year: movie.year,
            poster: movie.poster,
            genres: movie.genres || [],
            imdbRating: movie.imdbRating,
          }));
          setTmdbResults(results);
          setShowSearchResults(true);
        } else {
          setTmdbResults([]);
        }
      } catch (error) {
        console.error("Search failed:", error);
        toast({
          title: "Search Error",
          description: "Failed to search movies",
          variant: "error",
        });
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Filter local movies based on genre
  useEffect(() => {
    let results = movies;

    if (selectedGenre) {
      results = results.filter((movie) =>
        movie.genres?.includes(selectedGenre),
      );
    }

    setFilteredMovies(results);
    setCurrentPage(1);
    setDisplayedMovies(results.slice(0, MOVIES_PER_PAGE));
    setHasMore(results.length > MOVIES_PER_PAGE);
  }, [selectedGenre, movies]);

  // Load more local movies
  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    const startIdx = nextPage * MOVIES_PER_PAGE - MOVIES_PER_PAGE;
    const endIdx = startIdx + MOVIES_PER_PAGE;
    const newMovies = filteredMovies.slice(0, endIdx);

    setDisplayedMovies(newMovies);
    setCurrentPage(nextPage);
    setHasMore(endIdx < filteredMovies.length);
  };

  // Open the add movie modal
  const handleOpenModal = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowAddMovieModal(true);
  };

  // Handle movie added from modal
  const handleMovieAdded = () => {
    setSearchQuery("");
    setTmdbResults([]);
    setShowSearchResults(false);
  };

  const { observerTarget, isLoading: isLoadingMore } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    threshold: 300,
  });

  const MovieCard = ({ movie, index }: { movie: Movie; index: number }) => (
    <motion.button
      onClick={() => handleOpenModal(movie)}
      className="rounded-lg overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20 text-left w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion()
          ? { duration: 0 }
          : { duration: 0.4, delay: (index % 12) * 0.05 }
      }
      whileHover={shouldReduceMotion() ? {} : { scale: 1.05 }}
      whileTap={shouldReduceMotion() ? {} : { scale: 0.95 }}
    >
      <div className="relative bg-card border border-border rounded-lg overflow-hidden aspect-[3/4] flex items-center justify-center">
        {movie.poster ? (
          <motion.img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="text-center p-4">
            <Clapperboard className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{movie.title}</p>
          </div>
        )}

        {/* Rating badge */}
        {movie.imdbRating && (
          <motion.div
            className="absolute top-2 right-2 bg-primary/90 rounded-lg px-2 py-1 text-xs font-bold text-primary-foreground"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: (index % 12) * 0.05 + 0.2 }}
          >
            {movie.imdbRating.toFixed(1)}
          </motion.div>
        )}
      </div>
      <div className="mt-3 px-1">
        <p className="font-semibold text-sm truncate">{movie.title}</p>
        <p className="text-xs text-muted-foreground">{movie.year}</p>
      </div>
    </motion.button>
  );

  const TMDBMovieCard = ({ movie }: { movie: Movie }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => handleOpenModal(movie)}
        className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-all flex gap-3 group cursor-pointer hover:shadow-md"
      >
        <div className="w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-background flex items-center justify-center">
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />
          ) : (
            <Clapperboard className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-sm truncate">{movie.title}</h4>
            <p className="text-xs text-muted-foreground">{movie.year}</p>
            {movie.imdbRating && (
              <p className="text-xs text-yellow-500 mt-1">
                ⭐ {movie.imdbRating.toFixed(1)}
              </p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(movie);
            }}
            className="w-full px-3 py-1.5 rounded text-xs font-medium transition-all mt-2 flex items-center justify-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
          >
            <Plus className="h-3 w-3" />
            Add Movie
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <AddMovieModal
        isOpen={showAddMovieModal}
        onClose={() => setShowAddMovieModal(false)}
        movie={selectedMovie}
        friends={friends}
        onMovieAdded={handleMovieAdded}
      />
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            Trending Movies
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Discover what&apos;s popular right now
          </p>
        </div>

        {/* Featured Movie Hero */}
        {!loading && displayedMovies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <FeaturedMovieHero
              movie={{
                id: displayedMovies[0].id,
                title: displayedMovies[0].title,
                year: displayedMovies[0].year,
                genres: displayedMovies[0].genres,
                poster: displayedMovies[0].poster,
                backdrop: displayedMovies[0].poster,
                imdbRating: displayedMovies[0].imdbRating,
              }}
              onAddToWatchlist={() => handleOpenModal(displayedMovies[0])}
              onWatch={() => router.push(`/movies/${displayedMovies[0].id}`)}
              onSuggest={() => handleOpenModal(displayedMovies[0])}
            />
          </motion.div>
        )}

        {/* Search Bar */}
        <motion.div
          className="relative z-20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search movies on TMDB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() =>
              searchQuery.length >= 2 && setShowSearchResults(true)
            }
            className="w-full pl-12 pr-4 py-3 md:py-2 rounded-xl bg-card border border-primary/20 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all min-h-[44px]"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}

          {/* TMDB Search Results Dropdown */}
          {showSearchResults && tmdbResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-primary/30 rounded-xl shadow-lg max-h-96 overflow-y-auto"
            >
              <div className="p-3 space-y-2">
                {tmdbResults.map((movie) => (
                  <TMDBMovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </motion.div>
          )}

          {showSearchResults &&
            !isSearching &&
            tmdbResults.length === 0 &&
            searchQuery.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-primary/30 rounded-xl shadow-lg p-4 text-center text-muted-foreground"
              >
                No movies found
              </motion.div>
            )}
        </motion.div>

        {/* Genre Filter Chips */}
        {allGenres.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={() => setSelectedGenre(null)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                selectedGenre === null
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50 hover:shadow-lg hover:shadow-primary/70"
                  : "bg-card border border-primary/20 text-foreground hover:border-primary/60 hover:bg-accent/30"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              All Genres
            </motion.button>
            {allGenres.map((genre, idx) => (
              <motion.button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                  selectedGenre === genre
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50 hover:shadow-lg hover:shadow-primary/70"
                    : "bg-card border border-primary/20 text-foreground hover:border-primary/60 hover:bg-accent/30"
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {genre}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Local Movies Browse */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMovies.length > 0 ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Found {filteredMovies.length} movie
              {filteredMovies.length !== 1 ? "s" : ""}
            </p>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
              initial="hidden"
              animate="visible"
              variants={
                shouldReduceMotion()
                  ? {}
                  : {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                        },
                      },
                    }
              }
            >
              {displayedMovies.map((movie, index) => (
                <MovieCard key={movie.id} movie={movie} index={index} />
              ))}
            </motion.div>

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div
                ref={observerTarget}
                className="mt-8 flex justify-center py-8"
              >
                {isLoadingMore && (
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </motion.div>
                )}
              </div>
            )}

            {!hasMore && displayedMovies.length > 0 && (
              <motion.div
                className="text-center py-8 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <p>No more movies to load</p>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            className="text-center py-12 bg-card border border-primary/20 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Clapperboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No movies found matching your criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre(null);
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 active:scale-95 transition-all"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
