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
  const { trigger: triggerConfetti, triggerCheckmark, triggerPaperAirplane } =
    useConfetti();

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

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("movienight_token")
      : null;

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        const res = await fetch(`/api/movies/${movieId}`, { headers });
        const data = await res.json();

        if (data.success && data.data) {
          setMovie(data.data);
        }

        // Check if in watchlist
        const watchlistRes = await fetch("/api/watch/desire", { headers });
        const watchlistData = await watchlistRes.json();
        if (watchlistData.success && Array.isArray(watchlistData.data)) {
          const isInList = watchlistData.data.some(
            (item: any) => item.movieId === movieId,
          );
          setInWatchlist(isInList);
        }

        // Check if watched
        const historyRes = await fetch("/api/watch/history", { headers });
        const historyData = await historyRes.json();
        if (historyData.success && Array.isArray(historyData.data)) {
          const isWatched = historyData.data.some(
            (item: any) => item.movieId === movieId,
          );
          setWatched(isWatched);
        }

        // Fetch friends for suggestions
        const friendsRes = await fetch("/api/friends", { headers });
        const friendsData = await friendsRes.json();
        if (friendsData.success && friendsData.data?.friends) {
          setFriends(friendsData.data.friends);
        }
      } catch (error) {
        console.error("Failed to fetch movie:", error);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovie();
    }
  }, [movieId, token]);

  const handleAddToWatchlist = async () => {
    const previousState = inWatchlist;
    setIsAddingToWatchlist(true);
    setInWatchlist(!inWatchlist);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await fetch("/api/watch/desire", {
        method: "POST",
        headers,
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
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await fetch("/api/watch/mark-watched", {
        method: "POST",
        headers,
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
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers,
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Movie not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
      >
        <ArrowLeft size={20} />
        Back
      </button>

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
          <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
        <div className="flex flex-wrap gap-3 mb-12">
          <button
            onClick={handleAddToWatchlist}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              inWatchlist
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-card border border-border text-foreground hover:border-primary/50"
            }`}
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
          </button>

          <button
            onClick={handleMarkWatched}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              watched
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-card border border-border text-foreground hover:border-primary/50"
            }`}
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
          </button>

          <button
            onClick={() => setShowSuggestModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-card border border-border text-foreground hover:border-primary/50 font-medium transition-all"
          >
            <Heart size={20} />
            Suggest to Friend
          </button>

          <button className="flex items-center gap-2 px-6 py-3 rounded-lg bg-card border border-border text-foreground hover:border-primary/50 font-medium transition-all">
            <Share2 size={20} />
            Share
          </button>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-card border border-border rounded-xl p-6">
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
        </div>
      </div>

      {/* Suggest Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Suggest to a Friend</h2>
            <p className="text-muted-foreground mb-4">
              Choose a friend to suggest {movie.title}
            </p>

            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedFriend === friend.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium">
                      {friend.name || friend.username}
                    </p>
                    <p className="text-sm opacity-75">@{friend.username}</p>
                  </button>
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No friends yet. Add friends to suggest movies!
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSuggestModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-card transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSuggestToFriend}
                disabled={!selectedFriend}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Suggest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
