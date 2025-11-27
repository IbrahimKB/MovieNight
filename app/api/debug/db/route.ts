import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const movieCount = await prisma.movie.count();
    const releaseCount = await prisma.release.count();
    const sampleMovies = await prisma.movie.findMany({ take: 3 });

    return NextResponse.json({
      success: true,
      counts: {
        movies: movieCount,
        releases: releaseCount,
      },
      sampleMovies,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
