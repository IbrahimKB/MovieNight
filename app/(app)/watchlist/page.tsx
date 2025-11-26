"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bookmark,
  Edit3,
  Check,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Star,
  Filter,
  History,
  Target,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Friend {
  id: string;
  name: string | null;
  avatar?: string;
}

interface WatchlistItem {
  id: string; // Movie ID
  desireId?: string; // ID from WatchDesire table
  title: string;
  year: number;
  genres: string[];
  platform: string;
  poster?: string;
  description: string;
  releaseDate: string | null;
  userDesireScore: number;
  selectedFriends: string[];
  suggestedBy?: string;
  dateAdded: string;
  isWatched: boolean;
}

interface HistoryItem {
  id: string; // Movie ID
  historyId?: string; // WatchedMovie ID
  title: string;
  year: number;
  genres: string[];
  platform: string;
  poster?: string;
  watchedDate: string;
  watchedWith: string[];
  originalScore: number;
  actualRating?: number;
}

export default function WatchlistPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [markAsWatchedItem, setMarkAsWatchedItem] = useState<string | null>(
    null,
  );
  const [watchedWith, setWatchedWith] = useState<string[]>([]);
  const [historyFilter, setHistoryFilter] = useState("All");
  const [selectedFriend, setSelectedFriend] = useState("All Friends");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem("movienight_token");
        const headers = { Authorization: token ? `Bearer ${token}` : "" };

        const [watchlistRes, friendsRes] = await Promise.all([
          fetch("/api/watchlist", { headers }),
          fetch("/api/friends", { headers }),
        ]);

        const watchlistData = await watchlistRes.json();
        const friendsData = await friendsRes.json();

        if (watchlistData.success) {
          setWatchlist(watchlistData.watchlist);
          setHistory(watchlistData.history);
        }

        if (friendsData.success) {
          setFriends(
            friendsData.data.friends.map((f: any) => ({
              id: f.userId,
              name: f.name,
              avatar: f.avatar,
            })) || [],
          );
        }
      } catch (error) {
        console.error("Failed to fetch watchlist data:", error);
        toast({
          title: "Error",
          description: "Failed to load watchlist. Please try again.",
          variant: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "Netflix":
        return "bg-red-600";
      case "Disney+":
        return "bg-blue-600";
      case "Hulu":
        return "bg-green-600";
      case "Amazon Prime":
        return "bg-orange-600";
      case "HBO Max":
        return "bg-purple-600";
      case "Paramount+":
        return "bg-blue-500";
      default:
        return "bg-gray-600";
    }
  };

  const handleDesireScoreChange = (itemId: string, newScore: number[]) => {
    // Optimistic update
    setWatchlist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, userDesireScore: newScore[0] } : item,
      ),
    );

    // TODO: Debounce and save to API
  };

  const handleFriendsChange = (itemId: string, friendId: string) => {
    setWatchlist((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedFriends = item.selectedFriends.includes(friendId)
            ? item.selectedFriends.filter((id) => id !== friendId)
            : [...item.selectedFriends, friendId];
          return { ...item, selectedFriends: updatedFriends };
        }
        return item;
      }),
    );
  };

  const handleMarkAsWatched = (itemId: string) => {
    const item = watchlist.find((w) => w.id === itemId);
    if (!item) return;

    setWatchedWith(item.selectedFriends);
    setMarkAsWatchedItem(itemId);
  };

  const confirmMarkAsWatched = async () => {
    if (!markAsWatchedItem) return;

    const item = watchlist.find((w) => w.id === markAsWatchedItem);
    if (!item) return;

    try {
      const token = localStorage.getItem("movienight_token");
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          action: "markWatched",
          movieId: item.id,
          watchedWith,
        }),
      });

      if (res.ok) {
        setWatchlist((prev) =>
          prev.map((w) =>
            w.id === markAsWatchedItem ? { ...w, isWatched: true } : w,
          ),
        );

        // Add to history locally
        const newItem: HistoryItem = {
          id: item.id,
          title: item.title,
          year: item.year,
          genres: item.genres,
          platform: item.platform,
          poster: item.poster,
          watchedDate: new Date().toISOString(),
          watchedWith: watchedWith,
          originalScore: 0, // Default until rated?
        };
        setHistory((prev) => [newItem, ...prev]);

        toast({
          title: "Movie marked as watched! ✅",
          description: `${item.title} has been added to your watch history.`,
        });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as watched.",
        variant: "error",
      });
    }

    setMarkAsWatchedItem(null);
    setWatchedWith([]);
  };

  const getFriendName = (friendId: string) => {
    const friend = friends.find((f) => f.id === friendId);
    return friend?.name || "Unknown";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFilteredHistory = () => {
    let filtered = history;

    if (historyFilter !== "All") {
      filtered = filtered.filter((item) => item.genres.includes(historyFilter));
    }

    if (selectedFriend !== "All Friends") {
      const friendId = friends.find((f) => f.name === selectedFriend)?.id;
      if (friendId) {
        filtered = filtered.filter((item) =>
          item.watchedWith.includes(friendId),
        );
      }
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.watchedDate).getTime() - new Date(a.watchedDate).getTime(),
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Watchlist & History</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Manage your movie preferences and track your viewing history.
        </p>
      </div>

      {/* Section 1: Your Watchlist */}
      <Card className="bg-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-primary" />
            🎯 Your Watchlist
          </CardTitle>
          <p className="text-muted-foreground">
            Movies you want to watch - edit your desire scores and plan who to
            watch with.
          </p>
        </CardHeader>
        <CardContent>
          {watchlist.filter((item) => !item.isWatched).length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Your watchlist is empty
              </h3>
              <p className="text-muted-foreground">
                Start suggesting movies to friends to build your watchlist!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {watchlist
                .filter((item) => !item.isWatched)
                .map((item) => (
                  <Card
                    key={item.id}
                    className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-bold text-lg">
                              {item.title} ({item.year})
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    getPlatformColor(item.platform),
                                  )}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {item.platform}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Release: {formatDate(item.releaseDate)}
                              </span>
                            </div>
                            {item.suggestedBy && (
                              <p className="text-xs text-muted-foreground">
                                Suggested by {item.suggestedBy}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingItem(
                                editingItem === item.id ? null : item.id,
                              )
                            }
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-1">
                          {item.genres.map((genre) => (
                            <Badge
                              key={genre}
                              variant="secondary"
                              className="text-xs"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {item.description}
                        </p>

                        {/* Editable Fields */}
                        <div className="space-y-4 pt-2 border-t">
                          {/* Desire Score */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Your WatchDesire ({item.userDesireScore}/10)
                            </label>
                            <Slider
                              value={[item.userDesireScore]}
                              onValueChange={(value: number[]) =>
                                handleDesireScoreChange(item.id, value)
                              }
                              max={10}
                              min={1}
                              step={1}
                              className="w-full"
                              disabled={editingItem !== item.id}
                            />
                          </div>

                          {/* Who to watch with */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Who to watch with
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {friends.map((friend) => (
                                <div
                                  key={friend.id}
                                  className={cn(
                                    "flex items-center space-x-2 p-2 rounded border transition-colors",
                                    editingItem === item.id
                                      ? "cursor-pointer hover:bg-accent"
                                      : "opacity-75",
                                  )}
                                  onClick={() =>
                                    editingItem === item.id &&
                                    handleFriendsChange(item.id, friend.id)
                                  }
                                >
                                  <Checkbox
                                    id={`${item.id}-${friend.id}`}
                                    checked={item.selectedFriends.includes(
                                      friend.id,
                                    )}
                                    disabled={editingItem !== item.id}
                                  />
                                  <label
                                    htmlFor={`${item.id}-${friend.id}`}
                                    className="text-sm font-medium leading-none cursor-pointer"
                                  >
                                    {friend.name}
                                  </label>
                                </div>
                              ))}
                              {friends.length === 0 && (
                                <p className="text-xs text-muted-foreground col-span-full">
                                  Add friends to plan viewing!
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsWatched(item.id)}
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark as Watched
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <History className="h-6 w-6 text-primary" />
            📅 Viewing History
          </CardTitle>
          <p className="text-muted-foreground">
            A timeline of everything you've watched with friends.
          </p>
        </CardHeader>
        <CardContent>
          {/* History Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={historyFilter} onValueChange={setHistoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Genres</SelectItem>
                <SelectItem value="Action">Action</SelectItem>
                <SelectItem value="Comedy">Comedy</SelectItem>
                <SelectItem value="Drama">Drama</SelectItem>
                <SelectItem value="Horror">Horror</SelectItem>
                <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                <SelectItem value="Mystery">Mystery</SelectItem>
                <SelectItem value="Thriller">Thriller</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedFriend} onValueChange={setSelectedFriend}>
              <SelectTrigger className="w-full sm:w-48">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Friends">All Friends</SelectItem>
                {friends.map((friend) => (
                  <SelectItem key={friend.id} value={friend.name}>
                    {friend.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeline View */}
          <div className="space-y-4">
            {getFilteredHistory().length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No history found</h3>
                <p className="text-muted-foreground">
                  No movies match your current filters.
                </p>
              </div>
            ) : (
              getFilteredHistory().map((item, index) => (
                <div key={item.id} className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full border-2",
                        index === 0
                          ? "bg-primary border-primary"
                          : "bg-background border-border",
                      )}
                    />
                    {index < getFilteredHistory().length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <Card className="flex-1 mb-4">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-lg">
                              {item.title} ({item.year})
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {formatDate(item.watchedDate)}
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    getPlatformColor(item.platform),
                                  )}
                                />
                                {item.platform}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              Expected: {item.originalScore}
                            </Badge>
                            {item.actualRating && (
                              <Badge className="text-xs bg-green-600">
                                <Star className="h-3 w-3 mr-1" />
                                Actual: {item.actualRating}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-1">
                          {item.genres.map((genre) => (
                            <Badge
                              key={genre}
                              variant="secondary"
                              className="text-xs"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>

                        {/* Watched with */}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Watched with:{" "}
                          </span>
                          <div className="flex gap-1">
                            {item.watchedWith.length > 0 ? (
                              item.watchedWith.map((friendId, idx) => (
                                <Badge
                                  key={friendId}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {getFriendName(friendId)}
                                  {idx < item.watchedWith.length - 1 && ","}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Just me
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score comparison */}
                        {item.actualRating &&
                          item.actualRating !== item.originalScore && (
                            <div className="text-xs text-muted-foreground bg-accent/30 p-2 rounded">
                              {item.actualRating > item.originalScore
                                ? "🎉 Better than expected!"
                                : "😐 Didn't quite meet expectations"}
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mark as Watched Dialog */}
      <Dialog
        open={markAsWatchedItem !== null}
        onOpenChange={() => setMarkAsWatchedItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Watched</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Who did you watch with?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-accent"
                    onClick={() =>
                      setWatchedWith((prev) =>
                        prev.includes(friend.id)
                          ? prev.filter((id) => id !== friend.id)
                          : [...prev, friend.id],
                      )
                    }
                  >
                    <Checkbox checked={watchedWith.includes(friend.id)} />
                    <span className="text-sm">{friend.name || "Unknown"}</span>
                  </div>
                ))}
                {friends.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No friends found.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmMarkAsWatched} className="flex-1">
                <Sparkles className="h-4 w-4 mr-2" />
                Confirm
              </Button>
              <Button
                variant="outline"
                onClick={() => setMarkAsWatchedItem(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
