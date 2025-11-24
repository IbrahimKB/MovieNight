"use client";

import { useState, useEffect } from "react";
import { User, Mail, LogOut, Bell, Eye, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface SettingsState {
  emailNotifications: boolean;
  friendRequests: boolean;
  suggestions: boolean;
  movieNightInvites: boolean;
}

const settingsOptions = [
  {
    id: "emailNotifications",
    title: "Email Notifications",
    description: "Receive notifications about activity",
    icon: Bell,
  },
  {
    id: "friendRequests",
    title: "Friend Requests",
    description: "Allow others to send you friend requests",
    icon: User,
  },
  {
    id: "suggestions",
    title: "Movie Suggestions",
    description: "Receive movie recommendations from friends",
    icon: Eye,
  },
  {
    id: "movieNightInvites",
    title: "Movie Night Invites",
    description: "Get notified about movie night plans",
    icon: Bell,
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    friendRequests: true,
    suggestions: true,
    movieNightInvites: true,
  });

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

  const toggleSetting = (key: string) => {
    setSettings({
      ...settings,
      [key]: !settings[key as keyof SettingsState],
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Settings</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Profile</h2>
          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl md:text-4xl">
                  🎬
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold">
                    {user.username}
                  </h3>
                  <p className="text-muted-foreground">@{user.username}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Joined recently
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User
                      size={18}
                      className="absolute left-3 top-3 text-muted-foreground"
                    />
                    <input
                      type="text"
                      value={user.username}
                      disabled
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground disabled:opacity-50"
                    />
                  </div>
                  <button className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium text-sm whitespace-nowrap">
                    Edit
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Display only currently
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail
                      size={18}
                      className="absolute left-3 top-3 text-muted-foreground"
                    />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground disabled:opacity-50"
                    />
                  </div>
                  <button className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium text-sm whitespace-nowrap">
                    Edit
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Display only currently
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <button className="px-6 py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium flex items-center gap-2">
                  <Lock size={16} />
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Preferences</h2>
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-4 md:space-y-6">
            {settingsOptions.map((option) => {
              const Icon = option.icon;
              const isChecked = settings[option.id as keyof SettingsState];
              return (
                <div
                  key={option.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 py-3 border-b border-border last:border-b-0 last:py-0"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1">
                    <Icon size={20} className="text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <h3 className="font-medium text-sm md:text-base">
                        {option.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSetting(option.id)}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 rounded-full transition-colors ${
                      isChecked ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-7 w-7 rounded-full bg-white shadow-lg transform transition-transform ${
                        isChecked ? "translate-x-7" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Section */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Account</h2>
          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
              <button className="w-full px-6 py-3 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors font-bold">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
