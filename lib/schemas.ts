import { z } from "zod";

/**
 * Centralized Zod validation schemas for API routes
 * This reduces duplication and ensures consistent validation across the app
 */

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const SignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores",
    ),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const ProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  avatar: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
});

export const SettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  friendRequests: z.boolean().optional(),
  suggestions: z.boolean().optional(),
  movieReleases: z.boolean().optional(),
});

// ============================================================================
// MOVIE & WATCH SCHEMAS
// ============================================================================

export const CreateWatchDesireSchema = z.object({
  movieId: z.union([z.string(), z.number()], {
    errorMap: () => ({ message: "Movie ID must be a valid string or number" }),
  }),
  suggestionId: z.string().uuid("Invalid suggestion ID").optional(),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(10, "Rating must be at most 10")
    .optional(),
});

export const WatchMovieSchema = z.object({
  movieId: z.string().uuid("Invalid movie ID"),
  score: z
    .number()
    .min(1, "Score must be at least 1")
    .max(10, "Score must be at most 10")
    .optional(),
  reaction: z.record(z.unknown()).optional(),
});

// ============================================================================
// SUGGESTION SCHEMAS
// ============================================================================

export const CreateSuggestionSchema = z.object({
  movieId: z.union([z.string(), z.number()], {
    errorMap: () => ({ message: "Movie ID must be a valid string or number" }),
  }),
  friendIds: z.array(z.string()).optional(),
  toUserId: z.string().optional(),
  comment: z.string().optional(),
  message: z.string().optional(),
  desireRating: z.number().min(1).max(10).optional(),
});

export const SuggestionResponseSchema = z.object({
  action: z.enum(["accept", "reject"], {
    errorMap: () => ({ message: "Action must be 'accept' or 'reject'" }),
  }),
  rating: z.number().min(1).max(10).optional(),
});

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const CreateEventSchema = z.object({
  movieId: z.string().uuid("Invalid movie ID"),
  date: z.string().datetime("Invalid date format").or(z.coerce.date()),
  notes: z.string().optional(),
  invitedFriendIds: z.array(z.string()).optional(),
});

export const UpdateEventSchema = z.object({
  movieId: z.string().uuid("Invalid movie ID").optional(),
  date: z
    .string()
    .datetime("Invalid date format")
    .or(z.coerce.date())
    .optional(),
  notes: z.string().optional().or(z.literal("")),
  participants: z.array(z.string()).optional(),
});

export const SendInvitationsSchema = z.object({
  externalUserIds: z
    .array(z.string())
    .min(1, "At least one user must be invited"),
});

export const UpdateInvitationSchema = z.object({
  status: z.enum(["accepted", "declined"], {
    errorMap: () => ({ message: "Status must be 'accepted' or 'declined'" }),
  }),
});

// ============================================================================
// FRIENDSHIP SCHEMAS
// ============================================================================

export const FriendRequestSchema = z.object({
  toUserId: z.string().uuid("Invalid user ID"),
});

export const RespondFriendRequestSchema = z.object({
  friendshipId: z.string().uuid("Invalid friendship ID"),
  action: z.enum(["accept", "reject"], {
    errorMap: () => ({ message: "Action must be 'accept' or 'reject'" }),
  }),
});

// ============================================================================
// MOVIE NIGHT (VOTING) SCHEMAS
// ============================================================================

export const MovieNightVoteSchema = z.object({
  movieId: z.string().uuid("Invalid movie ID"),
  voteType: z.enum(["yes", "maybe", "no"], {
    errorMap: () => ({ message: "Vote type must be 'yes', 'maybe', or 'no'" }),
  }),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
export type SettingsInput = z.infer<typeof SettingsSchema>;
export type CreateWatchDesireInput = z.infer<typeof CreateWatchDesireSchema>;
export type WatchMovieInput = z.infer<typeof WatchMovieSchema>;
export type CreateSuggestionInput = z.infer<typeof CreateSuggestionSchema>;
export type SuggestionResponseInput = z.infer<typeof SuggestionResponseSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type SendInvitationsInput = z.infer<typeof SendInvitationsSchema>;
export type UpdateInvitationInput = z.infer<typeof UpdateInvitationSchema>;
export type FriendRequestInput = z.infer<typeof FriendRequestSchema>;
export type RespondFriendRequestInput = z.infer<
  typeof RespondFriendRequestSchema
>;
export type MovieNightVoteInput = z.infer<typeof MovieNightVoteSchema>;
