import { tmdbClient, TMDBMovie, TMDBMovieDetails } from './tmdb';
import { prisma } from './prisma';

/**
 * Synchronizes trending movies from TMDB to the local database
 * @param timeWindow - 'day' or 'week' for trending movies
 * @param limit - Maximum number of movies to sync (default: 20)
 */
export async function syncTrendingMovies(
  timeWindow: 'day' | 'week' = 'week',
  limit: number = 20
): Promise<{ synced: number; failed: number; message: string }> {
  try {
    console.log(`[TMDB Sync] Starting trending movies sync (${timeWindow})...`);
    
    const tmdbResponse = await tmdbClient.getTrendingMovies(timeWindow);
    if (!tmdbResponse) {
      return {
        synced: 0,
        failed: 0,
        message: 'Failed to fetch from TMDB - API key may be missing',
      };
    }

    let synced = 0;
    let failed = 0;

    // Process each movie
    for (const tmdbMovie of tmdbResponse.results.slice(0, limit)) {
      try {
        // Check if movie already exists
        const existing = await prisma.movie.findUnique({
          where: { tmdbId: tmdbMovie.id },
        });

        if (existing) {
          console.log(`[TMDB Sync] Movie already exists: ${tmdbMovie.title}`);
          continue;
        }

        // Create new movie
        await prisma.movie.create({
          data: {
            tmdbId: tmdbMovie.id,
            title: tmdbMovie.title || tmdbMovie.name || 'Unknown Title',
            year: new Date(tmdbMovie.release_date || tmdbMovie.first_air_date || '2024-01-01').getFullYear(),
            genres: tmdbMovie.genre_ids?.map(String) || [],
            poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
            description: tmdbMovie.overview || 'No description available',
            imdbRating: tmdbMovie.vote_average || null,
            releaseDate: tmdbMovie.release_date || tmdbMovie.first_air_date ? new Date(tmdbMovie.release_date || tmdbMovie.first_air_date) : null,
          },
        });

        synced++;
        console.log(`[TMDB Sync] ✓ Synced: ${tmdbMovie.title || tmdbMovie.name}`);
      } catch (error) {
        failed++;
        console.error(`[TMDB Sync] ✗ Failed to sync ${tmdbMovie.title}:`, error);
      }
    }

    console.log(`[TMDB Sync] Completed: ${synced} synced, ${failed} failed`);
    return {
      synced,
      failed,
      message: `Synced ${synced} trending movies (${failed} failed)`,
    };
  } catch (error) {
    console.error('[TMDB Sync] Trending movies sync error:', error);
    return {
      synced: 0,
      failed: 0,
      message: 'Error during sync',
    };
  }
}

/**
 * Synchronizes upcoming movies from TMDB to the local database
 * @param limit - Maximum number of movies to sync (default: 30)
 */
export async function syncUpcomingMovies(
  limit: number = 30
): Promise<{ synced: number; failed: number; message: string }> {
  try {
    console.log('[TMDB Sync] Starting upcoming movies sync...');
    
    const tmdbResponse = await tmdbClient.getUpcomingMovies(1);
    if (!tmdbResponse) {
      return {
        synced: 0,
        failed: 0,
        message: 'Failed to fetch from TMDB - API key may be missing',
      };
    }

    let synced = 0;
    let failed = 0;

    // Process each movie
    for (const tmdbMovie of tmdbResponse.results.slice(0, limit)) {
      try {
        // Check if movie already exists
        const existing = await prisma.movie.findUnique({
          where: { tmdbId: tmdbMovie.id },
        });

        if (existing) {
          console.log(`[TMDB Sync] Movie already exists: ${tmdbMovie.title}`);
          continue;
        }

        // Create new movie
        const createdMovie = await prisma.movie.create({
          data: {
            tmdbId: tmdbMovie.id,
            title: tmdbMovie.title || tmdbMovie.name || 'Unknown Title',
            year: new Date(tmdbMovie.release_date || tmdbMovie.first_air_date || '2024-01-01').getFullYear(),
            genres: tmdbMovie.genre_ids?.map(String) || [],
            poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
            description: tmdbMovie.overview || 'No description available',
            imdbRating: tmdbMovie.vote_average || null,
            releaseDate: tmdbMovie.release_date || tmdbMovie.first_air_date ? new Date(tmdbMovie.release_date || tmdbMovie.first_air_date) : null,
          },
        });

        // Create release entry if it doesn't exist
        const releaseDate = new Date(tmdbMovie.release_date || tmdbMovie.first_air_date || Date.now());
        await prisma.release.create({
          data: {
            tmdbId: tmdbMovie.id,
            movieId: createdMovie.id,
            title: tmdbMovie.title || tmdbMovie.name || 'Unknown Title',
            platform: 'Theater',
            releaseDate,
            year: releaseDate.getFullYear(),
            genres: tmdbMovie.genre_ids?.map(String) || [],
            poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
            description: tmdbMovie.overview || 'No description available',
          },
        });

        synced++;
        console.log(`[TMDB Sync] ✓ Synced: ${tmdbMovie.title || tmdbMovie.name} (${releaseDate.toLocaleDateString()})`);
      } catch (error) {
        failed++;
        console.error(`[TMDB Sync] ✗ Failed to sync ${tmdbMovie.title || tmdbMovie.name}:`, error);
      }
    }

    console.log(`[TMDB Sync] Completed: ${synced} synced, ${failed} failed`);
    return {
      synced,
      failed,
      message: `Synced ${synced} upcoming movies (${failed} failed)`,
    };
  } catch (error) {
    console.error('[TMDB Sync] Upcoming movies sync error:', error);
    return {
      synced: 0,
      failed: 0,
      message: 'Error during sync',
    };
  }
}

/**
 * Synchronizes details for a specific movie from TMDB
 */
export async function syncMovieDetails(
  tmdbId: number
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`[TMDB Sync] Fetching details for TMDB ID: ${tmdbId}`);
    
    const tmdbMovie = await tmdbClient.getMovieDetails(tmdbId);
    if (!tmdbMovie) {
      return {
        success: false,
        message: 'Failed to fetch movie from TMDB',
      };
    }

    // Find or create the movie
    let movie = await prisma.movie.findUnique({
      where: { tmdbId },
    });

    if (!movie) {
      movie = await prisma.movie.create({
        data: {
          tmdbId: tmdbMovie.id,
          title: tmdbMovie.title,
          year: new Date(tmdbMovie.release_date || '2024-01-01').getFullYear(),
          genres: tmdbMovie.genres?.map((g) => g.name) || [],
          poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
          description: tmdbMovie.overview || 'No description available',
          imdbRating: tmdbMovie.vote_average || null,
          releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
        },
      });
    } else {
      // Update existing movie with more details
      movie = await prisma.movie.update({
        where: { tmdbId },
        data: {
          genres: tmdbMovie.genres?.map((g) => g.name) || [],
          imdbRating: tmdbMovie.vote_average || movie.imdbRating,
          description: tmdbMovie.overview || movie.description,
        },
      });
    }

    console.log(`[TMDB Sync] ✓ Synced movie details: ${tmdbMovie.title}`);
    return {
      success: true,
      message: `Successfully synced ${tmdbMovie.title}`,
    };
  } catch (error) {
    console.error('[TMDB Sync] Movie details sync error:', error);
    return {
      success: false,
      message: 'Error syncing movie details',
    };
  }
}

/**
 * Check TMDB API connectivity and rate limits
 */
export async function checkTMDBStatus(): Promise<{ 
  connected: boolean; 
  apiKey: boolean;
  message: string;
}> {
  try {
    const tmdbResponse = await tmdbClient.getTrendingMovies('day', 1);
    
    if (!tmdbResponse) {
      return {
        connected: false,
        apiKey: !process.env.TMDB_API_KEY,
        message: 'TMDB API not responding',
      };
    }

    return {
      connected: true,
      apiKey: !!process.env.TMDB_API_KEY,
      message: 'TMDB API is working correctly',
    };
  } catch (error) {
    return {
      connected: false,
      apiKey: !!process.env.TMDB_API_KEY,
      message: 'Error connecting to TMDB API',
    };
  }
}

/**
 * Synchronizes a single movie from TMDB search result to the local database
 */
export async function syncTMDBMovie(tmdbMovie: TMDBMovie): Promise<any> {
  try {
    const existing = await prisma.movie.findUnique({
      where: { tmdbId: tmdbMovie.id },
    });

    if (existing) {
      return existing;
    }

        const movie = await prisma.movie.create({
          data: {
            tmdbId: tmdbMovie.id,
            title: tmdbMovie.title || tmdbMovie.name || 'Unknown Title',
            year: new Date(tmdbMovie.release_date || tmdbMovie.first_air_date || '2024-01-01').getFullYear(),
            genres: tmdbMovie.genre_ids?.map(String) || [],
            poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
            description: tmdbMovie.overview || 'No description available',
            imdbRating: tmdbMovie.vote_average || null,
            releaseDate: tmdbMovie.release_date || tmdbMovie.first_air_date ? new Date(tmdbMovie.release_date || tmdbMovie.first_air_date) : null,
          },
        });

    return movie;
  } catch (error) {
    console.error(`[TMDB Sync] Failed to sync movie ${tmdbMovie.title}:`, error);
    return null;
  }
}

