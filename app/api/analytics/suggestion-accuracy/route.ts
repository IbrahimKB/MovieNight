import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

const RATING_THRESHOLD = 7; // Minimum rating to consider a suggestion successful

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
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    const userIdInternal = await mapExternalUserIdToInternal(currentUser.id);
    if (!userIdInternal) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 },
      );
    }

    // Get all suggestions made by the current user
    const mySuggestions = await prisma.suggestion.findMany({
      where: { fromUserId: userIdInternal },
      include: {
        movie: true,
        toUser: true,
      },
    });

    // Get all watched movies with ratings >= RATING_THRESHOLD
    const successfulWatches = await prisma.watchedMovie.findMany({
      where: {
        userId: userIdInternal,
        originalScore: { gte: RATING_THRESHOLD },
      },
      select: { movieId: true, originalScore: true },
    });

    const successfulMovieIds = new Set(successfulWatches.map((w) => w.movieId));

    // Calculate accuracy: how many suggestions were watched AND rated >= 7
    let accuracy = 0;
    if (mySuggestions.length > 0) {
      const correctSuggestions = mySuggestions.filter((s) =>
        successfulMovieIds.has(s.movieId),
      ).length;
      accuracy = Math.round((correctSuggestions / mySuggestions.length) * 100);
    }

    return NextResponse.json({
      success: true,
      data: {
        accuracy,
        totalSuggestions: mySuggestions.length,
        successfulSuggestions: mySuggestions.filter((s) =>
          successfulMovieIds.has(s.movieId),
        ).length,
        ratingThreshold: RATING_THRESHOLD,
      },
    });
  } catch (err) {
    console.error("Get suggestion accuracy error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
