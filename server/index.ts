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
  handleGetReleases,
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
import { initializeDatabase } from "./utils/storage";

export function createServer() {
  const app = express();

  // Initialize database on server start
  initializeDatabase().catch(console.error);

  // Middleware
  app.use(cors());

  // Custom body parser middleware to handle potential conflicts
  app.use((req, res, next) => {
    if (
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "PATCH"
    ) {
      if (!req.body || Object.keys(req.body).length === 0) {
        return express.json({ limit: "10mb" })(req, res, next);
      }
    }
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

  return app;
}
