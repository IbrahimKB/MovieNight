import { User } from "@/contexts/AuthContext";

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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("movienight_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Helper to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const data: ApiResponse<T> = await response.json();
  if (!data.success) {
    throw new Error(data.error || "API request failed");
  }

  return data.data as T;
}

// User and friend management
export async function searchUsers(query: string): Promise<Friend[]> {
  const response = await fetch(
    `/api/auth/search-users?q=${encodeURIComponent(query)}`,
    {
      headers: getAuthHeaders(),
    },
  );

  return handleApiResponse<Friend[]>(response);
}

export async function getUserFriends(userId: string): Promise<Friend[]> {
  const response = await fetch(`/api/friends/${userId}`, {
    headers: getAuthHeaders(),
  });

  return handleApiResponse<Friend[]>(response);
}

export async function getIncomingRequests(
  userId: string,
): Promise<FriendRequest[]> {
  const response = await fetch(`/api/friends/${userId}/incoming`, {
    headers: getAuthHeaders(),
  });

  return handleApiResponse<FriendRequest[]>(response);
}

export async function getOutgoingRequests(
  userId: string,
): Promise<FriendRequest[]> {
  const response = await fetch(`/api/friends/${userId}/outgoing`, {
    headers: getAuthHeaders(),
  });

  return handleApiResponse<FriendRequest[]>(response);
}

export async function sendFriendRequest(
  userId: string,
  targetUserId: string,
): Promise<void> {
  const response = await fetch(`/api/friends/${userId}/request`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ targetUserId }),
  });

  await handleApiResponse(response);
}

export async function respondToFriendRequest(
  userId: string,
  friendshipId: string,
  action: "accept" | "reject",
): Promise<void> {
  const response = await fetch(`/api/friends/${userId}/respond`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ friendshipId, action }),
  });

  await handleApiResponse(response);
}

export async function removeFriend(
  userId: string,
  friendshipId: string,
): Promise<void> {
  const response = await fetch(`/api/friends/${userId}/${friendshipId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await handleApiResponse(response);
}

// Notification management
export async function getNotifications(
  userId: string,
): Promise<Notification[]> {
  const response = await fetch(`/api/notifications/${userId}`, {
    headers: getAuthHeaders(),
  });

  return handleApiResponse<Notification[]>(response);
}

export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  const response = await fetch(`/api/notifications/${userId}/unread-count`, {
    headers: getAuthHeaders(),
  });

  const data = await handleApiResponse<{ count: number }>(response);
  return data.count;
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  const response = await fetch(`/api/notifications/${userId}/mark-read`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ notificationId }),
  });

  await handleApiResponse(response);
}

export async function deleteNotification(
  userId: string,
  notificationId: string,
): Promise<void> {
  const response = await fetch(
    `/api/notifications/${userId}/${notificationId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

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
