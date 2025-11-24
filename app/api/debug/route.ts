/**
 * Debug endpoint to check system status
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Count users
    const userCount = await prisma.authUser.count();
    
    // Count movies
    const movieCount = await prisma.movie.count();

    return NextResponse.json({
      success: true,
      data: {
        database: {
          status: "connected",
          users: userCount,
          movies: movieCount,
        },
        tmdb: {
          apiKeySet: !!process.env.TMDB_API_KEY,
          apiKeyLength: process.env.TMDB_API_KEY?.length || 0,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[DEBUG] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Unknown error",
        details: {
          code: err?.code,
          prismaErrorCode: err?.meta?.code,
        },
      },
      { status: 500 }
    );
  }
}
