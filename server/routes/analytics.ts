import { Router } from "express";
import { verifyJWT } from "./auth";
import { withTransaction } from "../utils/storage";
import { ApiResponse } from "../models/types";

const router = Router();

// Calculate suggestion accuracy for a user
router.get("/suggestion-accuracy/:userId", verifyJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;

    // Users can only view their own accuracy or friends' accuracy
    if (requestingUserId !== userId) {
      // TODO: Add friend validation here
      // For now, allow viewing any user's accuracy
    }

    const database = await withTransaction(async (db) => db);

    // Find all suggestions made by this user
    const userSuggestions = database.suggestions.filter(
      (s) => s.suggestedBy === userId,
    );

    if (userSuggestions.length === 0) {
      return res.json({
        success: true,
        data: {
          userId,
          totalSuggestions: 0,
          accuracy: 0,
          accuracyScore: "No data",
          breakdown: {
            excellent: 0, // 90%+
            good: 0, // 75-89%
            fair: 0, // 60-74%
            poor: 0, // <60%
          },
          recentSuggestions: [],
        },
      } as ApiResponse);
    }

    // Calculate accuracy for each suggestion
    const suggestionAccuracies = userSuggestions
      .map((suggestion) => {
        // Find corresponding watch desires (actual ratings)
        const watchDesires = database.watchDesires.filter(
          (wd) => wd.suggestionId === suggestion.id,
        );

        // Calculate average actual rating for this suggestion
        if (watchDesires.length === 0) {
          return null; // No ratings yet
        }

        const avgActualRating =
          watchDesires.reduce((sum, wd) => sum + wd.rating, 0) /
          watchDesires.length;

        // Calculate accuracy percentage
        const accuracy = Math.round(
          (1 - Math.abs(suggestion.desireRating - avgActualRating) / 10) * 100,
        );

        const movie = database.movies.find((m) => m.id === suggestion.movieId);

        return {
          suggestionId: suggestion.id,
          movieTitle: movie?.title || "Unknown Movie",
          desiredRating: suggestion.desireRating,
          actualRating: avgActualRating,
          accuracy,
          ratingCount: watchDesires.length,
          createdAt: suggestion.createdAt,
        };
      })
      .filter(Boolean); // Remove null values

    if (suggestionAccuracies.length === 0) {
      return res.json({
        success: true,
        data: {
          userId,
          totalSuggestions: userSuggestions.length,
          accuracy: 0,
          accuracyScore: "Pending ratings",
          breakdown: {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0,
          },
          recentSuggestions: [],
        },
      } as ApiResponse);
    }

    // Calculate overall accuracy
    const overallAccuracy =
      suggestionAccuracies.reduce((sum, sa) => sum + sa.accuracy, 0) /
      suggestionAccuracies.length;

    // Categorize suggestions by accuracy
    const breakdown = {
      excellent: suggestionAccuracies.filter((sa) => sa.accuracy >= 90).length,
      good: suggestionAccuracies.filter(
        (sa) => sa.accuracy >= 75 && sa.accuracy < 90,
      ).length,
      fair: suggestionAccuracies.filter(
        (sa) => sa.accuracy >= 60 && sa.accuracy < 75,
      ).length,
      poor: suggestionAccuracies.filter((sa) => sa.accuracy < 60).length,
    };

    // Determine accuracy score label
    let accuracyScore = "Needs work";
    if (overallAccuracy >= 90) accuracyScore = "🎯 Excellent Predictor";
    else if (overallAccuracy >= 75) accuracyScore = "👍 Good Predictor";
    else if (overallAccuracy >= 60) accuracyScore = "👌 Fair Predictor";
    else accuracyScore = "📊 Developing Taste";

    // Get recent suggestions with accuracy
    const recentSuggestions = suggestionAccuracies
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        userId,
        totalSuggestions: userSuggestions.length,
        ratedSuggestions: suggestionAccuracies.length,
        accuracy: Math.round(overallAccuracy),
        accuracyScore,
        breakdown,
        recentSuggestions,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Get suggestion accuracy error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

// Get leaderboard of best predictors
router.get("/suggestion-leaderboard", verifyJWT, async (req, res) => {
  try {
    const database = await withTransaction(async (db) => db);

    // Calculate accuracy for all users who have made suggestions
    const userAccuracies = database.users
      .map((user) => {
        const userSuggestions = database.suggestions.filter(
          (s) => s.suggestedBy === user.id,
        );

        if (userSuggestions.length === 0) return null;

        const suggestionAccuracies = userSuggestions
          .map((suggestion) => {
            const watchDesires = database.watchDesires.filter(
              (wd) => wd.suggestionId === suggestion.id,
            );

            if (watchDesires.length === 0) return null;

            const avgActualRating =
              watchDesires.reduce((sum, wd) => sum + wd.rating, 0) /
              watchDesires.length;

            return Math.round(
              (1 - Math.abs(suggestion.desireRating - avgActualRating) / 10) *
                100,
            );
          })
          .filter(Boolean);

        if (suggestionAccuracies.length === 0) return null;

        const overallAccuracy =
          suggestionAccuracies.reduce((sum, acc) => sum + acc, 0) /
          suggestionAccuracies.length;

        return {
          userId: user.id,
          name: user.name,
          accuracy: Math.round(overallAccuracy),
          totalSuggestions: userSuggestions.length,
          ratedSuggestions: suggestionAccuracies.length,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by accuracy, then by number of rated suggestions
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return b.ratedSuggestions - a.ratedSuggestions;
      })
      .slice(0, 10); // Top 10

    res.json({
      success: true,
      data: userAccuracies,
    } as ApiResponse);
  } catch (error) {
    console.error("Get suggestion leaderboard error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

// Get user's suggestion impact (how many people watched their suggestions)
router.get("/suggestion-impact/:userId", verifyJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const database = await withTransaction(async (db) => db);

    const userSuggestions = database.suggestions.filter(
      (s) => s.suggestedBy === userId,
    );

    const impact = userSuggestions.map((suggestion) => {
      const movie = database.movies.find((m) => m.id === suggestion.movieId);
      const watchDesires = database.watchDesires.filter(
        (wd) => wd.suggestionId === suggestion.id,
      );
      const watchedMovies = database.watchedMovies.filter(
        (wm) => wm.movieId === suggestion.movieId,
      );

      // Find how many people actually watched it after the suggestion
      const watchedAfterSuggestion = watchedMovies.filter((wm) =>
        suggestion.suggestedTo.includes(wm.userId),
      );

      return {
        movieTitle: movie?.title || "Unknown",
        suggestedTo: suggestion.suggestedTo.length,
        responded: watchDesires.length,
        actuallyWatched: watchedAfterSuggestion.length,
        averageDesireRating:
          watchDesires.length > 0
            ? Math.round(
                (watchDesires.reduce((sum, wd) => sum + wd.rating, 0) /
                  watchDesires.length) *
                  10,
              ) / 10
            : null,
        suggestionDate: suggestion.createdAt,
      };
    });

    const totalSuggested = impact.reduce((sum, i) => sum + i.suggestedTo, 0);
    const totalWatched = impact.reduce((sum, i) => sum + i.actuallyWatched, 0);
    const conversionRate =
      totalSuggested > 0
        ? Math.round((totalWatched / totalSuggested) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        userId,
        totalSuggestions: userSuggestions.length,
        totalPeopleSuggestedTo: totalSuggested,
        totalActualWatches: totalWatched,
        conversionRate,
        impact,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Get suggestion impact error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

export default router;
