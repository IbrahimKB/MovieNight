import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

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

    // Get watched movies for current user
    const result = await query(
      `SELECT wm.id, wm."movieId", wm."watchedAt", wm."originalScore", wm.reaction, wm."createdAt",
              m.title, m.poster, m.year, m.genres, m.description
       FROM movienight."WatchedMovie" wm
       LEFT JOIN movienight."Movie" m ON wm."movieId" = m.id
       WHERE wm."userId" = $1
       ORDER BY wm."watchedAt" DESC`,
      [currentUser.id],
    );

    const watchedMovies = result.rows.map((row) => ({
      id: row.id,
      movieId: row.movieId,
      title: row.title,
      poster: row.poster,
      year: row.year,
      genres: row.genres,
      description: row.description,
      watchedAt: row.watchedAt,
      originalScore: row.originalScore,
      reaction: row.reaction ? JSON.parse(row.reaction) : null,
    }));

    return NextResponse.json({
      success: true,
      data: watchedMovies,
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
