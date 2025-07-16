import { User } from "@/contexts/AuthContext";

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

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

// All available users who can be friends
export const ALL_USERS: Friend[] = [
  { id: "1", name: "Ibrahim Kaysar", username: "ibrahim" },
  { id: "2", name: "Omar", username: "omar" },
  { id: "3", name: "Sara", username: "sara" },
  { id: "4", name: "Alex", username: "alex" },
  { id: "5", name: "Maya", username: "maya" },
];

// Friend relationships (who is friends with whom)
export const FRIENDSHIPS: Record<string, string[]> = {
  "1": ["2", "3"], // Ibrahim is friends with Omar, Sara
  "2": ["1", "3", "5"], // Omar is friends with Ibrahim, Sara, Maya
  "3": ["1", "2", "4", "5"], // Sara is friends with everyone
  "4": ["3", "5"], // Alex is friends with Sara, Maya
  "5": ["2", "3", "4"], // Maya is friends with Omar, Sara, Alex
};

// Mock friend requests
export const FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: "req_1",
    fromUserId: "4", // Alex
    toUserId: "1", // Ibrahim
    status: "pending",
    sentAt: "2024-01-12T10:30:00Z",
  },
  {
    id: "req_2",
    fromUserId: "1", // Ibrahim
    toUserId: "5", // Maya
    status: "pending",
    sentAt: "2024-01-11T15:45:00Z",
  },
];

// Mock friend activities
export const FRIEND_ACTIVITIES: FriendActivity[] = [
  {
    userId: "2",
    lastWatched: {
      title: "The Menu",
      date: "2024-01-10",
    },
  },
  {
    userId: "3",
    lastWatched: {
      title: "Glass Onion",
      date: "2024-01-08",
    },
  },
  {
    userId: "5",
    lastWatched: {
      title: "Avatar: The Way of Water",
      date: "2024-01-05",
    },
  },
];

// Get friends for a specific user
export function getUserFriends(userId: string): Friend[] {
  const friendIds = FRIENDSHIPS[userId] || [];
  return friendIds
    .map((id) => ALL_USERS.find((user) => user.id === id))
    .filter(Boolean) as Friend[];
}

// Get friend by ID
export function getFriendById(friendId: string): Friend | undefined {
  return ALL_USERS.find((user) => user.id === friendId);
}

// Get friend name by ID
export function getFriendName(friendId: string): string {
  const friend = getFriendById(friendId);
  return friend?.name || "Unknown";
}

// Check if two users are friends
export function areFriends(userId1: string, userId2: string): boolean {
  const user1Friends = FRIENDSHIPS[userId1] || [];
  return user1Friends.includes(userId2);
}

// Get incoming friend requests for a user
export function getIncomingRequests(
  userId: string,
): (FriendRequest & { fromUser: Friend })[] {
  return FRIEND_REQUESTS.filter(
    (req) => req.toUserId === userId && req.status === "pending",
  ).map((req) => ({
    ...req,
    fromUser: ALL_USERS.find((u) => u.id === req.fromUserId)!,
  }));
}

// Get outgoing friend requests for a user
export function getOutgoingRequests(
  userId: string,
): (FriendRequest & { toUser: Friend })[] {
  return FRIEND_REQUESTS.filter(
    (req) => req.fromUserId === userId && req.status === "pending",
  ).map((req) => ({
    ...req,
    toUser: ALL_USERS.find((u) => u.id === req.toUserId)!,
  }));
}

// Search users by username
export function searchUsers(query: string, excludeUserId?: string): Friend[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];

  return ALL_USERS.filter((user) => {
    if (excludeUserId && user.id === excludeUserId) return false;
    return (
      user.username.toLowerCase().includes(searchTerm) ||
      user.name.toLowerCase().includes(searchTerm)
    );
  });
}

// Get friend activity
export function getFriendActivity(userId: string): FriendActivity | undefined {
  return FRIEND_ACTIVITIES.find((activity) => activity.userId === userId);
}

// Check if friend request exists between users
export function hasExistingRequest(
  fromUserId: string,
  toUserId: string,
): FriendRequest | undefined {
  return FRIEND_REQUESTS.find(
    (req) =>
      (req.fromUserId === fromUserId && req.toUserId === toUserId) ||
      (req.fromUserId === toUserId && req.toUserId === fromUserId),
  );
}

// Send friend request (mock function)
export function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
): boolean {
  // Check if already friends
  if (areFriends(fromUserId, toUserId)) return false;

  // Check if request already exists
  if (hasExistingRequest(fromUserId, toUserId)) return false;

  // In real app, this would make an API call
  const newRequest: FriendRequest = {
    id: `req_${Date.now()}`,
    fromUserId,
    toUserId,
    status: "pending",
    sentAt: new Date().toISOString(),
  };

  FRIEND_REQUESTS.push(newRequest);
  return true;
}

// Accept friend request (mock function)
export function acceptFriendRequest(requestId: string): boolean {
  const request = FRIEND_REQUESTS.find((req) => req.id === requestId);
  if (!request || request.status !== "pending") return false;

  request.status = "accepted";

  // Add to friendships
  if (!FRIENDSHIPS[request.fromUserId]) FRIENDSHIPS[request.fromUserId] = [];
  if (!FRIENDSHIPS[request.toUserId]) FRIENDSHIPS[request.toUserId] = [];

  if (!FRIENDSHIPS[request.fromUserId].includes(request.toUserId)) {
    FRIENDSHIPS[request.fromUserId].push(request.toUserId);
  }
  if (!FRIENDSHIPS[request.toUserId].includes(request.fromUserId)) {
    FRIENDSHIPS[request.toUserId].push(request.fromUserId);
  }

  return true;
}

// Reject friend request (mock function)
export function rejectFriendRequest(requestId: string): boolean {
  const requestIndex = FRIEND_REQUESTS.findIndex((req) => req.id === requestId);
  if (requestIndex === -1) return false;

  FRIEND_REQUESTS[requestIndex].status = "rejected";
  return true;
}
