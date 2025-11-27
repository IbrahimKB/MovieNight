import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

import { ensureMovieExists } from "@/lib/movies";

const CreateWatchDesireSchema = z.object({
  movieId: z.union([z.string(), z.number()]), // Accept UUID or TMDB ID
  suggestionId: z.string().uuid().optional(),
  rating: z.number().min(1).max(10).optional(),
});

async function mapExternalUserIdToInternal(
  externalId: string,
): Promise<string | null> {
  const user = await prisma.authUser.findFirst({
    where: { OR: [{ puid: externalId }, { id: externalId }] },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function POST(
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

    const body = await req.json();
    const validation = CreateWatchDesireSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { movieId: inputMovieId, suggestionId, rating } = validation.data;

    // Map current user external -> internal
    const userIdInternal = await mapExternalUserIdToInternal(currentUser.id);
    if (!userIdInternal) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 },
      );
    }

    // Ensure movie exists (lazy sync)
    const internalMovieId = await ensureMovieExists(inputMovieId);

    if (!internalMovieId) {
      return NextResponse.json(
        {
          success: false,
          error: "Movie not found",
        },
        { status: 404 },
      );
    }

    // Check if already in watch desire
    const existing = await prisma.watchDesire.findFirst({
      where: {
        userId: userIdInternal,
        movieId: internalMovieId,
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Movie already in your watch list",
        },
        { status: 409 },
      );
    }

    // Create watch desire
    const desire = await prisma.watchDesire.create({
      data: {
        userId: userIdInternal,
        movieId: internalMovieId,
        suggestionId: suggestionId ?? null,
        rating: rating ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: desire.id,
          userId: currentUser.id, // external ID as before
          movieId: internalMovieId,
          suggestionId: desire.suggestionId,
          rating: desire.rating,
          createdAt: desire.createdAt,
          updatedAt: desire.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Create watch desire error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
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

    const desires = await prisma.watchDesire.findMany({
      where: { userId: userIdInternal },
      include: {
        movie: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const mapped = desires.map((d) => ({
      id: d.id,
      movieId: d.movieId,
      title: d.movie?.title ?? null,
      poster: d.movie?.poster ?? null,
      year: d.movie?.year ?? null,
      rating: d.rating,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (err) {
    console.error("Get watch desires error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
