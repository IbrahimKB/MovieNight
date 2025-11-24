import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ApiResponse } from "@/types";

// ---------------------------------------------
// Validation schema
// ---------------------------------------------
const SearchSchema = z.object({
  q: z.string().optional(),
  limit: z.string().transform(Number).optional().default("50"),
  offset: z.string().transform(Number).optional().default("0"),
});

// ---------------------------------------------
// GET /api/movies
// ---------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const parsed = SearchSchema.safeParse({
      q: searchParams.get("q"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { q, limit, offset } = parsed.data;

    // Build Prisma search filter
    const whereClause: Prisma.MovieWhereInput = q
      ? {
          OR: [
            { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { genres: { has: q } },
          ],
        }
      : {};

    const movies = await prisma.movie.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: movies,
    });
  } catch (err) {
    console.error("Get movies error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
