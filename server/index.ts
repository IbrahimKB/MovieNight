import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
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
} from "./routes/auth";
import {
  handleGetMovies,
  handleSearchMovies,
  handleCreateSuggestion,
  handleGetSuggestions,
  handleUpdateWatchDesire,
  handleMarkAsWatched,
  handleGetWatchHistory,
} from "./routes/movies";
import {
  handleGetFriends,
  handleGetIncomingRequests,
  handleGetOutgoingRequests,
  handleSendFriendRequest,
  handleRespondToFriendRequest,
  handleRemoveFriend,
} from "./routes/friends";
import {
  handleGetNotifications,
  handleGetUnreadCount,
  handleMarkAsRead,
  handleDeleteNotification,
  handleClearAllNotifications,
} from "./routes/notifications";
import {
  handleSearchMoviesExternal,
  handleSaveMovieFromTMDB,
  handleGetRateLimit,
} from "./routes/tmdb";
import {
  handleGetReleases,
  handleSyncReleases,
  handleGetUpcomingReleases,
  handleGetReleasesByPlatform,
  handleGetJustWatchStatus,
  handleWeeklySync,
  handleGetSchedulerStatus,
  handleTriggerManualSync,
} from "./routes/releases";
import suggestionsRouter from "./routes/suggestions";
import analyticsRouter from "./routes/analytics";
import { initializeDatabase } from "./utils/storage";
import { schedulerService } from "./services/scheduler";

export function createServer() {
  const app = express();

  // Initialize database on server start
  initializeDatabase().catch(console.error);

  // Start scheduler service for automatic weekly sync
  schedulerService.start();

  // Middleware
  app.use(cors());

  // Request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      contentType: req.headers["content-type"],
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });
    next();
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({
      message: "MovieNight API v1.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  // Test endpoint for body parsing
  app.post("/api/test", (req, res) => {
    console.log("Test endpoint body:", req.body);
    res.json({
      success: true,
      receivedBody: req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });
  });

  // Legacy demo route
  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/signup", handleSignup);
  app.get("/api/auth/profile/:userId", handleGetProfile);
  app.get("/api/auth/search-users", handleSearchUsers);

  // Admin routes (protected)
  app.get("/api/admin/users", verifyJWT, requireAdmin, handleGetAllUsers);
  app.post(
    "/api/admin/users/reset-password",
    verifyJWT,
    requireAdmin,
    handleResetPassword,
  );
  app.delete(
    "/api/admin/users/:userId",
    verifyJWT,
    requireAdmin,
    handleDeleteUser,
  );
  app.get(
    "/api/admin/scheduler/status",
    verifyJWT,
    requireAdmin,
    handleGetSchedulerStatus,
  );
  app.post(
    "/api/admin/scheduler/trigger",
    verifyJWT,
    requireAdmin,
    handleTriggerManualSync,
  );

  // Movie and suggestion routes
  app.get("/api/movies", handleGetMovies);
  app.get("/api/movies/search", handleSearchMovies);
  app.get("/api/releases", handleGetReleases);
  app.post("/api/suggestions/:userId", handleCreateSuggestion);
  app.get("/api/suggestions/:userId", handleGetSuggestions);
  app.post("/api/watch-desire/:userId", handleUpdateWatchDesire);
  app.post("/api/watched/:userId", handleMarkAsWatched);
  app.get("/api/watch-history/:userId", handleGetWatchHistory);

  // TMDB integration routes
  app.get("/api/tmdb/search", handleSearchMoviesExternal);
  app.post("/api/tmdb/save-movie", handleSaveMovieFromTMDB);
  app.get("/api/tmdb/rate-limit", handleGetRateLimit);

  // Releases and JustWatch integration routes
  app.get("/api/releases", handleGetReleases);
  app.post("/api/releases/sync", handleSyncReleases);
  app.get("/api/releases/upcoming", handleGetUpcomingReleases);
  app.get("/api/releases/platform", handleGetReleasesByPlatform);
  app.get("/api/releases/justwatch-status", handleGetJustWatchStatus);
  app.post("/api/releases/weekly-sync", handleWeeklySync);

  // Friend management routes
  app.get("/api/friends/:userId", handleGetFriends);
  app.get("/api/friends/:userId/incoming", handleGetIncomingRequests);
  app.get("/api/friends/:userId/outgoing", handleGetOutgoingRequests);
  app.post("/api/friends/:userId/request", handleSendFriendRequest);
  app.post("/api/friends/:userId/respond", handleRespondToFriendRequest);
  app.delete("/api/friends/:userId/:friendshipId", handleRemoveFriend);

  // Notification routes
  app.get("/api/notifications/:userId", handleGetNotifications);
  app.get("/api/notifications/:userId/unread-count", handleGetUnreadCount);
  app.post("/api/notifications/:userId/mark-read", handleMarkAsRead);
  app.delete(
    "/api/notifications/:userId/:notificationId",
    handleDeleteNotification,
  );
  app.delete(
    "/api/notifications/:userId/clear-all",
    handleClearAllNotifications,
  );

  // New suggestions router (replaces old suggestion routes)
  app.use("/api/suggestions", suggestionsRouter);

  return app;
}
