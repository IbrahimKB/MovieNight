import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const userId = user.id; // Assuming user is already resolved to internal ID by auth lib

    // Use Promise.all to parallelize independent DB queries
    const [
      friendsCount,
      activeSuggestions,
      watchHistory,
      suggestionsMade,
      trendingMovies,
      upcomingReleases,
      nudge
    ] = await Promise.all([
      // 1. Friends Count
      prisma.friendship.count({
        where: {
          status: "accepted",
          OR: [{ userId1: userId }, { userId2: userId }],
        },
      }),

      // 2. Active Suggestions (received)
      prisma.suggestion.count({
        where: {
          toUserId: userId,
          status: "pending",
        },
      }),

      // 3. Watch History (last 7 days)
      prisma.watchedMovie.findMany({
        where: {
          userId: userId,
          watchedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: { id: true },
      }),

      // 4. Suggestions Made (for accuracy)
      prisma.suggestion.findMany({
        where: { fromUserId: userId },
        include: {
          movie: true,
        },
      }),

      // 5. Trending Movies (Global - simplified)
      // Complex aggregation should ideally be cached or computed via cron
      // For now, we'll just fetch top 5 movies by watch count from a materialized view or simple query
      // Since we don't have a materialized view, we'll do a simplified query on recent watches
      prisma.watchedMovie.groupBy({
        by: ['movieId'],
        _count: {
          movieId: true,
        },
        orderBy: {
          _count: {
            movieId: 'desc',
          },
        },
        take: 5,
      }),

      // 6. Upcoming Releases
      prisma.release.findMany({
        where: {
          releaseDate: {
            gte: new Date(),
          },
        },
        orderBy: { releaseDate: 'asc' },
        take: 5,
      }),

      // 7. Nudge (simplified logic for now)
      // Just get a pending suggestion or random movie from watchlist
      prisma.watchDesire.findFirst({
        where: { userId: userId },
        include: { movie: true },
        orderBy: { createdAt: 'desc' },
      })
    ]);

    // Fetch movie details for trending
    const trendingMovieIds = trendingMovies.map(t => t.movieId);
    const trendingMoviesDetails = await prisma.movie.findMany({
      where: { id: { in: trendingMovieIds } },
      select: {
        id: true,
        title: true,
        year: true,
        rtRating: true,
        imdbRating: true,
        genres: true,
      }
    });

    // Map counts back to movies
    const trending = trendingMoviesDetails.map(movie => {
        const count = trendingMovies.find(t => t.movieId === movie.id)?._count.movieId || 0;
        return {
            id: movie.id,
            title: movie.title,
            year: movie.year,
            rating: movie.imdbRating || movie.rtRating || 0,
            genres: movie.genres,
            watchCount: count,
        };
    }).sort((a, b) => b.watchCount - a.watchCount);


    // Calculate Accuracy
    // Fetch watched movies by the user (to check if suggestions were watched)
    // Note: This is a heavy query if history is huge.
    // Optimisation: Only fetch watched IDs.
    const allWatchedIds = await prisma.watchedMovie.findMany({
        where: { userId: userId },
        select: { movieId: true }
    });
    const watchedSet = new Set(allWatchedIds.map(w => w.movieId));
    
    let accuracy = 0;
    if (suggestionsMade.length > 0) {
        const correct = suggestionsMade.filter(s => watchedSet.has(s.movieId)).length;
        accuracy = Math.round((correct / suggestionsMade.length) * 100);
    }

    // Nudge logic
    let smartNudge = null;
    if (nudge) {
        smartNudge = {
            id: nudge.id,
            movie: nudge.movie.title,
            reason: "From your watchlist"
        };
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
            totalFriends: friendsCount,
            activeSuggestions: activeSuggestions,
            moviesWatchedThisWeek: watchHistory.length,
            suggestionAccuracy: accuracy,
        },
        trending,
        upcoming: upcomingReleases,
        nudge: smartNudge
      },
    });

  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
