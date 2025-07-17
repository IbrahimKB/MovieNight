export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  password: string; // Hashed password
  role: "user" | "admin";
  avatar?: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  genres: string[];
  platform?: string;
  poster?: string;
  description: string;
  imdbRating?: number;
  rtRating?: number;
  releaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Suggestion {
  id: string;
  movieId: string;
  suggestedBy: string; // userId
  suggestedTo: string[]; // userIds
  desireRating: number;
  comment?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface WatchDesire {
  id: string;
  userId: string;
  movieId: string;
  suggestionId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  status: "pending" | "accepted" | "rejected";
  requestedBy: string; // userId who sent the request
  createdAt: string;
  updatedAt: string;
}

export interface WatchedMovie {
  id: string;
  userId: string;
  movieId: string;
  watchedDate: string;
  watchedWith: string[]; // userIds
  originalScore?: number;
  actualRating?: number;
  reaction?: PostWatchReaction;
  createdAt: string;
  updatedAt: string;
}

export interface PostWatchReaction {
  rating: number;
  tags: string[];
  oneLineReaction?: string;
}

export interface Notification {
  id: string;
  userId: string; // recipient
  type:
    | "friend_request"
    | "suggestion"
    | "reaction"
    | "reminder"
    | "movie_night";
  title: string;
  content: string;
  read: boolean;
  actionData?: {
    userId?: string;
    movieId?: string;
    suggestionId?: string;
    friendshipId?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Release {
  id: string;
  title: string;
  platform: string;
  releaseDate: string;
  genres: string[];
  description?: string;
  poster?: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPushSubscription {
  id: string;
  userId: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserNotificationPreferences {
  userId: string;
  preferences: Record<string, any>;
  updatedAt: string;
}

// Database structure
export interface Database {
  users: User[];
  movies: Movie[];
  suggestions: Suggestion[];
  watchDesires: WatchDesire[];
  friendships: Friendship[];
  watchedMovies: WatchedMovie[];
  notifications: Notification[];
  releases: Release[];
  pushSubscriptions?: UserPushSubscription[];
  notificationPreferences?: UserNotificationPreferences[];
  metadata: {
    version: string;
    lastUpdated: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  name: string;
  password: string;
}

export interface CreateSuggestionRequest {
  movieId: string;
  suggestedTo: string[];
  desireRating: number;
  comment?: string;
}

export interface UpdateWatchDesireRequest {
  suggestionId: string;
  rating: number;
}

export interface SendFriendRequestRequest {
  targetUserId: string;
}

export interface RespondToFriendRequestRequest {
  friendshipId: string;
  action: "accept" | "reject";
}

export interface MarkAsWatchedRequest {
  movieId: string;
  watchedDate: string;
  watchedWith: string[];
  originalScore?: number;
  reaction?: PostWatchReaction;
}

export interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}

export interface JWTPayload {
  userId: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}
