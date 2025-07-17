// Notification Types and Push Notification Management

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "movie_suggestion"
  | "suggestion_response"
  | "movie_night_invite"
  | "movie_night_reminder"
  | "movie_available"
  | "recommendation"
  | "weekly_recap"
  | "system_update";

export interface NotificationPreferences {
  // Social notifications
  friend_request: {
    enabled: boolean;
    push: boolean;
    email: boolean;
  };
  friend_accepted: {
    enabled: boolean;
    push: boolean;
    email: boolean;
  };

  // Movie suggestions
  movie_suggestion: {
    enabled: boolean;
    push: boolean;
    email: boolean;
  };
  suggestion_response: {
    enabled: boolean;
    push: boolean;
    email: boolean;
  };

  // Movie nights
  movie_night_invite: {
    enabled: boolean;
    push: boolean;
    email: boolean;
  };
  movie_night_reminder: {
    enabled: boolean;
    push: boolean;
    email: boolean;
    reminderHours: number; // Hours before event
  };

  // Content updates
  movie_available: {
    enabled: boolean;
    push: boolean;
    email: boolean;
  };
  recommendation: {
    enabled: boolean;
    push: boolean;
    email: boolean;
  };

  // System notifications
  weekly_recap: {
    enabled: boolean;
    push: boolean;
    email: boolean;
    dayOfWeek: number; // 0 = Sunday
  };
  system_update: {
    enabled: boolean;
    push: boolean;
    email: boolean;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  friend_request: { enabled: true, push: true, email: true },
  friend_accepted: { enabled: true, push: true, email: false },
  movie_suggestion: { enabled: true, push: true, email: false },
  suggestion_response: { enabled: true, push: true, email: false },
  movie_night_invite: { enabled: true, push: true, email: true },
  movie_night_reminder: {
    enabled: true,
    push: true,
    email: false,
    reminderHours: 2,
  },
  movie_available: { enabled: true, push: false, email: false },
  recommendation: { enabled: true, push: false, email: false },
  weekly_recap: { enabled: true, push: false, email: true, dayOfWeek: 0 },
  system_update: { enabled: true, push: true, email: false },
};

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

// Notification metadata for display
export const NOTIFICATION_META: Record<
  NotificationType,
  {
    title: string;
    description: string;
    icon: string;
    category: string;
    defaultSound: boolean;
  }
> = {
  friend_request: {
    title: "Friend Requests",
    description: "When someone sends you a friend request",
    icon: "👥",
    category: "Social",
    defaultSound: true,
  },
  friend_accepted: {
    title: "Friend Accepted",
    description: "When someone accepts your friend request",
    icon: "✅",
    category: "Social",
    defaultSound: false,
  },
  movie_suggestion: {
    title: "Movie Suggestions",
    description: "When friends suggest movies to you",
    icon: "🎬",
    category: "Movies",
    defaultSound: true,
  },
  suggestion_response: {
    title: "Suggestion Responses",
    description: "When friends respond to your movie suggestions",
    icon: "💬",
    category: "Movies",
    defaultSound: false,
  },
  movie_night_invite: {
    title: "Movie Night Invites",
    description: "When you're invited to a movie night",
    icon: "🍿",
    category: "Events",
    defaultSound: true,
  },
  movie_night_reminder: {
    title: "Movie Night Reminders",
    description: "Reminders before scheduled movie nights",
    icon: "⏰",
    category: "Events",
    defaultSound: true,
  },
  movie_available: {
    title: "Movies Available",
    description: "When movies from your watchlist become available",
    icon: "📺",
    category: "Content",
    defaultSound: false,
  },
  recommendation: {
    title: "Recommendations",
    description: "Personalized movie recommendations for you",
    icon: "✨",
    category: "Content",
    defaultSound: false,
  },
  weekly_recap: {
    title: "Weekly Recap",
    description: "Summary of your week's movie activity",
    icon: "📊",
    category: "Reports",
    defaultSound: false,
  },
  system_update: {
    title: "App Updates",
    description: "Important app updates and announcements",
    icon: "🔔",
    category: "System",
    defaultSound: false,
  },
};

// Push notification utilities
export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private subscription: globalThis.PushSubscription | null = null;
  private vapidPublicKey: string = process.env.VITE_VAPID_PUBLIC_KEY || "";

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  // Check current permission status
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return "denied";
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error("Push notifications not supported");
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<globalThis.PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error("Push notifications not supported");
    }

    const permission = await this.requestPermission();
    if (permission !== "granted") {
      throw new Error("Permission not granted");
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      throw new Error("Service worker not registered");
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      this.subscription = subscription;
      await this.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        this.subscription = await registration.pushManager.getSubscription();
      }
    }

    if (this.subscription) {
      const success = await this.subscription.unsubscribe();
      if (success) {
        await this.removeSubscriptionFromServer();
        this.subscription = null;
      }
      return success;
    }

    return true;
  }

  // Get current subscription
  async getSubscription(): Promise<globalThis.PushSubscription | null> {
    if (this.subscription) return this.subscription;

    if (!this.isSupported()) return null;

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;

    this.subscription = await registration.pushManager.getSubscription();
    return this.subscription;
  }

  // Send subscription to server
  private async sendSubscriptionToServer(
    subscription: globalThis.PushSubscription,
  ): Promise<void> {
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
      },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
            auth: arrayBufferToBase64(subscription.getKey("auth")!),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save subscription to server");
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(): Promise<void> {
    const response = await fetch("/api/notifications/unsubscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to remove subscription from server");
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Notification preferences API
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const response = await fetch("/api/user/notification-preferences", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
      },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to load notification preferences:", error);
  }

  // Return defaults if API fails
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<boolean> {
  try {
    const response = await fetch("/api/user/notification-preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
      },
      body: JSON.stringify(preferences),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to save notification preferences:", error);
    return false;
  }
}

// Test notification
export async function sendTestNotification(
  type: NotificationType,
): Promise<void> {
  const response = await fetch("/api/notifications/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
    },
    body: JSON.stringify({ type }),
  });

  if (!response.ok) {
    throw new Error("Failed to send test notification");
  }
}
