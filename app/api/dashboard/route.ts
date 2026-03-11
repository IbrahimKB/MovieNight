import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";
import { cacheFunction, CACHE_TTL } from "@/lib/cache";
import { tmdbClient } from "@/lib/tmdb";

// ------------------------------------------------------
// CACHED DATA FETCHERS
// ------------------------------------------------------

const TRENDING_LOOKBACK_DAYS = 45;

// Cache TMDB artwork lookups so dashboard requests do not repeatedly block on external API latency.
const getCachedMovieArtwork = cacheFunction(
  async (tmdbId: number) => {
    if (!process.env.TMDB_API_KEY) return null;

    try {
      const tmdbDetails = await tmdbClient.getMovieDetails(tmdbId);
      if (!tmdbDetails) return null;

      return {
        backdrop: tmdbDetails.backdrop_path
          ? tmdbClient.getBackdropUrl(tmdbDetails.backdrop_path)
          : null,
        poster: tmdbDetails.poster_path
          ? tmdbClient.getPosterUrl(tmdbDetails.poster_path, "w500")
          : null,
      };
    } catch {
      return null;
    }
  },
  ["dashboard-featured-artwork"],
  { revalidate: CACHE_TTL.DAY },
);

function normalizePosterUrl(poster: string | null | undefined): string | null {
  if (!poster) return null;

  if (poster.startsWith("//")) {
    return `https:${poster}`;
  }

  if (poster.startsWith("http://")) {
    return poster.replace("http://", "https://");
  }

  if (poster.startsWith("/")) {
    return tmdbClient.getPosterUrl(poster) || null;
  }

  return poster;
}

async function getNetworkTrendingMovies(squadUserIds: string[]) {
  if (squadUserIds.length === 0) return [];

  const lookbackDate = new Date(
    Date.now() - TRENDING_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  );

  const recentGroups = await prisma.watchedMovie.groupBy({
    by: ["movieId"],
    where: {
      userId: { in: squadUserIds },
      watchedAt: { gte: lookbackDate },
    },
    _count: { movieId: true },
    orderBy: { _count: { movieId: "desc" } },
    take: 8,
  });

  const groupsToUse =
    recentGroups.length > 0
      ? recentGroups
      : await prisma.watchedMovie.groupBy({
          by: ["movieId"],
          where: { userId: { in: squadUserIds } },
          _count: { movieId: true },
          orderBy: { _count: { movieId: "desc" } },
          take: 8,
        });

  if (groupsToUse.length === 0) return [];

  const movieIds = groupsToUse.map((g) => g.movieId);
  const movies = await prisma.movie.findMany({
    where: { id: { in: movieIds } },
    select: {
      id: true,
      tmdbId: true,
      title: true,
      year: true,
      rtRating: true,
      imdbRating: true,
      genres: true,
      description: true,
      poster: true,
    },
  });

  const sorted = movies
    .map((movie) => {
      const count =
        groupsToUse.find((group) => group.movieId === movie.id)?._count.movieId ||
        0;

      return {
        id: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        year: movie.year,
        rating: movie.imdbRating || movie.rtRating || 0,
        genres: movie.genres,
        watchCount: count,
        description: movie.description,
        poster: normalizePosterUrl(movie.poster),
        backdrop: null as string | null,
      };
    })
    .sort((a, b) => {
      if (b.watchCount !== a.watchCount) return b.watchCount - a.watchCount;
      return b.year - a.year;
    });

  const featuredMovie = sorted[0];
  if (featuredMovie?.tmdbId) {
    const artwork = await getCachedMovieArtwork(featuredMovie.tmdbId);
    featuredMovie.backdrop = artwork?.backdrop || null;
    if (!featuredMovie.poster) {
      featuredMovie.poster = artwork?.poster || null;
    }
  }

  return sorted.map(({ tmdbId, ...movie }) => movie);
}

async function getFeaturedUpcomingMovie(squadUserIds: string[]) {
  const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);

  const releases = await prisma.release.findMany({
    where: {
      releaseDate: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    include: {
      movie: {
        select: {
          id: true,
          tmdbId: true,
          title: true,
          year: true,
          imdbRating: true,
          rtRating: true,
          genres: true,
          description: true,
          poster: true,
        },
      },
    },
    orderBy: {
      releaseDate: "asc",
    },
    take: 60,
  });

  if (releases.length === 0) return null;

  const movieIds = Array.from(new Set(releases.map((r) => r.movieId)));
  const desires = await prisma.watchDesire.groupBy({
    by: ["movieId"],
    where: {
      movieId: { in: movieIds },
      userId: { in: squadUserIds },
    },
    _count: { movieId: true },
  });

  const desireCountByMovie = new Map(
    desires.map((row) => [row.movieId, row._count.movieId]),
  );

  const ranked = releases
    .map((release) => ({
      id: release.movie.id,
      title: release.movie.title,
      year: release.movie.year,
      rating: release.movie.imdbRating || release.movie.rtRating || 0,
      genres: release.movie.genres,
      watchCount: desireCountByMovie.get(release.movie.id) || 0,
      description: release.movie.description,
      poster: normalizePosterUrl(release.movie.poster),
      releaseDate: release.releaseDate,
      tmdbId: release.movie.tmdbId,
      backdrop: null as string | null,
    }))
    .sort((a, b) => {
      if (b.watchCount !== a.watchCount) return b.watchCount - a.watchCount;
      return a.releaseDate.getTime() - b.releaseDate.getTime();
    });

  const featured = ranked[0];
  if (featured?.tmdbId) {
    const artwork = await getCachedMovieArtwork(featured.tmdbId);
    featured.backdrop = artwork?.backdrop || null;
    if (!featured.poster) {
      featured.poster = artwork?.poster || null;
    }
  }

  return featured
    ? {
        id: featured.id,
        title: featured.title,
        year: featured.year,
        rating: featured.rating,
        genres: featured.genres,
        watchCount: featured.watchCount,
        description: featured.description,
        poster: featured.poster,
        backdrop: featured.backdrop,
      }
    : null;
}

// Cached Upcoming Releases
const getCachedUpcomingReleases = cacheFunction(
  async () => {
    return await prisma.release.findMany({
      where: {
        releaseDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { releaseDate: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        year: true,
        releaseDate: true,
        poster: true,
        genres: true,
        platform: true,
      },
    });
  },
  ["dashboard-upcoming-releases"],
  { revalidate: CACHE_TTL.HOUR * 12 }, // Cache for 12 hours
);

// ------------------------------------------------------
// MAIN HANDLER
// ------------------------------------------------------
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const userId = user.id;

    // Fetch user-specific data live (cannot be globally cached)
    // But we can parallelize it with cached global data
    const [
      friendships,
      activeSuggestions,
      watchHistoryCount,
      suggestionsMade,
      nudge,
      allWatchedIds,
      upcomingReleases,
      upcomingEvents,
    ] = await Promise.all([
      // 1. Friend relationships (count + squad scope)
      prisma.friendship.findMany({
        where: {
          status: "accepted",
          OR: [{ userId1: userId }, { userId2: userId }],
        },
        select: { userId1: true, userId2: true },
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
        select: { movieId: true }, // Optimized select
      }),

      // 5. Nudge (Optimized)
      prisma.watchDesire.findFirst({
        where: { userId: userId },
        include: { movie: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      }),

      // 6. All Watched IDs with high ratings (for accuracy calc - rating >= 7)
      prisma.watchedMovie.findMany({
        where: {
          userId: userId,
          originalScore: { gte: 7 },
        },
        select: { movieId: true },
      }),

      // 7. Cached Upcoming
      getCachedUpcomingReleases(),

      // 8. Upcoming Events (Personal)
      prisma.event.findMany({
        where: {
          OR: [{ hostUserId: userId }, { participants: { has: userId } }],
          date: { gte: new Date() },
        },
        include: { movie: { select: { title: true, poster: true } } },
        orderBy: { date: "asc" },
        take: 3,
      }),
    ]);

    const friendsCount = friendships.length;
    const squadUserIds = Array.from(
      new Set([
        userId,
        ...friendships.map((f) => (f.userId1 === userId ? f.userId2 : f.userId1)),
      ]),
    );

    const [trending, featuredUpcoming] = await Promise.all([
      getNetworkTrendingMovies(squadUserIds),
      getFeaturedUpcomingMovie(squadUserIds),
    ]);
    const featured = featuredUpcoming || trending[0] || null;

    // Calculate Accuracy (in memory, cheap)
    const watchedSet = new Set(allWatchedIds.map((w) => w.movieId));
    let accuracy = 0;
    if (suggestionsMade.length > 0) {
      const correct = suggestionsMade.filter((s) =>
        watchedSet.has(s.movieId),
      ).length;
      accuracy = Math.round((correct / suggestionsMade.length) * 100);
    }

    // Nudge formatting
    let smartNudge = null;
    if (nudge) {
      smartNudge = {
        id: nudge.id,
        movie: nudge.movie.title,
        reason: "From your watchlist",
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
        featured,
        trending,
        upcoming: upcomingReleases,
        nudge: smartNudge,
        upcomingEvents: upcomingEvents.map((e) => ({
          id: e.id,
          title: e.movie.title,
          date: e.date,
          poster: e.movie.poster,
        })),
      },
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
