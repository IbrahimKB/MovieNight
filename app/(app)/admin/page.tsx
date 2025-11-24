"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user is admin
  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive">
          Access denied. Only administrators can access this page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Users</h3>
          <p className="text-3xl font-bold text-primary">-</p>
          <p className="text-sm text-muted-foreground">Active users</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Movies</h3>
          <p className="text-3xl font-bold text-primary">-</p>
          <p className="text-sm text-muted-foreground">In database</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Events</h3>
          <p className="text-3xl font-bold text-primary">-</p>
          <p className="text-sm text-muted-foreground">Movie nights planned</p>
        </div>
      </div>
    </div>
  );
}
