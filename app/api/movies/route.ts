import { NextRequest, NextResponse } from "next/server";
import { tmdbClient, TMDB_GENRE_MAP } from "@/lib/tmdb";
import { getCurrentUser } from "@/lib/auth";

// ---------------------------------------------
// GET /api/movies
// Search movies via TMDB only (No DB storage)
// ---------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
       return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");

    if (!q) {
      return NextResponse.json({ success: true, results: [] });
    }

    console.log(`[SEARCH] TMDB Query: "${q}" (Page: ${page})`);

    const tmdbResponse = await tmdbClient.searchMovies(q, page);
    
    if (!tmdbResponse || !tmdbResponse.results) {
       return NextResponse.json({ success: true, results: [] });
    }

    // Map TMDB results to our format
    const results = tmdbResponse.results.map((movie) => ({
        tmdbId: movie.id,
        title: movie.title || 'Unknown Title',
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
        poster: tmdbClient.getPosterUrl(movie.poster_path),
        description: movie.overview || '',
        genres: movie.genre_ids.map(id => TMDB_GENRE_MAP[id] || String(id)),
    }));

    return NextResponse.json({
      success: true,
      results,
      pagination: {
        page: tmdbResponse.page,
        totalPages: tmdbResponse.total_pages,
        totalResults: tmdbResponse.total_results,
      },
    });

  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
