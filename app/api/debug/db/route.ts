import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tmdbClient } from "@/lib/tmdb";

export async function GET() {
  try {
    const movieCount = await prisma.movie.count();
    const releaseCount = await prisma.release.count();
    
    // Test TMDB
    let tmdbStatus = "unknown";
    let tmdbSample = null;
    try {
        const search = await tmdbClient.searchMovies("Inception", 1);
        if (search && search.results.length > 0) {
            tmdbStatus = "working";
            tmdbSample = search.results[0].title;
        } else {
            tmdbStatus = "empty_results";
        }
    } catch (e) {
        tmdbStatus = "error: " + String(e);
    }

    return NextResponse.json({
      success: true,
      counts: {
        movies: movieCount,
        releases: releaseCount,
      },
      tmdb: {
          status: tmdbStatus,
          sample: tmdbSample,
          keyConfigured: !!process.env.TMDB_API_KEY
      },
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
