// Legacy compatibility file - most functionality moved to api.ts
// Keep minimal interfaces and utilities for backward compatibility

export interface Notification {
  id: string;
  type:
    | "friend_request"
    | "suggestion"
    | "reaction"
    | "reminder"
    | "movie_night";
  content: string;
  read: boolean;
  created_at: string;
  actionData?: {
    userId?: string;
    movieId?: string;
    requestId?: string;
    username?: string;
    movieTitle?: string;
  };
}

// Get notification icon based on type
export function getNotificationIcon(type: Notification["type"]): string {
  switch (type) {
    case "friend_request":
      return "👥";
    case "suggestion":
      return "🎬";
    case "reaction":
      return "⭐️";
    case "reminder":
      return "⚠️";
    case "movie_night":
      return "🍿";
    default:
      return "🔔";
  }
}

// Format time ago
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60),
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

// Deprecated: Functions below are replaced by API calls in api.ts
// They are kept for backward compatibility but return empty/default data

export const MOCK_NOTIFICATIONS: Notification[] = [];

export function getUnreadCount(notifications: Notification[]): number {
  console.warn(
    "getUnreadCount from notificationData.ts is deprecated. Use api.ts instead.",
  );
  return 0;
}

export function markNotificationAsRead(
  notifications: Notification[],
  notificationId: string,
): Notification[] {
  console.warn(
    "markNotificationAsRead from notificationData.ts is deprecated. Use api.ts instead.",
  );
  return notifications;
}

export function markAllNotificationsAsRead(
  notifications: Notification[],
): Notification[] {
  console.warn(
    "markAllNotificationsAsRead from notificationData.ts is deprecated. Use api.ts instead.",
  );
  return notifications;
}

export function getNotificationActionText(notification: Notification): {
  primary?: string;
  secondary?: string;
} {
  switch (notification.type) {
    case "friend_request":
      return { primary: "Accept", secondary: "Ignore" };
    case "suggestion":
      return { primary: "View Movie", secondary: "Dismiss" };
    case "reminder":
      return { primary: "Watch Now", secondary: "Later" };
    case "movie_night":
      return { primary: "Join Night" };
    default:
      return {};
  }
}

export function sortNotificationsByDate(
  notifications: Notification[],
): Notification[] {
  return [...notifications].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
