import { prisma } from "@/lib/prisma";
import { tmdbClient, TMDB_GENRE_MAP } from "@/lib/tmdb";

/**
 * Ensures a movie exists in the local database.
 * Accepts either a UUID (existing local movie) or a TMDB ID (number or string).
 * If it's a TMDB ID and the movie doesn't exist locally, it fetches details from TMDB and creates it.
 * 
 * @param movieId - UUID or TMDB ID (e.g. 12345, "12345", "tmdb_12345")
 * @returns The UUID of the local movie record
 */
export async function ensureMovieExists(movieId: string | number): Promise<string | null> {
  // 1. Check if it's already a UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(movieId));
  
  if (isUuid) {
    // Validate it exists
    const exists = await prisma.movie.findUnique({ where: { id: String(movieId) }, select: { id: true } });
    return exists ? exists.id : null;
  }

  // 2. Extract TMDB ID
  let tmdbId: number;
  const idStr = String(movieId);
  
  if (idStr.startsWith("tmdb_")) {
    tmdbId = parseInt(idStr.replace("tmdb_", ""));
  } else if (/^\d+$/.test(idStr)) {
    tmdbId = parseInt(idStr);
  } else {
    // Invalid format
    return null;
  }

  if (isNaN(tmdbId)) return null;

  // 3. Check if we already have this TMDB ID synced
  const existingMovie = await prisma.movie.findUnique({
    where: { tmdbId },
    select: { id: true }
  });

  if (existingMovie) {
    return existingMovie.id;
  }

  // 4. Fetch from TMDB and Create
  try {
    const tmdbMovie = await tmdbClient.getMovieDetails(tmdbId);
    if (!tmdbMovie) return null;

    const releaseDate = tmdbMovie.release_date || tmdbMovie.first_air_date;
    const releaseYear = new Date(releaseDate || '2024-01-01').getFullYear();
    
    // Map genres (using names)
    const genres = tmdbMovie.genres?.map(g => g.name) || tmdbMovie.genre_ids?.map(id => TMDB_GENRE_MAP[id] || String(id)) || [];

    const newMovie = await prisma.movie.create({
      data: {
        tmdbId: tmdbMovie.id,
        title: tmdbMovie.title || tmdbMovie.name || 'Unknown Title',
        year: releaseYear,
        description: tmdbMovie.overview || '',
        poster: tmdbClient.getPosterUrl(tmdbMovie.poster_path),
        genres: genres,
        imdbRating: tmdbMovie.vote_average,
        rtRating: tmdbMovie.vote_average ? tmdbMovie.vote_average * 10 : null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
      }
    });

    return newMovie.id;
  } catch (error) {
    console.error(`Failed to sync movie ${tmdbId}:`, error);
    return null;
  }
}
