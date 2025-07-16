import { User } from "@/contexts/AuthContext";

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
  "1": ["2", "3", "4"], // Ibrahim is friends with Omar, Sara, Alex
  "2": ["1", "3", "5"], // Omar is friends with Ibrahim, Sara, Maya
  "3": ["1", "2", "4", "5"], // Sara is friends with everyone
  "4": ["1", "3", "5"], // Alex is friends with Ibrahim, Sara, Maya
  "5": ["2", "3", "4"], // Maya is friends with Omar, Sara, Alex
};

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
