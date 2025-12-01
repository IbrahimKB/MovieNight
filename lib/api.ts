import { User } from "@/types";

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  friendshipId?: string;
  friendsSince?: string;
}

export interface FriendRequest {
  id: string;
  fromUser: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  toUser?: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  sentAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "friend_request" | "suggestion" | "general";
  title: string;
  content: string;
  read: boolean;
  actionData?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalFriends: number;
  activeSuggestions: number;
  moviesWatchedThisWeek: number;
  suggestionAccuracy: number;
}

export interface TrendingMovie {
  id: string;
  title: string;
  year: number;
  rating: number;
  watchCount: number;
  genres: string[];
}

// Helper to get auth headers (httpOnly cookies are used for auth)
function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

// Standard API Response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | { field?: string; message: string }[] | undefined; // Ensure consistent type
}

// Helper to handle API responses with better type safety
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    const errorMessage = typeof errorData.error === "string"
      ? errorData.error
      : `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  const data: ApiResponse<T> = await response.json();
  if (!data.success) {
    const errorMessage = typeof data.error === "string"
      ? data.error
      : Array.isArray(data.error)
        ? data.error.map((e) => e.message).join("; ")
        : "API request failed";
    throw new Error(errorMessage);
  }

  return data.data as T;
}

// User and friend management
export async function searchUsers(query: string): Promise<Friend[]> {
  const response = await fetch(
    `/api/auth/search-users?q=${encodeURIComponent(query)}`,
    {
      headers: getAuthHeaders(),
      credentials: "include",
    },
  );

  return handleApiResponse<Friend[]>(response);
}

export async function getUserFriends(): Promise<Friend[]> {
  const response = await fetch(`/api/friends`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });

  return handleApiResponse<Friend[]>(response);
}

export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const response = await fetch(`/api/friends/incoming`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });

  return handleApiResponse<FriendRequest[]>(response);
}

export async function getOutgoingRequests(): Promise<FriendRequest[]> {
  const response = await fetch(`/api/friends/outgoing`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });

  return handleApiResponse<FriendRequest[]>(response);
}

export async function sendFriendRequest(
  targetUserId: string,
): Promise<void> {
  const response = await fetch(`/api/friends/request`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ targetUserId }),
  });

  await handleApiResponse(response);
}

export async function respondToFriendRequest(
  friendshipId: string,
  action: "accept" | "reject",
): Promise<void> {
  const response = await fetch(`/api/friends/${friendshipId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ action }),
  });

  await handleApiResponse(response);
}

export async function removeFriend(
  friendshipId: string,
): Promise<void> {
  const response = await fetch(`/api/friends/${friendshipId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  await handleApiResponse(response);
}

// Notification management
export async function getNotifications(): Promise<Notification[]> {
  const response = await fetch(`/api/notifications`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });

  return handleApiResponse<Notification[]>(response);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await fetch(`/api/notifications/unread-count`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });

  const data = await handleApiResponse<{ count: number }>(response);
  return data.count;
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const response = await fetch(`/api/notifications/mark-read`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ notificationId }),
  });

  await handleApiResponse(response);
}

export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  await handleApiResponse(response);
}

// Helper functions for compatibility with existing code
export function getFriendName(friendId: string, friends: Friend[]): string {
  const friend = friends.find((f) => f.id === friendId);
  return friend?.name || "Unknown";
}

export function areFriends(
  userId: string,
  targetUserId: string,
  friends: Friend[],
): boolean {
  return friends.some((f) => f.id === targetUserId);
}

export function hasExistingRequest(
  userId: string,
  targetUserId: string,
  incomingRequests: FriendRequest[],
  outgoingRequests: FriendRequest[],
): FriendRequest | undefined {
  // Check if there's an incoming request from the target user
  const incoming = incomingRequests.find(
    (req) => req.fromUser.id === targetUserId,
  );
  if (incoming)
    return {
      ...incoming,
      fromUserId: incoming.fromUser.id,
      toUserId: userId,
      status: "pending",
    } as any;

  // Check if there's an outgoing request to the target user
  const outgoing = outgoingRequests.find(
    (req) => req.toUser?.id === targetUserId,
  );
  if (outgoing)
    return {
      ...outgoing,
      fromUserId: userId,
      toUserId: targetUserId,
      status: "pending",
    } as any;

  return undefined;
}

// Dashboard and statistics
export async function getDashboardStats(): Promise<{
  stats: DashboardStats;
  trending: TrendingMovie[];
  upcoming: any[];
  nudge: any;
}> {
  try {
    // Use the consolidated endpoint
    const response = await fetch("/api/dashboard", {
      headers: getAuthHeaders(),
      credentials: "include",
    });
    const data = await handleApiResponse<{
      stats: DashboardStats;
      trending: TrendingMovie[];
      upcoming: any[];
      nudge: any;
    }>(response);

    return data;
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return {
      stats: {
        totalFriends: 0,
        activeSuggestions: 0,
        moviesWatchedThisWeek: 0,
        suggestionAccuracy: 0,
      },
      trending: [],
      upcoming: [],
      nudge: null,
    };
  }
}

export async function getTrendingMovies(): Promise<TrendingMovie[]> {
  try {
    const response = await fetch("/api/movies", {
      headers: getAuthHeaders(),
      credentials: "include",
    });
    const movies = await handleApiResponse<any[]>(response);

    // Transform movies to trending format - if no movies exist, return empty array
    if (!movies || movies.length === 0) {
      return [];
    }

    // Get watch history to calculate watch counts
    let watchHistory: any[] = [];
    try {
      const historyResponse = await fetch("/api/watch/history", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (historyResponse.ok) {
        watchHistory = await handleApiResponse<any[]>(historyResponse);
      }
    } catch (error) {
      console.log("Could not load watch history for trending:", error);
    }

    // Count watches per movie
    const watchCountMap = new Map<string, number>();
    watchHistory.forEach((watched) => {
      watchCountMap.set(
        watched.movieId,
        (watchCountMap.get(watched.movieId) || 0) + 1,
      );
    });

    // Sort by watch count and return top 5
    return movies
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.year,
        rating: movie.imdbRating || movie.rating || 0,
        watchCount: watchCountMap.get(movie.id) || 0,
        genres: movie.genres || [],
      }))
      .sort((a, b) => b.watchCount - a.watchCount)
      .slice(0, 5);
  } catch (error) {
    console.error("Failed to load trending movies:", error);
    return [];
  }
}

export async function getUpcomingReleases(): Promise<any[]> {
  try {
    const response = await fetch("/api/releases/upcoming", {
      headers: getAuthHeaders(),
      credentials: "include",
    });
    return handleApiResponse<any[]>(response);
  } catch (error) {
    console.error("Failed to load upcoming releases:", error);
    return [];
  }
}
