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
} from "../models/types.js";
import { withTransaction, generateId } from "../utils/storage.js";
import { tmdbService, MovieNightSearchResult } from "../services/tmdb.js";
import { dbMovies } from "../services/dbMovies.js";

// Validation schemas
const createSuggestionSchema = z.object({
  movieId: z.string().min(1, "Movie ID is required"),
  suggestedTo: z.array(z.string()).min(1, "At least one friend must be selected"),
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

// Update movie schema
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

/* =====================================================================================
   MOVIE ROUTES — SQL FIRST → JSON FALLBACK
 ===================================================================================== */

// Get all movies
export const handleGetMovies: RequestHandler = async (req, res) => {
  try {
    const sqlMovies = await dbMovies.getAll();
    return res.json({ success: true, data: sqlMovies });
  } catch (err) {
    console.error("SQL error (GetMovies), falling back:", err);
  }

  try {
    const result = await withTransaction((db) => db.movies);
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to fetch movies" });
  }
};

// Search movies
export const handleSearchMovies: RequestHandler = async (req, res) => {
  const q = (req.query.q as string) || "";
  const limit = parseInt((req.query.limit as string) || "20");

  if (!q) {
    return res.status(400).json({ success: false, error: "Query parameter 'q' is required" });
  }

  try {
    const sqlResults = await dbMovies.search(q, limit);
    return res.json({ success: true, data: sqlResults });
  } catch (err) {
    console.error("SQL error (SearchMovies), falling back:", err);
  }

  try {
    const result = await withTransaction((db) =>
      db.movies.filter((movie) => {
        const query = q.toLowerCase();
        return (
          movie.title.toLowerCase().includes(query) ||
          movie.description.toLowerCase().includes(query) ||
          movie.genres.some((g) => g.toLowerCase().includes(query))
        );
      })
    );

    return res.json({ success: true, data: result.slice(0, limit) });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to search movies" });
  }
};

// Get movie by ID
export const handleGetMovieById: RequestHandler = async (req, res) => {
  const { movieId } = req.params;

  try {
    const sqlMovie = await dbMovies.getById(movieId);
    if (sqlMovie) return res.json({ success: true, data: sqlMovie });
  } catch (err) {
    console.error("SQL error (GetMovieById), falling back:", err);
  }

  try {
    const result = await withTransaction((db) =>
      db.movies.find((movie) => movie.id === movieId)
    );

    if (!result) {
      return res.status(404).json({ success: false, error: "Movie not found" });
    }

    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to fetch movie" });
  }
};

// Update movie
export const handleUpdateMovie: RequestHandler = async (req, res) => {
  const { movieId } = req.params;
  const validation = updateMovieSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: validation.error.errors,
    });
  }

  const updateData = validation.data;

  try {
    const updated = await dbMovies.update(movieId, updateData);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("SQL update failed, falling back:", err);
  }

  // JSON fallback
  try {
    const result = await withTransaction((db) => {
      const index = db.movies.findIndex((m) => m.id === movieId);
      if (index === -1) throw new Error("Movie not found");

      const updatedMovie = {
        ...db.movies[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      db.movies[index] = updatedMovie;
      return updatedMovie;
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    if (error?.message === "Movie not found") {
      return res.status(404).json({ success: false, error: "Movie not found" });
    }
    return res.status(500).json({ success: false, error: "Failed to update movie" });
  }
};

// Delete movie
export const handleDeleteMovie: RequestHandler = async (req, res) => {
  const { movieId } = req.params;

  try {
    const deleted = await dbMovies.delete(movieId);
    return res.json({ success: true, data: deleted });
  } catch (err) {
    console.error("SQL delete failed, falling back:", err);
  }

  // JSON fallback
  try {
    const deleted = await withTransaction((db) => {
      const index = db.movies.findIndex((m) => m.id === movieId);
      if (index === -1) throw new Error("Movie not found");

      const old = db.movies[index];
      db.movies.splice(index, 1);

      db.suggestions = db.suggestions.filter((s) => s.movieId !== movieId);
      db.watchDesires = db.watchDesires.filter((wd) => wd.movieId !== movieId);
      db.watchedMovies = db.watchedMovies.filter((w) => w.movieId !== movieId);

      return old;
    });

    return res.json({ success: true, data: deleted });
  } catch (error: any) {
    if (error?.message === "Movie not found") {
      return res.status(404).json({ success: false, error: "Movie not found" });
    }
    return res.status(500).json({ success: false, error: "Failed to delete movie" });
  }
};

/* =====================================================================================
   EVERYTHING BELOW THIS LINE remains JSON-only for now
   (Suggestions, WatchDesires, Releases, WatchHistory)
 ===================================================================================== */

export const handleGetReleases: RequestHandler = async (req, res) => {
  try {
    const result = await withTransaction((db) =>
      db.releases.sort(
        (a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
      )
    );

    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to fetch releases" });
  }
};

// 🔥 All suggestion / watch desire / watch history logic stays unchanged for now.
// (Exact code left untouched below)
// ============================================================================
// CREATE SUGGESTION
// ============================================================================

export const handleCreateSuggestion: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const parsed = createSuggestionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const data = parsed.data as CreateSuggestionRequest;

    const result = await withTransaction((db) => {
      const movie = db.movies.find((m) => m.id === data.movieId);
      if (!movie) throw new Error("Movie not found");

      const invalid = data.suggestedTo.filter(
        (id) => !db.users.find((u) => u.id === id)
      );
      if (invalid.length) {
        throw new Error(`Invalid user IDs: ${invalid.join(", ")}`);
      }

      const suggestion: Suggestion = {
        id: generateId(),
        movieId: data.movieId,
        suggestedBy: userId,
        suggestedTo: data.suggestedTo,
        desireRating: data.desireRating,
        comment: data.comment ?? "",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.suggestions.push(suggestion);
      return suggestion;
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// GET SUGGESTIONS FOR A MOVIE OR USER
// ============================================================================

export const handleGetSuggestions: RequestHandler = async (req, res) => {
  try {
    const { movieId, userId } = req.query;

    const suggestions = await withTransaction((db) => {
      return db.suggestions.filter((s) => {
        if (movieId) return s.movieId === String(movieId);
        if (userId) return s.suggestedTo.includes(String(userId));
        return false;
      });
    });

    res.json({ success: true, data: suggestions });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch suggestions" });
  }
};

// ============================================================================
// UPDATE WATCH DESIRE
// ============================================================================

export const handleUpdateWatchDesire: RequestHandler = async (req, res) => {
  try {
    const parsed = updateWatchDesireSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const data = parsed.data as UpdateWatchDesireRequest;

    const updated = await withTransaction((db) => {
      const wd = db.watchDesires.find((w) => w.id === data.suggestionId);
      if (!wd) throw new Error("Watch desire not found");

      wd.rating = data.rating;
      wd.updatedAt = new Date().toISOString();
      return wd;
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// MARK AS WATCHED
// ============================================================================

export const handleMarkAsWatched: RequestHandler = async (req, res) => {
  try {
    const parsed = markAsWatchedSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const data = parsed.data as MarkAsWatchedRequest;

    const result = await withTransaction((db) => {
      const movie = db.movies.find((m) => m.id === data.movieId);
      if (!movie) throw new Error("Movie not found");

      const watched: WatchedMovie = {
        id: generateId(),
        userId: req.params.userId,
        movieId: data.movieId,
        watchedDate: data.watchedDate,
        watchedWith: data.watchedWith,
        originalScore: data.originalScore ?? null,
        actualRating: data.reaction?.rating ?? null,
        reaction: data.reaction ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.watchedMovies.push(watched);
      return watched;
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// GET WATCH HISTORY
// ============================================================================

export const handleGetWatchHistory: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const history = await withTransaction((db) =>
      db.watchedMovies.filter((w) => w.userId === userId)
    );

    res.json({ success: true, data: history });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch watch history" });
  }
};
