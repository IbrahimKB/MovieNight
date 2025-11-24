// Legacy compatibility file - most functionality moved to api.ts
// Keep minimal interfaces and utilities for backward compatibility

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  sentAt: string;
}

export interface FriendActivity {
  userId: string;
  lastWatched?: {
    title: string;
    date: string;
  };
}

// Utility functions for backward compatibility
export function getFriendName(friendId: string, friends?: Friend[]): string {
  if (!friends) return "Unknown";
  const friend = friends.find((f) => f.id === friendId);
  return friend?.name || "Unknown";
}

// Deprecated: All functions below are replaced by API calls in api.ts
// They are kept for backward compatibility but return empty data

export function getUserFriends(userId: string): Friend[] {
  console.warn(
    "getUserFriends from userData.ts is deprecated. Use api.ts instead.",
  );
  return [];
}

export function getFriendById(friendId: string): Friend | undefined {
  console.warn(
    "getFriendById from userData.ts is deprecated. Use api.ts instead.",
  );
  return undefined;
}

export function areFriends(userId1: string, userId2: string): boolean {
  console.warn(
    "areFriends from userData.ts is deprecated. Use api.ts instead.",
  );
  return false;
}

export function getIncomingRequests(
  userId: string,
): (FriendRequest & { fromUser: Friend })[] {
  console.warn(
    "getIncomingRequests from userData.ts is deprecated. Use api.ts instead.",
  );
  return [];
}

export function getOutgoingRequests(
  userId: string,
): (FriendRequest & { toUser: Friend })[] {
  console.warn(
    "getOutgoingRequests from userData.ts is deprecated. Use api.ts instead.",
  );
  return [];
}

export function searchUsers(query: string, excludeUserId?: string): Friend[] {
  console.warn(
    "searchUsers from userData.ts is deprecated. Use api.ts instead.",
  );
  return [];
}

export function getFriendActivity(userId: string): FriendActivity | undefined {
  console.warn(
    "getFriendActivity from userData.ts is deprecated. Use api.ts instead.",
  );
  return undefined;
}

export function hasExistingRequest(
  fromUserId: string,
  toUserId: string,
): FriendRequest | undefined {
  console.warn(
    "hasExistingRequest from userData.ts is deprecated. Use api.ts instead.",
  );
  return undefined;
}

export function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
): boolean {
  console.warn(
    "sendFriendRequest from userData.ts is deprecated. Use api.ts instead.",
  );
  return false;
}

export function acceptFriendRequest(requestId: string): boolean {
  console.warn(
    "acceptFriendRequest from userData.ts is deprecated. Use api.ts instead.",
  );
  return false;
}

export function rejectFriendRequest(requestId: string): boolean {
  console.warn(
    "rejectFriendRequest from userData.ts is deprecated. Use api.ts instead.",
  );
  return false;
}
