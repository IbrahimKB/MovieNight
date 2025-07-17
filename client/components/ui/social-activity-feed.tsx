import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Share2,
  Star,
  Calendar,
  Users,
  Film,
  Tv,
  Clock,
  ThumbsUp,
  Eye,
  TrendingUp,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface ActivityItem {
  id: string;
  type:
    | "suggestion"
    | "watched"
    | "rated"
    | "friend_joined"
    | "movie_night"
    | "review";
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  movie?: {
    id: string;
    title: string;
    year: number;
    poster?: string;
    genres: string[];
  };
  metadata: {
    rating?: number;
    desire_rating?: number;
    comment?: string;
    suggested_to?: string[];
    watch_date?: string;
    platform?: string;
  };
  timestamp: string;
  interactions: {
    likes: number;
    comments: number;
    userLiked?: boolean;
  };
}

// Mock social activity data
const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "suggestion",
    user: { id: "user-2", name: "Omar" },
    movie: {
      id: "1",
      title: "The Menu",
      year: 2022,
      genres: ["Thriller", "Horror"],
    },
    metadata: {
      desire_rating: 8,
      comment: "Perfect for our horror movie night! 🍽️",
      suggested_to: ["user-3", "user-4"],
    },
    timestamp: "2025-01-17T10:30:00Z",
    interactions: { likes: 3, comments: 2, userLiked: false },
  },
  {
    id: "2",
    type: "watched",
    user: { id: "user-3", name: "Sara" },
    movie: {
      id: "2",
      title: "Glass Onion: A Knives Out Mystery",
      year: 2022,
      genres: ["Mystery", "Comedy"],
    },
    metadata: {
      rating: 9,
      watch_date: "2025-01-16",
      platform: "Netflix",
    },
    timestamp: "2025-01-16T22:15:00Z",
    interactions: { likes: 5, comments: 3, userLiked: true },
  },
  {
    id: "3",
    type: "movie_night",
    user: { id: "user-4", name: "Alex" },
    movie: {
      id: "3",
      title: "Avatar: The Way of Water",
      year: 2022,
      genres: ["Action", "Adventure", "Sci-Fi"],
    },
    metadata: {
      watch_date: "2025-01-18T20:00:00Z",
      comment: "Who's ready for an epic Friday night? 🌊",
    },
    timestamp: "2025-01-16T15:45:00Z",
    interactions: { likes: 8, comments: 4, userLiked: false },
  },
  {
    id: "4",
    type: "friend_joined",
    user: { id: "user-5", name: "Maya" },
    metadata: {},
    timestamp: "2025-01-16T09:20:00Z",
    interactions: { likes: 12, comments: 0, userLiked: false },
  },
  {
    id: "5",
    type: "rated",
    user: { id: "user-2", name: "Omar" },
    movie: {
      id: "4",
      title: "The Batman",
      year: 2022,
      genres: ["Action", "Crime", "Drama"],
    },
    metadata: {
      rating: 7,
      desire_rating: 6,
      comment: "Better than expected! Robert Pattinson nailed it 🦇",
    },
    timestamp: "2025-01-15T19:30:00Z",
    interactions: { likes: 6, comments: 1, userLiked: true },
  },
];

interface SocialActivityFeedProps {
  className?: string;
}

export default function SocialActivityFeed({
  className,
}: SocialActivityFeedProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);
  const [loading, setLoading] = useState(false);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLike = (activityId: string) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id === activityId) {
          const userLiked = !activity.interactions.userLiked;
          return {
            ...activity,
            interactions: {
              ...activity.interactions,
              userLiked,
              likes: userLiked
                ? activity.interactions.likes + 1
                : activity.interactions.likes - 1,
            },
          };
        }
        return activity;
      }),
    );
  };

  const handleComment = (activityId: string) => {
    toast({
      title: "Comments",
      description: "Comment functionality coming soon!",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "suggestion":
        return <Share2 className="h-4 w-4 text-blue-500" />;
      case "watched":
        return <Eye className="h-4 w-4 text-green-500" />;
      case "rated":
        return <Star className="h-4 w-4 text-yellow-500" />;
      case "movie_night":
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case "friend_joined":
        return <Users className="h-4 w-4 text-pink-500" />;
      default:
        return <Film className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "suggestion":
        return (
          <span>
            suggested <strong>{activity.movie?.title}</strong> to{" "}
            {activity.metadata.suggested_to?.length || 0} friends
          </span>
        );
      case "watched":
        return (
          <span>
            watched <strong>{activity.movie?.title}</strong> and rated it{" "}
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {activity.metadata.rating}/10
            </span>
          </span>
        );
      case "rated":
        const desire = activity.metadata.desire_rating || 0;
        const actual = activity.metadata.rating || 0;
        const accuracy =
          desire > 0
            ? Math.round((1 - Math.abs(desire - actual) / 10) * 100)
            : 0;
        return (
          <span>
            rated <strong>{activity.movie?.title}</strong>{" "}
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {actual}/10
            </span>
            {desire > 0 && (
              <span className="text-sm text-muted-foreground">
                {" "}
                • {accuracy}% prediction accuracy
              </span>
            )}
          </span>
        );
      case "movie_night":
        return (
          <span>
            planned a movie night for <strong>{activity.movie?.title}</strong>
          </span>
        );
      case "friend_joined":
        return <span>joined MovieNight! 🎉</span>;
      default:
        return <span>did something with movies</span>;
    }
  };

  const getSuggestionAccuracy = (
    desireRating: number,
    actualRating: number,
  ) => {
    const accuracy = Math.round(
      (1 - Math.abs(desireRating - actualRating) / 10) * 100,
    );
    if (accuracy >= 90)
      return { label: "🎯 Excellent", color: "text-green-600" };
    if (accuracy >= 75) return { label: "👍 Good", color: "text-blue-600" };
    if (accuracy >= 60) return { label: "👌 Fair", color: "text-yellow-600" };
    return { label: "📊 Needs work", color: "text-red-600" };
  };

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
            Activity Feed
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
            See what your friends are watching and suggesting
          </p>
          <p className="text-sm text-muted-foreground sm:hidden">
            Friend activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs sm:text-sm"
        >
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Trending</span>
          <span className="sm:hidden">Hot</span>
        </Button>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3 sm:space-y-4">
        {activities.map((activity) => (
          <Card
            key={activity.id}
            className="hover:shadow-md transition-shadow active:scale-[0.98] sm:active:scale-100"
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3">
                {/* User Avatar */}
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                    {activity.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                  {/* Activity Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.type)}
                        <span className="font-medium">
                          {activity.user.name}
                        </span>
                        {getActivityText(activity)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Movie Details */}
                  {activity.movie && (
                    <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-md">
                      <div className="w-12 h-16 bg-muted rounded flex items-center justify-center shrink-0">
                        <Film className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">
                          {activity.movie.title} ({activity.movie.year})
                        </h4>
                        <div className="flex gap-1">
                          {activity.movie.genres.slice(0, 2).map((genre) => (
                            <Badge
                              key={genre}
                              variant="secondary"
                              className="text-xs"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>
                        {activity.metadata.platform && (
                          <p className="text-xs text-muted-foreground">
                            on {activity.metadata.platform}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comment */}
                  {activity.metadata.comment && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm italic">
                        "{activity.metadata.comment}"
                      </p>
                    </div>
                  )}

                  {/* Suggestion Accuracy Badge */}
                  {activity.type === "rated" &&
                    activity.metadata.desire_rating &&
                    activity.metadata.rating && (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const accuracy = getSuggestionAccuracy(
                            activity.metadata.desire_rating,
                            activity.metadata.rating,
                          );
                          return (
                            <Badge variant="outline" className={accuracy.color}>
                              {accuracy.label}
                            </Badge>
                          );
                        })()}
                      </div>
                    )}

                  {/* Interaction Buttons */}
                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(activity.id)}
                      className={cn(
                        "h-8 px-2",
                        activity.interactions.userLiked && "text-red-500",
                      )}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 mr-1",
                          activity.interactions.userLiked && "fill-current",
                        )}
                      />
                      {activity.interactions.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComment(activity.id)}
                      className="h-8 px-2"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {activity.interactions.comments}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setLoading(true)}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load more activities"}
        </Button>
      </div>
    </div>
  );
}
