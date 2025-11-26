/**
 * Sync Popular Movies from TMDB
 * Runs daily to populate the movie catalog for search/discovery
 * Pulls top 1000+ popular movies across multiple pages
 */

import axios from "axios";
import { prisma } from "@/lib/prisma";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  genre_ids: number[];
}

export async function syncPopularMovies() {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY not set in environment variables");
    return;
  }

  try {
    console.log("[SYNC] Starting popular movies sync...");
    const startTime = Date.now();
    let totalImported = 0;
    let totalSkipped = 0;

    // Fetch popular movies from multiple pages (entire TMDB database)
    // TMDB has ~500+ pages of popular movies, but we'll fetch first 50 pages (~1000 movies)
    // For full database, would need to use all pages or alternate endpoints
    for (let page = 1; page <= 50; page++) {
      try {
        if (page % 10 === 0) {
          console.log(`[SYNC] Fetching popular movies page ${page}...`);
        }

        const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
          params: {
            api_key: TMDB_API_KEY,
            page,
            language: "en-US",
          },
          timeout: 10000,
        });

        const movies: TMDBMovie[] = response.data.results || [];
        console.log(`[SYNC] Found ${movies.length} movies on page ${page}`);

        for (const movie of movies) {
          // Skip movies without essential data
          if (!movie.title || !movie.release_date) {
            totalSkipped++;
            continue;
          }

          try {
            const releaseYear = new Date(movie.release_date).getFullYear();

            // Upsert: update if exists, create if new
            await prisma.movie.upsert({
              where: { tmdbId: movie.id },
              update: {
                title: movie.title,
                year: releaseYear,
                description: movie.overview,
                poster: movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : null,
                genres: movie.genre_ids?.map(String) || [],
                imdbRating: movie.vote_average,
                rtRating: movie.vote_average * 10, // Approximation for RT rating
                releaseDate: new Date(movie.release_date),
                updatedAt: new Date(),
              },
              create: {
                tmdbId: movie.id,
                title: movie.title,
                year: releaseYear,
                description: movie.overview,
                poster: movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : null,
                genres: movie.genre_ids?.map(String) || [],
                imdbRating: movie.vote_average,
                rtRating: movie.vote_average * 10, // Approximation for RT rating
                releaseDate: new Date(movie.release_date),
              },
            });

            totalImported++;
          } catch (err) {
            console.error(`[SYNC] Error importing movie ${movie.title}:`, err);
            totalSkipped++;
          }
        }

        // Rate limit: wait 1 second between pages
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (pageErr) {
        console.error(`[SYNC] Error fetching page ${page}:`, pageErr);
        continue;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[SYNC] ✅ Popular movies sync complete in ${duration}s - Imported: ${totalImported}, Skipped: ${totalSkipped}`
    );

    return {
      success: true,
      imported: totalImported,
      skipped: totalSkipped,
      duration: `${duration}s`,
    };
  } catch (err) {
    console.error("[SYNC] ❌ Popular movies sync failed:", err);
    return {
      success: false,
      error: String(err),
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running as standalone script
if (require.main === module) {
  syncPopularMovies();
}
