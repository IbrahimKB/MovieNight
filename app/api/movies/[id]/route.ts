import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";
import { tmdbClient } from "@/lib/tmdb";

// ---------------------------------------------
// Zod schema for updates
// ---------------------------------------------
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

// ---------------------------------------------
// Helper to extract ID from URL (Next.js 15 fix)
// ---------------------------------------------
function getMovieId(req: NextRequest): string | null {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  return parts.at(-1) ?? null;
}

// Helper function to convert TMDB movie details to local format
function mapTMDBMovieDetailsToLocal(tmdbMovie: any) {
  const releaseDate = tmdbMovie.release_date || tmdbMovie.first_air_date;
  const runtime = tmdbMovie.runtime || (tmdbMovie.episode_run_time?.length > 0 ? tmdbMovie.episode_run_time[0] : 0);
  
  return {
    id: undefined,
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name || 'Unknown Title',
    year: new Date(releaseDate || '2024-01-01').getFullYear(),
    genres: tmdbMovie.genres?.map((g: any) => g.name) || [],
    platform: null,
    poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
    description: tmdbMovie.overview || '',
    imdbRating: tmdbMovie.vote_average || null,
    rtRating: null,
    releaseDate: releaseDate ? new Date(releaseDate) : null,
    runtime: runtime,
    productionCompanies: tmdbMovie.production_companies?.map((c: any) => c.name) || [],
  };
}

// Check if ID is a TMDB ID or local UUID
function isTMDBId(id: string): boolean {
  return /^\d+$/.test(id);
}

// ---------------------------------------------
// GET /api/movies/[id]
// ---------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Movie ID is required" },
        { status: 400 }
      );
    }

    // If ID looks like TMDB ID (all digits) and TMDB API is available
    if (isTMDBId(id) && process.env.TMDB_API_KEY) {
      const tmdbMovie = await tmdbClient.getMovieDetails(parseInt(id));
      if (tmdbMovie) {
        return NextResponse.json({
          success: true,
          data: mapTMDBMovieDetailsToLocal(tmdbMovie),
          source: 'tmdb',
        });
      }
    }

    // Fallback to local database
    const movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      return NextResponse.json(
        { success: false, error: "Movie not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: movie,
      source: 'local',
    });
  } catch (err) {
    console.error("GET movie error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// PATCH /api/movies/[id]
// (Admin-only)
// ---------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    // Auth required + must be admin
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Movie ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = UpdateMovieSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.movie.update({
      where: { id },
      data: {
        ...data,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("PATCH movie error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
