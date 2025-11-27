"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Bell, Lock, User } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [notifications, setNotifications] = useState({
    friendRequests: true,
    suggestions: true,
    movieReleases: true,
    pushNotifications: true,
  });
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // In a real app, you'd call an API to update the profile
      setEditMode(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const SettingSection = ({
    icon: Icon,
    title,
    description,
    children,
  }: {
    icon: any;
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );

  const NotificationToggle = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <SettingSection
        icon={User}
        title="Profile Information"
        description="Update your profile details"
      >
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{formData.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{formData.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="font-medium">@{user?.username}</p>
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="mt-4 px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors font-medium text-sm"
            >
              Edit Profile
            </button>
          </div>
        )}
      </SettingSection>

      {/* Notifications Section */}
      <SettingSection
        icon={Bell}
        title="Notifications"
        description="Control how you receive notifications"
      >
        <div className="space-y-2">
          <NotificationToggle
            label="Friend Requests"
            value={notifications.friendRequests}
            onChange={(value) =>
              setNotifications({ ...notifications, friendRequests: value })
            }
          />
          <NotificationToggle
            label="Movie Suggestions"
            value={notifications.suggestions}
            onChange={(value) =>
              setNotifications({ ...notifications, suggestions: value })
            }
          />
          <NotificationToggle
            label="Movie Releases"
            value={notifications.movieReleases}
            onChange={(value) =>
              setNotifications({ ...notifications, movieReleases: value })
            }
          />
          <NotificationToggle
            label="Push Notifications"
            value={notifications.pushNotifications}
            onChange={(value) =>
              setNotifications({
                ...notifications,
                pushNotifications: value,
              })
            }
          />
        </div>
      </SettingSection>

      {/* Privacy Section */}
      <SettingSection
        icon={Lock}
        title="Privacy & Security"
        description="Manage your privacy settings"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
            <div>
              <p className="font-medium text-sm">Profile Visibility</p>
              <p className="text-xs text-muted-foreground">Public</p>
            </div>
            <button className="px-3 py-1 rounded-lg border border-border text-sm hover:bg-border transition-colors">
              Change
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
            <div>
              <p className="font-medium text-sm">Show Watch History</p>
              <p className="text-xs text-muted-foreground">Friends can see</p>
            </div>
            <button className="px-3 py-1 rounded-lg border border-border text-sm hover:bg-border transition-colors">
              Change
            </button>
          </div>
        </div>
      </SettingSection>

      {/* Danger Zone */}
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
        <h3 className="font-semibold text-lg text-destructive mb-2">
          Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          These actions are irreversible. Please be careful.
        </p>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* Account Info */}
      <div className="bg-card border border-border rounded-xl p-6 text-sm">
        <p className="text-muted-foreground">
          Account ID: <span className="font-mono text-xs">{user?.id}</span>
        </p>
      </div>
    </div>
  );
}
