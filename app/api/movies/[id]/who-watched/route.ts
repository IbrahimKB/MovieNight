import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

async function mapExternalUserIdToInternal(
  externalId: string,
): Promise<string | null> {
  const user = await prisma.authUser.findFirst({
    where: { OR: [{ puid: externalId }, { id: externalId }] },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const userIdInternal = await mapExternalUserIdToInternal(currentUser.id);
    if (!userIdInternal) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const movieId = params.id;

    // Get all friendships for the current user (bidirectional)
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId1: userIdInternal }, { userId2: userIdInternal }],
      },
      select: {
        userId1: true,
        userId2: true,
      },
    });

    // Extract friend IDs
    const friendIds = friendships.flatMap((f) => [
      f.userId1 === userIdInternal ? f.userId2 : f.userId1,
    ]);

    // Find friends who watched this movie
    const watchers = await prisma.watchedMovie.findMany({
      where: {
        movieId: movieId,
        userId: { in: friendIds },
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
      orderBy: { watchedAt: "desc" },
    });

    // Format the response
    const watchersList = watchers.map((w) => ({
      userId: w.user.id,
      username: w.user.username,
      name: w.user.name || w.user.username,
      avatar: w.user.avatar,
      rating: w.originalScore,
      watchedAt: w.watchedAt.toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        data: watchersList,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Get who-watched error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
