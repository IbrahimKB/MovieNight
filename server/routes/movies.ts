import { RequestHandler } from "express";
import { z } from "zod";
import {
  ApiResponse,
  Movie,
  Suggestion,
  WatchDesire,
  CreateSuggestionRequest,
  UpdateWatchDesireRequest,
  MarkAsWatchedRequest,
  WatchedMovie,
  Release,
} from "../models/types";
import { withTransaction, generateId } from "../utils/storage";

// Validation schemas
const createSuggestionSchema = z.object({
  movieId: z.string().min(1, "Movie ID is required"),
  suggestedTo: z
    .array(z.string())
    .min(1, "At least one friend must be selected"),
  desireRating: z.number().min(1).max(10),
  comment: z.string().optional(),
});

const updateWatchDesireSchema = z.object({
  suggestionId: z.string().min(1, "Suggestion ID is required"),
  rating: z.number().min(1).max(10),
});

const markAsWatchedSchema = z.object({
  movieId: z.string().min(1, "Movie ID is required"),
  watchedDate: z.string().min(1, "Watched date is required"),
  watchedWith: z.array(z.string()),
  originalScore: z.number().min(1).max(10).optional(),
  reaction: z
    .object({
      rating: z.number().min(1).max(10),
      tags: z.array(z.string()),
      oneLineReaction: z.string().optional(),
    })
    .optional(),
});

// Get all movies
export const handleGetMovies: RequestHandler = async (req, res) => {
  try {
    const movies = await withTransaction(async (db) => {
      return db.movies;
    });

    const response: ApiResponse<Movie[]> = {
      success: true,
      data: movies,
    };

    res.json(response);
  } catch (error) {
    console.error("Get movies error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Search movies
export const handleSearchMovies: RequestHandler = async (req, res) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Search query is required",
      };
      return res.status(400).json(response);
    }

    const movies = await withTransaction(async (db) => {
      const searchTerm = query.toLowerCase().trim();

      return db.movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchTerm) ||
          movie.description.toLowerCase().includes(searchTerm) ||
          movie.genres.some((genre) =>
            genre.toLowerCase().includes(searchTerm),
          ),
      );
    });

    const response: ApiResponse<Movie[]> = {
      success: true,
      data: movies,
    };

    res.json(response);
  } catch (error) {
    console.error("Search movies error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Get upcoming releases
export const handleGetReleases: RequestHandler = async (req, res) => {
  try {
    const releases = await withTransaction(async (db) => {
      // Return releases sorted by release date
      return db.releases.sort(
        (a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
      );
    });

    const response: ApiResponse<Release[]> = {
      success: true,
      data: releases,
    };

    res.json(response);
  } catch (error) {
    console.error("Get releases error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Create a movie suggestion
export const handleCreateSuggestion: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;
    const body = createSuggestionSchema.parse(
      req.body,
    ) as CreateSuggestionRequest;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const suggestion = await withTransaction(async (db) => {
      // Verify movie exists
      const movie = db.movies.find((m) => m.id === body.movieId);
      if (!movie) {
        throw new Error("Movie not found");
      }

      // Verify all suggested users exist
      const invalidUsers = body.suggestedTo.filter(
        (userId) => !db.users.find((u) => u.id === userId),
      );
      if (invalidUsers.length > 0) {
        throw new Error(`Invalid user IDs: ${invalidUsers.join(", ")}`);
      }

      // Create suggestion
      const suggestion: Suggestion = {
        id: generateId(),
        movieId: body.movieId,
        suggestedBy: userId,
        suggestedTo: body.suggestedTo,
        desireRating: body.desireRating,
        comment: body.comment,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.suggestions.push(suggestion);

      // Create notifications for suggested users
      body.suggestedTo.forEach((targetUserId) => {
        const notification = {
          id: generateId(),
          userId: targetUserId,
          type: "suggestion" as const,
          title: "New Movie Suggestion",
          content: `${db.users.find((u) => u.id === userId)?.name} suggested ${movie.title} to you`,
          read: false,
          actionData: {
            userId: userId,
            movieId: body.movieId,
            suggestionId: suggestion.id,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.notifications.push(notification);
      });

      return suggestion;
    });

    const response: ApiResponse<Suggestion> = {
      success: true,
      data: suggestion,
      message: "Suggestion created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Create suggestion error:", error);

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
      return res.status(400).json(response);
    }

    if (error instanceof Error) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Get suggestions for a user
export const handleGetSuggestions: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const suggestions = await withTransaction(async (db) => {
      // Get suggestions where user is involved (suggested by or suggested to)
      const userSuggestions = db.suggestions.filter(
        (s) => s.suggestedBy === userId || s.suggestedTo.includes(userId),
      );

      // Enrich with movie and user data
      return userSuggestions.map((suggestion) => {
        const movie = db.movies.find((m) => m.id === suggestion.movieId);
        const suggestedByUser = db.users.find(
          (u) => u.id === suggestion.suggestedBy,
        );
        const watchDesires = db.watchDesires.filter(
          (wd) => wd.suggestionId === suggestion.id,
        );

        return {
          ...suggestion,
          movie,
          suggestedByUser: suggestedByUser
            ? {
                id: suggestedByUser.id,
                name: suggestedByUser.name,
                username: suggestedByUser.username,
              }
            : null,
          watchDesires,
        };
      });
    });

    const response: ApiResponse = {
      success: true,
      data: suggestions,
    };

    res.json(response);
  } catch (error) {
    console.error("Get suggestions error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Update watch desire rating
export const handleUpdateWatchDesire: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;
    const body = updateWatchDesireSchema.parse(
      req.body,
    ) as UpdateWatchDesireRequest;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const watchDesire = await withTransaction(async (db) => {
      // Find or create watch desire
      let existingDesire = db.watchDesires.find(
        (wd) => wd.userId === userId && wd.suggestionId === body.suggestionId,
      );

      const suggestion = db.suggestions.find((s) => s.id === body.suggestionId);
      if (!suggestion) {
        throw new Error("Suggestion not found");
      }

      if (existingDesire) {
        // Update existing
        existingDesire.rating = body.rating;
        existingDesire.updatedAt = new Date().toISOString();
        return existingDesire;
      } else {
        // Create new
        const newDesire: WatchDesire = {
          id: generateId(),
          userId,
          movieId: suggestion.movieId,
          suggestionId: body.suggestionId,
          rating: body.rating,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.watchDesires.push(newDesire);
        return newDesire;
      }
    });

    const response: ApiResponse<WatchDesire> = {
      success: true,
      data: watchDesire,
      message: "Watch desire updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Update watch desire error:", error);

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
      return res.status(400).json(response);
    }

    if (error instanceof Error) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Mark movie as watched
export const handleMarkAsWatched: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;
    const body = markAsWatchedSchema.parse(req.body) as MarkAsWatchedRequest;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const watchedMovie = await withTransaction(async (db) => {
      // Verify movie exists
      const movie = db.movies.find((m) => m.id === body.movieId);
      if (!movie) {
        throw new Error("Movie not found");
      }

      // Create watched movie record
      const watched: WatchedMovie = {
        id: generateId(),
        userId,
        movieId: body.movieId,
        watchedDate: body.watchedDate,
        watchedWith: body.watchedWith,
        originalScore: body.originalScore,
        actualRating: body.reaction?.rating,
        reaction: body.reaction,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.watchedMovies.push(watched);

      return watched;
    });

    const response: ApiResponse<WatchedMovie> = {
      success: true,
      data: watchedMovie,
      message: "Movie marked as watched successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Mark as watched error:", error);

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
      return res.status(400).json(response);
    }

    if (error instanceof Error) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Get user's watch history
export const handleGetWatchHistory: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const watchHistory = await withTransaction(async (db) => {
      const userWatchedMovies = db.watchedMovies
        .filter((wm) => wm.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.watchedDate).getTime() -
            new Date(a.watchedDate).getTime(),
        );

      // Enrich with movie data
      return userWatchedMovies.map((watched) => {
        const movie = db.movies.find((m) => m.id === watched.movieId);
        const watchedWithUsers = watched.watchedWith
          .map((userId) => db.users.find((u) => u.id === userId))
          .filter(Boolean)
          .map((user) => ({
            id: user!.id,
            name: user!.name,
            username: user!.username,
          }));

        return {
          ...watched,
          movie,
          watchedWithUsers,
        };
      });
    });

    const response: ApiResponse = {
      success: true,
      data: watchHistory,
    };

    res.json(response);
  } catch (error) {
    console.error("Get watch history error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};
