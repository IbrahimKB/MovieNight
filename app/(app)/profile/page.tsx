"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Bookmark, Clock, Heart, Users, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import FeaturedMovieHero from "@/components/ui/featured-movie-hero";

interface Movie {
  id: string;
  title: string;
  year: number;
  poster?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [watchHistory, setWatchHistory] = useState<Movie[]>([]);
  const [sentSuggestions, setSentSuggestions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFriends: 0,
    moviesWatched: 0,
    activeWatchlist: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [friendsRes, watchlistRes, historyRes, suggestionsRes] =
          await Promise.all([
            fetch("/api/friends", { credentials: "include" }),
            fetch("/api/watch/desire", { credentials: "include" }),
            fetch("/api/watch/history", { credentials: "include" }),
            fetch("/api/suggestions", { credentials: "include" }),
          ]);

        const friendsData = await friendsRes.json();
        const watchlistData = await watchlistRes.json();
        const historyData = await historyRes.json();
        const suggestionsData = await suggestionsRes.json();

        const watchlistMovies = watchlistData.success
          ? watchlistData.data || []
          : [];
        const historyMovies = historyData.success ? historyData.data || [] : [];
        const suggestions = suggestionsData.success
          ? suggestionsData.data || []
          : [];

        setWatchlist(watchlistMovies.slice(0, 4));
        setWatchHistory(historyMovies.slice(0, 4));
        setSentSuggestions(
          suggestions.filter((s: any) => s.fromUserId === user?.id).slice(0, 4),
        );

        setStats({
          totalFriends: friendsData.success
            ? friendsData.data?.friends?.length || 0
            : 0,
          moviesWatched: historyMovies.length,
          activeWatchlist: watchlistMovies.length,
        });
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id]);

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
          <div className="text-center p-4 text-muted-foreground">
            <p className="text-xs">{movie.title}</p>
          </div>
        )}
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Profile Header */}
      <motion.div
        className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-8 neon-glow-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex gap-4 sm:gap-6 items-start">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl sm:text-3xl flex-shrink-0 border border-primary/30">
              {user?.name?.[0] || user?.username[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
                {user?.name || user?.username}
              </h1>
              <p className="text-muted-foreground text-sm truncate">
                @{user?.username}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Member since{" "}
                {user?.joinedAt
                  ? new Date(user.joinedAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "recently"}
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => router.push("/settings")}
            className="flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 rounded-lg border border-primary/50 text-primary hover:bg-primary/10 transition-colors font-medium text-sm sm:text-base whitespace-nowrap w-full sm:w-auto glow-hover"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Edit2 size={18} />
            Edit Profile
          </motion.button>
        </div>
      </motion.div>

      {/* Featured Movie from History */}
      {!loading && watchHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FeaturedMovieHero
            movie={{
              id: watchHistory[0].id,
              title: watchHistory[0].title,
              year: watchHistory[0].year,
              poster: watchHistory[0].poster,
              backdrop: watchHistory[0].poster,
            }}
            onAddToWatchlist={() => router.push("/movies")}
            onWatch={() => router.push(`/movies/${watchHistory[0].id}`)}
          />
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          className="bg-card border border-border rounded-xl p-4 sm:p-6 glow-hover neon-glow-border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </motion.div>
            <p className="text-xs sm:text-sm text-muted-foreground">Friends</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats.totalFriends}</p>
        </motion.div>

        <motion.div
          className="bg-card border border-border rounded-xl p-4 sm:p-6 glow-hover neon-glow-border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
            >
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </motion.div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Movies Watched
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">
            {stats.moviesWatched}
          </p>
        </motion.div>

        <motion.div
          className="bg-card border border-border rounded-xl p-4 sm:p-6 glow-hover neon-glow-border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            >
              <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </motion.div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              In Watchlist
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">
            {stats.activeWatchlist}
          </p>
        </motion.div>
      </div>

      {/* Recently Watched */}
      {watchHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recently Watched</h2>
            <button
              onClick={() => router.push("/watchlist")}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {watchHistory.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Watchlist</h2>
            <button
              onClick={() => router.push("/watchlist")}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {watchlist.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {sentSuggestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Suggestions Sent</h2>
            <button
              onClick={() => router.push("/suggestions")}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {sentSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg"
              >
                <Heart className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{suggestion.movie?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Sent to{" "}
                    {suggestion.toUser?.name || suggestion.toUser?.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
