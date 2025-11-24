"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("movienight_token");
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.data);
        } else {
          // Redirect to login if not authenticated
          window.location.href = "/(auth)/login";
        }
      } catch (err) {
        setError("Failed to fetch user");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive">{error}</p>
      </div>
    );
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
         <a
           href="/(app)/movies"
           className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
         >
           <h3 className="text-lg font-semibold mb-2">Discover Movies</h3>
           <p className="text-sm text-muted-foreground">
             Browse and search movies
           </p>
         </a>

         <a
           href="/(app)/suggestions"
           className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
         >
           <h3 className="text-lg font-semibold mb-2">Suggestions</h3>
           <p className="text-sm text-muted-foreground">
             Share movie ideas with friends
           </p>
         </a>

         <a
           href="/(app)/watchlist"
           className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
         >
           <h3 className="text-lg font-semibold mb-2">My Watchlist</h3>
           <p className="text-sm text-muted-foreground">
             Track movies you want to watch
           </p>
         </a>

         <a
           href="/squad"
           className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
         >
           <h3 className="text-lg font-semibold mb-2">Friends</h3>
           <p className="text-sm text-muted-foreground">
             Connect with other movie enthusiasts
           </p>
         </a>
       </div>
    </div>
  );
}
