/**
 * Sync Upcoming Releases from TMDB
 * Runs daily to populate the releases calendar
 * Pulls movies releasing in the next 180 days
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

export async function syncUpcomingReleases() {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY not set in environment variables");
    return;
  }

  try {
    console.log("[SYNC] Starting upcoming releases sync...");
    const startTime = Date.now();
    let totalImported = 0;
    let totalSkipped = 0;

    // Calculate date range: today to 30 days from now
    const today = new Date();
    const today_iso = today.toISOString().split("T")[0];

    const future = new Date();
    future.setDate(future.getDate() + 30);
    const future_iso = future.toISOString().split("T")[0];

    console.log(`[SYNC] Fetching releases from ${today_iso} to ${future_iso}`);

    // Fetch upcoming releases from multiple pages (30 days window)
    for (let page = 1; page <= 3; page++) {
      try {
        console.log(`[SYNC] Fetching upcoming releases page ${page}...`);

        const response = await axios.get(
          `${TMDB_BASE_URL}/discover/movie`,
          {
            params: {
              api_key: TMDB_API_KEY,
              sort_by: "release_date.asc",
              primary_release_date_gte: today_iso,
              primary_release_date_lte: future_iso,
              page,
              language: "en-US",
            },
            timeout: 10000,
          }
        );

        const movies: TMDBMovie[] = response.data.results || [];
        console.log(`[SYNC] Found ${movies.length} releases on page ${page}`);

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
                rtRating: movie.vote_average * 10, // Approximation
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
                rtRating: movie.vote_average * 10, // Approximation
                releaseDate: new Date(movie.release_date),
              },
            });

            totalImported++;
          } catch (err) {
            console.error(`[SYNC] Error importing release ${movie.title}:`, err);
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
      `[SYNC] ✅ Upcoming releases sync complete in ${duration}s - Imported: ${totalImported}, Skipped: ${totalSkipped}`
    );

    return {
      success: true,
      imported: totalImported,
      skipped: totalSkipped,
      duration: `${duration}s`,
    };
  } catch (err) {
    console.error("[SYNC] ❌ Upcoming releases sync failed:", err);
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
  syncUpcomingReleases();
}
