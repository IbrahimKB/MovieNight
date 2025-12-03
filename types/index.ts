// Auth types
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  name?: string;
  role: "user" | "admin";
  joinedAt: Date;
  puid?: string;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  createdAt: Date;
}

// MovieNight types
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
  releaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Release {
  id: string;
  movieId: string;
  title: string;
  platform: string;
  releaseDate: Date;
  genres?: string[];
  description?: string;
  poster?: string;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Suggestion {
  id: string;
  movieId: string;
  fromUserId: string;
  toUserId?: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchDesire {
  id: string;
  userId: string;
  movieId: string;
  suggestionId?: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchedMovie {
  id: string;
  userId: string;
  movieId: string;
  watchedAt: Date;
  originalScore?: number;
  reaction?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  requestedBy: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  movieId: string;
  hostUserId: string;
  participants: string[];
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  auth: string;
  p256dh: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  friendRequests: boolean;
  suggestions: boolean;
  movieReleases: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?:
    | string
    | Record<string, unknown>
    | { field?: string; message: string }[];
}

export interface ValidationError {
  field: string;
  message: string;
}
