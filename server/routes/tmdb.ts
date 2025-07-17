import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Movie } from "../models/types";
import { withTransaction, generateId } from "../utils/storage";
import { tmdbService, MovieNightSearchResult } from "../services/tmdb";

// Search movies via TMDB
export const handleSearchMoviesExternal: RequestHandler = async (req, res) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;

    if (!query || query.trim().length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Search query is required",
      };
      return res.status(400).json(response);
    }

    const searchResults = await tmdbService.searchMulti(query, page);
    const rateLimitStatus = tmdbService.getRateLimitStatus();

    const response: ApiResponse<{
      results: MovieNightSearchResult[];
      rateLimit: typeof rateLimitStatus;
    }> = {
      success: true,
      data: {
        results: searchResults,
        rateLimit: rateLimitStatus,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("TMDB search error:", error);

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search movies",
    };

    res.status(500).json(response);
  }
};

// Save TMDB movie to local database
const saveMovieSchema = z.object({
  tmdbId: z.number(),
  title: z.string().min(1, "Title is required"),
  year: z.number().min(1900).max(2030),
  description: z.string(),
  poster: z.string().nullable(),
  mediaType: z.enum(["movie", "tv"]),
  rating: z.number().min(0).max(10),
  genres: z.array(z.string()),
});

export const handleSaveMovieFromTMDB: RequestHandler = async (req, res) => {
  try {
    const body = saveMovieSchema.parse(req.body);

    const savedMovie = await withTransaction(async (db) => {
      // Check if movie already exists by title and year
      const existingMovie = db.movies.find(
        (m) => m.title === body.title && m.year === body.year,
      );

      if (existingMovie) {
        throw new Error("Movie already exists in database");
      }

      // Create new movie record
      const movie: Movie = {
        id: generateId(),
        title: body.title,
        year: body.year,
        genres: body.genres,
        platform: body.mediaType === "tv" ? "TV" : undefined,
        poster: body.poster || undefined,
        description: body.description,
        imdbRating: body.rating,
        releaseDate: `${body.year}-01-01`, // Approximate release date
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.movies.push(movie);
      return movie;
    });

    const response: ApiResponse<Movie> = {
      success: true,
      data: savedMovie,
      message: "Movie saved successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Save movie error:", error);

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

// Get TMDB rate limit status
export const handleGetRateLimit: RequestHandler = async (req, res) => {
  try {
    const rateLimitStatus = tmdbService.getRateLimitStatus();

    const response: ApiResponse = {
      success: true,
      data: rateLimitStatus,
    };

    res.json(response);
  } catch (error) {
    console.error("Rate limit status error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Failed to get rate limit status",
    };
    res.status(500).json(response);
  }
};
