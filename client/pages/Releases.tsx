import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReleasesCalendar from "@/components/ui/releases-calendar";
import { PlatformBadges } from "@/components/ui/platform-logo";
import {
  Calendar,
  RefreshCw,
  Clock,
  Filter,
  TrendingUp,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Release {
  id: string;
  title: string;
  platform: string;
  releaseDate: string;
  genres: string[];
  description?: string;
  year: number;
  poster?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface SyncResult {
  totalReleases: number;
  syncTime: string;
  daysAhead: number;
}

interface RateLimitStatus {
  remaining: number;
  resetTime: Date | null;
  isLimited: boolean;
}

export default function ReleasesPage() {
  const { token } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [filteredReleases, setFilteredReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [rateLimitStatus, setRateLimitStatus] =
    useState<RateLimitStatus | null>(null);

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");

  // API helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    return response.json();
  };

  // Load releases
  const loadReleases = async () => {
    try {
      console.log("🔄 Loading releases...");
      const result: ApiResponse<Release[]> = await apiCall("/releases");
      console.log("✅ Releases API response:", result);

      if (result.success && result.data) {
        console.log("📝 Setting releases:", result.data);
        setReleases(result.data);
      } else {
        console.error("❌ Releases API error:", result.error);
        toast.error(result.error || "Failed to load releases");
      }
    } catch (error) {
      console.error("❌ Releases load exception:", error);
      toast.error("Failed to load releases");
    }
  };

  // Load TMDB status
  const loadTMDBStatus = async () => {
    try {
      const result: ApiResponse<RateLimitStatus & { service?: string }> =
        await apiCall("/releases/tmdb-status");
      if (result.success && result.data) {
        setRateLimitStatus({
          ...result.data,
          resetTime: result.data.resetTime
            ? new Date(result.data.resetTime)
            : null,
        });
      }
    } catch (error) {
      console.error("Failed to load TMDB status:", error);
    }
  };

  // Manual sync
  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      const days =
        selectedPeriod === "week" ? 7 : selectedPeriod === "quarter" ? 90 : 30;

      const result: ApiResponse<{
        result: SyncResult;
        rateLimit: RateLimitStatus;
      }> = await apiCall(`/releases/sync?days=${days}`, {
        method: "POST",
      });

      if (result.success && result.data) {
        toast.success(result.message || "Releases synced successfully");
        setLastSync(result.data.result.syncTime);
        setRateLimitStatus({
          ...result.data.rateLimit,
          resetTime: result.data.rateLimit.resetTime
            ? new Date(result.data.rateLimit.resetTime)
            : null,
        });
        await loadReleases(); // Reload releases
      } else {
        toast.error(result.error || "Failed to sync releases");
      }
    } catch (error) {
      toast.error("Failed to sync releases");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Weekly sync
  const handleWeeklySync = async () => {
    try {
      const result: ApiResponse<any> = await apiCall("/releases/weekly-sync", {
        method: "POST",
      });

      if (result.success) {
        toast.success("Weekly sync completed successfully");
        await loadReleases();
        await loadTMDBStatus();
      } else {
        toast.error(result.error || "Weekly sync failed");
      }
    } catch (error) {
      toast.error("Weekly sync failed");
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...releases];

    // Filter by platform
    if (selectedPlatform !== "all") {
      filtered = filtered.filter((release) =>
        release.platform.toLowerCase().includes(selectedPlatform.toLowerCase()),
      );
    }

    // Filter by period
    if (selectedPeriod !== "all") {
      const now = new Date();
      let endDate: Date;

      switch (selectedPeriod) {
        case "week":
          endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case "quarter":
          endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      }

      filtered = filtered.filter((release) => {
        const releaseDate = new Date(release.releaseDate);
        return releaseDate >= now && releaseDate <= endDate;
      });
    }

    // Filter by genre
    if (selectedGenre !== "all") {
      filtered = filtered.filter((release) =>
        release.genres.some((genre) =>
          genre.toLowerCase().includes(selectedGenre.toLowerCase()),
        ),
      );
    }

    setFilteredReleases(filtered);
  }, [releases, selectedPlatform, selectedPeriod, selectedGenre]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadReleases(), loadJustWatchStatus()]);
      setIsLoading(false);
    };

    if (token) {
      loadData();
    }
  }, [token]);

  // Get unique platforms and genres for filters
  const platforms = Array.from(
    new Set(
      releases.flatMap((r) => r.platform.split(", ").map((p) => p.trim())),
    ),
  ).sort();

  const genres = Array.from(new Set(releases.flatMap((r) => r.genres))).sort();

  // Statistics
  const stats = {
    total: filteredReleases.length,
    thisWeek: filteredReleases.filter((r) => {
      const releaseDate = new Date(r.releaseDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return releaseDate <= weekFromNow;
    }).length,
    thisMonth: filteredReleases.filter((r) => {
      const releaseDate = new Date(r.releaseDate);
      const monthFromNow = new Date();
      monthFromNow.setDate(monthFromNow.getDate() + 30);
      return releaseDate <= monthFromNow;
    }).length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
            Upcoming Releases
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
            Track when your favorite movies and shows are coming to streaming
            platforms
          </p>
          <p className="text-sm text-muted-foreground sm:hidden">
            Movies & shows releasing soon
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleWeeklySync}
            variant="outline"
            disabled={isRefreshing}
            className="flex-1 sm:flex-none h-9 text-sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Weekly Sync</span>
            <span className="sm:hidden">Sync</span>
          </Button>
          <Button
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none h-9 text-sm"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">Refresh Now</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              <span className="hidden sm:inline">Total Releases</span>
              <span className="sm:hidden">Total</span>
            </CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              <span className="hidden sm:inline">This Week</span>
              <span className="sm:hidden">Week</span>
            </CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {stats.thisWeek}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Releasing in 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              <span className="hidden sm:inline">This Month</span>
              <span className="sm:hidden">Month</span>
            </CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {stats.thisMonth}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Releasing in 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Status */}
      {rateLimitStatus && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            TMDB API Status: {rateLimitStatus.remaining} requests remaining
            {rateLimitStatus.isLimited && rateLimitStatus.resetTime && (
              <span className="text-destructive">
                {" "}
                - Rate limited until{" "}
                {rateLimitStatus.resetTime.toLocaleTimeString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Platform</label>
              <Select
                value={selectedPlatform}
                onValueChange={setSelectedPlatform}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Time Period
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">Next 3 Months</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Genre</label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="All genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {lastSync && (
            <div className="mt-4 text-sm text-muted-foreground">
              Last synced: {new Date(lastSync).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Releases Calendar */}
      <ReleasesCalendar
        releases={filteredReleases}
        isLoading={isLoading}
        onRefresh={handleManualSync}
      />
    </div>
  );
}
