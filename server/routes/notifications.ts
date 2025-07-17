import { RequestHandler } from "express";
import { withTransaction } from "../utils/storage";
import { Database } from "../models/types";

// Original notification functions
export const handleGetNotifications: RequestHandler = async (req, res) => {
  console.log("handleGetNotifications called for userId:", req.params.userId);
  console.log("User from JWT:", (req as any).user);
  try {
    const userId = (req as any).user?.id;
    console.log("Extracted userId:", userId);
    if (!userId) {
      console.log("No userId found, returning unauthorized");
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const notifications = await withTransaction(async (db: Database) => {
      const userNotifications =
        db.notifications?.filter((n: any) => n.userId === userId) || [];
      console.log("Found notifications:", userNotifications.length);
      return userNotifications;
    });

    console.log("Sending notifications response");
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Failed to get notifications:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get notifications" });
  }
};

export const handleGetUnreadCount: RequestHandler = async (req, res) => {
  console.log("handleGetUnreadCount called for userId:", req.params.userId);
  console.log("User from JWT:", (req as any).user);
  try {
    const userId = (req as any).user?.id;
    console.log("Extracted userId:", userId);
    if (!userId) {
      console.log("No userId found, returning unauthorized");
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const count = await withTransaction(async (db: Database) => {
      if (!db.notifications) return 0;
      const unreadCount = db.notifications.filter(
        (n: any) => n.userId === userId && !n.read,
      ).length;
      console.log("Found unread notifications:", unreadCount);
      return unreadCount;
    });

    console.log("Sending unread count response:", count);
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error("Failed to get unread count:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get unread count" });
  }
};

export const handleMarkAsRead: RequestHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await withTransaction(async (db: Database) => {
      if (!db.notifications) return;

      const notification = db.notifications.find(
        (n: any) => n.id === notificationId && n.userId === userId,
      );

      if (notification) {
        notification.read = true;
        notification.updatedAt = new Date().toISOString();
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
};

export const handleDeleteNotification: RequestHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await withTransaction(async (db: Database) => {
      if (!db.notifications) return;

      db.notifications = db.notifications.filter(
        (n: any) => !(n.id === notificationId && n.userId === userId),
      );
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

export const handleClearAllNotifications: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await withTransaction(async (db: Database) => {
      if (!db.notifications) return;

      db.notifications = db.notifications.filter(
        (n: any) => n.userId !== userId,
      );
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
};

// Types for push subscriptions
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface UserPushSubscription {
  id: string;
  userId: string;
  subscription: PushSubscription;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationPreferences {
  userId: string;
  preferences: Record<string, any>;
  updatedAt: string;
}

// Subscribe to push notifications
export const handleSubscribePush: RequestHandler = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription data" });
    }

    await withTransaction(async (db: Database) => {
      // Initialize push subscriptions if not exists
      if (!db.pushSubscriptions) {
        db.pushSubscriptions = [];
      }

      // Remove existing subscription for this user and endpoint
      db.pushSubscriptions = db.pushSubscriptions.filter(
        (sub: UserPushSubscription) =>
          !(
            sub.userId === userId &&
            sub.subscription.endpoint === subscription.endpoint
          ),
      );

      // Add new subscription
      const newSubscription: UserPushSubscription = {
        id: `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        subscription,
        userAgent: req.headers["user-agent"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.pushSubscriptions.push(newSubscription);
    });

    res.json({ success: true, message: "Push subscription saved" });
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to save subscription" });
  }
};

// Unsubscribe from push notifications
export const handleUnsubscribePush: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await withTransaction(async (db: Database) => {
      if (!db.pushSubscriptions) {
        db.pushSubscriptions = [];
      }

      // Remove all subscriptions for this user
      const initialLength = db.pushSubscriptions.length;
      db.pushSubscriptions = db.pushSubscriptions.filter(
        (sub: UserPushSubscription) => sub.userId !== userId,
      );

      const removedCount = initialLength - db.pushSubscriptions.length;
      console.log(
        `Removed ${removedCount} push subscriptions for user ${userId}`,
      );
    });

    res.json({ success: true, message: "Push subscriptions removed" });
  } catch (error) {
    console.error("Failed to remove push subscriptions:", error);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
};

// Get notification preferences
export const handleGetNotificationPreferences: RequestHandler = async (
  req,
  res,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await withTransaction(async (db: Database) => {
      if (!db.notificationPreferences) {
        db.notificationPreferences = [];
      }

      const userPrefs = db.notificationPreferences.find(
        (pref: NotificationPreferences) => pref.userId === userId,
      );

      return userPrefs?.preferences || getDefaultNotificationPreferences();
    });

    res.json(result);
  } catch (error) {
    console.error("Failed to get notification preferences:", error);
    res.status(500).json({ error: "Failed to get preferences" });
  }
};

// Save notification preferences
export const handleSaveNotificationPreferences: RequestHandler = async (
  req,
  res,
) => {
  try {
    const userId = (req as any).user?.id;
    const preferences = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!preferences || typeof preferences !== "object") {
      return res.status(400).json({ error: "Invalid preferences data" });
    }

    await withTransaction(async (db: Database) => {
      if (!db.notificationPreferences) {
        db.notificationPreferences = [];
      }

      // Remove existing preferences for this user
      db.notificationPreferences = db.notificationPreferences.filter(
        (pref: NotificationPreferences) => pref.userId !== userId,
      );

      // Add new preferences
      const newPreferences: NotificationPreferences = {
        userId,
        preferences,
        updatedAt: new Date().toISOString(),
      };

      db.notificationPreferences.push(newPreferences);
    });

    res.json({ success: true, message: "Preferences saved" });
  } catch (error) {
    console.error("Failed to save notification preferences:", error);
    res.status(500).json({ error: "Failed to save preferences" });
  }
};

// Send test notification
export const handleSendTestNotification: RequestHandler = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!type) {
      return res.status(400).json({ error: "Notification type required" });
    }

    // Get user's push subscriptions
    const subscriptions = await withTransaction(async (db: Database) => {
      if (!db.pushSubscriptions) return [];

      return db.pushSubscriptions.filter(
        (sub: UserPushSubscription) => sub.userId === userId,
      );
    });

    if (subscriptions.length === 0) {
      return res.status(400).json({ error: "No push subscriptions found" });
    }

    // Create test notification payload
    const payload = createTestNotificationPayload(type);

    // Send to all user's subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub: UserPushSubscription) =>
        sendPushNotification(sub.subscription, payload),
      ),
    );

    const successCount = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const failCount = results.filter(
      (result) => result.status === "rejected",
    ).length;

    console.log(
      `Test notification sent: ${successCount} success, ${failCount} failed`,
    );

    res.json({
      success: true,
      message: "Test notification sent",
      results: { sent: successCount, failed: failCount },
    });
  } catch (error) {
    console.error("Failed to send test notification:", error);
    res.status(500).json({ error: "Failed to send test notification" });
  }
};

// Send push notification to all users
export const handleSendNotificationToUsers: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { userIds, type, title, body, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "User IDs required" });
    }

    if (!type || !title || !body) {
      return res.status(400).json({ error: "Notification data required" });
    }

    // Get push subscriptions for specified users
    const subscriptions = await withTransaction(async (db: Database) => {
      if (!db.pushSubscriptions) return [];

      return db.pushSubscriptions.filter((sub: UserPushSubscription) =>
        userIds.includes(sub.userId),
      );
    });

    if (subscriptions.length === 0) {
      return res
        .status(400)
        .json({ error: "No push subscriptions found for users" });
    }

    // Create notification payload
    const payload = {
      type,
      title,
      body,
      icon: "/icons/icon-192x192.svg",
      badge: "/icons/icon-72x72.svg",
      data: data || {},
    };

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub: UserPushSubscription) =>
        sendPushNotification(sub.subscription, payload),
      ),
    );

    const successCount = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const failCount = results.filter(
      (result) => result.status === "rejected",
    ).length;

    console.log(
      `Notification sent to ${userIds.length} users: ${successCount} success, ${failCount} failed`,
    );

    res.json({
      success: true,
      message: "Notifications sent",
      results: {
        sent: successCount,
        failed: failCount,
        totalUsers: userIds.length,
      },
    });
  } catch (error) {
    console.error("Failed to send notifications:", error);
    res.status(500).json({ error: "Failed to send notifications" });
  }
};

// Helper functions
function getDefaultNotificationPreferences() {
  return {
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
}

function createTestNotificationPayload(type: string) {
  const testPayloads: Record<string, any> = {
    friend_request: {
      title: "New Friend Request! 👥",
      body: "Someone wants to be your MovieNight friend",
      icon: "/icons/icon-192x192.svg",
      data: { type: "friend_request", test: true },
    },
    movie_suggestion: {
      title: "Movie Suggestion! 🎬",
      body: "A friend suggested 'Test Movie' for you to watch",
      icon: "/icons/icon-192x192.svg",
      data: { type: "movie_suggestion", test: true },
    },
    movie_night_invite: {
      title: "Movie Night Invite! 🍿",
      body: "You've been invited to a test movie night",
      icon: "/icons/icon-192x192.svg",
      data: { type: "movie_night_invite", test: true },
    },
    system_update: {
      title: "App Update Available! 🔔",
      body: "This is a test notification for app updates",
      icon: "/icons/icon-192x192.svg",
      data: { type: "system_update", test: true },
    },
  };

  return (
    testPayloads[type] || {
      title: "Test Notification",
      body: `Test notification for ${type}`,
      icon: "/icons/icon-192x192.svg",
      data: { type, test: true },
    }
  );
}

// Mock push notification sender (in production, use a proper push service)
async function sendPushNotification(
  subscription: PushSubscription,
  payload: any,
): Promise<void> {
  // This is a mock implementation
  // In production, you would use a library like web-push to send actual push notifications
  console.log("Mock push notification sent:", {
    endpoint: subscription.endpoint.substring(0, 50) + "...",
    payload: payload.title,
  });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate 90% success rate
  if (Math.random() < 0.9) {
    return Promise.resolve();
  } else {
    throw new Error("Mock push notification failed");
  }
}

// Get all push subscriptions for a user
export async function getUserPushSubscriptions(
  userId: string,
): Promise<UserPushSubscription[]> {
  return await withTransaction(async (db: Database) => {
    if (!db.pushSubscriptions) return [];

    return db.pushSubscriptions.filter(
      (sub: UserPushSubscription) => sub.userId === userId,
    );
  });
}

// Clean up invalid push subscriptions
export async function cleanupInvalidSubscriptions(): Promise<void> {
  await withTransaction(async (db: Database) => {
    if (!db.pushSubscriptions) return;

    // In a real implementation, you would test each subscription
    // and remove ones that are no longer valid
    const initialCount = db.pushSubscriptions.length;

    // For now, just remove very old subscriptions (90+ days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    db.pushSubscriptions = db.pushSubscriptions.filter(
      (sub: UserPushSubscription) => new Date(sub.createdAt) > ninetyDaysAgo,
    );

    const removedCount = initialCount - db.pushSubscriptions.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old push subscriptions`);
    }
  });
}
