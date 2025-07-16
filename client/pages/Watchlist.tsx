import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import PostWatchReactionModal, {
  PostWatchReaction,
} from "@/components/PostWatchReactionModal";

interface Friend {
  id: string;
  name: string;
  avatar?: string;
}

interface WatchlistItem {
  id: string;
  title: string;
  year: number;
  genres: string[];
  platform: string;
  poster?: string;
  description: string;
  releaseDate: string;
  userDesireScore: number;
  selectedFriends: string[];
  suggestedBy?: string;
  dateAdded: string;
  isWatched: boolean;
}

interface HistoryItem {
  id: string;
  title: string;
  year: number;
  genres: string[];
  platform: string;
  poster?: string;
  watchedDate: string;
  watchedWith: string[];
  originalScore: number;
  actualRating?: number;
  reaction?: PostWatchReaction;
}

// Mock data
const mockFriends: Friend[] = [
  { id: "1", name: "Ibrahim" },
  { id: "2", name: "Omar" },
  { id: "3", name: "Sara" },
  { id: "4", name: "Alex" },
  { id: "5", name: "Maya" },
];

const mockWatchlist: WatchlistItem[] = [
  {
    id: "1",
    title: "The Menu",
    year: 2022,
    genres: ["Thriller", "Horror"],
    platform: "Netflix",
    description:
      "A young couple travels to a remote island to eat at an exclusive restaurant.",
    releaseDate: "2024-01-15",
    userDesireScore: 9,
    selectedFriends: ["2", "3"],
    suggestedBy: "Omar",
    dateAdded: "2024-01-10",
    isWatched: false,
  },
  {
    id: "2",
    title: "Glass Onion",
    year: 2022,
    genres: ["Mystery", "Comedy"],
    platform: "Netflix",
    description: "Detective Benoit Blanc travels to Greece to solve a mystery.",
    releaseDate: "2024-01-16",
    userDesireScore: 8,
    selectedFriends: ["1", "4"],
    dateAdded: "2024-01-12",
    isWatched: false,
  },
  {
    id: "3",
    title: "Avatar: The Way of Water",
    year: 2022,
    genres: ["Action", "Adventure", "Sci-Fi"],
    platform: "Disney+",
    description: "Jake Sully continues his story on Pandora.",
    releaseDate: "2024-01-17",
    userDesireScore: 7,
    selectedFriends: ["2", "5"],
    dateAdded: "2024-01-08",
    isWatched: false,
  },
];

const mockHistory: HistoryItem[] = [
  {
    id: "1",
    title: "Everything Everywhere All at Once",
    year: 2022,
    genres: ["Sci-Fi", "Comedy", "Drama"],
    platform: "Amazon Prime",
    watchedDate: "2024-01-05",
    watchedWith: ["2", "3"], // Omar, Sara
    originalScore: 8,
    actualRating: 9,
  },
  {
    id: "2",
    title: "Top Gun: Maverick",
    year: 2022,
    genres: ["Action", "Drama"],
    platform: "Paramount+",
    watchedDate: "2023-12-28",
    watchedWith: ["1", "4"], // Ibrahim, Alex
    originalScore: 7,
    actualRating: 8,
  },
  {
    id: "3",
    title: "The Bear Season 2",
    year: 2023,
    genres: ["Comedy", "Drama"],
    platform: "Hulu",
    watchedDate: "2023-12-20",
    watchedWith: ["5"], // Maya
    originalScore: 9,
    actualRating: 10,
  },
  {
    id: "4",
    title: "Wednesday",
    year: 2022,
    genres: ["Comedy", "Horror", "Mystery"],
    platform: "Netflix",
    watchedDate: "2023-12-15",
    watchedWith: ["2", "3", "5"], // Omar, Sara, Maya
    originalScore: 7,
    actualRating: 8,
  },
];

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(mockWatchlist);
  const [history] = useState<HistoryItem[]>(mockHistory);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [markAsWatchedItem, setMarkAsWatchedItem] = useState<string | null>(
    null,
  );
  const [watchedDate, setWatchedDate] = useState<Date | undefined>(new Date());
  const [watchedWith, setWatchedWith] = useState<string[]>([]);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [pendingWatchedItem, setPendingWatchedItem] =
    useState<WatchlistItem | null>(null);
  const [historyFilter, setHistoryFilter] = useState("All");
  const [selectedFriend, setSelectedFriend] = useState("All Friends");

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
    setWatchlist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, userDesireScore: newScore[0] } : item,
      ),
    );
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

    // Set default watched with to selected friends
    setWatchedWith(item.selectedFriends);
    setMarkAsWatchedItem(itemId);
  };

  const confirmMarkAsWatched = () => {
    if (!markAsWatchedItem || !watchedDate) return;

    const item = watchlist.find((w) => w.id === markAsWatchedItem);
    if (!item) return;

    setPendingWatchedItem(item);
    setShowReactionModal(true);

    // Reset mark as watched state
    setMarkAsWatchedItem(null);
    setWatchedDate(new Date());
    setWatchedWith([]);
  };

  const handleReactionSave = (reaction: PostWatchReaction) => {
    if (!pendingWatchedItem) return;

    // In real app, this would create a history entry and remove from watchlist
    setWatchlist((prev) =>
      prev.map((item) =>
        item.id === pendingWatchedItem.id ? { ...item, isWatched: true } : item,
      ),
    );

    // Reset state
    setShowReactionModal(false);
    setPendingWatchedItem(null);

    // Could also add to history with reaction here
    console.log("Saved reaction:", reaction);
  };

  const getFriendName = (friendId: string) => {
    return mockFriends.find((f) => f.id === friendId)?.name || "Unknown";
  };

  const formatDate = (dateString: string) => {
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
      const friendId = mockFriends.find((f) => f.name === selectedFriend)?.id;
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
                        <p className="text-sm text-muted-foreground">
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
                              onValueChange={(value) =>
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
                              {mockFriends.map((friend) => (
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
              </SelectContent>
            </Select>
            <Select value={selectedFriend} onValueChange={setSelectedFriend}>
              <SelectTrigger className="w-full sm:w-48">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Friends">All Friends</SelectItem>
                {mockFriends.map((friend) => (
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
                            {item.watchedWith.map((friendId, idx) => (
                              <Badge
                                key={friendId}
                                variant="outline"
                                className="text-xs"
                              >
                                {getFriendName(friendId)}
                                {idx < item.watchedWith.length - 1 && ","}
                              </Badge>
                            ))}
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
              <label className="text-sm font-medium">Date watched</label>
              <Calendar
                mode="single"
                selected={watchedDate}
                onSelect={setWatchedDate}
                className="rounded-md border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Who did you watch with?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {mockFriends.map((friend) => (
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
                    <span className="text-sm">{friend.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={confirmMarkAsWatched}
                disabled={!watchedDate}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Continue to Reaction
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

      {/* Post-Watch Reaction Modal */}
      <PostWatchReactionModal
        isOpen={showReactionModal}
        onClose={() => {
          setShowReactionModal(false);
          setPendingWatchedItem(null);
        }}
        onSave={handleReactionSave}
        movieTitle={
          pendingWatchedItem
            ? `${pendingWatchedItem.title} (${pendingWatchedItem.year})`
            : ""
        }
        originalScore={pendingWatchedItem?.userDesireScore}
      />
    </div>
  );
}
