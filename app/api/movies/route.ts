import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse, Movie } from "@/types";

const SearchSchema = z.object({
  q: z.string().optional(),
  limit: z.string().transform(Number).optional().default("50"),
  offset: z.string().transform(Number).optional().default("0"),
});

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const validation = SearchSchema.safeParse({
      q: searchParams.get("q"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
        },
        { status: 400 },
      );
    }

    const { q, limit, offset } = validation.data;

    let sql = `SELECT id, title, year, genres, platform, poster, description, "imdbRating", "rtRating", "releaseDate", "createdAt", "updatedAt"
               FROM movienight."Movie"`;
    const params: any[] = [];

    if (q) {
      sql += ` WHERE title ILIKE $1 OR description ILIKE $1 OR genres @> ARRAY[$1]`;
      params.push(`%${q}%`);
    }

    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows as Movie[],
    });
  } catch (err) {
    console.error("Get movies error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
