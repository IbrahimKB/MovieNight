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

// API function to fetch social activities
const fetchSocialActivities = async (): Promise<ActivityItem[]> => {
  try {
    const token = localStorage.getItem("movienight_token");
    if (!token) return [];

    const response = await fetch("/api/activities", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch activities");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching social activities:", error);
    return [];
  }
};

// API function to like/unlike an activity
const toggleActivityLike = async (activityId: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem("movienight_token");
    if (!token) return false;

    const response = await fetch(`/api/activities/${activityId}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error toggling activity like:", error);
    return false;
  }
};

interface SocialActivityFeedProps {
  className?: string;
}

export default function SocialActivityFeed({
  className,
}: SocialActivityFeedProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load activities on component mount
  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      const fetchedActivities = await fetchSocialActivities();
      setActivities(fetchedActivities);
      setLoading(false);
    };

    loadActivities();
  }, []);

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

  const handleLike = async (activityId: string) => {
    // Optimistic update
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

    // Try to sync with server
    const success = await toggleActivityLike(activityId);
    if (!success) {
      // Revert optimistic update on failure
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
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
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
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No activities yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Start by adding friends and suggesting movies to see activity
              here!
            </p>
          </div>
        ) : (
          activities.map((activity) => (
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
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          {getActivityIcon(activity.type)}
                          <span className="font-medium text-sm sm:text-base truncate">
                            {activity.user.name}
                          </span>
                          <div className="text-sm sm:text-base min-w-0 flex-1">
                            {getActivityText(activity)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Movie Details */}
                    {activity.movie && (
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-accent/30 rounded-md">
                        <div className="w-8 h-10 sm:w-12 sm:h-16 bg-muted rounded flex items-center justify-center shrink-0">
                          <Film className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="font-medium text-sm sm:text-base leading-tight">
                            {activity.movie.title} ({activity.movie.year})
                          </h4>
                          <div className="flex gap-1 flex-wrap">
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
                              <Badge
                                variant="outline"
                                className={accuracy.color}
                              >
                                {accuracy.label}
                              </Badge>
                            );
                          })()}
                        </div>
                      )}

                    {/* Interaction Buttons */}
                    <div className="flex items-center gap-3 sm:gap-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(activity.id)}
                        className={cn(
                          "h-8 px-2 sm:px-3 touch-manipulation active:scale-95",
                          activity.interactions.userLiked && "text-red-500",
                        )}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 mr-1",
                            activity.interactions.userLiked && "fill-current",
                          )}
                        />
                        <span className="text-sm">
                          {activity.interactions.likes}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleComment(activity.id)}
                        className="h-8 px-2 sm:px-3 touch-manipulation active:scale-95"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {activity.interactions.comments}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {activities.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={async () => {
              setLoadingMore(true);
              // TODO: Implement pagination when backend supports it
              setTimeout(() => setLoadingMore(false), 1000);
            }}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more activities"}
          </Button>
        </div>
      )}
    </div>
  );
}
