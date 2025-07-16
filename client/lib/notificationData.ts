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

// Mock notifications data
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif_1",
    type: "suggestion",
    content: "Omar suggested The Menu to you",
    read: false,
    created_at: "2024-01-14T10:30:00Z",
    actionData: {
      userId: "2",
      username: "Omar",
      movieTitle: "The Menu",
      movieId: "movie_1",
    },
  },
  {
    id: "notif_2",
    type: "friend_request",
    content: "Alex sent you a friend request",
    read: false,
    created_at: "2024-01-14T09:15:00Z",
    actionData: {
      userId: "4",
      username: "Alex",
      requestId: "req_1",
    },
  },
  {
    id: "notif_3",
    type: "reaction",
    content: "Sara rated Glass Onion 9/10 after watching",
    read: false,
    created_at: "2024-01-13T20:45:00Z",
    actionData: {
      userId: "3",
      username: "Sara",
      movieTitle: "Glass Onion",
    },
  },
  {
    id: "notif_4",
    type: "movie_night",
    content: "Movie night tonight! Your squad picked The Menu",
    read: true,
    created_at: "2024-01-13T15:30:00Z",
    actionData: {
      movieTitle: "The Menu",
    },
  },
  {
    id: "notif_5",
    type: "reminder",
    content: "You scored Wednesday a 9 but haven't watched it yet",
    read: true,
    created_at: "2024-01-12T14:20:00Z",
    actionData: {
      movieTitle: "Wednesday",
      movieId: "movie_5",
    },
  },
  {
    id: "notif_6",
    type: "suggestion",
    content: "Maya suggested Avatar: The Way of Water to your group",
    read: true,
    created_at: "2024-01-11T11:00:00Z",
    actionData: {
      userId: "5",
      username: "Maya",
      movieTitle: "Avatar: The Way of Water",
    },
  },
];

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

// Get unread count
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

// Mark notification as read
export function markNotificationAsRead(
  notifications: Notification[],
  notificationId: string,
): Notification[] {
  return notifications.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n,
  );
}

// Mark all notifications as read
export function markAllNotificationsAsRead(
  notifications: Notification[],
): Notification[] {
  return notifications.map((n) => ({ ...n, read: true }));
}

// Get notification action text based on type
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

// Sort notifications by date (newest first)
export function sortNotificationsByDate(
  notifications: Notification[],
): Notification[] {
  return [...notifications].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
