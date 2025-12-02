import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const movieId = params.id;

    // Verify movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return NextResponse.json(
        { success: false, error: "Movie not found" },
        { status: 404 }
      );
    }

    // Get all users who watched this movie (from watch history)
    const watchers = await prisma.watchedMovie.findMany({
      where: {
        movieId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        watchedAt: "desc",
      },
    });

    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [
          { userId1: user.id },
          { userId2: user.id },
        ],
      },
      select: {
        userId1: true,
        userId2: true,
      },
    });

    const friendIds = new Set<string>();
    friendships.forEach((f) => {
      if (f.userId1 === user.id) {
        friendIds.add(f.userId2);
      } else {
        friendIds.add(f.userId1);
      }
    });

    // Filter watchers to only show friends
    const friendWatchers = watchers
      .filter((w) => friendIds.has(w.userId))
      .map((w) => ({
        userId: w.user.id,
        username: w.user.username,
        name: w.user.name,
        avatar: w.user.avatar,
        watchedAt: w.watchedAt,
        originalScore: w.originalScore,
      }));

    return NextResponse.json({
      success: true,
      data: {
        friendWatchers,
        totalWatchers: watchers.length,
        totalFriendWatchers: friendWatchers.length,
      },
    });
  } catch (error) {
    console.error("Who watched error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
