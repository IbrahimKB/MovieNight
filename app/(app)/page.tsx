"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function HomePage() {
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

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Welcome to MovieNight</h1>

      {user && (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <p className="mb-2">
            <span className="font-medium">Username:</span> {user.username}
          </p>
          <p className="mb-2">
            <span className="font-medium">Email:</span> {user.email}
          </p>
          <p className="mb-2">
            <span className="font-medium">Role:</span> {user.role}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/movies"
          className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Discover Movies</h3>
          <p className="text-sm text-muted-foreground">
            Browse and search movies
          </p>
        </Link>

        <Link
          href="/suggestions"
          className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Suggestions</h3>
          <p className="text-sm text-muted-foreground">
            Share movie ideas with friends
          </p>
        </Link>

        <Link
          href="/watchlist"
          className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">My Watchlist</h3>
          <p className="text-sm text-muted-foreground">
            Track movies you want to watch
          </p>
        </Link>

        <Link
          href="/squad"
          className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Friends</h3>
          <p className="text-sm text-muted-foreground">
            Connect with other movie enthusiasts
          </p>
        </Link>

        <Link
          href="/events"
          className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Movie Nights</h3>
          <p className="text-sm text-muted-foreground">
            Plan movie nights with friends
          </p>
        </Link>

        <Link
          href="/releases"
          className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Upcoming Releases</h3>
          <p className="text-sm text-muted-foreground">
            Discover movies coming soon
          </p>
        </Link>
      </div>
    </div>
  );
}
