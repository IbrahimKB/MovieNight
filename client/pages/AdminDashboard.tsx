import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable, formatDate, StatusBadge } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlatformLogo, PlatformBadges } from "@/components/ui/platform-logo";
import {
  Users,
  UserCheck,
  Film,
  Bell,
  Calendar,
  Heart,
  Eye,
  MessageSquare,
  Search,
  Database,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "user" | "admin";
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Movie {
  id: string;
  title: string;
  year: number;
  genres: string[];
  platform?: string;
  description: string;
  createdAt: string;
}

interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  status: "pending" | "accepted" | "rejected";
  requestedBy: string;
  createdAt: string;
}

interface Suggestion {
  id: string;
  movieId: string;
  suggestedBy: string;
  suggestedTo: string[];
  desireRating: number;
  comment?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface Release {
  id: string;
  title: string;
  platform: string;
  releaseDate: string;
  genres: string[];
  description?: string;
  year: number;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export default function AdminDashboard() {
  const { user, token, isAdmin } = useAuth();

  // State for different data collections
  const [users, setUsers] = useState<User[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [loadingRateLimit, setLoadingRateLimit] = useState(false);

  // TMDB state
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetTime: Date | null;
    isLimited: boolean;
  } | null>(null);

  // Scheduler state
  const [schedulerStatus, setSchedulerStatus] = useState<{
    isRunning: boolean;
    nextScheduledRun: string | null;
    schedule: string;
    timezone: string;
  } | null>(null);

  // Modal states
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    open: boolean;
    user?: User;
  }>({ open: false });
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  // API helper function
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

  // Load all users
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const result: ApiResponse<User[]> = await apiCall("/admin/users");
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        toast.error(result.error || "Failed to load users");
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load movies
  const loadMovies = async () => {
    setLoadingMovies(true);
    try {
      const result: ApiResponse<Movie[]> = await apiCall("/movies");
      if (result.success && result.data) {
        setMovies(result.data);
      } else {
        toast.error(result.error || "Failed to load movies");
      }
    } catch (error) {
      toast.error("Failed to load movies");
    } finally {
      setLoadingMovies(false);
    }
  };

  // Load releases
  const loadReleases = async () => {
    setLoadingReleases(true);
    try {
      const result: ApiResponse<Release[]> = await apiCall("/releases");
      if (result.success && result.data) {
        setReleases(result.data);
      } else {
        toast.error(result.error || "Failed to load releases");
      }
    } catch (error) {
      toast.error("Failed to load releases");
    } finally {
      setLoadingReleases(false);
    }
  };

  // Reset user password
  const resetPassword = async () => {
    if (!resetPasswordModal.user || !newPassword) return;

    setResettingPassword(true);
    try {
      const result: ApiResponse<any> = await apiCall(
        "/admin/users/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            userId: resetPasswordModal.user.id,
            newPassword: newPassword,
          }),
        },
      );

      if (result.success) {
        toast.success("Password reset successfully");
        setResetPasswordModal({ open: false });
        setNewPassword("");
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  // Delete user
  const deleteUser = async (userToDelete: User) => {
    if (userToDelete.role === "admin") {
      toast.error("Cannot delete admin user");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete user "${userToDelete.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const result: ApiResponse<any> = await apiCall(
        `/admin/users/${userToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (result.success) {
        toast.success("User deleted successfully");
        loadUsers(); // Reload users
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  // Load TMDB rate limit info
  const loadRateLimit = async () => {
    setLoadingRateLimit(true);
    try {
      const result: ApiResponse<{
        remaining: number;
        resetTime: string | null;
        isLimited: boolean;
      }> = await apiCall("/tmdb/rate-limit");
      if (result.success && result.data) {
        setRateLimitInfo({
          ...result.data,
          resetTime: result.data.resetTime
            ? new Date(result.data.resetTime)
            : null,
        });
      } else {
        toast.error(result.error || "Failed to load rate limit info");
      }
    } catch (error) {
      toast.error("Failed to load rate limit info");
    } finally {
      setLoadingRateLimit(false);
    }
  };

  // Load scheduler status
  const loadSchedulerStatus = async () => {
    try {
      const result: ApiResponse<{
        isRunning: boolean;
        nextScheduledRun: string | null;
        schedule: string;
        timezone: string;
      }> = await apiCall("/admin/scheduler/status");
      if (result.success && result.data) {
        setSchedulerStatus(result.data);
      } else {
        toast.error(result.error || "Failed to load scheduler status");
      }
    } catch (error) {
      toast.error("Failed to load scheduler status");
    }
  };

  // Trigger manual sync
  const triggerManualSync = async () => {
    try {
      const result: ApiResponse<any> = await apiCall(
        "/admin/scheduler/trigger",
        {
          method: "POST",
        },
      );
      if (result.success) {
        toast.success("Manual sync triggered successfully");
        await loadSchedulerStatus();
        await loadReleases();
      } else {
        toast.error(result.error || "Failed to trigger manual sync");
      }
    } catch (error) {
      toast.error("Failed to trigger manual sync");
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (isAdmin && token) {
      loadUsers();
      loadMovies();
      loadReleases();
      loadRateLimit();
      loadSchedulerStatus();
    }
  }, [isAdmin, token]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            You need administrator privileges to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Statistics cards
  const statsCards = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      description: "Registered users",
    },
    {
      title: "Admin Users",
      value: users.filter((u) => u.role === "admin").length,
      icon: UserCheck,
      description: "Administrator accounts",
    },
    {
      title: "Total Movies",
      value: movies.length,
      icon: Film,
      description: "Movies in catalog",
    },
    {
      title: "TMDB Searches",
      value: rateLimitInfo
        ? `${40 - rateLimitInfo.remaining}/40`
        : "Loading...",
      icon: Search,
      description: "API calls used",
    },
  ];

  // User table columns
  const userColumns = [
    { key: "username", label: "Username" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: "joinedAt",
      label: "Joined",
      render: (value: string) => formatDate(value),
    },
  ];

  // Movie table columns
  const movieColumns = [
    { key: "title", label: "Title" },
    { key: "year", label: "Year" },
    {
      key: "platform",
      label: "Platform",
      render: (value: string) =>
        value ? (
          <PlatformLogo platform={value} size="sm" />
        ) : (
          <PlatformLogo platform="Theaters" size="sm" />
        ),
    },
    {
      key: "genres",
      label: "Genres",
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((genre, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {genre}
            </Badge>
          ))}
          {value.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Added",
      render: (value: string) => formatDate(value),
    },
  ];

  // Release table columns
  const releaseColumns = [
    { key: "title", label: "Title" },
    { key: "year", label: "Year" },
    {
      key: "platform",
      label: "Platform",
      render: (value: string) => (
        <PlatformBadges platforms={value.split(", ")} size="sm" />
      ),
    },
    {
      key: "releaseDate",
      label: "Release Date",
      render: (value: string) => formatDate(value),
    },
    {
      key: "genres",
      label: "Genres",
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((genre, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {genre}
            </Badge>
          ))}
          {value.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage MovieNight users, content, and platform settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-sm">
              Administrator
            </Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Data Management Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="releases">Releases</TabsTrigger>
            <TabsTrigger value="tmdb">TMDB</TabsTrigger>
            <TabsTrigger value="friendships">Friendships</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <DataTable
              title="User Management"
              data={users}
              columns={userColumns}
              isLoading={loadingUsers}
              onEdit={(user) => setResetPasswordModal({ open: true, user })}
              onDelete={deleteUser}
            />
          </TabsContent>

          <TabsContent value="movies">
            <DataTable
              title="Movie Catalog"
              data={movies}
              columns={movieColumns}
              isLoading={loadingMovies}
            />
          </TabsContent>

          <TabsContent value="releases">
            <DataTable
              title="Upcoming Releases"
              data={releases}
              columns={releaseColumns}
              isLoading={loadingReleases}
            />
          </TabsContent>

          <TabsContent value="tmdb">
            <div className="space-y-6">
              {/* TMDB Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    TMDB API Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingRateLimit ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading rate limit info...</span>
                    </div>
                  ) : rateLimitInfo ? (
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {rateLimitInfo.remaining}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Searches Remaining
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {40 - rateLimitInfo.remaining}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Searches Used
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {rateLimitInfo.isLimited ? (
                            <Badge variant="destructive">Limited</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          API Status
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Unable to load TMDB status
                    </div>
                  )}

                  {rateLimitInfo?.resetTime && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>
                          Rate limit resets at:{" "}
                          {rateLimitInfo.resetTime.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={loadRateLimit}
                      disabled={loadingRateLimit}
                      variant="outline"
                    >
                      Refresh Status
                    </Button>
                    <Button asChild>
                      <a
                        href="/discover"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Test Movie Search
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* API Configuration Card */}
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        TMDB API Key
                      </Label>
                      <div className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                        {process.env.TMDB_API_KEY
                          ? "✓ Configured"
                          : "⚠️ Not configured"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Set the TMDB_API_KEY environment variable to enable
                        movie search
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Rate Limits</Label>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <p>• 40 requests per 10 seconds</p>
                        <p>• Searches are automatically debounced</p>
                        <p>• Rate limit status updates in real-time</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Features</Label>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <p>• Search movies and TV shows</p>
                        <p>• Save search results to local database</p>
                        <p>• Suggest movies to friends</p>
                        <p>• Real-time rate limit monitoring</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scheduler Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Release Scheduler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {schedulerStatus ? (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <div className="mt-1">
                            {schedulerStatus.isRunning ? (
                              <Badge
                                variant="default"
                                className="text-green-600"
                              >
                                ✓ Running
                              </Badge>
                            ) : (
                              <Badge variant="destructive">⚠️ Stopped</Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Schedule
                          </Label>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {schedulerStatus.schedule}
                          </div>
                        </div>
                      </div>

                      {schedulerStatus.nextScheduledRun && (
                        <div>
                          <Label className="text-sm font-medium">
                            Next Run
                          </Label>
                          <div className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                            {new Date(
                              schedulerStatus.nextScheduledRun,
                            ).toLocaleString()}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={triggerManualSync}
                          variant="outline"
                          size="sm"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Trigger Sync Now
                        </Button>
                        <Button
                          onClick={loadSchedulerStatus}
                          variant="ghost"
                          size="sm"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Refresh Status
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <p>
                          <strong>Automatic Schedule:</strong> Every Monday at
                          1:00 AM UTC
                        </p>
                        <p>
                          <strong>Purpose:</strong> Syncs upcoming movie/TV
                          releases from JustWatch
                        </p>
                        <p>
                          <strong>Timezone:</strong> {schedulerStatus.timezone}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Loading scheduler status...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="friendships">
            <DataTable
              title="Friendship Management"
              data={friendships}
              columns={[
                { key: "userId1", label: "User 1" },
                { key: "userId2", label: "User 2" },
                {
                  key: "status",
                  label: "Status",
                  render: (value: string) => <StatusBadge status={value} />,
                },
                {
                  key: "createdAt",
                  label: "Created",
                  render: (value: string) => formatDate(value),
                },
              ]}
            />
          </TabsContent>

          <TabsContent value="suggestions">
            <DataTable
              title="Movie Suggestions"
              data={suggestions}
              columns={[
                { key: "movieId", label: "Movie ID" },
                { key: "suggestedBy", label: "Suggested By" },
                { key: "desireRating", label: "Rating" },
                {
                  key: "status",
                  label: "Status",
                  render: (value: string) => <StatusBadge status={value} />,
                },
                {
                  key: "createdAt",
                  label: "Created",
                  render: (value: string) => formatDate(value),
                },
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Reset Password Modal */}
      <Dialog
        open={resetPasswordModal.open}
        onOpenChange={(open) => setResetPasswordModal({ open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <Input
                value={resetPasswordModal.user?.name || ""}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordModal({ open: false })}
            >
              Cancel
            </Button>
            <Button
              onClick={resetPassword}
              disabled={resettingPassword || !newPassword}
            >
              {resettingPassword ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
