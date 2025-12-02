"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldReduceMotion } from "@/lib/animations";

interface FriendWatcher {
  userId: string;
  username: string;
  name: string | null;
  avatar?: string;
  watchedAt: string;
  originalScore?: number | null;
}

interface FriendsWhoWatchedProps {
  movieId: string;
}

export function FriendsWhoWatched({ movieId }: FriendsWhoWatchedProps) {
  const [friendWatchers, setFriendWatchers] = useState<FriendWatcher[]>([]);
  const [totalFriendWatchers, setTotalFriendWatchers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWatchers = async () => {
      try {
        const res = await fetch(`/api/movies/${movieId}/who-watched`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch watchers");
        }

        const data = await res.json();
        if (data.success) {
          setFriendWatchers(data.data.friendWatchers);
          setTotalFriendWatchers(data.data.totalFriendWatchers);
        }
      } catch (err) {
        console.error("Error fetching watchers:", err);
        setError("Failed to load watchers");
      } finally {
        setLoading(false);
      }
    };

    fetchWatchers();
  }, [movieId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends Who Watched
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Loading...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || friendWatchers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends Who Watched
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {error || "None of your friends have watched this yet"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends Who Watched ({totalFriendWatchers})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={
            shouldReduceMotion()
              ? {}
              : {
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }
          }
        >
          {friendWatchers.map((watcher) => (
            <motion.div
              key={watcher.userId}
              variants={
                shouldReduceMotion()
                  ? {}
                  : {
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }
              }
              className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={watcher.avatar} alt={watcher.name || watcher.username} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {(watcher.name || watcher.username)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {watcher.name || watcher.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Watched on {formatDate(watcher.watchedAt)}
                  </p>
                </div>
              </div>

              {watcher.originalScore !== null &&
                watcher.originalScore !== undefined && (
                  <motion.div
                    className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg flex-shrink-0 ml-2"
                    whileHover={
                      shouldReduceMotion() ? {} : { scale: 1.05 }
                    }
                  >
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">
                      {watcher.originalScore}/10
                    </span>
                  </motion.div>
                )}
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}
