"use client";

import { useState, useEffect } from "react";
import { Users, Film, Calendar, TrendingUp, Search, Shield, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  movies?: number;
}

interface Stat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  change: string;
}

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user || user.role !== "admin") return;

    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("movienight_token");
        const headers = {
          Authorization: token ? `Bearer ${token}` : "",
        };

        const [usersRes, statsRes] = await Promise.all([
          fetch("/api/admin/users", { headers }),
          fetch("/api/admin/stats", { headers }),
        ]);

        const usersData = await usersRes.json();
        const statsData = await statsRes.json();

        setUsers(usersData.data || []);
        
        if (statsData.data) {
          setStats([
            {
              label: "Total Users",
              value: statsData.data.totalUsers || 0,
              icon: Users,
              change: "+12 this week",
            },
            {
              label: "Total Movies",
              value: statsData.data.totalMovies || 0,
              icon: Film,
              change: "+89 this month",
            },
            {
              label: "Movie Nights",
              value: statsData.data.totalEvents || 0,
              icon: Calendar,
              change: "+23 this week",
            },
            {
              label: "Engagement",
              value: "87%",
              icon: TrendingUp,
              change: "Up from 84%",
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [mounted, user]);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive">
          Access denied. Only administrators can access this page.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const StatCard = ({ stat }: { stat: Stat }) => {
    const Icon = stat.icon;
    return (
      <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
            <p className="text-3xl font-bold mb-2">{stat.value}</p>
            <p className="text-xs text-primary">{stat.change}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon size={24} className="text-primary" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">System management & statistics</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Users Management */}
        <div className="bg-card border border-border rounded-xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">User Management</h2>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-3 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search by username, email, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">User</th>
                  <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold hidden lg:table-cell">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">
                    Movies
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border hover:bg-background/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{u.name || u.username}</p>
                        <p className="text-xs text-muted-foreground">
                          @{u.username}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      {u.movies || 0}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        {u.role !== "admin" && (
                          <button
                            title="Promote to Admin"
                            className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors text-primary hover:text-primary/90"
                          >
                            <Shield size={16} />
                          </button>
                        )}
                        <button
                          title="Reset Password"
                          className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          title="Delete User"
                          className="p-2 rounded-lg border border-border hover:bg-destructive/10 transition-colors text-destructive hover:text-destructive/90"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* No Results */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No users found matching your search
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
