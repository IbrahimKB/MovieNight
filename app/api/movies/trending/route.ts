import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { tmdbClient, TMDB_GENRE_MAP } from "@/lib/tmdb";

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
    const page = parseInt(searchParams.get("page") || "1");
    const timeWindow = searchParams.get("timeWindow") === "day" ? "day" : "week";

    const tmdbResponse = await tmdbClient.getTrendingMovies(timeWindow, page);
    
    if (!tmdbResponse) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch trending movies" },
        { status: 500 },
      );
    }

    const movies = tmdbResponse.results.map((movie) => ({
      id: `tmdb_${movie.id}`,
      tmdbId: movie.id,
      title: movie.title || movie.name || "Unknown",
      year: new Date(movie.release_date || movie.first_air_date || "2024-01-01").getFullYear(),
      poster: movie.poster_path
        ? tmdbClient.getPosterUrl(movie.poster_path)
        : null,
      genres: movie.genre_ids?.map((id) => TMDB_GENRE_MAP[id]).filter(Boolean) || [],
      imdbRating: movie.vote_average,
    }));

    return NextResponse.json({
      success: true,
      data: movies,
      pagination: {
        page: tmdbResponse.page,
        totalPages: tmdbResponse.total_pages,
        totalCount: tmdbResponse.total_results,
      },
    });
  } catch (err) {
    console.error("Get trending movies error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
