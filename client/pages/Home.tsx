import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  TrendingUp,
  Users,
  Film,
  Star,
  Clock,
  ArrowRight,
  Target,
  Eye,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SmartNudge from "@/components/SmartNudge";
import SocialActivityFeed from "@/components/ui/social-activity-feed";
import SuggestionAccuracy, {
  SuggestionLeaderboard,
} from "@/components/ui/suggestion-accuracy";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DashboardStats,
  TrendingMovie,
  getDashboardStats,
  getTrendingMovies,
  getUpcomingReleases,
} from "@/lib/api";

// Default stats while loading
const defaultStats: DashboardStats = {
  totalFriends: 0,
  activeSuggestions: 0,
  moviesWatchedThisWeek: 0,
  suggestionAccuracy: 0,
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [recentReleases, setRecentReleases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashboardStats, trending, upcoming] = await Promise.all([
        getDashboardStats(user!.id),
        getTrendingMovies(),
        getUpcomingReleases(),
      ]);

      setStats(dashboardStats);
      setTrendingMovies(trending);
      setRecentReleases(upcoming);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = "text-primary",
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    color?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                {trend}
              </p>
            )}
          </div>
          <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0", color)} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
          Welcome back, {user?.name?.split(" ")[0] || "Movie Lover"}! 🎬
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Discover what your friends are watching and find your next great movie
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Friends"
          value={isLoading ? "..." : stats.totalFriends}
          icon={Users}
          trend={
            stats.totalFriends > 0
              ? `${stats.totalFriends} in your squad`
              : "Find friends to get started"
          }
          color="text-blue-500"
        />
        <StatCard
          title="Suggestions"
          value={isLoading ? "..." : stats.activeSuggestions}
          icon={MessageSquare}
          trend={
            stats.activeSuggestions > 0
              ? "Respond now"
              : "No pending suggestions"
          }
          color="text-green-500"
        />
        <StatCard
          title="This Week"
          value={isLoading ? "..." : stats.moviesWatchedThisWeek}
          icon={Eye}
          trend={
            stats.moviesWatchedThisWeek > 0
              ? "Great progress!"
              : "Start watching"
          }
          color="text-purple-500"
        />
        <StatCard
          title="Accuracy"
          value={
            isLoading
              ? "..."
              : stats.suggestionAccuracy > 0
                ? `${stats.suggestionAccuracy}%`
                : "N/A"
          }
          icon={Target}
          trend={
            stats.suggestionAccuracy > 0
              ? "Great predictor!"
              : "Make suggestions to track"
          }
          color="text-orange-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Social Activity Feed */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <SocialActivityFeed className="space-y-3 sm:space-y-4" />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Trending in Your Network */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Trending in Network</span>
                  <span className="sm:hidden">Trending</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                  onClick={() => navigate("/movies")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg"
                    >
                      <div className="w-6 h-8 sm:w-8 sm:h-10 bg-muted rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse" />
                        <div className="h-2 bg-muted rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : trendingMovies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No trending movies yet
                </p>
              ) : (
                trendingMovies.slice(0, 3).map((movie, index) => (
                  <div
                    key={movie.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer touch-manipulation active:scale-95"
                    onClick={() => navigate("/movie-search")}
                  >
                    <div className="w-6 h-8 sm:w-8 sm:h-10 bg-muted rounded flex items-center justify-center shrink-0">
                      <Film className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-xs sm:text-sm leading-none truncate pr-2">
                          {movie.title}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{movie.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {movie.watchCount} friends
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Suggestion Accuracy */}
          {user && (
            <SuggestionAccuracy
              userId={user.id}
              showDetails={true}
              className="border-2 border-primary/10"
            />
          )}

          {/* Smart Nudge */}
          <SmartNudge
            onWatchTonight={(movieTitle) => {
              console.log("Watch tonight:", movieTitle);
              // Could navigate to movie or add to watchlist
            }}
            onDismiss={(nudgeId) => {
              console.log("Dismissed nudge:", nudgeId);
            }}
          />

          {/* Upcoming Releases */}
          <Card className="lg:block">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Coming Soon</span>
                  <span className="sm:hidden">Releases</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/releases")}
                  className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">View Calendar</span>
                  <span className="sm:hidden">View All</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg"
                    >
                      <div className="w-6 h-8 sm:w-8 sm:h-10 bg-muted rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse" />
                        <div className="h-2 bg-muted rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentReleases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming releases
                </p>
              ) : (
                recentReleases.slice(0, 2).map((release) => (
                  <div
                    key={release.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer touch-manipulation active:scale-95"
                    onClick={() => navigate("/releases")}
                  >
                    <div className="w-6 h-8 sm:w-8 sm:h-10 bg-muted rounded flex items-center justify-center shrink-0">
                      <Film className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm leading-none truncate">
                        {release.title}
                      </p>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {release.platform}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {new Date(release.releaseDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Suggestion Leaderboard */}
          <SuggestionLeaderboard />

          {/* Quick Actions */}
          <Card className="lg:block">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-sm h-9 touch-manipulation active:scale-95"
                onClick={() => navigate("/movie-search")}
              >
                <Film className="h-4 w-4 mr-2" />
                Discover Movies
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm h-9 touch-manipulation active:scale-95"
                onClick={() => navigate("/suggest")}
              >
                <Users className="h-4 w-4 mr-2" />
                Suggest to Friends
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm h-9 touch-manipulation active:scale-95"
                onClick={() => navigate("/movie-night")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Plan Movie Night
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
