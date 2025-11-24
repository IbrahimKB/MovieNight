"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Home } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Home className="h-6 w-6 text-primary" />
            <span className="text-2xl font-bold text-primary">MovieNight</span>
          </button>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => router.push("/(app)/movies")}
              className="text-sm hover:text-primary transition-colors"
            >
              Movies
            </button>
            <button
              onClick={() => router.push("/(app)/calendar")}
              className="text-sm hover:text-primary transition-colors"
            >
              Calendar
            </button>
            <button
              onClick={() => router.push("/(app)/suggestions")}
              className="text-sm hover:text-primary transition-colors"
            >
              Suggestions
            </button>
            <button
              onClick={() => router.push("/(app)/watchlist")}
              className="text-sm hover:text-primary transition-colors"
            >
              Watchlist
            </button>
            <button
              onClick={() => router.push("/squad")}
              className="text-sm hover:text-primary transition-colors"
            >
              Friends
            </button>
            <button
              onClick={logout}
              className="text-sm hover:text-primary transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="container max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
