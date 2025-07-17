import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  PlusCircle,
  Users,
  Bookmark,
  UserPlus,
  LogOut,
  User,
  Settings,
  Shield,
  Search,
  Calendar,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "@/components/NotificationBell";
import OnboardingFlow from "@/components/OnboardingFlow";
import { useOnboarding } from "@/hooks/useOnboarding";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { shouldShowOnboarding, markOnboardingComplete, skipOnboarding } =
    useOnboarding();

  const bottomNavItems = [
    {
      path: "/",
      label: "Home",
      icon: Home,
    },
    {
      path: "/suggest",
      label: "Suggest",
      icon: PlusCircle,
    },
    {
      path: "/watchlist",
      label: "Watchlist",
      icon: Bookmark,
    },
    {
      path: "/squad",
      label: "Squad",
      icon: UserPlus,
    },
    {
      path: "/movie-night",
      label: "Movie Night",
      icon: Users,
    },
  ];

  // All navigation items (combining bottom nav and additional pages for desktop)
  const allNavItems = [
    ...bottomNavItems,
    {
      path: "/releases",
      label: "Releases",
      icon: Calendar,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Onboarding Flow */}
      {shouldShowOnboarding && (
        <OnboardingFlow
          onComplete={markOnboardingComplete}
          onSkip={skipOnboarding}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo */}
            <Link
              to="/"
              className="flex items-center gap-2"
              aria-label="MovieNight - Go to homepage"
            >
              <h1 className="text-lg sm:text-2xl font-bold text-primary">
                <span role="img" aria-label="Movie camera">
                  🎬
                </span>
                <span className="hidden xs:inline">MovieNight</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden lg:flex items-center gap-1"
              role="navigation"
              aria-label="Main navigation"
            >
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-2 focus:outline-primary focus:outline-offset-2",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side - Notifications & User Menu */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <NotificationBell />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-9 px-2 sm:px-3"
                    aria-label={`User menu for ${user?.name}`}
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User
                        className="h-3 w-3 sm:h-4 sm:w-4"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 sm:w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user?.username}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-20 lg:pb-6"
        id="main-content"
      >
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-lg supports-[backdrop-filter]:bg-card/90 border-t border-border safe-area-pb"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex justify-around items-center py-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all min-w-0 flex-1 touch-manipulation focus:outline-2 focus:outline-primary focus:outline-offset-2",
                  isActive
                    ? "text-primary bg-primary/15 scale-105"
                    : "text-muted-foreground hover:text-foreground active:scale-95",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn("h-5 w-5 mb-1", isActive && "animate-pulse")}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-xs font-medium leading-tight",
                    isActive ? "font-semibold" : "font-normal",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area for home indicator on iOS */}
        <div className="h-safe-area-inset-bottom" />
      </nav>
    </div>
  );
}
