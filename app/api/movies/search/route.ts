import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tmdbClient } from "@/lib/tmdb";
import { getCurrentUser } from "@/lib/auth";
import { cacheFunction, CACHE_TTL } from "@/lib/cache";

const SearchSchema = z.object({
  q: z.string().min(1),
  page: z.string().transform(Number).optional().default("1"),
});

// Helper function to convert TMDB movie to local format
function mapTMDBMovieToLocal(tmdbMovie: any) {
  const releaseDate = tmdbMovie.release_date || tmdbMovie.first_air_date;
  return {
    id: tmdbMovie.id.toString(), // Use TMDB ID as ID for live results (frontend needs to handle this distinction)
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name || 'Unknown Title',
    year: new Date(releaseDate || '2024-01-01').getFullYear(),
    genres: tmdbMovie.genre_ids || [],
    platform: null,
    poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
    description: tmdbMovie.overview || '',
    imdbRating: tmdbMovie.vote_average || null,
    rtRating: null,
    releaseDate: releaseDate ? new Date(releaseDate) : null,
  };
}

// Cached TMDB Search
const getCachedTMDBSearch = cacheFunction(
  async (query: string, page: number) => {
    if (!process.env.TMDB_API_KEY) return null;
    return await tmdbClient.searchMovies(query, page);
  },
  ['tmdb-search'], // Dynamic keys are handled by the cacheFunction if passed correctly, but here we need query-specific keys
  { revalidate: CACHE_TTL.DAY } // Cache search results for a day
);

// Wrapper to handle dynamic keys properly since unstable_cache expects fixed key parts
// We actually need to call unstable_cache INSIDE a function that takes the dynamic parts
const cachedSearch = async (query: string, page: number) => {
    // Create a specific cache key for this query
    return unstable_cache(
        async () => {
             if (!process.env.TMDB_API_KEY) return null;
             return await tmdbClient.searchMovies(query, page);
        },
        [`tmdb-search-${query}-${page}`], // Unique key per query
        { revalidate: CACHE_TTL.DAY }
    )();
};

import { unstable_cache } from "next/cache"; // Import needed for the fix above


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
    const parsed = SearchSchema.safeParse({
      q: searchParams.get("q"),
      page: searchParams.get("page"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const { q, page } = parsed.data;

    // LIVE TMDB SEARCH WITH CACHING
    if (!process.env.TMDB_API_KEY) {
        console.error("TMDB_API_KEY missing for live search");
        return NextResponse.json({ success: false, error: "Search unavailable" }, { status: 503 });
    }

    // Use cached search
    const tmdbResponse = await cachedSearch(q, page);
    
    if (!tmdbResponse) {
        return NextResponse.json({ success: false, error: "External API error" }, { status: 502 });
    }

    const mappedMovies = tmdbResponse.results.map(mapTMDBMovieToLocal);

    return NextResponse.json({
      success: true,
      data: mappedMovies,
      pagination: {
        page: tmdbResponse.page,
        totalPages: tmdbResponse.total_pages,
        totalResults: tmdbResponse.total_results,
      },
      source: 'tmdb-live'
    });

  } catch (err) {
    console.error("Search movies error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
