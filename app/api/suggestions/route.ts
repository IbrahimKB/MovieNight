import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { query } from "@/lib/db";
import { getCurrentUser, getUserExternalId } from "@/lib/auth";
import { ApiResponse, Suggestion } from "@/types";

const CreateSuggestionSchema = z.object({
  movieId: z.string().uuid(),
  toUserId: z.string(),
  message: z.string().optional(),
});

const UserIdMappingSchema = z.object({
  puid: z.string().optional(),
});

// Helper: map external user ID (puid) to internal user ID
async function mapExternalUserIdToInternal(
  externalId: string,
): Promise<string | null> {
  try {
    // Try to find by puid first
    const result = await query(
      `SELECT id FROM auth."User" WHERE puid = $1 OR id = $1 LIMIT 1`,
      [externalId],
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (err) {
    console.error("Error mapping user ID:", err);
    return null;
  }
}

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
    const validation = CreateSuggestionSchema.safeParse(body);

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

    const { movieId, toUserId, message } = validation.data;

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

    // Map toUserId (external) to internal ID
    const toUserIdInternal = await mapExternalUserIdToInternal(toUserId);

    if (!toUserIdInternal) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid user ID: ${toUserId}`,
        },
        { status: 400 },
      );
    }

    // Create suggestion
    const suggestionId = randomUUID();
    const now = new Date();

    await query(
      `INSERT INTO movienight."Suggestion" (id, "movieId", "fromUserId", "toUserId", message, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        suggestionId,
        movieId,
        currentUser.id,
        toUserIdInternal,
        message || null,
        "pending",
        now.toISOString(),
        now.toISOString(),
      ],
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: suggestionId,
          movieId,
          fromUserId: getUserExternalId(currentUser),
          toUserId: toUserId,
          message: message || null,
          status: "pending",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Create suggestion error:", err);
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

    // Get suggestions sent to and by current user
    const result = await query(
      `SELECT s.id, s."movieId", s."fromUserId", s."toUserId", s.message, s.status, s."createdAt", s."updatedAt",
              m.title as "movieTitle", m.poster as "moviePoster",
              fu.puid as "fromUserPuid", fu.username as "fromUserUsername",
              tu.puid as "toUserPuid", tu.username as "toUserUsername"
       FROM movienight."Suggestion" s
       LEFT JOIN movienight."Movie" m ON s."movieId" = m.id
       LEFT JOIN auth."User" fu ON s."fromUserId" = fu.id
       LEFT JOIN auth."User" tu ON s."toUserId" = tu.id
       WHERE s."fromUserId" = $1 OR s."toUserId" = $1
       ORDER BY s."createdAt" DESC`,
      [currentUser.id],
    );

    const suggestions = result.rows.map((row) => ({
      id: row.id,
      movieId: row.movieId,
      movieTitle: row.movieTitle,
      moviePoster: row.moviePoster,
      fromUserId: row.fromUserPuid || row.fromUserId,
      fromUserUsername: row.fromUserUsername,
      toUserId: row.toUserPuid || row.toUserId,
      toUserUsername: row.toUserUsername,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (err) {
    console.error("Get suggestions error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
