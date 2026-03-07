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
  desireId: z.string().optional(),
  watchedDate: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  review: z.string().optional(),
  watchedWith: z.array(z.string()).optional(),
  originalScore: z.number().min(1).max(10).optional(),
  reaction: z.record(z.any()).optional(), // generic JSON
});

// -----------------------------------------------------
// Map PUID <-> Internal UUID
// -----------------------------------------------------
async function mapExternalUserIdToInternal(
  externalId: string,
): Promise<string | null> {
  const user = await prisma.authUser.findFirst({
    where: { OR: [{ puid: externalId }, { id: externalId }] },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function mapExternalUserIdsToInternal(
  externalIds: string[],
): Promise<Map<string, string>> {
  const uniqueExternalIds = Array.from(
    new Set(externalIds.map((id) => id.trim()).filter(Boolean)),
  );

  if (uniqueExternalIds.length === 0) {
    return new Map<string, string>();
  }

  const users = await prisma.authUser.findMany({
    where: {
      OR: [{ puid: { in: uniqueExternalIds } }, { id: { in: uniqueExternalIds } }],
    },
    select: { id: true, puid: true },
  });

  const mapped = new Map<string, string>();
  for (const user of users) {
    if (user.puid && uniqueExternalIds.includes(user.puid)) {
      mapped.set(user.puid, user.id);
    }
    if (uniqueExternalIds.includes(user.id)) {
      mapped.set(user.id, user.id);
    }
  }

  return mapped;
}

// -----------------------------------------------------
// POST /api/watch/mark-watched
// -----------------------------------------------------
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
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
        { status: 400 },
      );
    }

    const {
      movieId: inputMovieId,
      desireId,
      watchedDate,
      rating,
      review,
      watchedWith,
      originalScore,
      reaction,
    } = validation.data;

    const watchedWithExternal = Array.from(
      new Set(
        (watchedWith || [])
          .map((id) => id.trim())
          .filter((id) => id && id !== currentUser.id),
      ),
    );

    const watchedWithMap = await mapExternalUserIdsToInternal(watchedWithExternal);
    const validWatchedWithExternal: string[] = [];
    const seenInternalIds = new Set<string>();

    for (const externalId of watchedWithExternal) {
      const internalId = watchedWithMap.get(externalId);
      if (!internalId || internalId === userIdInternal) continue;
      if (seenInternalIds.has(internalId)) continue;
      seenInternalIds.add(internalId);
      validWatchedWithExternal.push(externalId);
    }

    // Ensure movie exists (lazy sync)
    const internalMovieId = await ensureMovieExists(inputMovieId);

    if (!internalMovieId) {
      return NextResponse.json(
        { success: false, error: "Movie not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    const watchedAt = watchedDate ? new Date(watchedDate) : now;

    // Build reaction object with all data
    const reactionData: any = reaction || {};
    if (rating !== undefined) reactionData.rating = rating;
    if (review !== undefined) reactionData.review = review;
    if (watchedWith !== undefined) {
      reactionData.watchedWith = validWatchedWithExternal;
    }

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
          reaction:
            Object.keys(reactionData).length > 0
              ? (reactionData as Prisma.InputJsonValue)
              : undefined,
        },
      });
    } catch (err: any) {
      // Handle unique constraint violation - movie already marked as watched
      if (
        err.code === "P2002" &&
        err.meta?.target?.includes("userId_movieId")
      ) {
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
            { status: 200 },
          );
        }
      }
      // Re-throw if not a constraint violation
      throw err;
    }

    // -----------------------------------------------------
    // Mirror watched history for selected friends.
    // -----------------------------------------------------
    for (const externalFriendId of validWatchedWithExternal) {
      const internalFriendId = watchedWithMap.get(externalFriendId);
      if (!internalFriendId || internalFriendId === userIdInternal) continue;

      const friendReactionData = {
        watchedWith: [
          currentUser.id,
          ...validWatchedWithExternal.filter((id) => id !== externalFriendId),
        ],
      };

      try {
        await prisma.watchedMovie.create({
          data: {
            userId: internalFriendId,
            movieId: internalMovieId,
            watchedAt,
            reaction: friendReactionData as Prisma.InputJsonValue,
          },
        });
      } catch (err: any) {
        // Friend already has this movie in history; keep existing row.
        if (
          err.code !== "P2002" ||
          !err.meta?.target?.includes("userId_movieId")
        ) {
          throw err;
        }
      }

      await prisma.watchDesire.deleteMany({
        where: {
          userId: internalFriendId,
          movieId: internalMovieId,
        },
      });
    }

    // -----------------------------------------------------
    // Remove from current user's WatchDesire if present
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
      { status: 201 },
    );
  } catch (err) {
    console.error("Mark watched error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
