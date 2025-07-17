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
import { tmdbService, MovieNightSearchResult } from "../services/tmdb";

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
  watchedWith: z.array(z.string()).default([]),
  originalScore: z.number().min(1).max(10).optional(),
  reaction: z
    .object({
      rating: z.number().min(1).max(10),
      tags: z.array(z.string()),
      oneLineReaction: z.string().optional(),
    })
    .optional(),
});

// NEW: Update movie schema
const updateMovieSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  year: z.number().min(1900).max(2030).optional(),
  genres: z.array(z.string()).optional(),
  platform: z.string().optional(),
  poster: z.string().nullable().optional(),
  description: z.string().optional(),
  imdbRating: z.number().min(0).max(10).optional(),
  rtRating: z.number().min(0).max(100).optional(),
  releaseDate: z.string().optional(),
});

// Get all movies
export const handleGetMovies: RequestHandler = async (req, res) => {
  try {
    const result = await withTransaction(async (database) => {
      return database.movies;
    });

    res.json({
      success: true,
      data: result,
    } as ApiResponse<Movie[]>);
  } catch (error) {
    console.error("Get movies error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch movies",
    } as ApiResponse);
  }
};

// Search movies
export const handleSearchMovies: RequestHandler = async (req, res) => {
  try {
    const { q, limit = "20" } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required",
      } as ApiResponse);
    }

    const searchLimit = Math.min(parseInt(limit as string) || 20, 100);

    const result = await withTransaction(async (database) => {
      const searchQuery = q.toLowerCase();
      return database.movies
        .filter((movie) => {
          return (
            movie.title.toLowerCase().includes(searchQuery) ||
            movie.description.toLowerCase().includes(searchQuery) ||
            movie.genres.some((genre) =>
              genre.toLowerCase().includes(searchQuery),
            )
          );
        })
        .slice(0, searchLimit);
    });

    res.json({
      success: true,
      data: result,
    } as ApiResponse<Movie[]>);
  } catch (error) {
    console.error("Search movies error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search movies",
    } as ApiResponse);
  }
};

// Get single movie by ID
export const handleGetMovieById: RequestHandler = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        error: "Movie ID is required",
      } as ApiResponse);
    }

    const result = await withTransaction(async (database) => {
      return database.movies.find((movie) => movie.id === movieId);
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Movie not found",
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result,
    } as ApiResponse<Movie>);
  } catch (error) {
    console.error("Get movie by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch movie",
    } as ApiResponse);
  }
};

// NEW: Update movie
export const handleUpdateMovie: RequestHandler = async (req, res) => {
  try {
    const { movieId } = req.params;
    const validation = updateMovieSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      } as ApiResponse);
    }

    const updateData = validation.data;

    const result = await withTransaction(async (database) => {
      const movieIndex = database.movies.findIndex(
        (movie) => movie.id === movieId,
      );

      if (movieIndex === -1) {
        throw new Error("Movie not found");
      }

      const existingMovie = database.movies[movieIndex];
      const updatedMovie: Movie = {
        ...existingMovie,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      database.movies[movieIndex] = updatedMovie;
      return updatedMovie;
    });

    res.json({
      success: true,
      data: result,
      message: "Movie updated successfully",
    } as ApiResponse<Movie>);
  } catch (error) {
    console.error("Update movie error:", error);
    if (error instanceof Error && error.message === "Movie not found") {
      return res.status(404).json({
        success: false,
        error: "Movie not found",
      } as ApiResponse);
    }
    res.status(500).json({
      success: false,
      error: "Failed to update movie",
    } as ApiResponse);
  }
};

// NEW: Delete movie
export const handleDeleteMovie: RequestHandler = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        error: "Movie ID is required",
      } as ApiResponse);
    }

    const result = await withTransaction(async (database) => {
      const movieIndex = database.movies.findIndex(
        (movie) => movie.id === movieId,
      );

      if (movieIndex === -1) {
        throw new Error("Movie not found");
      }

      const deletedMovie = database.movies[movieIndex];

      // Remove movie
      database.movies.splice(movieIndex, 1);

      // Clean up related data
      // Remove suggestions for this movie
      database.suggestions = database.suggestions.filter(
        (suggestion) => suggestion.movieId !== movieId,
      );

      // Remove watch desires for this movie
      database.watchDesires = database.watchDesires.filter(
        (desire) => desire.movieId !== movieId,
      );

      // Remove watched movies entries
      database.watchedMovies = database.watchedMovies.filter(
        (watched) => watched.movieId !== movieId,
      );

      return deletedMovie;
    });

    res.json({
      success: true,
      data: result,
      message: "Movie and related data deleted successfully",
    } as ApiResponse<Movie>);
  } catch (error) {
    console.error("Delete movie error:", error);
    if (error instanceof Error && error.message === "Movie not found") {
      return res.status(404).json({
        success: false,
        error: "Movie not found",
      } as ApiResponse);
    }
    res.status(500).json({
      success: false,
      error: "Failed to delete movie",
    } as ApiResponse);
  }
};

// Get upcoming releases
export const handleGetReleases: RequestHandler = async (req, res) => {
  try {
    const result = await withTransaction(async (database) => {
      return database.releases.sort(
        (a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
      );
    });

    res.json({
      success: true,
      data: result,
    } as ApiResponse<Release[]>);
  } catch (error) {
    console.error("Get releases error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch releases",
    } as ApiResponse);
  }
};

// Create a movie suggestion
export const handleCreateSuggestion: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const validation = createSuggestionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      } as ApiResponse);
    }

    const suggestionData = validation.data as CreateSuggestionRequest;

    const result = await withTransaction(async (database) => {
      // Verify movie exists
      const movie = database.movies.find(
        (m) => m.id === suggestionData.movieId,
      );
      if (!movie) {
        throw new Error("Movie not found");
      }

      // Verify all suggested users exist
      const invalidUsers = suggestionData.suggestedTo.filter(
        (id) => !database.users.find((u) => u.id === id),
      );
      if (invalidUsers.length > 0) {
        throw new Error(`Invalid user IDs: ${invalidUsers.join(", ")}`);
      }

      // Create suggestion
      const suggestion: Suggestion = {
        id: generateId(),
        movieId: suggestionData.movieId,
        suggestedBy: userId,
        suggestedTo: suggestionData.suggestedTo,
        desireRating: suggestionData.desireRating,
        comment: suggestionData.comment,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      database.suggestions.push(suggestion);

      // Create notifications for suggested users
      suggestionData.suggestedTo.forEach((suggestedUserId) => {
        const notification = {
          id: generateId(),
          userId: suggestedUserId,
          type: "suggestion" as const,
          title: "New Movie Suggestion",
          content: `You have a new movie suggestion for "${movie.title}"`,
          read: false,
          actionData: {
            suggestionId: suggestion.id,
            movieId: movie.id,
            suggestedBy: userId,
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
      data: result,
      message: "Suggestion created successfully",
    } as ApiResponse<Suggestion>);
  } catch (error) {
    console.error("Create suggestion error:", error);
    if (error instanceof Error) {
      if (error.message === "Movie not found") {
        return res.status(404).json({
          success: false,
          error: "Movie not found",
        } as ApiResponse);
      }
      if (error.message.includes("Invalid user IDs")) {
        return res.status(400).json({
          success: false,
          error: error.message,
        } as ApiResponse);
      }
    }
    res.status(500).json({
      success: false,
      error: "Failed to create suggestion",
    } as ApiResponse);
  }
};

// Get suggestions for a user
export const handleGetSuggestions: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await withTransaction(async (database) => {
      // Get suggestions where this user is the target
      const userSuggestions = database.suggestions
        .filter((suggestion) => suggestion.suggestedTo.includes(userId))
        .map((suggestion) => {
          const movie = database.movies.find(
            (m) => m.id === suggestion.movieId,
          );
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
        .filter((s) => s.movie && s.suggestedByUser);

      return userSuggestions;
    });

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error("Get suggestions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch suggestions",
    } as ApiResponse);
  }
};

// Update watch desire rating
export const handleUpdateWatchDesire: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const validation = updateWatchDesireSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      } as ApiResponse);
    }

    const watchDesireData = validation.data as UpdateWatchDesireRequest;

    const result = await withTransaction(async (database) => {
      // Find the suggestion
      const suggestion = database.suggestions.find(
        (s) => s.id === watchDesireData.suggestionId,
      );
      if (!suggestion) {
        throw new Error("Suggestion not found");
      }

      // Check if user is a target of this suggestion
      if (!suggestion.suggestedTo.includes(userId)) {
        throw new Error(
          "Unauthorized: User is not a target of this suggestion",
        );
      }

      // Find existing watch desire or create new one
      const existingDesireIndex = database.watchDesires.findIndex(
        (wd) =>
          wd.suggestionId === watchDesireData.suggestionId &&
          wd.userId === userId,
      );

      let watchDesire: WatchDesire;

      if (existingDesireIndex >= 0) {
        // Update existing
        watchDesire = {
          ...database.watchDesires[existingDesireIndex],
          rating: watchDesireData.rating,
          updatedAt: new Date().toISOString(),
        };
        database.watchDesires[existingDesireIndex] = watchDesire;
      } else {
        // Create new
        watchDesire = {
          id: generateId(),
          userId,
          movieId: suggestion.movieId,
          suggestionId: watchDesireData.suggestionId,
          rating: watchDesireData.rating,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        database.watchDesires.push(watchDesire);
      }

      return watchDesire;
    });

    res.json({
      success: true,
      data: result,
      message: "Watch desire updated successfully",
    } as ApiResponse<WatchDesire>);
  } catch (error) {
    console.error("Update watch desire error:", error);
    if (error instanceof Error) {
      if (error.message === "Suggestion not found") {
        return res.status(404).json({
          success: false,
          error: "Suggestion not found",
        } as ApiResponse);
      }
      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({
          success: false,
          error: error.message,
        } as ApiResponse);
      }
    }
    res.status(500).json({
      success: false,
      error: "Failed to update watch desire",
    } as ApiResponse);
  }
};

// Mark movie as watched
export const handleMarkAsWatched: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const validation = markAsWatchedSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      } as ApiResponse);
    }

    const watchedData = validation.data as MarkAsWatchedRequest;

    const result = await withTransaction(async (database) => {
      // Verify movie exists
      const movie = database.movies.find((m) => m.id === watchedData.movieId);
      if (!movie) {
        throw new Error("Movie not found");
      }

      // Create watched movie entry
      const watchedMovie: WatchedMovie = {
        id: generateId(),
        userId,
        movieId: watchedData.movieId,
        watchedDate: watchedData.watchedDate,
        watchedWith: watchedData.watchedWith || [],
        originalScore: watchedData.originalScore,
        actualRating: watchedData.reaction?.rating,
        reaction: watchedData.reaction,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      database.watchedMovies.push(watchedMovie);

      return watchedMovie;
    });

    res.json({
      success: true,
      data: result,
      message: "Movie marked as watched successfully",
    } as ApiResponse<WatchedMovie>);
  } catch (error) {
    console.error("Mark as watched error:", error);
    if (error instanceof Error && error.message === "Movie not found") {
      return res.status(404).json({
        success: false,
        error: "Movie not found",
      } as ApiResponse);
    }
    res.status(500).json({
      success: false,
      error: "Failed to mark movie as watched",
    } as ApiResponse);
  }
};

// Get user's watch history
export const handleGetWatchHistory: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await withTransaction(async (database) => {
      const watchHistory = database.watchedMovies
        .filter((watched) => watched.userId === userId)
        .map((watched) => {
          const movie = database.movies.find((m) => m.id === watched.movieId);
          return {
            ...watched,
            movie,
          };
        })
        .filter((w) => w.movie)
        .sort(
          (a, b) =>
            new Date(b.watchedDate).getTime() -
            new Date(a.watchedDate).getTime(),
        );

      return watchHistory;
    });

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error("Get watch history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch watch history",
    } as ApiResponse);
  }
};
