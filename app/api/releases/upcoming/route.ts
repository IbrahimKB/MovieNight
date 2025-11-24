import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// GET /api/releases/upcoming
// Returns upcoming movie releases
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get upcoming releases from the next 90 days
    const now = new Date();
    const nineDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const releases = await prisma.movie.findMany({
      where: {
        releaseDate: {
          gte: now,
          lte: nineDaysFromNow,
        },
      },
      select: {
        id: true,
        title: true,
        releaseDate: true,
        poster: true,
        year: true,
        genres: true,
        description: true,
        imdbRating: true,
      },
      orderBy: {
        releaseDate: "asc",
      },
      take: 20, // Limit to 20 upcoming releases
    });

    return NextResponse.json(
      {
        success: true,
        data: releases,
        message: "Upcoming releases retrieved successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching upcoming releases:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
