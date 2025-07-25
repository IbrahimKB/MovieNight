import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Play, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriends, getFriendName } from "@/lib/userData";

interface SmartNudgeData {
  id: string;
  movieTitle: string;
  movieYear: number;
  platform: string;
  score: number;
  suggestedBy?: string;
  friendsWhoScored: string[];
  daysSinceSuggested: number;
  genres: string[];
}

// Empty array - real nudge data will be loaded from API
const MOCK_NUDGES: SmartNudgeData[] = [];

interface SmartNudgeProps {
  onWatchTonight: (movieTitle: string) => void;
  onDismiss: (nudgeId: string) => void;
}

export default function SmartNudge({
  onWatchTonight,
  onDismiss,
}: SmartNudgeProps) {
  const { user } = useAuth();
  const [currentNudge, setCurrentNudge] = useState<SmartNudgeData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedNudges, setDismissedNudges] = useState<string[]>(() => {
    // Load dismissed nudges from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dismissedNudges");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    if (!user) return;

    // In real app, this would fetch nudges from API based on user activity
    const validNudges: SmartNudgeData[] = [];

    if (validNudges.length > 0) {
      // Randomly pick one to show
      const randomIndex = Math.floor(Math.random() * validNudges.length);
      setCurrentNudge(validNudges[randomIndex]);
      setIsVisible(true);
    }
  }, [user, dismissedNudges]);

  const handleDismiss = () => {
    if (currentNudge) {
      const newDismissedNudges = [...dismissedNudges, currentNudge.id];
      setDismissedNudges(newDismissedNudges);

      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "dismissedNudges",
          JSON.stringify(newDismissedNudges),
        );
      }

      onDismiss(currentNudge.id);
      setIsVisible(false);
      setCurrentNudge(null);
    }
  };

  const handleWatchTonight = () => {
    if (currentNudge) {
      onWatchTonight(currentNudge.movieTitle);

      // Also dismiss after accepting
      const newDismissedNudges = [...dismissedNudges, currentNudge.id];
      setDismissedNudges(newDismissedNudges);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "dismissedNudges",
          JSON.stringify(newDismissedNudges),
        );
      }

      setIsVisible(false);
      setCurrentNudge(null);
    }
  };

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
      default:
        return "bg-gray-600";
    }
  };

  const getFriendsText = (friendIds: string[]) => {
    if (!user) return "";

    // Filter out the current user
    const otherFriends = friendIds.filter((id) => id !== user.id);

    if (otherFriends.length === 0) return "you";
    if (otherFriends.length === 1) {
      return `you and ${getFriendName(otherFriends[0])}`;
    }
    if (otherFriends.length === 2) {
      return `you, ${getFriendName(otherFriends[0])}, and ${getFriendName(otherFriends[1])}`;
    }

    return `you and ${otherFriends.length} friends`;
  };

  if (!isVisible || !currentNudge) return null;

  return (
    <Card className="border-2 border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 text-6xl">🎬</div>
        <div className="absolute bottom-4 left-4 text-4xl">🍿</div>
      </div>

      {/* Dismiss Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-background/20"
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="p-6 relative">
        <div className="space-y-4">
          {/* Reminder Badge */}
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Clock className="h-3 w-3 mr-1" />
              🕒 Reminder
            </Badge>
            <Badge variant="outline" className="text-xs">
              {currentNudge.daysSinceSuggested} days ago
            </Badge>
          </div>

          {/* Main Message */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {getFriendsText(currentNudge.friendsWhoScored)} both scored{" "}
              <span className="text-primary font-bold">
                {currentNudge.movieTitle}
              </span>{" "}
              a {currentNudge.score}. Ready to watch it?
            </h3>

            {/* Movie Details */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    getPlatformColor(currentNudge.platform),
                  )}
                />
                <span>{currentNudge.platform}</span>
              </div>
              <span>•</span>
              <span>{currentNudge.movieYear}</span>
              <span>•</span>
              <div className="flex gap-1">
                {currentNudge.genres.slice(0, 2).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {currentNudge.suggestedBy && (
              <p className="text-sm text-muted-foreground">
                Originally suggested by {currentNudge.suggestedBy}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleWatchTonight}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              🎬 Watch Tonight
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              size="lg"
              className="px-6"
            >
              Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
