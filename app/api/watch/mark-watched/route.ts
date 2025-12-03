"use server";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

import { ensureMovieExists } from "@/lib/movies";

const MarkWatchedSchema = z.object({
  movieId: z.union([z.string(), z.number()]), // Accept UUID or TMDB ID
  watchedDate: z.string().datetime().optional(),
  originalScore: z.number().min(1).max(10).optional(),
  reaction: z.record(z.any()).optional(), // generic JSON
});

// -----------------------------------------------------
// Map PUID <-> Internal UUID
// -----------------------------------------------------
async function mapExternalUserIdToInternal(externalId: string): Promise<string | null> {
  const user = await prisma.authUser.findFirst({
    where: { OR: [{ puid: externalId }, { id: externalId }] },
    select: { id: true },
  });
  return user?.id ?? null;
}

// -----------------------------------------------------
// POST /api/watch/mark-watched
// -----------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
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

    const body = await req.json();
    const validation = MarkWatchedSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; "),
        },
        { status: 400 }
      );
    }

    const { movieId: inputMovieId, watchedDate, originalScore, reaction } = validation.data;

    // Ensure movie exists (lazy sync)
    const internalMovieId = await ensureMovieExists(inputMovieId);

    if (!internalMovieId) {
      return NextResponse.json(
        { success: false, error: "Movie not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const watchedAt = watchedDate ? new Date(watchedDate) : now;

    // -----------------------------------------------------
    // Create watched movie record
    // If already watched, return success with existing record
    // reaction: undefined → valid
    // -----------------------------------------------------
    let watched;
    try {
      watched = await prisma.watchedMovie.create({
        data: {
          userId: userIdInternal,
          movieId: internalMovieId,
          watchedAt,
          originalScore: originalScore ?? null,
          reaction: reaction ? (reaction as Prisma.InputJsonValue) : undefined,
        },
      });
    } catch (err: any) {
      // Handle unique constraint violation - movie already marked as watched
      if (err.code === 'P2002' && err.meta?.target?.includes('userId_movieId')) {
        // Movie already watched - fetch existing record
        const existing = await prisma.watchedMovie.findUnique({
          where: {
            userId_movieId: {
              userId: userIdInternal,
              movieId: internalMovieId,
            },
          },
        });

        if (existing) {
          return NextResponse.json(
            {
              success: true,
              data: {
                id: existing.id,
                userId: currentUser.id,
                movieId: internalMovieId,
                watchedAt: existing.watchedAt,
                originalScore: existing.originalScore ?? null,
                reaction: existing.reaction ?? null,
                createdAt: existing.createdAt,
                updatedAt: existing.updatedAt,
              },
              message: "Movie already marked as watched",
            },
            { status: 200 }
          );
        }
      }
      // Re-throw if not a constraint violation
      throw err;
    }

    // -----------------------------------------------------
    // Remove from WatchDesire if present
    // -----------------------------------------------------
    await prisma.watchDesire.deleteMany({
      where: {
        userId: userIdInternal,
        movieId: internalMovieId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: watched.id,
          userId: currentUser.id, // external (puid/id)
          movieId: internalMovieId,
          watchedAt: watched.watchedAt,
          originalScore: watched.originalScore ?? null,
          reaction: watched.reaction ?? null,
          createdAt: watched.createdAt,
          updatedAt: watched.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Mark watched error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
