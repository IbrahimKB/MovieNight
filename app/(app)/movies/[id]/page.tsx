"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  Heart,
  Share2,
  Clapperboard,
} from "lucide-react";
import { useConfetti } from "@/hooks/use-confetti";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { toast } from "@/components/ui/use-toast";
import { FriendsWhoWatched } from "@/components/friends-who-watched";

interface Movie {
  id: string;
  title: string;
  year: number;
  poster?: string;
  genres?: string[];
  description: string;
  imdbRating?: number;
  rtRating?: number;
  releaseDate?: string;
}

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const movieId = params?.id as string;
  const {
    trigger: triggerConfetti,
    triggerCheckmark,
    triggerPaperAirplane,
  } = useConfetti();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watched, setWatched] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [isMarkingWatched, setIsMarkingWatched] = useState(false);
  const [isSuggestingMovie, setIsSuggestingMovie] = useState(false);
  const [friendsWhoWatched, setFriendsWhoWatched] = useState<any[]>([]);
  const [friendsRatings, setFriendsRatings] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        // Parallelize independent requests
        const [movieRes, watchlistRes, historyRes, friendsRes] =
          await Promise.all([
            fetch(`/api/movies/${movieId}`, { credentials: "include" }),
            fetch("/api/watch/desire", { credentials: "include" }),
            fetch("/api/watch/history", { credentials: "include" }),
            fetch("/api/friends", { credentials: "include" }),
          ]);

        const data = await movieRes.json();
        if (data.success && data.data) {
          setMovie(data.data);
        }

        // Check if in watchlist
        const watchlistData = await watchlistRes.json();
        if (watchlistData.success && Array.isArray(watchlistData.data)) {
          const isInList = watchlistData.data.some(
            (item: any) => item.movieId === movieId,
          );
          setInWatchlist(isInList);
        }

        // Check if watched
        const historyData = await historyRes.json();
        if (historyData.success && Array.isArray(historyData.data)) {
          const isWatched = historyData.data.some(
            (item: any) => item.movieId === movieId,
          );
          setWatched(isWatched);
        }

        // Fetch friends for suggestions
        const friendsData = await friendsRes.json();
        if (friendsData.success && friendsData.data?.friends) {
          setFriends(friendsData.data.friends);
        }

        // Note: Friends who watched this movie would require a dedicated API endpoint
        // with proper ACL checks. For now, we don't fetch this data.
        // TODO: Add /api/movies/:id/who-watched endpoint on backend
        setFriendsWhoWatched([]);
      } catch (error) {
        console.error("Failed to fetch movie:", error);
        toast({
          title: "Error",
          description: "Failed to load movie details. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);

  const handleAddToWatchlist = async () => {
    const previousState = inWatchlist;
    setIsAddingToWatchlist(true);
    setInWatchlist(!inWatchlist);

    try {
      const res = await fetch("/api/watch/desire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ movieId }),
      });

      if (res.ok) {
        if (!previousState) {
          triggerConfetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.5 },
          });
        }
      } else {
        setInWatchlist(previousState);
      }
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      setInWatchlist(previousState);
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const handleMarkWatched = async () => {
    const previousState = watched;
    setIsMarkingWatched(true);
    setWatched(!watched);

    try {
      const res = await fetch("/api/watch/mark-watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ movieId }),
      });

      if (res.ok) {
        if (!previousState) {
          triggerCheckmark();
        }
      } else {
        setWatched(previousState);
      }
    } catch (error) {
      console.error("Failed to mark watched:", error);
      setWatched(previousState);
    } finally {
      setIsMarkingWatched(false);
    }
  };

  const handleSuggestToFriend = async () => {
    if (!selectedFriend) return;

    setIsSuggestingMovie(true);

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          movieId,
          toUserId: selectedFriend,
          message: `Check out ${movie?.title}!`,
        }),
      });

      if (res.ok) {
        triggerPaperAirplane();
        setShowSuggestModal(false);
        setSelectedFriend(null);
      }
    } catch (error) {
      console.error("Failed to suggest movie:", error);
    } finally {
      setIsSuggestingMovie(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading movie details...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-muted-foreground">Movie not found</p>
        <motion.button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          Go Back
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Back Button */}
      <motion.button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft size={20} />
        Back
      </motion.button>

      {/* Hero Section */}
      <div className="relative -mx-4 md:-mx-0">
        <div className="relative aspect-video bg-card border border-border rounded-xl overflow-hidden flex items-center justify-center">
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <Clapperboard className="h-16 w-16 text-muted-foreground mx-auto" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Poster Card */}
        <div className="absolute bottom-0 left-0 md:left-8 md:bottom-8 -mb-20 md:mb-0">
          <div className="w-32 h-48 bg-card border border-border rounded-lg overflow-hidden shadow-2xl">
            {movie.poster ? (
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Clapperboard className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-28 md:pt-0">
        {/* Title and Rating */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            {movie.title}
          </h1>
          <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
            <span>{movie.year}</span>
            {movie.imdbRating && (
              <span className="flex items-center gap-1">
                ⭐ {movie.imdbRating.toFixed(1)} IMDb
              </span>
            )}
            {movie.rtRating && (
              <span className="flex items-center gap-1">
                🍅 {movie.rtRating.toFixed(0)}% RT
              </span>
            )}
          </div>
        </div>

        {/* Genres */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {movie.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed max-w-2xl">
          {movie.description}
        </p>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap gap-3 mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.button
            onClick={handleAddToWatchlist}
            disabled={isAddingToWatchlist}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              inWatchlist
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-card border border-border text-foreground hover:border-primary/50"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              initial={false}
              animate={inWatchlist ? { scale: 1 } : { scale: 1 }}
            >
              {inWatchlist ? (
                <>
                  <BookmarkCheck size={20} />
                  In Watchlist
                </>
              ) : (
                <>
                  <Bookmark size={20} />
                  Add to Watchlist
                </>
              )}
            </motion.span>
          </motion.button>

          <motion.button
            onClick={handleMarkWatched}
            disabled={isMarkingWatched}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              watched
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-card border border-border text-foreground hover:border-primary/50"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              initial={false}
              animate={watched ? { scale: 1 } : { scale: 1 }}
            >
              {watched ? (
                <>
                  <Check size={20} />
                  Watched
                </>
              ) : (
                <>
                  <Check size={20} />
                  Mark as Watched
                </>
              )}
            </motion.span>
          </motion.button>

          <motion.button
            onClick={() => setShowSuggestModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-card border border-border text-foreground hover:border-primary/50 font-medium transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart size={20} />
            Suggest to Friend
          </motion.button>

          <motion.button
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-card border border-border text-foreground hover:border-primary/50 font-medium transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 size={20} />
            Share
          </motion.button>
        </motion.div>

        {/* Social Context Section */}
        {friendsWhoWatched.length > 0 && (
          <motion.div
            className="space-y-4 bg-card border border-primary/20 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-primary">👥</span> Friends Who Watched
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {friendsWhoWatched.map((friend) => (
                <motion.div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-primary/10 hover:border-primary/30"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {(friend.name || friend.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {friend.name || friend.username}
                    </p>
                    <p className="text-xs text-muted-foreground">✓ Watched</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Additional Info */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-card border border-primary/20 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div>
            <p className="text-xs text-muted-foreground">Year</p>
            <p className="font-semibold">{movie.year}</p>
          </div>
          {movie.imdbRating && (
            <div>
              <p className="text-xs text-muted-foreground">IMDb Rating</p>
              <p className="font-semibold">{movie.imdbRating.toFixed(1)}/10</p>
            </div>
          )}
          {movie.releaseDate && (
            <div>
              <p className="text-xs text-muted-foreground">Release Date</p>
              <p className="font-semibold">
                {new Date(movie.releaseDate).toLocaleDateString()}
              </p>
            </div>
          )}
          {movie.genres && (
            <div>
              <p className="text-xs text-muted-foreground">Genres</p>
              <p className="font-semibold text-sm">
                {movie.genres.slice(0, 2).join(", ")}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Suggest Modal - Using BottomSheet on mobile */}
      <AnimatePresence>
        {showSuggestModal && (
          <motion.div
            className="hidden md:flex fixed inset-0 bg-black/50 backdrop-blur-sm z-50 items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSuggestModal(false)}
          >
            <motion.div
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">Suggest to a Friend</h2>
              <p className="text-muted-foreground mb-4">
                Choose a friend to suggest {movie.title}
              </p>

              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <motion.button
                      key={friend.id}
                      onClick={() => setSelectedFriend(friend.id)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        selectedFriend === friend.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border hover:border-primary/50"
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="font-medium">
                        {friend.name || friend.username}
                      </p>
                      <p className="text-sm opacity-75">@{friend.username}</p>
                    </motion.button>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No friends yet. Add friends to suggest movies!
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <motion.button
                  onClick={() => setShowSuggestModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-card transition-colors font-medium"
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSuggestToFriend}
                  disabled={!selectedFriend || isSuggestingMovie}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  whileTap={{ scale: 0.95 }}
                >
                  {isSuggestingMovie ? "Suggesting..." : "Suggest"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet */}
      <BottomSheet
        isOpen={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
        title="Suggest to a Friend"
        className="md:hidden max-h-[70vh]"
      >
        <p className="text-muted-foreground mb-4">
          Choose a friend to suggest {movie.title}
        </p>

        <div className="space-y-2 mb-6">
          {friends.length > 0 ? (
            friends.map((friend) => (
              <motion.button
                key={friend.id}
                onClick={() => setSelectedFriend(friend.id)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedFriend === friend.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border hover:border-primary/50"
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <p className="font-medium">{friend.name || friend.username}</p>
                <p className="text-sm opacity-75">@{friend.username}</p>
              </motion.button>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              No friends yet. Add friends to suggest movies!
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={() => setShowSuggestModal(false)}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-card transition-colors font-medium"
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleSuggestToFriend}
            disabled={!selectedFriend || isSuggestingMovie}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            whileTap={{ scale: 0.95 }}
          >
            {isSuggestingMovie ? "Suggesting..." : "Suggest"}
          </motion.button>
        </div>
      </BottomSheet>
    </motion.div>
  );
}
