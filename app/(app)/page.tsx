"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MovieGridSkeleton,
  ListItemSkeleton,
} from "@/components/ui/skeleton-loader";
import HeroSection from "@/components/hero-section";
import FeaturedMovieHero from "@/components/ui/featured-movie-hero";

import {
  Calendar,
  TrendingUp,
  Users,
  Film,
  Star,
  Eye,
  Target,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import SmartNudge from "@/components/SmartNudge";
import SocialActivityFeed from "@/components/ui/social-activity-feed";
import SuggestionAccuracy, {
  SuggestionLeaderboard,
} from "@/components/ui/suggestion-accuracy";

import { useAuth } from "@/contexts/AuthContext";

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

import { StatCard } from "@/components/stat-card";

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [recentReleases, setRecentReleases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Load dashboard data
  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const {
        stats: dashboardStats,
        trending,
        upcoming,
      } = await getDashboardStats();

      setStats(dashboardStats);
      setTrendingMovies(trending);
      setRecentReleases(upcoming);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull-to-refresh handler (mobile only)
  const handlePullToRefresh = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only enable on mobile (< 768px)
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      return;
    }

    if (e.type === "touchstart") {
      pullStartY.current = e.touches[0].clientY;
    } else if (e.type === "touchmove") {
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartY.current;

      if (diff > 80 && !isRefreshing && contentRef.current?.scrollTop === 0) {
        setIsRefreshing(true);
      }
    } else if (e.type === "touchend") {
      if (isRefreshing) {
        loadDashboardData().finally(() => setIsRefreshing(false));
      }
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-muted-foreground">Loading MovieNight...</p>
        </motion.div>
      </div>
    );
  }

  // Show hero section for unauthenticated users
  if (!user) {
    return <HeroSection />;
  }

  return (
    <div
      ref={contentRef}
      onTouchStart={handlePullToRefresh}
      onTouchMove={handlePullToRefresh}
      onTouchEnd={handlePullToRefresh}
      className="space-y-4 sm:space-y-6"
    >
      {/* Welcome Header */}
      <motion.div
        className="space-y-1 sm:space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
          Welcome back, {user?.name?.split(" ")[0] || "Movie Lover"}! 🎬
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Discover what your friends are watching and find your next great movie
        </p>
      </motion.div>

      {/* Pull-to-Refresh Indicator */}
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-5 w-5 text-primary" />
          </motion.div>
          <span className="ml-2 text-sm text-muted-foreground">
            Refreshing...
          </span>
        </motion.div>
      )}

      {/* Quick Stats Grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-card rounded-lg border border-primary/10 animate-pulse"
            />
          ))
        ) : (
          <>
            <StatCard
              title="Friends"
              value={stats.totalFriends}
              icon={Users}
              trend={
                stats.totalFriends > 0
                  ? `${stats.totalFriends} in your squad`
                  : "Find friends to get started"
              }
              color="text-blue-500"
              index={0}
            />

            <StatCard
              title="Suggestions"
              value={stats.activeSuggestions}
              icon={MessageSquare}
              trend={
                stats.activeSuggestions > 0
                  ? "Respond now"
                  : "No pending suggestions"
              }
              color="text-green-500"
              index={1}
            />

            <StatCard
              title="This Week"
              value={stats.moviesWatchedThisWeek}
              icon={Eye}
              trend={
                stats.moviesWatchedThisWeek > 0
                  ? "Great progress!"
                  : "Start watching"
              }
              color="text-purple-500"
              index={2}
            />

            <StatCard
              title="Accuracy"
              value={
                stats.suggestionAccuracy > 0
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
              index={3}
            />
          </>
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Left Column - Activity Feed */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <SocialActivityFeed className="space-y-3 sm:space-y-4" />
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Trending */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">
                      Trending in Network
                    </span>
                    <span className="sm:hidden">Trending</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                    onClick={() => router.push("/movies")}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 sm:space-y-3">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <ListItemSkeleton key={i} />
                    ))}
                  </div>
                ) : trendingMovies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No trending movies yet
                  </p>
                ) : (
                  <motion.div
                    className="space-y-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}
                  >
                    {trendingMovies.slice(0, 3).map((movie, idx) => (
                      <motion.div
                        key={movie.id}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          visible: { opacity: 1, x: 0 },
                        }}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer touch-manipulation active:scale-95"
                        onClick={() => router.push("/movies")}
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
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

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
            onWatchTonight={(movieTitle) =>
              console.log("Watch tonight:", movieTitle)
            }
            onDismiss={(nudgeId) => console.log("Dismissed nudge:", nudgeId)}
          />

          {/* Upcoming Releases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
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
                    onClick={() => router.push("/releases")}
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
                      <ListItemSkeleton key={i} />
                    ))}
                  </div>
                ) : recentReleases.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming releases
                  </p>
                ) : (
                  <motion.div
                    className="space-y-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}
                  >
                    {recentReleases.slice(0, 2).map((release) => (
                      <motion.div
                        key={release.id}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          visible: { opacity: 1, x: 0 },
                        }}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer touch-manipulation active:scale-95"
                        onClick={() => router.push("/releases")}
                      >
                        <div className="w-6 h-8 sm:w-8 sm:h-10 bg-muted rounded flex items-center justify-center shrink-0">
                          <Film className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm leading-none truncate">
                            {release.title}
                          </p>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
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
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

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
                onClick={() => router.push("/movies")}
              >
                <Film className="h-4 w-4 mr-2" />
                Discover Movies
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-sm h-9 touch-manipulation active:scale-95"
                onClick={() => router.push("/suggestions")}
              >
                <Users className="h-4 w-4 mr-2" />
                Suggest to Friends
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-sm h-9 touch-manipulation active:scale-95"
                onClick={() => router.push("/events")}
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
