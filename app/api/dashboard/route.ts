import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";
import { cacheFunction, CACHE_TTL } from "@/lib/cache";

// ------------------------------------------------------
// CACHED DATA FETCHERS
// ------------------------------------------------------

// Cached Trending Movies (Global)
const getCachedTrendingMovies = cacheFunction(
  async () => {
    const trendingGroups = await prisma.watchedMovie.groupBy({
      by: ['movieId'],
      _count: { movieId: true },
      orderBy: { _count: { movieId: 'desc' } },
      take: 5,
    });

    const movieIds = trendingGroups.map(g => g.movieId);
    const movies = await prisma.movie.findMany({
      where: { id: { in: movieIds } },
      select: {
        id: true,
        title: true,
        year: true,
        rtRating: true,
        imdbRating: true,
        genres: true,
      }
    });

    return movies.map(movie => {
        const count = trendingGroups.find(t => t.movieId === movie.id)?._count.movieId || 0;
        return {
            id: movie.id,
            title: movie.title,
            year: movie.year,
            rating: movie.imdbRating || movie.rtRating || 0,
            genres: movie.genres,
            watchCount: count,
        };
    }).sort((a, b) => b.watchCount - a.watchCount);
  },
  ['dashboard-trending-movies'],
  { revalidate: CACHE_TTL.HOUR } // Cache for 1 hour
);

// Cached Upcoming Releases
const getCachedUpcomingReleases = cacheFunction(
  async () => {
    return await prisma.movie.findMany({
      where: {
        releaseDate: {
          gte: new Date(),
        },
      },
      orderBy: { releaseDate: 'asc' },
      take: 5,
      select: {
          id: true,
          title: true,
          year: true,
          releaseDate: true,
          poster: true,
          genres: true,
          platform: true
      }
    });
  },
  ['dashboard-upcoming-releases'],
  { revalidate: CACHE_TTL.HOUR * 12 } // Cache for 12 hours
);


// ------------------------------------------------------
// MAIN HANDLER
// ------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Fetch user-specific data live (cannot be globally cached)
    // But we can parallelize it with cached global data
    const [
      friendsCount,
      activeSuggestions,
      watchHistoryCount,
      suggestionsMade,
      nudge,
      allWatchedIds,
      trending,
      upcomingReleases,
      upcomingEvents
    ] = await Promise.all([
      // 1. Friends Count
      prisma.friendship.count({
        where: {
          status: "accepted",
          OR: [{ userId1: userId }, { userId2: userId }],
        },
      }),

      // 2. Active Suggestions
      prisma.suggestion.count({
        where: {
          toUserId: userId,
          status: "pending",
        },
      }),

      // 3. Watch History Count (Last 7 days)
      prisma.watchedMovie.count({
        where: {
          userId: userId,
          watchedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // 4. Suggestions Made (for accuracy)
      prisma.suggestion.findMany({
        where: { fromUserId: userId },
        select: { movieId: true } // Optimized select
      }),

      // 5. Nudge (Optimized)
      prisma.watchDesire.findFirst({
        where: { userId: userId },
        include: { movie: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
      }),

      // 6. All Watched IDs (for accuracy calc)
      prisma.watchedMovie.findMany({
          where: { userId: userId },
          select: { movieId: true }
      }),

      // 7. Cached Trending
      getCachedTrendingMovies(),

      // 8. Cached Upcoming
      getCachedUpcomingReleases(),

      // 9. Upcoming Events (Personal)
      prisma.event.findMany({
        where: {
          OR: [{ hostUserId: userId }, { participants: { has: userId } }],
          date: { gte: new Date() }
        },
        include: { movie: { select: { title: true, poster: true } } },
        orderBy: { date: 'asc' },
        take: 3
      })
    ]);

    // Calculate Accuracy (in memory, cheap)
    const watchedSet = new Set(allWatchedIds.map(w => w.movieId));
    let accuracy = 0;
    if (suggestionsMade.length > 0) {
        const correct = suggestionsMade.filter(s => watchedSet.has(s.movieId)).length;
        accuracy = Math.round((correct / suggestionsMade.length) * 100);
    }

    // Nudge formatting
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
            moviesWatchedThisWeek: watchHistoryCount,
            suggestionAccuracy: accuracy,
        },
        trending,
        upcoming: upcomingReleases,
        nudge: smartNudge,
        upcomingEvents: upcomingEvents.map(e => ({
            id: e.id,
            title: e.movie.title,
            date: e.date,
            poster: e.movie.poster
        }))
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
