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
    // Fake feed data (replace with API call later)
    setTimeout(() => {
      setActivity([
        {
          id: "1",
          user: "Aisha",
          action: "watched",
          movie: "Blade Runner 2049",
          timestamp: "2h ago",
        },
        {
          id: "2",
          user: "Sam",
          action: "suggested",
          movie: "Whiplash",
          timestamp: "5h ago",
        },
      ]);
      setLoading(false);
    }, 500);
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
