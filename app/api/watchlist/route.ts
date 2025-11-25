import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
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
            fromUser: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch History (WatchedMovie)
    const history = await prisma.watchedMovie.findMany({
      where: { userId: user.id },
      include: {
        movie: true,
      },
      orderBy: { watchedAt: 'desc' }
    });

    // Map to frontend format
    const watchlistData = watchDesires.map(wd => ({
      id: wd.movie.id, // Using movie ID as the primary identifier for the list item seems safer for uniqueness in list
      desireId: wd.id,
      title: wd.movie.title,
      year: wd.movie.year,
      genres: wd.movie.genres,
      platform: wd.movie.platform || 'Unknown',
      poster: wd.movie.poster,
      description: wd.movie.description,
      releaseDate: wd.movie.releaseDate ? wd.movie.releaseDate.toISOString() : null,
      userDesireScore: wd.rating || 0,
      selectedFriends: [], // We don't store this in WatchDesire currently
      suggestedBy: wd.suggestion?.fromUser.name,
      dateAdded: wd.createdAt.toISOString(),
      isWatched: false, // It's in watchlist
    }));

    // Check which watchlist items are also in history (watched)
    // Actually, if it's in history, it might not be in watchlist anymore?
    // Or we mark it as watched.
    const historyMovieIds = new Set(history.map(h => h.movieId));
    
    watchlistData.forEach(item => {
      if (historyMovieIds.has(item.id)) {
        item.isWatched = true;
      }
    });

    const historyData = history.map(h => ({
      id: h.movie.id,
      historyId: h.id,
      title: h.movie.title,
      year: h.movie.year,
      genres: h.movie.genres,
      platform: h.movie.platform || 'Unknown',
      poster: h.movie.poster,
      watchedDate: h.watchedAt.toISOString(),
      watchedWith: [], // We'd need to look up Events or similar to find who it was watched with
      originalScore: h.originalScore || 0,
      actualRating: h.reaction ? (h.reaction as any).rating : undefined,
    }));

    return NextResponse.json({
      success: true,
      watchlist: watchlistData,
      history: historyData,
    });

  } catch (err) {
    console.error("Get watchlist error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, movieId, watchedWith } = body;

    if (action === 'markWatched') {
      if (!movieId) {
        return NextResponse.json({ success: false, error: "Missing movieId" }, { status: 400 });
      }

      // Create WatchedMovie entry
      await prisma.watchedMovie.create({
        data: {
          userId: user.id,
          movieId: movieId,
          // We could store watchedWith in a JSON field or separate table if needed,
          // but current schema doesn't seem to have 'watchedWith' in WatchedMovie explicitly 
          // except maybe in 'reaction' JSON?
          // The UI passes it, but schema has: 
          // reaction      Json?
          reaction: {
             watchedWith: watchedWith || []
          }
        }
      });

      // Optionally remove from WatchDesire?
      // Usually yes.
      await prisma.watchDesire.deleteMany({
        where: {
          userId: user.id,
          movieId: movieId
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("Watchlist action error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

