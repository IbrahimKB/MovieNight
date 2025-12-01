"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/ui/brand-logo";
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

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 w-10 h-10">
            <BrandLogo size="lg" className="text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading MovieNight...</p>
        </div>
      </div>
    );
  }

  // Allow unauthenticated users to see landing page
  // Navigation bar is only shown for authenticated users
  if (!user) {
    return <>{children}</>;
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
      <nav className="border-b border-primary/10 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-3 sm:px-6 lg:px-8 py-3 flex items-center min-h-[64px]">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 sm:gap-3 hover:opacity-80 active:scale-95 transition-all duration-200 flex-shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9">
              <BrandLogo size="md" className="text-primary" />
            </div>
            <span className="hidden sm:inline text-lg sm:text-xl font-bold text-primary whitespace-nowrap">
              MovieNight
            </span>
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop Nav */}
          <div className="hidden lg:flex gap-1 items-center">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="text-sm text-muted-foreground hover:text-primary active:scale-95 transition-all duration-200 flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg hover:bg-accent/30"
              >
                <item.icon size={18} />
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            ))}
            <div className="h-6 w-px bg-border mx-1" />
            <button
              onClick={() => router.push("/settings")}
              className="text-sm text-muted-foreground hover:text-primary active:scale-95 transition-all duration-200 flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg hover:bg-accent/30"
            >
              <Settings size={18} />
              <span className="hidden xl:inline">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-destructive active:scale-95 transition-all duration-200 flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg hover:bg-accent/30"
            >
              <LogOut size={18} />
              <span className="hidden xl:inline">Logout</span>
            </button>
          </div>

          {/* Tablet - Icon Only Navigation */}
          <div className="hidden md:flex lg:hidden items-center gap-0.5 ml-auto">
            {navItems.slice(0, 3).map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                title={item.label}
                className="text-muted-foreground hover:text-primary active:scale-95 transition-all duration-200 p-2 rounded-lg hover:bg-accent/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <item.icon size={20} />
              </button>
            ))}
            <div className="h-6 w-px bg-border mx-0.5" />
            <button
              onClick={() => router.push("/settings")}
              title="Settings"
              className="text-muted-foreground hover:text-primary active:scale-95 transition-all duration-200 p-2 rounded-lg hover:bg-accent/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-foreground p-2 rounded-lg hover:bg-accent/30 active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-foreground p-2 rounded-lg hover:bg-accent/30 active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center ml-auto flex-shrink-0"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile/Tablet Sidebar */}
        {sidebarOpen && (
          <div className="md:hidden border-t border-primary/10 bg-background">
            <div className="flex flex-col p-4 gap-2 pb-6">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary active:scale-95 transition-all duration-200 text-left py-3 px-4 rounded-lg hover:bg-card/50 flex items-center gap-3 min-h-[44px]"
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-border my-2" />
              <button
                onClick={() => {
                  router.push("/settings");
                  setSidebarOpen(false);
                }}
                className="text-sm text-muted-foreground hover:text-primary active:scale-95 transition-all duration-200 text-left py-3 px-4 rounded-lg hover:bg-card/50 flex items-center gap-3 min-h-[44px]"
              >
                <Settings size={20} />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-destructive hover:text-destructive/80 active:scale-95 transition-all duration-200 text-left py-3 px-4 rounded-lg hover:bg-card/50 flex items-center gap-3 min-h-[44px]"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
