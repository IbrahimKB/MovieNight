// server/routes/suggestions.ts
import { Router } from "express";
import { verifyJWT } from "./auth.js";
import {
  ApiResponse,
  CreateSuggestionRequest,
  UpdateWatchDesireRequest,
  Suggestion,
  Movie,
  JWTPayload,
} from "../models/types.js";
import { sql } from "../db/sql.js";

const router = Router();

/**
 * Helper: get current userId from JWT
 */
function getUserIdFromRequest(req: any): string | null {
  const payload = req.user as JWTPayload | undefined;
  return payload?.userId ?? null;
}

/**
 * ---------------------------------------------------------------------------
 * POST /api/suggestions
 * Create a new suggestion (PG-only)
 * Body: CreateSuggestionRequest { movieId, suggestedTo[], desireRating, comment? }
 * ---------------------------------------------------------------------------
 */
router.post("/", verifyJWT, async (req, res) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    } as ApiResponse);
  }

  const body = req.body as CreateSuggestionRequest | undefined;

  if (
    !body ||
    !body.movieId ||
    !Array.isArray(body.suggestedTo) ||
    body.suggestedTo.length === 0 ||
    typeof body.desireRating !== "number"
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid request body",
    } as ApiResponse);
  }

  const { movieId, suggestedTo, desireRating, comment } = body;

  try {
    // 1) Ensure movie exists
    const movieResult = await sql<Movie>(
      `
      SELECT *
      FROM movienight."Movie"
      WHERE id = $1
      LIMIT 1;
      `,
      [movieId],
    );

    if (movieResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Movie not found",
      } as ApiResponse);
    }

    // 2) Validate that all suggestedTo user IDs exist in auth."User"
    const usersResult = await sql<{ id: string }>(
      `
      SELECT "id"
      FROM auth."User"
      WHERE "id" = ANY($1::text[]);
      `,
      [suggestedTo],
    );

    const foundIds = new Set(usersResult.rows.map((r) => r.id));
    const invalidUserIds = suggestedTo.filter((id) => !foundIds.has(id));

    if (invalidUserIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid user IDs: ${invalidUserIds.join(", ")}`,
      } as ApiResponse);
    }

    // 3) Insert suggestion into movienight."Suggestion"
    const suggestionResult = await sql<Suggestion & { suggestedTo: string[] }>(
      `
      INSERT INTO movienight."Suggestion" (
        id,
        "movieId",
        "suggestedBy",
        "suggestedTo",
        "desireRating",
        comment,
        status
      )
      VALUES (
        gen_random_uuid(),
        $1::uuid,
        $2::uuid,
        $3::text[],
        $4::integer,
        $5::text,
        'pending'
      )
      RETURNING
        id,
        "movieId",
        "suggestedBy",
        "suggestedTo",
        "desireRating",
        comment,
        status,
        "createdAt",
        "updatedAt";
      `,
      [movieId, userId, suggestedTo, desireRating, comment ?? null],
    );

    const suggestion = suggestionResult.rows[0];

    // (Optional) Insert notifications into movienight."Notification"
    // Only if your Notification schema matches this shape; otherwise tweak.
    await sql(
      `
      INSERT INTO movienight."Notification" (
        id,
        "userId",
        type,
        payload
      )
      SELECT
        gen_random_uuid(),
        u."id",
        'new_suggestion',
        jsonb_build_object(
          'suggestionId', $1,
          'movieId', $2,
          'fromUserId', $3
        )
      FROM auth."User" u
      WHERE u."id" = ANY($4::text[]);
      `,
      [suggestion.id, movieId, userId, suggestedTo],
    ).catch((err) => {
      // Don't fail the whole request if notifications break
      console.error("Failed to insert notifications for suggestion:", err);
    });

    return res.json({
      success: true,
      data: suggestion,
      message: "Suggestion created",
    } as ApiResponse);
  } catch (error) {
    console.error("Create suggestion error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

/**
 * ---------------------------------------------------------------------------
 * GET /api/suggestions
 * Get suggestions *for the current user* (they were suggested TO you)
 * Returns Suggestion + Movie + suggestedByUser + optional userRating
 * ---------------------------------------------------------------------------
 */
router.get("/", verifyJWT, async (req, res) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    } as ApiResponse);
  }

  try {
    const result = await sql<
      Suggestion & {
        movie: Movie;
        suggestedByUser: { id: string; username: string; name: string | null };
        userRating: number | null;
      }
    >(
      `
      SELECT
        s.id,
        s."movieId",
        s."suggestedBy",
        s."suggestedTo",
        s."desireRating",
        s.comment,
        s.status,
        s."createdAt",
        s."updatedAt",
        json_build_object(
          'id', m.id,
          'title', m.title,
          'year', m.year,
          'poster', m.poster,
          'rating', m.rating,
          'genres', m.genres
        ) AS "movie",
        json_build_object(
          'id', ub.id,
          'username', ub.username,
          'name', ub.name
        ) AS "suggestedByUser",
        wd.rating AS "userRating"
      FROM movienight."Suggestion" s
      JOIN movienight."Movie" m
        ON m.id = s."movieId"
      JOIN auth."User" ub
        ON s."suggestedBy"::text = ub."id"
      LEFT JOIN movienight."WatchDesire" wd
        ON wd."suggestionId" = s.id
       AND wd."userId" = $1
      WHERE $1 = ANY(s."suggestedTo")
      ORDER BY s."createdAt" DESC;
      `,
      [userId],
    );

    return res.json({
      success: true,
      data: result.rows,
    } as ApiResponse);
  } catch (error) {
    console.error("Get suggestions error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

/**
 * ---------------------------------------------------------------------------
 * POST /api/suggestions/respond
 * Accept / ignore a suggestion by setting your WatchDesire rating.
 *
 * Body: UpdateWatchDesireRequest { suggestionId, rating }
 * - rating high (e.g. >= 5) → treated as "accepted"
 * - rating low  (e.g. <= 3) → treated as "rejected"
 * ---------------------------------------------------------------------------
 */
router.post("/respond", verifyJWT, async (req, res) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    } as ApiResponse);
  }

  const body = req.body as UpdateWatchDesireRequest | undefined;

  if (!body || !body.suggestionId || typeof body.rating !== "number") {
    return res.status(400).json({
      success: false,
      error: "Invalid request body",
    } as ApiResponse);
  }

  const { suggestionId, rating } = body;

  try {
    // 1) Get the suggestion & its movie
    const suggestionResult = await sql<{ movieId: string }>(
      `
      SELECT "movieId"
      FROM movienight."Suggestion"
      WHERE id = $1::uuid
      LIMIT 1;
      `,
      [suggestionId],
    );

    if (suggestionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Suggestion not found",
      } as ApiResponse);
    }

    const movieId = suggestionResult.rows[0].movieId;

    // 2) Upsert WatchDesire for this user + suggestion
    const existingResult = await sql<{ id: string }>(
      `
      SELECT id
      FROM movienight."WatchDesire"
      WHERE "userId" = $1
        AND "suggestionId" = $2::uuid
      LIMIT 1;
      `,
      [userId, suggestionId],
    );

    if (existingResult.rows.length > 0) {
      await sql(
        `
        UPDATE movienight."WatchDesire"
        SET rating = $3,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $4;
        `,
        [userId, suggestionId, rating, existingResult.rows[0].id],
      );
    } else {
      await sql(
        `
        INSERT INTO movienight."WatchDesire" (
          id,
          "userId",
          "movieId",
          "suggestionId",
          rating
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2::uuid,
          $3::uuid,
          $4
        );
        `,
        [userId, movieId, suggestionId, rating],
      );
    }

    // 3) Update suggestion status based on rating
    const newStatus = rating <= 3 ? "rejected" : "accepted";

    await sql(
      `
      UPDATE movienight."Suggestion"
      SET status = $2,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1::uuid;
      `,
      [suggestionId, newStatus],
    );

    return res.json({
      success: true,
      data: {
        suggestionId,
        rating,
        status: newStatus,
      },
      message: "Suggestion response recorded",
    } as ApiResponse);
  } catch (error) {
    console.error("Respond to suggestion error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

/**
 * ---------------------------------------------------------------------------
 * DELETE /api/suggestions/:id
 * (Optional) Hard-delete a suggestion + its WatchDesire rows
 * ---------------------------------------------------------------------------
 */
router.delete("/:id", verifyJWT, async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    } as ApiResponse);
  }

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Suggestion ID is required",
    } as ApiResponse);
  }

  try {
    // Delete WatchDesire rows first to avoid orphans
    await sql(
      `
      DELETE FROM movienight."WatchDesire"
      WHERE "suggestionId" = $1::uuid;
      `,
      [id],
    );

    const deleted = await sql<Suggestion>(
      `
      DELETE FROM movienight."Suggestion"
      WHERE id = $1::uuid
      RETURNING
        id,
        "movieId",
        "suggestedBy",
        "suggestedTo",
        "desireRating",
        comment,
        status,
        "createdAt",
        "updatedAt";
      `,
      [id],
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Suggestion not found",
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: deleted.rows[0],
      message: "Suggestion and related data deleted successfully",
    } as ApiResponse);
  } catch (error) {
    console.error("Delete suggestion error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

export default router;
