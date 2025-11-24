"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Clapperboard,
  Bookmark,
  Users,
  Calendar,
  TrendingUp,
  Send,
} from "lucide-react";
import Link from "next/link";

interface Movie {
  id: string;
  title: string;
  year: number;
  poster?: string;
  genres?: string[];
}

interface DashboardStats {
  totalFriends: number;
  activeSuggestions: number;
  moviesWatchedThisWeek: number;
  suggestionAccuracy: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalFriends: 0,
    activeSuggestions: 0,
    moviesWatchedThisWeek: 0,
    suggestionAccuracy: 0,
  });
  const [recentMovies, setRecentMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [upcomingReleases, setUpcomingReleases] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("movienight_token") : null;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        // Fetch stats
        const statsPromises = [
          fetch("/api/friends", { headers }).then((r) => r.json()),
          fetch("/api/suggestions", { headers }).then((r) => r.json()),
          fetch("/api/watch/history", { headers }).then((r) => r.json()),
        ];

        const [friendsData, suggestionsData, historyData] = await Promise.all(statsPromises);

        let friendsCount = 0;
        if (friendsData.success && friendsData.data?.friends) {
          friendsCount = friendsData.data.friends.length;
        }

        let suggestionsCount = 0;
        if (suggestionsData.success && Array.isArray(suggestionsData.data)) {
          suggestionsCount = suggestionsData.data.length;
        }

        let moviesThisWeek = 0;
        if (historyData.success && Array.isArray(historyData.data)) {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          moviesThisWeek = historyData.data.filter((movie: any) => {
            const watchedDate = new Date(movie.watchedAt);
            return watchedDate >= oneWeekAgo;
          }).length;

          // Set recent movies
          setRecentMovies(historyData.data.slice(0, 4));
        }

        setStats({
          totalFriends: friendsCount,
          activeSuggestions: suggestionsCount,
          moviesWatchedThisWeek: moviesThisWeek,
          suggestionAccuracy: Math.floor(Math.random() * 30) + 70, // Placeholder
        });

        // Fetch trending movies
        const moviesRes = await fetch("/api/movies", { headers });
        const moviesData = await moviesRes.json();
        if (moviesData.success && Array.isArray(moviesData.data)) {
          setTrendingMovies(moviesData.data.slice(0, 6));
        }

        // Fetch upcoming releases
        const upcomingRes = await fetch("/api/releases/upcoming", { headers });
        const upcomingData = await upcomingRes.json();
        if (upcomingData.success && Array.isArray(upcomingData.data)) {
          setUpcomingReleases(upcomingData.data.slice(0, 6));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const QuickActionCard = ({
    icon: Icon,
    label,
    value,
    href,
  }: {
    icon: any;
    label: string;
    value: string | number;
    href: string;
  }) => (
    <button
      onClick={() => router.push(href)}
      className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:bg-card/80 transition-all group"
    >
      <Icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </button>
  );

  const MovieCard = ({ movie, size = "small" }: { movie: Movie; size?: string }) => (
    <button
      onClick={() => router.push(`/movies/${movie.id}`)}
      className={`rounded-lg overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20 ${
        size === "large" ? "col-span-2 row-span-2" : ""
      }`}
    >
      <div className="relative bg-card border border-border rounded-lg overflow-hidden aspect-video sm:aspect-[3/4] flex items-center justify-center">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="text-center p-4">
            <Clapperboard className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{movie.title}</p>
          </div>
        )}
      </div>
      <div className="mt-2 px-1">
        <p className="font-semibold text-sm truncate">{movie.title}</p>
        <p className="text-xs text-muted-foreground">{movie.year}</p>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name || user?.username}!</h1>
        <p className="text-muted-foreground text-lg">
          Discover new movies, connect with friends, and plan your movie nights.
        </p>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={Users}
            label="Friends"
            value={stats.totalFriends}
            href="/friends"
          />
          <QuickActionCard
            icon={Send}
            label="Suggestions"
            value={stats.activeSuggestions}
            href="/suggestions"
          />
          <QuickActionCard
            icon={Bookmark}
            label="Watched This Week"
            value={stats.moviesWatchedThisWeek}
            href="/watchlist"
          />
          <QuickActionCard
            icon={TrendingUp}
            label="Suggestion Accuracy"
            value={`${stats.suggestionAccuracy}%`}
            href="/suggestions"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => router.push("/movies")}
          className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:bg-card/80 transition-all text-left group"
        >
          <Clapperboard className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-semibold">Browse Movies</p>
          <p className="text-sm text-muted-foreground mt-1">Explore thousands of films</p>
        </button>

        <button
          onClick={() => router.push("/calendar")}
          className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:bg-card/80 transition-all text-left group"
        >
          <Calendar className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-semibold">Movie Events</p>
          <p className="text-sm text-muted-foreground mt-1">Check upcoming movie nights</p>
        </button>

        <button
          onClick={() => router.push("/friends")}
          className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:bg-card/80 transition-all text-left group"
        >
          <Users className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-semibold">Friends</p>
          <p className="text-sm text-muted-foreground mt-1">Connect with movie buddies</p>
        </button>
      </div>

      {/* Recently Watched */}
      {recentMovies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recently Watched</h2>
            <Link href="/watchlist" className="text-primary hover:text-primary/80 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Trending Movies */}
      {trendingMovies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Trending Now</h2>
            <Link href="/movies" className="text-primary hover:text-primary/80 text-sm font-medium">
              Explore More
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {trendingMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Releases */}
      {upcomingReleases.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Coming Soon</h2>
            <Link href="/releases" className="text-primary hover:text-primary/80 text-sm font-medium">
              View Calendar
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {upcomingReleases.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
