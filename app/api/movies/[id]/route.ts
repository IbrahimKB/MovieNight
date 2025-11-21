import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ApiResponse, Movie } from '@/types';

const UpdateMovieSchema = z.object({
  title: z.string().optional(),
  year: z.number().optional(),
  genres: z.array(z.string()).optional(),
  platform: z.string().optional(),
  poster: z.string().optional(),
  description: z.string().optional(),
  imdbRating: z.number().optional(),
  rtRating: z.number().optional(),
  releaseDate: z.string().datetime().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = params;

    const result = await query(
      `SELECT id, title, year, genres, platform, poster, description, "imdbRating", "rtRating", "releaseDate", "createdAt", "updatedAt"
       FROM movienight."Movie"
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Movie not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0] as Movie,
    });
  } catch (err) {
    console.error('Get movie error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const validation = UpdateMovieSchema.safeParse(body);

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

    const data = validation.data;
    const updates: string[] = [];
    const values: any[] = [id];
    let paramIndex = 2;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.year !== undefined) {
      updates.push(`year = $${paramIndex++}`);
      values.push(data.year);
    }
    if (data.genres !== undefined) {
      updates.push(`genres = $${paramIndex++}`);
      values.push(data.genres);
    }
    if (data.platform !== undefined) {
      updates.push(`platform = $${paramIndex++}`);
      values.push(data.platform);
    }
    if (data.poster !== undefined) {
      updates.push(`poster = $${paramIndex++}`);
      values.push(data.poster);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.imdbRating !== undefined) {
      updates.push(`"imdbRating" = $${paramIndex++}`);
      values.push(data.imdbRating);
    }
    if (data.rtRating !== undefined) {
      updates.push(`"rtRating" = $${paramIndex++}`);
      values.push(data.rtRating);
    }
    if (data.releaseDate !== undefined) {
      updates.push(`"releaseDate" = $${paramIndex++}`);
      values.push(new Date(data.releaseDate));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No fields to update',
        },
        { status: 400 }
      );
    }

    updates.push(`"updatedAt" = NOW()`);

    const sql = `UPDATE movienight."Movie"
                 SET ${updates.join(', ')}
                 WHERE id = $1
                 RETURNING *`;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Movie not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0] as Movie,
    });
  } catch (err) {
    console.error('Update movie error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
