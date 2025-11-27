"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Target,
  Film,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  Crown,
  Award,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface StatsEntry {
  rank: number;
  id: string;
  name: string;
  totalWatched: number;
  suggestions: number;
  avgRating: number; // TODO: implement rating tracking
  avgDesire: number;
  acceptanceRate: number;
}

interface UserStats {
  rank: number;
  totalWatched: number;
  suggestions: number;
  acceptanceRate: number;
  avgDesire: number;
  favGenre: string;
}

export default function StatsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [squadStats, setSquadStats] = useState<StatsEntry[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem("movienight_token");
        const headers = { Authorization: token ? `Bearer ${token}` : "" };

        const res = await fetch("/api/stats", { headers });
        const data = await res.json();

        if (data.success) {
          setSquadStats(data.squadStats);
          setUserStats(data.userStats);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const getStatsCardColor = (value: number) => {
    if (value >= 8) return "bg-green-500";
    if (value >= 7) return "bg-blue-500";
    if (value >= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
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
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            🏆 ReelTalk
          </h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Your squad's movie-watching stats & wins
        </p>
      </div>

      {/* Your Stats */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-primary" />
            📊 Your Stats
          </CardTitle>
          <div className="flex items-center gap-2">
            {userStats && (
              <Badge variant="outline">
                Squad Rank: {getMedalIcon(userStats.rank)}
              </Badge>
            )}
            {/* Badges logic could be dynamic based on stats */}
            {userStats && userStats.totalWatched > 10 && (
              <Badge className="bg-yellow-500 text-white text-xs">
                👑 Movie Maestro
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {userStats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Movies Watched */}
              <Card className="border-0 bg-accent/30">
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white bg-purple-500">
                      <Film className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold">
                      {userStats.totalWatched}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      🎬 Movies Watched
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Suggestions Made */}
              <Card className="border-0 bg-accent/30">
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white bg-green-500">
                      <Target className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold">
                      {userStats.suggestions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      🎯 Suggestions Made
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Acceptance Rate */}
              <Card className="border-0 bg-accent/30">
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white bg-blue-500">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold">
                      {userStats.acceptanceRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ✅ Acceptance Rate
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Avg Watch Desire Score */}
              <Card className="border-0 bg-accent/30">
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white",
                        getStatsCardColor(userStats.avgDesire),
                      )}
                    >
                      <Star className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold">
                      {userStats.avgDesire}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      🔥 Avg Desire Score
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-4">No stats available yet.</div>
          )}

          {/* Additional Info */}
          {userStats && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Favorite Genre
                  </p>
                  <p className="text-lg font-semibold">{userStats.favGenre}</p>
                </div>
                {/* <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Movies this month
                </p>
                <p className="text-lg font-semibold">7 new</p>
              </div> */}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Individual vs Group */}
      <Tabs defaultValue="group" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual Stats</TabsTrigger>
          <TabsTrigger value="group">Squad Leaderboard</TabsTrigger>
        </TabsList>

        {/* Individual Stats Tab */}
        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Squad Leaderboard Tab */}
        <TabsContent value="group" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Squad Rankings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Overall stats for your entire squad
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {squadStats.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                      entry.rank === 1
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                        : "bg-accent/30",
                    )}
                  >
                    {/* Rank */}
                    <div className="text-2xl font-bold w-12 text-center">
                      {getMedalIcon(entry.rank)}
                    </div>

                    {/* Name */}
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.suggestions} suggestions
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-right">
                      <div>
                        <div className="text-sm font-semibold">
                          {entry.totalWatched}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Watched
                        </div>
                      </div>
                      <div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-white",
                            getStatsCardColor(entry.avgDesire), // Using avgDesire as color indicator for now
                          )}
                        >
                          {entry.avgDesire}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {squadStats.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No squad stats yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Achievements Section - Static for now or TODO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            🏅 Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: "👑", name: "Movie Maestro", desc: "Most suggestions" },
              { icon: "🎯", name: "Accurate", desc: "70%+ acceptance" },
              {
                icon: "🎭",
                name: "Genre Master",
                desc: "Expert in Thriller",
              },
              { icon: "🔥", name: "Hot Take", desc: "Highest avg rating" },
              {
                icon: "👀",
                name: "Film Fanatic",
                desc: "20+ movies watched",
              },
              { icon: "⭐", name: "Rising Star", desc: "New this month" },
            ].map((achievement, i) => (
              <div
                key={i}
                className="flex flex-col items-center p-4 rounded-lg bg-accent/30 border border-primary/20 text-center"
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className="font-semibold text-sm">{achievement.name}</p>
                <p className="text-xs text-muted-foreground">
                  {achievement.desc}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
