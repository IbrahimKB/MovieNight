// server/index.ts — FINAL SQL-ONLY VERSION (no Prisma, no JSON fallbacks)

import express from "express";
import cors from "cors";
import * as Sentry from "@sentry/node";

// Auth routes
import {
  handleLogin,
  handleSignup,
  handleGetProfile,
  handleSearchUsers,
  verifyJWT,
  requireAdmin,
  handleResetPassword,
  handleGetAllUsers,
  handleDeleteUser,
} from "./routes/auth.js";

// Movies (now SQL-only)
import {
  handleGetMovies,
  handleSearchMovies,
  handleGetMovieById,
  handleUpdateMovie,
  handleDeleteMovie,
} from "./routes/movies.js";

// TMDB API handlers (unchanged)
import {
  handleSearchMoviesExternal,
  handleSaveMovieFromTMDB,
  handleGetRateLimit,
} from "./routes/tmdb.js";

// Releases: still JSON-backed TEMPORARILY until you convert them
import {
  handleGetReleases,
  handleSyncReleases,
  handleGetUpcomingReleases,
  handleGetReleasesByPlatform,
  handleGetTMDBStatus,
  handleWeeklySync,
  handleGetSchedulerStatus,
  handleTriggerManualSync,
  handleGetReleaseById,
  handleCreateRelease,
  handleUpdateRelease,
  handleDeleteRelease,
} from "./routes/releases.js";

// Friends / Notifications
import {
  handleGetFriends,
  handleGetIncomingRequests,
  handleGetOutgoingRequests,
  handleSendFriendRequest,
  handleRespondToFriendRequest,
  handleRemoveFriend,
} from "./routes/friends.js";

import {
  handleGetNotifications,
  handleGetUnreadCount,
  handleMarkAsRead,
  handleDeleteNotification,
  handleClearAllNotifications,
  handleSubscribePush,
  handleUnsubscribePush,
  handleGetNotificationPreferences,
  handleSaveNotificationPreferences,
  handleSendTestNotification,
  handleSendNotificationToUsers,
} from "./routes/notifications.js";

import analyticsRouter from "./routes/analytics.js";
import suggestionsRouter from "./routes/suggestions.js"; // FULL SQL NOW

import { schedulerService } from "./services/scheduler.js";

export function createServer() {
  const app = express();

  // Sentry setup
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0.1,
    });

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }

  // Scheduler
  schedulerService.start();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request Logger (very helpful for debugging)
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`, {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });
    next();
  });

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({
      message: "MovieNight API v1.0.0 (SQL-only)",
      timestamp: new Date().toISOString(),
    });
  });

  // ----------------------------------------
  // AUTH
  // ----------------------------------------
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/signup", handleSignup);
  app.get("/api/auth/profile/:userId", handleGetProfile);
  app.get("/api/auth/search-users", handleSearchUsers);

  // Admin
  app.get("/api/admin/users", verifyJWT, requireAdmin, handleGetAllUsers);
  app.post("/api/admin/users/reset-password", verifyJWT, requireAdmin, handleResetPassword);
  app.delete("/api/admin/users/:userId", verifyJWT, requireAdmin, handleDeleteUser);

  app.get("/api/admin/scheduler/status", verifyJWT, requireAdmin, handleGetSchedulerStatus);
  app.post("/api/admin/scheduler/trigger", verifyJWT, requireAdmin, handleTriggerManualSync);

  // ----------------------------------------
  // MOVIES (SQL ONLY)
  // ----------------------------------------
  app.get("/api/movies", handleGetMovies);
  app.get("/api/movies/search", handleSearchMovies);
  app.get("/api/movies/:movieId", handleGetMovieById);
  app.put("/api/movies/:movieId", verifyJWT, handleUpdateMovie);
  app.delete("/api/movies/:movieId", verifyJWT, requireAdmin, handleDeleteMovie);

  // ----------------------------------------
  // SUGGESTIONS (FULLY SQL)
  // ----------------------------------------
  app.use("/api/suggestions", suggestionsRouter);

  // ----------------------------------------
  // TMDB
  // ----------------------------------------
  app.get("/api/tmdb/search", handleSearchMoviesExternal);
  app.post("/api/tmdb/save-movie", handleSaveMovieFromTMDB);
  app.get("/api/tmdb/rate-limit", handleGetRateLimit);

  // ----------------------------------------
  // RELEASES (still JSON fallback)
  // ----------------------------------------
  app.get("/api/releases", handleGetReleases);
  app.get("/api/releases/upcoming", handleGetUpcomingReleases);
  app.get("/api/releases/platform", handleGetReleasesByPlatform);
  app.get("/api/releases/tmdb-status", handleGetTMDBStatus);
  app.get("/api/releases/:releaseId", handleGetReleaseById);
  app.post("/api/releases", verifyJWT, requireAdmin, handleCreateRelease);
  app.put("/api/releases/:releaseId", verifyJWT, requireAdmin, handleUpdateRelease);
  app.delete("/api/releases/:releaseId", verifyJWT, requireAdmin, handleDeleteRelease);
  app.post("/api/releases/sync", handleSyncReleases);
  app.post("/api/releases/weekly-sync", handleWeeklySync);

  // ----------------------------------------
  // FRIENDS
  // ----------------------------------------
  app.get("/api/friends/:userId", handleGetFriends);
  app.get("/api/friends/:userId/incoming", handleGetIncomingRequests);
  app.get("/api/friends/:userId/outgoing", handleGetOutgoingRequests);
  app.post("/api/friends/:userId/request", handleSendFriendRequest);
  app.post("/api/friends/:userId/respond", handleRespondToFriendRequest);
  app.delete("/api/friends/:userId/:friendshipId", handleRemoveFriend);

  // ----------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------
  app.get("/api/notifications/:userId", verifyJWT, handleGetNotifications);
  app.get("/api/notifications/:userId/unread-count", verifyJWT, handleGetUnreadCount);
  app.post("/api/notifications/:userId/mark-read", verifyJWT, handleMarkAsRead);
  app.delete("/api/notifications/:userId/:notificationId", verifyJWT, handleDeleteNotification);
  app.delete("/api/notifications/:userId/clear-all", verifyJWT, handleClearAllNotifications);

  // Push notifications
  app.post("/api/notifications/subscribe", verifyJWT, handleSubscribePush);
  app.post("/api/notifications/unsubscribe", verifyJWT, handleUnsubscribePush);
  app.post("/api/notifications/test", verifyJWT, handleSendTestNotification);
  app.post("/api/notifications/send", verifyJWT, requireAdmin, handleSendNotificationToUsers);

  // Notification preferences
  app.get("/api/user/notification-preferences", verifyJWT, handleGetNotificationPreferences);
  app.put("/api/user/notification-preferences", verifyJWT, handleSaveNotificationPreferences);

  // ----------------------------------------
  // ANALYTICS
  // ----------------------------------------
  app.use("/api/analytics", analyticsRouter);

  // Sentry error handler
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }

  // Generic error handler
  app.use((err, req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  });

  return app;
}
