"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Bookmark,
  Check,
  Users,
  Film,
  Star,
  X,
  Loader2,
  Clapperboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

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

type ActionTab = "watchlist" | "watched" | "suggest" | "movienight";

interface AddMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie | null;
  friends: Friend[];
  onMovieAdded?: () => void;
}

export function AddMovieModal({
  isOpen,
  onClose,
  movie,
  friends,
  onMovieAdded,
}: AddMovieModalProps) {
  const [activeTab, setActiveTab] = useState<ActionTab>("watchlist");
  const [isLoading, setIsLoading] = useState(false);
  const [watchedDate, setWatchedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [rating, setRating] = useState([3]);
  const [review, setReview] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [desiredScore, setDesiredScore] = useState([5]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("movienight_token")
      : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const handleClose = () => {
    setActiveTab("watchlist");
    setWatchedDate(new Date().toISOString().split("T")[0]);
    setRating([3]);
    setReview("");
    setSelectedFriends([]);
    setMessage("");
    setDesiredScore([5]);
    onClose();
  };

  const handleAddToWatchlist = async () => {
    if (!movie) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/watch/desire/add-from-tmdb", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.year,
          genres: movie.genres,
          poster: movie.poster,
          description: "",
          imdbRating: movie.imdbRating,
          rating: desiredScore[0],
        }),
      });

      if (res.ok) {
        toast({
          title: "Added!",
          description: `"${movie.title}" added to your watchlist`,
        });
        onMovieAdded?.();
        handleClose();
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Failed to add movie",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Failed to add movie:", error);
      toast({
        title: "Error",
        description: "Failed to add movie",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsWatched = async () => {
    if (!movie) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/watch/mark-watched", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          movieId: movie.id || `tmdb_${movie.tmdbId}`,
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.year,
          genres: movie.genres,
          poster: movie.poster,
          watchedDate: watchedDate,
          rating: rating[0],
          review: review || undefined,
          watchedWith: selectedFriends,
        }),
      });

      if (res.ok) {
        toast({
          title: "Success!",
          description: `"${movie.title}" marked as watched`,
        });
        onMovieAdded?.();
        handleClose();
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Failed to mark as watched",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Failed to mark as watched:", error);
      toast({
        title: "Error",
        description: "Failed to mark as watched",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestToFriends = async () => {
    if (!movie || selectedFriends.length === 0) return;
    setIsLoading(true);

    try {
      const promises = selectedFriends.map((friendId) =>
        fetch("/api/suggestions", {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            movieId: movie.id || `tmdb_${movie.tmdbId}`,
            tmdbId: movie.tmdbId,
            toUserId: friendId,
            title: movie.title,
            year: movie.year,
            genres: movie.genres,
            poster: movie.poster,
            message: message || undefined,
          }),
        }),
      );

      const results = await Promise.all(promises);
      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        toast({
          title: "Suggested!",
          description: `"${movie.title}" suggested to ${selectedFriends.length} friend${selectedFriends.length > 1 ? "s" : ""}`,
        });
        onMovieAdded?.();
        handleClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to suggest to some friends",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Failed to suggest movie:", error);
      toast({
        title: "Error",
        description: "Failed to suggest movie",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToMovieNight = async () => {
    if (!movie) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/movie-night", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          movieId: movie.id || `tmdb_${movie.tmdbId}`,
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.year,
          genres: movie.genres,
          poster: movie.poster,
          description: message || undefined,
        }),
      });

      if (res.ok) {
        toast({
          title: "Added!",
          description: `"${movie.title}" added to movie night suggestions`,
        });
        onMovieAdded?.();
        handleClose();
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Failed to add to movie night",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Failed to add to movie night:", error);
      toast({
        title: "Error",
        description: "Failed to add to movie night",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
  };

  const getRatingStars = (value: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < Math.ceil(value) ? "text-yellow-400" : ""}>
        {i < Math.ceil(value) ? "★" : "☆"}
      </span>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogClose />
        <AnimatePresence mode="wait">
          {movie && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl">Add Movie</DialogTitle>
                <DialogDescription>
                  {movie.title} ({movie.year})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Movie Preview */}
                <div className="flex gap-4">
                  <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-background flex items-center justify-center">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Clapperboard className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{movie.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {movie.year}
                      {movie.imdbRating && (
                        <span className="ml-3">
                          ⭐ {movie.imdbRating.toFixed(1)}
                        </span>
                      )}
                    </p>
                    {movie.genres && movie.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {movie.genres.slice(0, 3).map((genre) => (
                          <Badge key={genre} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Tabs */}
                <div className="border-b border-border">
                  <div className="flex gap-2 -mb-px overflow-x-auto pb-2">
                    {[
                      {
                        id: "watchlist" as ActionTab,
                        label: "Add to Watchlist",
                        icon: Bookmark,
                      },
                      {
                        id: "watched" as ActionTab,
                        label: "Mark as Watched",
                        icon: Check,
                      },
                      {
                        id: "suggest" as ActionTab,
                        label: "Suggest to Friends",
                        icon: Users,
                      },
                      {
                        id: "movienight" as ActionTab,
                        label: "Add to Movie Night",
                        icon: Film,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-0.5",
                          activeTab === tab.id
                            ? "text-primary border-b-primary"
                            : "text-muted-foreground border-b-transparent hover:text-foreground",
                        )}
                      >
                        <tab.icon size={16} />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                  {activeTab === "watchlist" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label>Your Interest Level (WatchDesire Score)</Label>
                        <div className="space-y-2">
                          <Slider
                            value={desiredScore}
                            onValueChange={setDesiredScore}
                            max={10}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Not Interested</span>
                            <span className="text-primary font-semibold">
                              {desiredScore[0]}/10
                            </span>
                            <span>Must Watch</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleAddToWatchlist}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-4 w-4 mr-2" />
                            Add to Watchlist
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {activeTab === "watched" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="watched-date">Date Watched</Label>
                        <Input
                          id="watched-date"
                          type="date"
                          value={watchedDate}
                          onChange={(e) => setWatchedDate(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Your Rating</Label>
                        <div className="space-y-3">
                          <div className="flex gap-1 text-3xl cursor-pointer">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setRating([i + 1])}
                                className="transition-transform hover:scale-110 active:scale-95"
                              >
                                {i < rating[0] ? (
                                  <span className="text-yellow-400">★</span>
                                ) : (
                                  <span className="text-muted-foreground">☆</span>
                                )}
                              </button>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rating[0]}/5 Stars
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="review">Review / Notes (Optional)</Label>
                        <Textarea
                          id="review"
                          placeholder="Write your thoughts about this movie..."
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                          className="min-h-24 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Watched With</Label>
                        {friends.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {friends.map((friend) => (
                              <div
                                key={friend.id}
                                onClick={() => toggleFriend(friend.id)}
                                className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-accent/50 transition-colors"
                              >
                                <Checkbox
                                  checked={selectedFriends.includes(friend.id)}
                                  onChange={() => {}}
                                />
                                <span className="text-sm">
                                  {friend.name || friend.username}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No friends to add. Add friends to track who you watched with.
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleMarkAsWatched}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Mark as Watched
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {activeTab === "suggest" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label>Select Friends to Suggest To</Label>
                        {friends.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {friends.map((friend) => (
                              <div
                                key={friend.id}
                                onClick={() => toggleFriend(friend.id)}
                                className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-accent/50 transition-colors"
                              >
                                <Checkbox
                                  checked={selectedFriends.includes(friend.id)}
                                  onChange={() => {}}
                                />
                                <span className="text-sm">
                                  {friend.name || friend.username}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No friends added yet. Add friends to send suggestions.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="suggest-message">
                          Message (Optional)
                        </Label>
                        <Textarea
                          id="suggest-message"
                          placeholder="Add a personal message to your friend..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="min-h-20 resize-none"
                        />
                      </div>

                      <Button
                        onClick={handleSuggestToFriends}
                        disabled={isLoading || selectedFriends.length === 0}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Suggesting...
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 mr-2" />
                            Suggest to {selectedFriends.length}{" "}
                            {selectedFriends.length === 1 ? "Friend" : "Friends"}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {activeTab === "movienight" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="movienight-message">
                          Why This Movie? (Optional)
                        </Label>
                        <Textarea
                          id="movienight-message"
                          placeholder="Describe why you think this would be great for movie night..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="min-h-24 resize-none"
                        />
                      </div>

                      <Button
                        onClick={handleAddToMovieNight}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Film className="h-4 w-4 mr-2" />
                            Add to Movie Night
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
