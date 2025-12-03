"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ActivityItem {
  id: string;
  userName: string;
  userImage?: string;
  action: string;
  movie: string;
  timestamp: string;
  movieId: string;
}

export default function SocialActivityFeed({
  className,
}: {
  className?: string;
}) {
  const { user } = useAuth();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch friends list
        const friendsRes = await fetch("/api/friends", {
          credentials: "include",
        });
        const friendsData = await friendsRes.json();
        const friends = friendsData.success && Array.isArray(friendsData.data)
          ? friendsData.data
          : [];

        if (friends.length === 0) {
          setActivity([]);
          setLoading(false);
          return;
        }

        // Fetch watch history for all friends (can be accessed through public API)
        // Since we can't directly fetch friends' watch history, we'll show friend-related activity
        // from notifications that indicate friends watched movies
        const notificationsRes = await fetch("/api/notifications", {
          credentials: "include",
        });
        const notificationsData = await notificationsRes.json();

        let recentActivity: ActivityItem[] = [];

        if (notificationsData.success && Array.isArray(notificationsData.data)) {
          // Build a friend map for quick lookup
          const friendMap = new Map(friends.map((f: any) => [f.id, f]));

          // Filter notifications and convert to activity items
          recentActivity = notificationsData.data
            .filter((item: any) => {
              // Show notifications about friend activity
              return item.type && item.type !== 'general';
            })
            .map((item: any) => {
              // Try to extract friend info from notification data
              const friendInfo = item.data?.fromUser || item.data?.user;
              const friendName = friendInfo?.name || friendInfo?.username || "A friend";

              return {
                id: item.id,
                userName: friendName,
                userImage: friendInfo?.avatar,
                action: getActionText(item.type),
                movie: item.title || item.data?.movieTitle || "a movie",
                timestamp: new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
                movieId: item.data?.movieId || "",
              };
            });
        }

        setActivity(recentActivity.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch activity:", error);
        setActivity([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [user]);

  const getActionText = (type: string): string => {
    const actionMap: Record<string, string> = {
      "watched": "watched",
      "movie_watched": "watched",
      "friend_request": "sent you a friend request",
      "suggestion": "suggested",
      "friend_accepted": "accepted your friend request",
    };
    return actionMap[type] || type.replace(/_/g, " ");
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading activity...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {activity.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() =>
              toast({
                title: "Activity Clicked",
                description: `${item.userName} ${item.action} ${item.movie}.`,
              })
            }
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                <strong>{item.user}</strong> {item.action}{" "}
                <span className="italic">{item.movie}</span>
              </p>
              <p className="text-xs text-muted-foreground">{item.timestamp}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
