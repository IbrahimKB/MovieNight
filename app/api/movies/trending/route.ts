import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { cacheFunction, CACHE_TTL } from "@/lib/cache";
import { tmdbClient, TMDB_GENRE_MAP, TMDBMovie } from "@/lib/tmdb";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10).default(1),
  timeWindow: z.enum(["day", "week"]).default("week"),
});

const getCachedTrendingMovies = cacheFunction(
  async (timeWindow: "day" | "week", page: number) => {
    return tmdbClient.getTrendingMovies(timeWindow, page);
  },
  ["movies-trending"],
  { revalidate: CACHE_TTL.MINUTE * 10 },
);

function mapTrendingMovie(movie: TMDBMovie) {
  const releaseDate = movie.release_date || movie.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 0;

  return {
    id: `tmdb_${movie.id}`,
    tmdbId: movie.id,
    title: movie.title || movie.name || "Unknown",
    year: Number.isFinite(year) ? year : 0,
    poster: movie.poster_path
      ? tmdbClient.getPosterUrl(movie.poster_path)
      : movie.backdrop_path
        ? tmdbClient.getBackdropUrl(movie.backdrop_path, "w780")
        : null,
    genres:
      movie.genre_ids?.map((id) => TMDB_GENRE_MAP[id]).filter(Boolean) || [],
    imdbRating: movie.vote_average,
  };
}

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
    const parsedQuery = QuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      timeWindow: searchParams.get("timeWindow") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters" },
        { status: 400 },
      );
    }

    const { page, timeWindow } = parsedQuery.data;
    const tmdbResponse = await getCachedTrendingMovies(timeWindow, page);

    if (!tmdbResponse) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch trending movies" },
        { status: 500 },
      );
    }

    const movies = tmdbResponse.results.map(mapTrendingMovie);

    return NextResponse.json({
      success: true,
      data: movies,
      pagination: {
        page: tmdbResponse.page,
        totalPages: Math.min(tmdbResponse.total_pages, 10),
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
