import { NextRequest, NextResponse } from "next/server";
import { tmdbClient, TMDB_GENRE_MAP } from "@/lib/tmdb";
import { getCurrentUser } from "@/lib/auth";

// -----------------------------------------------
// GET /api/movies/search
// Search movies on TMDB by query
// -----------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "Search query too short",
      });
    }

    console.log(`[SEARCH] TMDB Query: "${q}" (Page: ${page})`);

    const tmdbResponse = await tmdbClient.searchMovies(q, page);

    if (!tmdbResponse || !tmdbResponse.results) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Map TMDB results to our format
    const data = tmdbResponse.results.map((movie: any) => ({
      id: `tmdb_${movie.id}`,
      tmdbId: movie.id,
      title: movie.title || "Unknown Title",
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
      poster: tmdbClient.getPosterUrl(movie.poster_path),
      description: movie.overview || "",
      genres: movie.genre_ids
        ? movie.genre_ids.map((id: number) => TMDB_GENRE_MAP[id] || String(id))
        : [],
      imdbRating: movie.vote_average || null,
    }));

    return NextResponse.json({
      success: true,
      data,
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
      { status: 500 },
    );
  }
}
