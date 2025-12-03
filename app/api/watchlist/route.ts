import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

// Validation schemas
const WatchlistPostSchema = z.object({
  action: z.enum(["markWatched"]).describe("Action to perform"),
  movieId: z.string().min(1).describe("Movie ID"),
  watchedWith: z
    .array(z.string())
    .optional()
    .default([])
    .describe("IDs of users watched with"),
});

type WatchlistPostRequest = z.infer<typeof WatchlistPostSchema>;

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    // Fetch Watchlist (WatchDesire)
    // We only want movies that are NOT in watch history?
    // Typically watchlist implies "not watched yet".
    // The schema has separate tables. A movie can be in both (re-watch?).
    // But for simplicity, let's fetch WatchDesire.

    const watchDesires = await prisma.watchDesire.findMany({
      where: { userId: user.id },
      include: {
        movie: true,
        suggestion: {
          include: {
            fromUser: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch History (WatchedMovie)
    const history = await prisma.watchedMovie.findMany({
      where: { userId: user.id },
      include: {
        movie: true,
      },
      orderBy: { watchedAt: "desc" },
    });

    // Fetch events to derive selectedFriends for each watchlist item
    const events = await prisma.event.findMany({
      where: {
        OR: [{ hostUserId: user.id }, { participants: { has: user.id } }],
      },
      select: {
        movieId: true,
        participants: true,
        hostUserId: true,
      },
    });

    // Map events by movieId for quick lookup
    const eventsByMovieId = new Map<string, string[]>();
    events.forEach((event) => {
      const participants = event.participants || [];
      // Exclude the current user from selectedFriends
      const friendIds = participants.filter((p) => p !== user.id);
      if (friendIds.length > 0 || event.hostUserId !== user.id) {
        eventsByMovieId.set(event.movieId, friendIds);
      }
    });

    // Map to frontend format
    const watchlistData = watchDesires.map((wd) => ({
      id: wd.movie.id, // Using movie ID as the primary identifier for the list item seems safer for uniqueness in list
      desireId: wd.id,
      title: wd.movie.title,
      year: wd.movie.year,
      genres: wd.movie.genres,
      platform: wd.movie.platform || "Unknown",
      poster: wd.movie.poster,
      description: wd.movie.description,
      releaseDate: wd.movie.releaseDate
        ? wd.movie.releaseDate.toISOString()
        : null,
      userDesireScore: wd.rating || 0,
      selectedFriends: eventsByMovieId.get(wd.movie.id) || [],
      suggestedBy: wd.suggestion?.fromUser.name,
      dateAdded: wd.createdAt.toISOString(),
      isWatched: false, // It's in watchlist
    }));

    // Check which watchlist items are also in history (watched)
    // Actually, if it's in history, it might not be in watchlist anymore?
    // Or we mark it as watched.
    const historyMovieIds = new Set(history.map((h) => h.movieId));

    watchlistData.forEach((item) => {
      if (historyMovieIds.has(item.id)) {
        item.isWatched = true;
      }
    });

    const historyData = history.map((h) => ({
      id: h.movie.id,
      historyId: h.id,
      title: h.movie.title,
      year: h.movie.year,
      genres: h.movie.genres,
      platform: h.movie.platform || "Unknown",
      poster: h.movie.poster,
      watchedDate: h.watchedAt.toISOString(),
      watchedWith: [], // We'd need to look up Events or similar to find who it was watched with
      originalScore: h.originalScore || 0,
      actualRating: h.reaction ? (h.reaction as any).rating : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        watchlist: watchlistData,
        history: historyData,
      },
    });
  } catch (err) {
    console.error("Get watchlist error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    // Validate request body
    const body = await req.json();
    const validationResult = WatchlistPostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { action, movieId, watchedWith } = validationResult.data;

    if (action === "markWatched") {
      // Create WatchedMovie entry
      await prisma.watchedMovie.create({
        data: {
          userId: user.id,
          movieId: movieId,
          reaction: {
            watchedWith: watchedWith,
          },
        },
      });

      // Remove from WatchDesire since it's now watched
      await prisma.watchDesire.deleteMany({
        where: {
          userId: user.id,
          movieId: movieId,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (err) {
    console.error("Watchlist action error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
