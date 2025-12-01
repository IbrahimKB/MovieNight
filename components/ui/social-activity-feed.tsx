"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  movie: string;
  timestamp: string;
}

export default function SocialActivityFeed({
  className,
}: {
  className?: string;
}) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        // Fetch notifications as a proxy for activity for now
        const res = await fetch("/api/notifications", { credentials: "include" });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const formattedActivity = data.data.map((item: any) => ({
            id: item.id,
            user: "System", // You might want to enrich this with real user data if available
            action: item.type.replace('_', ' '),
            movie: item.title,
            timestamp: new Date(item.createdAt).toLocaleDateString(),
          }));
          setActivity(formattedActivity.slice(0, 5));
        } else {
           setActivity([]);
        }
      } catch (error) {
        console.error("Failed to fetch activity");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

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
                description: `${item.user} ${item.action} ${item.movie}.`,
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
