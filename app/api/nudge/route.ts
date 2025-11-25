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

    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId1: user.id }, { userId2: user.id }],
        status: 'accepted'
      }
    });

    const friendIds = friendships.map(f => f.userId1 === user.id ? f.userId2 : f.userId1);

    if (friendIds.length === 0) {
        return NextResponse.json({ success: true, nudge: null });
    }

    // Find a movie highly rated by friends (WatchDesire > 8)
    // That the user hasn't watched or desired
    
    const userMovieIds = await prisma.watchDesire.findMany({
        where: { userId: user.id },
        select: { movieId: true }
    }).then(res => res.map(r => r.movieId));
    
    // Also exclude watched
    const userWatchedIds = await prisma.watchedMovie.findMany({
        where: { userId: user.id },
        select: { movieId: true }
    }).then(res => res.map(r => r.movieId));

    const excludedIds = [...userMovieIds, ...userWatchedIds];

    const potentialNudges = await prisma.watchDesire.findMany({
        where: {
            userId: { in: friendIds },
            rating: { gte: 8 },
            movieId: { notIn: excludedIds }
        },
        include: {
            movie: true,
            user: true
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    if (potentialNudges.length === 0) {
         return NextResponse.json({ success: true, nudge: null });
    }

    // Pick one
    const randomNudge = potentialNudges[Math.floor(Math.random() * potentialNudges.length)];

    return NextResponse.json({
      success: true,
      nudge: {
        id: `nudge-${randomNudge.id}`,
        movie: randomNudge.movie.title,
        reason: `${randomNudge.user.name} rated it ${randomNudge.rating}/10 recently`
      }
    });

  } catch (err) {
    console.error("Nudge error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
