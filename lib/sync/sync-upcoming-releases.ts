/**
 * Sync Upcoming Releases from TMDB
 * Runs daily to populate the releases calendar
 * Pulls movies releasing in the next 30 days for multiple regions
 */

import axios from "axios";
import { prisma } from "@/lib/prisma";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Import shared genre map
import { TMDB_GENRE_MAP } from "@/lib/tmdb";

// Country codes mapping for TMDB region parameter
const COUNTRIES = {
  US: { code: "US", label: "United States", tmdbRegion: "US" },
  GB: { code: "GB", label: "United Kingdom", tmdbRegion: "GB" },
  JP: { code: "JP", label: "Japan", tmdbRegion: "JP" },
  KR: { code: "KR", label: "South Korea", tmdbRegion: "KR" },
};

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  primary_release_date?: string;
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

  // Debug DB connection
  const dbUrl = process.env.DATABASE_URL;
  console.log(
    `[SYNC] DATABASE_URL is ${dbUrl ? "set" : "MISSING"} (${dbUrl ? dbUrl.replace(/:[^:]*@/, ":***@") : "N/A"})`,
  );

  // Check TMDB_API_KEY
  const hasApiKey = !!TMDB_API_KEY;
  console.log(`[SYNC] TMDB_API_KEY is ${hasApiKey ? "set" : "MISSING"}`);

  try {
    console.log(
      "[SYNC] Starting upcoming releases sync for multiple regions...",
    );
    const startTime = Date.now();
    let totalImported = 0;
    let totalSkipped = 0;
    let hasErrors = false;
    const countryStats: Record<string, { imported: number; skipped: number }> =
      {};

    // Calculate date range: today to 30 days from now
    const today = new Date();
    const today_iso = today.toISOString().split("T")[0];

    const future = new Date();
    future.setDate(future.getDate() + 30);
    const future_iso = future.toISOString().split("T")[0];

    console.log(`[SYNC] Fetching releases from ${today_iso} to ${future_iso}`);

    // Outer loop: iterate over all countries
    for (const countryKey of Object.keys(COUNTRIES)) {
      const country = COUNTRIES[countryKey as keyof typeof COUNTRIES];
      countryStats[country.code] = { imported: 0, skipped: 0 };

      console.log(
        `[SYNC] Starting sync for ${country.label} (${country.code})...`,
      );

      // Inner loop: fetch upcoming releases from multiple pages per country
      for (let page = 1; page <= 3; page++) {
        try {
          console.log(
            `[SYNC] Fetching ${country.code} releases page ${page}...`,
          );

          const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              sort_by: "release_date.asc",
              primary_release_date_gte: today_iso,
              primary_release_date_lte: future_iso,
              region: country.tmdbRegion,
              page,
              language: "en-US",
            },
            timeout: 10000,
          });

          const movies: TMDBMovie[] = response.data.results || [];
          console.log(
            `[SYNC] Found ${movies.length} releases for ${country.code} on page ${page}`,
          );

          for (const movie of movies) {
            // Skip movies without essential data
            if (!movie.title || !movie.release_date || !movie.id) {
              if (!movie.id)
                console.warn(
                  `[SYNC] Skipping movie "${movie.title}" - Missing ID`,
                );
              totalSkipped++;
              countryStats[country.code].skipped++;
              continue;
            }

            try {
              // Use primary_release_date for upcoming releases (what the query filtered by)
              // Fall back to release_date if primary_release_date is not available
              const releaseDate = movie.primary_release_date || movie.release_date;
              const releaseYear = new Date(releaseDate).getFullYear();
              const mappedGenres =
                movie.genre_ids?.map(
                  (id) => TMDB_GENRE_MAP[id] || String(id),
                ) || [];

              // Upsert: update if exists, create if new
              const movieData = {
                tmdbId: movie.id,
                title: movie.title,
                year: releaseYear,
                description: movie.overview,
                poster: movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : null,
                genres: mappedGenres,
                imdbRating: movie.vote_average,
                rtRating: movie.vote_average * 10, // Approximation
                releaseDate: new Date(releaseDate),
              };

              // Create/Update Movie Record (Required for Foreign Key)
              // We keep this because Release table requires a valid movieId
              const dbMovie = await prisma.movie.upsert({
                where: { tmdbId: movie.id },
                update: { ...movieData, updatedAt: new Date() },
                create: movieData,
              });

              // Upsert Release entry with composite unique key: (tmdbId, countryCode, platform)
              const platform = "Theater"; // Default platform
              const releaseDateObj = new Date(releaseDate);
              await prisma.release.upsert({
                where: {
                  tmdbId_countryCode_platform: {
                    tmdbId: movie.id,
                    countryCode: country.code,
                    platform: platform,
                  },
                },
                update: {
                  title: movie.title,
                  movieId: dbMovie.id,
                  releaseDate: releaseDateObj,
                  genres: mappedGenres,
                  description: movie.overview,
                  poster: movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : null,
                  year: releaseYear,
                  updatedAt: new Date(),
                },
                create: {
                  tmdbId: movie.id,
                  movieId: dbMovie.id,
                  countryCode: country.code,
                  title: movie.title,
                  platform: platform,
                  releaseDate: releaseDateObj,
                  genres: mappedGenres,
                  description: movie.overview,
                  poster: movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : null,
                  year: releaseYear,
                },
              });

              totalImported++;
              countryStats[country.code].imported++;
            } catch (err) {
              console.error(
                `[SYNC] Error importing release ${movie.title} (ID: ${movie.id}) for ${country.code}:`,
                err,
              );
              totalSkipped++;
              countryStats[country.code].skipped++;
            }
          }

          // Rate limit: wait 1 second between pages
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (pageErr) {
          console.error(
            `[SYNC] Error fetching page ${page} for ${country.code}:`,
            pageErr,
          );
          hasErrors = true;
          continue;
        }
      }

      console.log(
        `[SYNC] Completed ${country.label} - Imported: ${countryStats[country.code].imported}, Skipped: ${countryStats[country.code].skipped}`,
      );
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const status = hasErrors ? "⚠️ PARTIAL" : "✅";
    console.log(
      `[SYNC] ${status} Upcoming releases sync complete in ${duration}s - Total Imported: ${totalImported}, Total Skipped: ${totalSkipped}`,
    );

    // Log stats per country
    Object.entries(countryStats).forEach(([code, stats]) => {
      console.log(
        `[SYNC] ${code}: Imported=${stats.imported}, Skipped=${stats.skipped}`,
      );
    });

    // Verify data was actually saved
    const releaseCount = await prisma.release.count();
    console.log(`[SYNC] Total releases in database: ${releaseCount}`);

    return {
      success: !hasErrors,
      imported: totalImported,
      skipped: totalSkipped,
      duration: `${duration}s`,
      totalInDatabase: releaseCount,
      hadErrors: hasErrors,
      countryStats,
    };
  } catch (err) {
    console.error("[SYNC] ❌ Upcoming releases sync failed:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMsg,
      imported: 0,
      skipped: 0,
      duration: "0s",
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running as standalone script (CommonJS check removed for Next.js compatibility)
// if (require.main === module) {
//   syncUpcomingReleases();
// }
