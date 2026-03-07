"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Lock, LogOut, Save, Send, User } from "lucide-react";

type NotificationPrefs = {
  emailNotifications: boolean;
  friendRequests: boolean;
  suggestions: boolean;
  movieReleases: boolean;
  pushNotifications: boolean;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DEFAULT_PREFS: NotificationPrefs = {
  emailNotifications: true,
  friendRequests: true,
  suggestions: true,
  movieReleases: true,
  pushNotifications: true,
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [notifications, setNotifications] =
    useState<NotificationPrefs>(DEFAULT_PREFS);
  const [persistedNotifications, setPersistedNotifications] =
    useState<NotificationPrefs>(DEFAULT_PREFS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [pushPermission, setPushPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [isStandalone, setIsStandalone] = useState(false);
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false);
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);
  const [secureContext, setSecureContext] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.name || "",
      email: user.email || "",
    });
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    } else {
      setPushPermission("unsupported");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setSecureContext(window.isSecureContext);
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true,
    );

    const checkInstallPrompt = () => {
      const deferred =
        (
          window as Window & {
            __movienightDeferredPrompt?: BeforeInstallPromptEvent;
          }
        ).__movienightDeferredPrompt || null;
      setInstallPromptAvailable(!!deferred);
    };
    checkInstallPrompt();

    const onInstallReady = () => checkInstallPrompt();
    window.addEventListener("movienight:pwa-install-ready", onInstallReady);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          setServiceWorkerActive(!!registration.active);
        })
        .catch(() => setServiceWorkerActive(false));
    }

    return () => {
      window.removeEventListener("movienight:pwa-install-ready", onInstallReady);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setSettingsLoading(false);
      return;
    }

    const loadSettings = async () => {
      setSettingsLoading(true);
      setFeedback("");
      try {
        const res = await fetch("/api/user/settings", {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || !data?.success || !data?.data) {
          throw new Error(data?.error || "Failed to load settings");
        }

        const incoming: NotificationPrefs = {
          emailNotifications:
            typeof data.data.emailNotifications === "boolean"
              ? data.data.emailNotifications
              : true,
          friendRequests:
            typeof data.data.friendRequests === "boolean"
              ? data.data.friendRequests
              : true,
          suggestions:
            typeof data.data.suggestions === "boolean"
              ? data.data.suggestions
              : true,
          movieReleases:
            typeof data.data.movieReleases === "boolean"
              ? data.data.movieReleases
              : true,
          pushNotifications:
            typeof data.data.pushNotifications === "boolean"
              ? data.data.pushNotifications
              : true,
        };

        setNotifications(incoming);
        setPersistedNotifications(incoming);
      } catch (error: any) {
        console.error("Failed to load settings:", error);
        setFeedback(error?.message || "Failed to load settings");
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const hasPendingNotificationChanges = useMemo(
    () => JSON.stringify(notifications) !== JSON.stringify(persistedNotifications),
    [notifications, persistedNotifications],
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const subscribeToPush = async () => {
    if (typeof window === "undefined") {
      throw new Error("Push is unavailable");
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("This device/browser does not support push notifications");
    }

    if (!("Notification" in window)) {
      throw new Error("Notification API is not available");
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    setPushPermission(permission);

    if (permission !== "granted") {
      throw new Error(
        permission === "denied"
          ? "Push permission denied in browser settings"
          : "Push permission not granted",
      );
    }

    const keyRes = await fetch("/api/push/public-key", {
      credentials: "include",
    });
    const keyData = await keyRes.json();
    if (!keyRes.ok || !keyData?.success || !keyData?.data?.publicKey) {
      throw new Error(keyData?.error || "Push not configured on server");
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.data.publicKey),
      });
    }

    const subscribeRes = await fetch("/api/push/subscribe", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    const subscribeData = await subscribeRes.json();
    if (!subscribeRes.ok || !subscribeData?.success) {
      throw new Error(subscribeData?.error || "Failed to save push subscription");
    }
  };

  const unsubscribeFromPush = async () => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    const endpoint = subscription?.endpoint;

    if (subscription) {
      await subscription.unsubscribe();
    }

    await fetch("/api/push/subscribe", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    setFeedback("");
    try {
      if (
        !persistedNotifications.pushNotifications &&
        notifications.pushNotifications
      ) {
        await subscribeToPush();
      } else if (
        persistedNotifications.pushNotifications &&
        !notifications.pushNotifications
      ) {
        await unsubscribeFromPush();
      }

      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to save settings");
      }

      setPersistedNotifications(notifications);
      setFeedback("Notification settings saved.");
    } catch (error: any) {
      console.error("Failed to save notifications:", error);
      setNotifications(persistedNotifications);
      setFeedback(error?.message || "Failed to save notification settings");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSendTestPush = async () => {
    setSendingTestPush(true);
    setFeedback("");
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to send test push");
      }
      setFeedback(`Test push sent (${data?.data?.sent || 0} device(s)).`);
    } catch (error: any) {
      setFeedback(error?.message || "Failed to send test push");
    } finally {
      setSendingTestPush(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setFeedback("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to save profile");
      }
      setEditMode(false);
      setFeedback("Profile updated.");
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      setFeedback(error?.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleInstallApp = async () => {
    if (typeof window === "undefined") return;
    const deferred =
      (
        window as Window & {
          __movienightDeferredPrompt?: BeforeInstallPromptEvent;
        }
      ).__movienightDeferredPrompt || null;

    if (!deferred) {
      setFeedback(
        "Install prompt unavailable. On iPhone use Share -> Add to Home Screen.",
      );
      return;
    }

    try {
      await deferred.prompt();
      await deferred.userChoice;
      (
        window as Window & {
          __movienightDeferredPrompt?: BeforeInstallPromptEvent;
        }
      ).__movienightDeferredPrompt = undefined;
      setInstallPromptAvailable(false);
      setFeedback("Install prompt opened.");
    } catch {
      setFeedback("Could not open install prompt.");
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
          <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  const NotificationToggle = ({
    label,
    value,
    onChange,
    disabled,
  }: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm">{label}</span>
      <button
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-primary" : "bg-muted"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  if (!user) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Loading account settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account and preferences
        </p>
        {feedback && (
          <p className="mt-2 text-sm text-primary/90">{feedback}</p>
        )}
      </div>

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
                disabled={savingProfile}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
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
              <p className="font-medium">@{user.username}</p>
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

      <SettingSection
        icon={Bell}
        title="Notifications"
        description="Control how you receive notifications"
      >
        <div className="space-y-2">
          <NotificationToggle
            label="Email Notifications"
            value={notifications.emailNotifications}
            disabled={settingsLoading || savingNotifications}
            onChange={(value) =>
              setNotifications({ ...notifications, emailNotifications: value })
            }
          />
          <NotificationToggle
            label="Friend Requests"
            value={notifications.friendRequests}
            disabled={settingsLoading || savingNotifications}
            onChange={(value) =>
              setNotifications({ ...notifications, friendRequests: value })
            }
          />
          <NotificationToggle
            label="Movie Suggestions"
            value={notifications.suggestions}
            disabled={settingsLoading || savingNotifications}
            onChange={(value) =>
              setNotifications({ ...notifications, suggestions: value })
            }
          />
          <NotificationToggle
            label="Movie Releases"
            value={notifications.movieReleases}
            disabled={settingsLoading || savingNotifications}
            onChange={(value) =>
              setNotifications({ ...notifications, movieReleases: value })
            }
          />
          <NotificationToggle
            label="Push Notifications"
            value={notifications.pushNotifications}
            disabled={settingsLoading || savingNotifications}
            onChange={(value) =>
              setNotifications({ ...notifications, pushNotifications: value })
            }
          />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Browser push permission:{" "}
            <span className="font-medium text-foreground">{pushPermission}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSaveNotifications}
              disabled={
                settingsLoading || savingNotifications || !hasPendingNotificationChanges
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              <Save className="h-4 w-4" />
              {savingNotifications ? "Saving..." : "Save Notification Settings"}
            </button>
            <button
              onClick={handleSendTestPush}
              disabled={sendingTestPush || !notifications.pushNotifications}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background disabled:opacity-50 transition-colors font-medium text-sm"
            >
              <Send className="h-4 w-4" />
              {sendingTestPush ? "Sending..." : "Send Test Push"}
            </button>
          </div>
        </div>
      </SettingSection>

      <SettingSection
        icon={Save}
        title="App Install (PWA)"
        description="Installability and runtime checks for mobile/PWA usage"
      >
        <div className="space-y-2 text-sm">
          <p>
            Secure context:{" "}
            <span className="font-medium text-foreground">
              {secureContext ? "yes" : "no"}
            </span>
          </p>
          <p>
            Service worker active:{" "}
            <span className="font-medium text-foreground">
              {serviceWorkerActive ? "yes" : "no"}
            </span>
          </p>
          <p>
            Display mode:{" "}
            <span className="font-medium text-foreground">
              {isStandalone ? "standalone" : "browser"}
            </span>
          </p>
          <p>
            Browser install prompt:{" "}
            <span className="font-medium text-foreground">
              {installPromptAvailable ? "available" : "not available"}
            </span>
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleInstallApp}
            disabled={isStandalone}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isStandalone ? "Already installed" : "Install app"}
          </button>
        </div>
        {!isStandalone && (
          <p className="mt-3 text-xs text-muted-foreground">
            iPhone/iPad: open Safari menu Share then Add to Home Screen.
          </p>
        )}
      </SettingSection>

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

      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
        <h3 className="font-semibold text-lg text-destructive mb-2">Danger Zone</h3>
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

      <div className="bg-card border border-border rounded-xl p-6 text-sm">
        <p className="text-muted-foreground">
          Account ID: <span className="font-mono text-xs">{user.id}</span>
        </p>
      </div>
    </div>
  );
}
