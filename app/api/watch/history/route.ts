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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const history = await prisma.watchedMovie.findMany({
      where: { userId: userIdInternal },
      include: {
        movie: true,
      },
      orderBy: { watchedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const mapped = history.map((wm) => ({
      id: wm.id,
      movieId: wm.movieId,
      title: wm.movie?.title ?? null,
      poster: wm.movie?.poster ?? null,
      year: wm.movie?.year ?? null,
      genres: wm.movie?.genres ?? [],
      description: wm.movie?.description ?? null,
      watchedAt: wm.watchedAt,
      originalScore: wm.originalScore,
      reaction: wm.reaction ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (err) {
    console.error("Get watch history error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
