"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Shield, RotateCw, Lock, Eye } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  role: "user" | "admin";
  joinedAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMovies: 0,
    totalEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncingMovies, setSyncingMovies] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("movienight_token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  useEffect(() => {
    // Redirect non-admins
    if (!isAdmin) {
      router.push("/");
      return;
    }

    const fetchAdminData = async () => {
      try {
        const [usersRes, statsRes] = await Promise.all([
          fetch("/api/admin/users", { headers }),
          fetch("/api/admin/stats", { headers }),
        ]);

        const usersData = await usersRes.json();
        const statsData = await statsRes.json();

        if (usersData.success && Array.isArray(usersData.data)) {
          setUsers(usersData.data);
        }

        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [token, isAdmin, router]);

  const handleSyncMovies = async () => {
    setSyncingMovies(true);
    try {
      const res = await fetch("/api/cron/init", {
        method: "POST",
        headers,
      });

      if (res.ok) {
        // Refresh stats
        const statsRes = await fetch("/api/admin/stats", { headers });
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      }
    } catch (error) {
      console.error("Failed to sync movies:", error);
    } finally {
      setSyncingMovies(false);
    }
  };

  const handlePromoteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/promote`, {
        method: "POST",
        headers,
      });

      if (res.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, role: "admin" } : u
          )
        );
      }
    } catch (error) {
      console.error("Failed to promote user:", error);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const newPassword = prompt("Enter new password:");
      if (!newPassword) return;

      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers,
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        alert("Password reset successfully");
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
  };

  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: number;
  }) => (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage MovieNight</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
        <StatCard label="Movies" value={stats.totalMovies} icon={Eye} />
        <StatCard label="Events" value={stats.totalEvents} icon={RotateCw} />
      </div>

      {/* Sync Controls */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Data Management</h2>
        <button
          onClick={handleSyncMovies}
          disabled={syncingMovies}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <RotateCw size={20} className={syncingMovies ? "animate-spin" : ""} />
          {syncingMovies ? "Syncing..." : "Sync Popular Movies"}
        </button>
        <p className="text-sm text-muted-foreground mt-2">
          Sync the latest movies and releases from the database
        </p>
      </div>

      {/* Users Management */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Users Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Username</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Role</th>
                <th className="text-left py-3 px-4 font-semibold">Joined</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border hover:bg-background/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="font-medium">{u.username}</p>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs truncate">
                    {u.email}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {u.name || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {new Date(u.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => handlePromoteUser(u.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="Promote to Admin"
                      >
                        <Shield size={14} />
                        Promote
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      title="Reset Password"
                    >
                      <Lock size={14} />
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs Panel */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-2">
          <div className="p-3 bg-background border border-border rounded-lg text-sm">
            <p className="text-muted-foreground">
              Last sync: Just now
            </p>
          </div>
          <div className="p-3 bg-background border border-border rounded-lg text-sm">
            <p className="text-muted-foreground">
              Total users: {stats.totalUsers}
            </p>
          </div>
          <div className="p-3 bg-background border border-border rounded-lg text-sm">
            <p className="text-muted-foreground">
              Movies in database: {stats.totalMovies}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
