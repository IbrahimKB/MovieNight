"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Clapperboard,
  Calendar,
  Send,
  Bookmark,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Shield,
} from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout, user, isLoading, isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, mounted, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-white font-black text-xl mx-auto mb-4">
            🎬
          </div>
          <p className="text-muted-foreground">Loading MovieNight...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Browse", icon: Clapperboard, href: "/movies" },
    { label: "Watchlist", icon: Bookmark, href: "/watchlist" },
    { label: "Calendar", icon: Calendar, href: "/calendar" },
    { label: "Suggestions", icon: Send, href: "/suggestions" },
    { label: "Friends", icon: Users, href: "/friends" },
    { label: "Profile", icon: User, href: "/profile" },
    ...(isAdmin ? [{ label: "Admin", icon: Shield, href: "/admin" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">
              🎬
            </div>
            <span className="hidden sm:inline text-xl font-bold text-primary">
              MovieNight
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-6 items-center">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
            <button
              onClick={() => router.push("/settings")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <Settings size={18} />
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-foreground"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="flex flex-col p-4 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors text-left py-2 px-3 rounded-lg hover:bg-card flex items-center gap-3"
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  router.push("/settings");
                  setSidebarOpen(false);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors text-left py-2 px-3 rounded-lg hover:bg-card flex items-center gap-3"
              >
                <Settings size={18} />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-destructive hover:text-destructive/80 transition-colors text-left py-2 px-3 rounded-lg hover:bg-card flex items-center gap-3"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
