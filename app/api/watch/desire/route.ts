import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse, WatchDesire } from "@/types";

const CreateWatchDesireSchema = z.object({
  movieId: z.string().uuid(),
  suggestionId: z.string().uuid().optional(),
  rating: z.number().min(1).max(10).optional(),
});

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    // Require authentication
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

    const { movieId, suggestionId, rating } = validation.data;

    // Validate movie exists
    const movieResult = await query(
      `SELECT id FROM movienight."Movie" WHERE id = $1`,
      [movieId],
    );

    if (movieResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Movie not found",
        },
        { status: 404 },
      );
    }

    // Check if already in watch desire
    const existingResult = await query(
      `SELECT id FROM movienight."WatchDesire" WHERE "userId" = $1 AND "movieId" = $2`,
      [currentUser.id, movieId],
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Movie already in your watch list",
        },
        { status: 409 },
      );
    }

    // Create watch desire
    const desireId = randomUUID();
    const now = new Date();

    await query(
      `INSERT INTO movienight."WatchDesire" (id, "userId", "movieId", "suggestionId", rating, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        desireId,
        currentUser.id,
        movieId,
        suggestionId || null,
        rating || null,
        now,
        now,
      ],
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: desireId,
          userId: currentUser.id,
          movieId,
          suggestionId: suggestionId || null,
          rating: rating || null,
          createdAt: now,
          updatedAt: now,
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
    // Require authentication
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

    // Get watch desires for current user
    const result = await query(
      `SELECT wd.id, wd."userId", wd."movieId", wd."suggestionId", wd.rating, wd."createdAt", wd."updatedAt",
              m.title, m.poster, m.year
       FROM movienight."WatchDesire" wd
       LEFT JOIN movienight."Movie" m ON wd."movieId" = m.id
       WHERE wd."userId" = $1
       ORDER BY wd."createdAt" DESC`,
      [currentUser.id],
    );

    const desires = result.rows.map((row) => ({
      id: row.id,
      movieId: row.movieId,
      title: row.title,
      poster: row.poster,
      year: row.year,
      rating: row.rating,
      createdAt: row.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: desires,
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
