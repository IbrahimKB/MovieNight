import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ApiResponse, WatchedMovie } from '@/types';

const MarkWatchedSchema = z.object({
  movieId: z.string().uuid(),
  watchedDate: z.string().datetime().optional(),
  originalScore: z.number().min(1).max(10).optional(),
  reaction: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthenticated',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = MarkWatchedSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { movieId, watchedDate, originalScore, reaction } = validation.data;

    // Validate movie exists
    const movieResult = await query(
      `SELECT id FROM movienight."Movie" WHERE id = $1`,
      [movieId]
    );

    if (movieResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Movie not found',
        },
        { status: 404 }
      );
    }

    // Create watched movie record
    const watchedId = randomUUID();
    const now = new Date();
    const watchedAt = watchedDate ? new Date(watchedDate) : now;

    await query(
      `INSERT INTO movienight."WatchedMovie" (id, "userId", "movieId", "watchedAt", "originalScore", reaction, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [watchedId, currentUser.id, movieId, watchedAt, originalScore || null, reaction ? JSON.stringify(reaction) : null, now, now]
    );

    // Remove from WatchDesire if present
    await query(
      `DELETE FROM movienight."WatchDesire" WHERE "userId" = $1 AND "movieId" = $2`,
      [currentUser.id, movieId]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: watchedId,
          userId: currentUser.id,
          movieId,
          watchedAt,
          originalScore: originalScore || null,
          reaction: reaction || null,
          createdAt: now,
          updatedAt: now,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Mark watched error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
