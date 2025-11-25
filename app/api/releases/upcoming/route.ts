import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { tmdbClient } from "@/lib/tmdb";

const PageSchema = z.object({
  page: z.string().transform(Number).optional().default("1"),
  limit: z.string().transform(Number).optional().default("20"),
});

// Helper function to convert TMDB movie to local format
function mapTMDBMovieToLocal(tmdbMovie: any) {
  return {
    id: undefined,
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    year: new Date(tmdbMovie.release_date || '2024-01-01').getFullYear(),
    genres: tmdbMovie.genre_ids || [],
    platform: null,
    poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
    description: tmdbMovie.overview || '',
    imdbRating: tmdbMovie.vote_average || null,
    rtRating: null,
    releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
  };
}

// GET /api/releases/upcoming
// Returns upcoming movie releases
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const parsed = PageSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { page, limit } = parsed.data;

    // Try TMDB API first if available
    if (process.env.TMDB_API_KEY) {
      const tmdbResponse = await tmdbClient.getUpcomingMovies(page);
      
      if (tmdbResponse) {
        const mappedReleases = tmdbResponse.results
          .slice(0, limit)
          .map(mapTMDBMovieToLocal);
        
        return NextResponse.json(
          {
            success: true,
            data: mappedReleases,
            pagination: {
              page: tmdbResponse.page,
              totalPages: tmdbResponse.total_pages,
              totalResults: tmdbResponse.total_results,
            },
            message: "Upcoming releases retrieved successfully from TMDB",
          },
          { status: 200 }
        );
      }
    }

    // Fallback to local database
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
      take: limit,
    });

    return NextResponse.json(
      {
        success: true,
        data: releases,
        message: "Upcoming releases retrieved successfully from local database",
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
