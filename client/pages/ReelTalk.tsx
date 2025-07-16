import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriends } from "@/lib/userData";
import {
  getUserStats,
  getSquadStats,
  formatStatsNumber,
  getRankSuffix,
  getStatsCardColor,
  MOCK_MONTHLY_STATS,
} from "@/lib/statsData";

export default function ReelTalk() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"individual" | "group">("group");

  if (!user) return null;

  // Get user's data
  const userStats = getUserStats(user.id);
  const userFriends = getUserFriends(user.id);
  const squadLeaderboard = getSquadStats(
    user.id,
    userFriends.map((f) => f.id),
  );

  // Find user's position in squad
  const userPosition =
    squadLeaderboard.findIndex((entry) => entry.user.id === user.id) + 1;

  if (!userStats) return null;

  const getBadgeIcon = (badge: string) => {
    if (badge.includes("🐐")) return "👑";
    if (badge.includes("👀")) return "🎬";
    if (badge.includes("💩")) return "💔";
    if (badge.includes("🎯")) return "🎯";
    if (badge.includes("🎭")) return "🎭";
    return "🏆";
  };

  const getBadgeColor = (badge: string) => {
    if (badge.includes("🐐")) return "bg-yellow-500 text-white";
    if (badge.includes("👀")) return "bg-blue-500 text-white";
    if (badge.includes("💩")) return "bg-red-500 text-white";
    if (badge.includes("🎯")) return "bg-green-500 text-white";
    if (badge.includes("🎭")) return "bg-purple-500 text-white";
    return "bg-gray-500 text-white";
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">🏆 ReelTalk</h1>
        </div>
        <p className="text-muted-foreground text-lg">
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
            <Badge variant="outline">
              Squad Rank: {getRankSuffix(userPosition)}
            </Badge>
            {squadLeaderboard
              .find((entry) => entry.user.id === user.id)
              ?.badges.map((badge) => (
                <Badge
                  key={badge}
                  className={cn("text-xs", getBadgeColor(badge))}
                >
                  {getBadgeIcon(badge)} {badge.split(" ").slice(1).join(" ")}
                </Badge>
              ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Suggestions Made */}
            <Card className="border-0 bg-accent/30">
              <CardContent className="p-4 text-center">
                <div className="space-y-2">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white",
                      getStatsCardColor(
                        userStats.totalSuggestionsMade,
                        "count",
                      ),
                    )}
                  >
                    <Target className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold">
                    {userStats.totalSuggestionsMade}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    🎯 Total Suggestions Made
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg WatchDesire on Your Picks */}
            <Card className="border-0 bg-accent/30">
              <CardContent className="p-4 text-center">
                <div className="space-y-2">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white",
                      getStatsCardColor(
                        userStats.avgWatchDesireOnPicks,
                        "desire",
                      ),
                    )}
                  >
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold">
                    {formatStatsNumber(userStats.avgWatchDesireOnPicks)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    🔥 Avg WatchDesire on Your Picks
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Movies Watched */}
            <Card className="border-0 bg-accent/30">
              <CardContent className="p-4 text-center">
                <div className="space-y-2">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white",
                      getStatsCardColor(userStats.totalMoviesWatched, "count"),
                    )}
                  >
                    <Film className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold">
                    {userStats.totalMoviesWatched}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    🍿 Total Movies Watched
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg Post-Watch Rating */}
            <Card className="border-0 bg-accent/30">
              <CardContent className="p-4 text-center">
                <div className="space-y-2">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white",
                      getStatsCardColor(userStats.avgPostWatchRating, "rating"),
                    )}
                  >
                    <Star className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold">
                    {formatStatsNumber(userStats.avgPostWatchRating)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ⭐ Avg Post-Watch Rating
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Squad Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" />
            🧑‍🤝‍🧑 Squad Rankings
          </CardTitle>
          <p className="text-muted-foreground">
            See how you and your friends stack up
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {squadLeaderboard.map((entry, index) => (
              <Card
                key={entry.user.id}
                className={cn(
                  "border-l-4 transition-all hover:bg-accent/20",
                  index === 0 &&
                    "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
                  index === 1 &&
                    "border-l-gray-400 bg-gray-50/50 dark:bg-gray-950/20",
                  index === 2 &&
                    "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20",
                  index >= 3 && "border-l-primary/30",
                  entry.user.id === user.id && "ring-2 ring-primary/30",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* User Info & Rank */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                              index === 0 && "bg-yellow-500 text-white",
                              index === 1 && "bg-gray-400 text-white",
                              index === 2 && "bg-orange-500 text-white",
                              index >= 3 && "bg-primary/20 text-primary",
                            )}
                          >
                            {index < 3 ? (
                              <>
                                {index === 0 && <Crown className="h-6 w-6" />}
                                {index === 1 && <Award className="h-6 w-6" />}
                                {index === 2 && <Medal className="h-6 w-6" />}
                              </>
                            ) : (
                              `#${index + 1}`
                            )}
                          </div>
                          {entry.user.id === user.id && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-xs text-white">👤</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {entry.user.name}
                            {entry.user.id === user.id && (
                              <span className="text-primary ml-1">(You)</span>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            @{entry.user.username}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-lg">
                          {entry.totalSuggestionsMade}
                        </div>
                        <div className="text-muted-foreground">Suggestions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">
                          {formatStatsNumber(entry.avgWatchDesire)}
                        </div>
                        <div className="text-muted-foreground">Avg Desire</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">
                          {formatStatsNumber(entry.avgPostWatchRating)}
                        </div>
                        <div className="text-muted-foreground">
                          Post-Watch Rating
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">
                          {entry.totalMoviesWatched}
                        </div>
                        <div className="text-muted-foreground">Watched</div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col gap-1">
                      {entry.badges.map((badge) => (
                        <Badge
                          key={badge}
                          className={cn("text-xs", getBadgeColor(badge))}
                        >
                          {getBadgeIcon(badge)}{" "}
                          {badge.split(" ").slice(1).join(" ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="h-6 w-6 text-primary" />
            📆 Monthly Stats
          </CardTitle>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Movies watched over the last 6 months
            </p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "individual" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("individual")}
              >
                Individual
              </Button>
              <Button
                variant={viewMode === "group" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("group")}
              >
                Squad
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chart */}
            <div className="h-64 flex items-end justify-between gap-2 border-l-2 border-b-2 border-border pl-4 pb-4">
              {MOCK_MONTHLY_STATS.map((stat, index) => {
                const value =
                  viewMode === "individual"
                    ? stat.moviesWatched
                    : stat.groupMoviesWatched;
                const maxValue = Math.max(
                  ...MOCK_MONTHLY_STATS.map((s) =>
                    viewMode === "individual"
                      ? s.moviesWatched
                      : s.groupMoviesWatched,
                  ),
                );
                const height = (value / maxValue) * 200;

                return (
                  <div
                    key={stat.month}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={cn(
                        "w-8 bg-primary rounded-t transition-all duration-300 hover:bg-primary/80 flex items-end justify-center relative group",
                        index === MOCK_MONTHLY_STATS.length - 1 &&
                          "bg-primary/70",
                      )}
                      style={{ height: `${height}px`, minHeight: "20px" }}
                    >
                      <div className="absolute -top-6 bg-background border rounded px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {value}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {stat.month}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span>
                  {viewMode === "individual"
                    ? "Movies you watched"
                    : "Movies watched by squad"}
                </span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {MOCK_MONTHLY_STATS.reduce(
                    (sum, stat) =>
                      sum +
                      (viewMode === "individual"
                        ? stat.moviesWatched
                        : stat.groupMoviesWatched),
                    0,
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total 6 Months
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(
                    MOCK_MONTHLY_STATS.reduce(
                      (sum, stat) =>
                        sum +
                        (viewMode === "individual"
                          ? stat.moviesWatched
                          : stat.groupMoviesWatched),
                      0,
                    ) / MOCK_MONTHLY_STATS.length,
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg per Month
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.max(
                    ...MOCK_MONTHLY_STATS.map((stat) =>
                      viewMode === "individual"
                        ? stat.moviesWatched
                        : stat.groupMoviesWatched,
                    ),
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Best Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {MOCK_MONTHLY_STATS[MOCK_MONTHLY_STATS.length - 1][
                    viewMode === "individual"
                      ? "moviesWatched"
                      : "groupMoviesWatched"
                  ] >
                  MOCK_MONTHLY_STATS[MOCK_MONTHLY_STATS.length - 2][
                    viewMode === "individual"
                      ? "moviesWatched"
                      : "groupMoviesWatched"
                  ]
                    ? "📈"
                    : "📉"}
                </div>
                <div className="text-sm text-muted-foreground">Trend</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
