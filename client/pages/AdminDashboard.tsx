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
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingRateLimit, setLoadingRateLimit] = useState(false);

  // TMDB state
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetTime: Date | null;
    isLimited: boolean;
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

  // Reset user password
  const resetPassword = async () => {
    if (!resetPasswordModal.user || !newPassword) return;

    setResettingPassword(true);
    try {
      const result: ApiResponse = await apiCall("/admin/users/reset-password", {
        method: "POST",
        body: JSON.stringify({
          userId: resetPasswordModal.user.id,
          newPassword: newPassword,
        }),
      });

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
      const result: ApiResponse = await apiCall(
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

  // Load data on component mount
  useEffect(() => {
    if (isAdmin && token) {
      loadUsers();
      loadMovies();
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
      title: "Active Friendships",
      value: friendships.filter((f) => f.status === "accepted").length,
      icon: Heart,
      description: "Connected users",
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
    { key: "platform", label: "Platform" },
    {
      key: "createdAt",
      label: "Added",
      render: (value: string) => formatDate(value),
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
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
