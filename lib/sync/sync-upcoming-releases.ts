/**
 * Sync Upcoming Releases from TMDB
 * Runs daily to populate the releases calendar
 * Pulls movies releasing in the next 180 days
 */

import axios from "axios";
import { prisma } from "@/lib/prisma";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Static map for TMDB Genre IDs to Names (Movies)
const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

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

  // Debug DB connection
  const dbUrl = process.env.DATABASE_URL;
  console.log(`[SYNC] DATABASE_URL is ${dbUrl ? "set" : "MISSING"} (${dbUrl ? dbUrl.replace(/:[^:]*@/, ":***@") : "N/A"})`);

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
          if (!movie.title || !movie.release_date || !movie.id) {
            if (!movie.id) console.warn(`[SYNC] Skipping movie "${movie.title}" - Missing ID`);
            totalSkipped++;
            continue;
          }

          try {
            const releaseYear = new Date(movie.release_date).getFullYear();
            const mappedGenres = movie.genre_ids?.map(id => TMDB_GENRE_MAP[id] || String(id)) || [];

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
                releaseDate: new Date(movie.release_date),
            };
            
            // Debug log first item
            if (totalImported === 0) {
               console.log("[SYNC] First movie payload:", JSON.stringify(movieData, null, 2));
            }

            const dbMovie = await prisma.movie.upsert({
              where: { tmdbId: movie.id },
              update: { ...movieData, updatedAt: new Date() },
              create: movieData,
            });

            // Upsert Release entry
            await prisma.release.upsert({
              where: { tmdbId: movie.id },
              update: {
                 title: movie.title,
                 movieId: dbMovie.id,
                 platform: "Theater", // Default for now
                 releaseDate: new Date(movie.release_date),
                 genres: mappedGenres,
                 description: movie.overview,
                 poster: movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : null,
                 year: releaseYear,
              },
              create: {
                 tmdbId: movie.id,
                 movieId: dbMovie.id,
                 title: movie.title,
                 platform: "Theater",
                 releaseDate: new Date(movie.release_date),
                 genres: mappedGenres,
                 description: movie.overview,
                 poster: movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : null,
                 year: releaseYear,
              }
            });

            totalImported++;
          } catch (err) {
            console.error(`[SYNC] Error importing release ${movie.title} (ID: ${movie.id}):`, err);
            // Log the specific error if it is a Prisma error
            if (err instanceof Error) {
                 console.error("[SYNC] Stack:", err.stack);
            }
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
