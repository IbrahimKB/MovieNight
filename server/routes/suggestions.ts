import { Router } from "express";
import { verifyJWT } from "./auth";
import { withTransaction, generateId } from "../utils/storage";
import {
  CreateSuggestionRequest,
  UpdateWatchDesireRequest,
  ApiResponse,
  Suggestion,
  WatchDesire,
  Movie,
} from "../models/types";

const router = Router();

// Create a new suggestion
router.post("/", verifyJWT, async (req, res) => {
  try {
    const { movieId, suggestedTo, desireRating, comment } =
      req.body as CreateSuggestionRequest;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ApiResponse);
    }

    if (!movieId || !suggestedTo || suggestedTo.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Movie ID and at least one recipient are required",
      } as ApiResponse);
    }

    if (desireRating < 1 || desireRating > 10) {
      return res.status(400).json({
        success: false,
        error: "Desire rating must be between 1 and 10",
      } as ApiResponse);
    }

    const suggestion = await withTransaction(async (database) => {
      // Check if movie exists
      const movie = database.movies.find((m) => m.id === movieId);
      if (!movie) {
        throw new Error("Movie not found");
      }

      // Check if all suggested users exist
      const invalidUsers = suggestedTo.filter(
        (id) => !database.users.find((u) => u.id === id),
      );
      if (invalidUsers.length > 0) {
        throw new Error(`Invalid user IDs: ${invalidUsers.join(", ")}`);
      }

      // Create the suggestion
      const suggestion: Suggestion = {
        id: generateId(),
        movieId,
        suggestedBy: userId,
        suggestedTo,
        desireRating,
        comment: comment || undefined,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      database.suggestions.push(suggestion);

      // Create notifications for each recipient
      const suggestedByUser = database.users.find((u) => u.id === userId);
      suggestedTo.forEach((recipientId) => {
        const notification = {
          id: generateId(),
          userId: recipientId,
          type: "suggestion" as const,
          title: "New Movie Suggestion",
          content: `${suggestedByUser?.name || "Someone"} suggested "${movie.title}" to you`,
          read: false,
          actionData: {
            suggestionId: suggestion.id,
            movieId,
            userId,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        database.notifications.push(notification);
      });

      return suggestion;
    });

    res.json({
      success: true,
      data: suggestion,
      message: "Suggestion created successfully",
    } as ApiResponse<Suggestion>);
  } catch (error) {
    console.error("Create suggestion error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

// Get suggestions for current user
router.get("/", verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ApiResponse);
    }

    const database = await withTransaction(async (db) => db);

    // Get suggestions sent to the current user
    const userSuggestions = database.suggestions
      .filter((s) => s.suggestedTo.includes(userId))
      .map((suggestion) => {
        const movie = database.movies.find((m) => m.id === suggestion.movieId);
        const suggestedBy = database.users.find(
          (u) => u.id === suggestion.suggestedBy,
        );
        const userDesire = database.watchDesires.find(
          (wd) => wd.suggestionId === suggestion.id && wd.userId === userId,
        );

        return {
          ...suggestion,
          movie,
          suggestedByUser: suggestedBy
            ? { id: suggestedBy.id, name: suggestedBy.name }
            : null,
          userRating: userDesire?.rating,
        };
      })
      .filter((s) => s.movie && s.suggestedByUser)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json({
      success: true,
      data: userSuggestions,
    } as ApiResponse);
  } catch (error) {
    console.error("Get suggestions error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

// Update watch desire (respond to suggestion)
router.post("/respond", verifyJWT, async (req, res) => {
  try {
    const { suggestionId, rating } = req.body as UpdateWatchDesireRequest;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ApiResponse);
    }

    if (!suggestionId || rating < 1 || rating > 10) {
      return res.status(400).json({
        success: false,
        error: "Valid suggestion ID and rating (1-10) are required",
      } as ApiResponse);
    }

    const result = await withTransaction(async (database) => {
      // Find the suggestion
      const suggestion = database.suggestions.find(
        (s) => s.id === suggestionId,
      );
      if (!suggestion) {
        throw new Error("Suggestion not found");
      }

      // Check if user is a recipient of this suggestion
      if (!suggestion.suggestedTo.includes(userId)) {
        throw new Error("You are not a recipient of this suggestion");
      }

      // Check if user already responded
      const existingDesire = database.watchDesires.find(
        (wd) => wd.suggestionId === suggestionId && wd.userId === userId,
      );

      if (existingDesire) {
        // Update existing response
        existingDesire.rating = rating;
        existingDesire.updatedAt = new Date().toISOString();
      } else {
        // Create new watch desire
        const watchDesire: WatchDesire = {
          id: generateId(),
          userId,
          movieId: suggestion.movieId,
          suggestionId,
          rating,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        database.watchDesires.push(watchDesire);
      }

      // Update suggestion status if this is the first response
      if (suggestion.status === "pending") {
        suggestion.status = rating >= 6 ? "accepted" : "rejected";
        suggestion.updatedAt = new Date().toISOString();
      }

      const movie = database.movies.find((m) => m.id === suggestion.movieId);
      const responseType = rating >= 6 ? "accepted" : "rejected";

      return { suggestionId, rating, status: responseType };
    });

    res.json({
      success: true,
      data: { suggestionId, rating, status: responseType },
      message: `Suggestion ${responseType} successfully`,
    } as ApiResponse);
  } catch (error) {
    console.error("Respond to suggestion error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

// Get suggestions sent by current user
router.get("/sent", verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ApiResponse);
    }

    const database = await withTransaction(async (db) => db);

    const sentSuggestions = database.suggestions
      .filter((s) => s.suggestedBy === userId)
      .map((suggestion) => {
        const movie = database.movies.find((m) => m.id === suggestion.movieId);
        const recipients = suggestion.suggestedTo.map((id) => {
          const user = database.users.find((u) => u.id === id);
          const desire = database.watchDesires.find(
            (wd) => wd.suggestionId === suggestion.id && wd.userId === id,
          );
          return {
            id,
            name: user?.name || "Unknown",
            rating: desire?.rating,
            responded: !!desire,
          };
        });

        return {
          ...suggestion,
          movie,
          recipients,
        };
      })
      .filter((s) => s.movie)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json({
      success: true,
      data: sentSuggestions,
    } as ApiResponse);
  } catch (error) {
    console.error("Get sent suggestions error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

// Delete a suggestion
router.delete("/:suggestionId", verifyJWT, async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ApiResponse);
    }

    if (!suggestionId) {
      return res.status(400).json({
        success: false,
        error: "Suggestion ID is required",
      } as ApiResponse);
    }

    const database = await withTransaction(async (db) => db);

    // Find the suggestion
    const suggestionIndex = database.suggestions.findIndex(
      (s) => s.id === suggestionId,
    );

    if (suggestionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Suggestion not found",
      } as ApiResponse);
    }

    const suggestion = database.suggestions[suggestionIndex];

    // Check if user is the owner of this suggestion
    if (suggestion.suggestedBy !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own suggestions",
      } as ApiResponse);
    }

    // Remove the suggestion
    const deletedSuggestion = database.suggestions.splice(
      suggestionIndex,
      1,
    )[0];

    // Clean up related data
    // Remove associated watch desires
    database.watchDesires = database.watchDesires.filter(
      (wd) => wd.suggestionId !== suggestionId,
    );

    // Remove associated notifications
    database.notifications = database.notifications.filter(
      (notification) => notification.actionData?.suggestionId !== suggestionId,
    );

    saveDatabase(database);

    res.json({
      success: true,
      data: deletedSuggestion,
      message: "Suggestion and related data deleted successfully",
    } as ApiResponse);
  } catch (error) {
    console.error("Delete suggestion error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

export default router;
