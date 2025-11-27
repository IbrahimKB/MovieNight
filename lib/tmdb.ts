import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title?: string; // Movies have title
  name?: string;  // TV shows have name
  media_type?: 'movie' | 'tv';
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string; // Movies
  first_air_date?: string; // TV Shows
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime?: number;
  episode_run_time?: number[];
  genres: Array<{ id: number; name: string }>;
  production_companies: Array<{ id: number; name: string }>;
}

export interface TMDBResponse {
  results: TMDBMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

class TMDBClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = TMDB_API_KEY || '') {
    this.apiKey = apiKey;
    this.baseUrl = TMDB_BASE_URL;
  }

  private getAxiosInstance() {
    return axios.create({
      baseURL: this.baseUrl,
      params: {
        api_key: this.apiKey,
      },
      timeout: 10000,
    });
  }

  async searchMovies(
    query: string,
    page: number = 1
  ): Promise<TMDBResponse | null> {
    try {
      if (!this.apiKey) {
        console.warn('TMDB_API_KEY not configured');
        return null;
      }

      // Search for both movies and TV shows separately and combine them if needed
      // For now, let's focus on movies as per the method name, but we can extend this.
      const response = await this.getAxiosInstance().get('/search/movie', { // Changed from multi to movie
        params: {
          query,
          page,
          include_adult: false,
        },
      });
      
      // Filter to keep only movies (API should handle this now, but extra safety)
      if (response.data && response.data.results) {
        response.data.results = response.data.results.filter(
          (item: any) => !item.media_type || item.media_type === 'movie' // Search/movie doesn't always return media_type
        );
      }
      
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      return null;
    }
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails | null> {
    try {
      if (!this.apiKey) {
        console.warn('TMDB_API_KEY not configured');
        return null;
      }

      const response = await this.getAxiosInstance().get(`/movie/${movieId}`);
      return response.data;
    } catch (error: any) {
      // If movie not found (404), try TV show
      if (error.response && error.response.status === 404) {
        try {
          const tvResponse = await this.getAxiosInstance().get(`/tv/${movieId}`);
          return { ...tvResponse.data, media_type: 'tv' };
        } catch (tvError) {
          // If fails here, it's really not found or another error
          console.error('Error fetching movie/tv details:', tvError);
          return null;
        }
      }
      
      console.error('Error fetching movie details:', error);
      return null;
    }
  }

  async getUpcomingMovies(page: number = 1): Promise<TMDBResponse | null> {
    try {
      if (!this.apiKey) {
        console.warn('TMDB_API_KEY not configured');
        return null;
      }

      const response = await this.getAxiosInstance().get('/movie/upcoming', {
        params: {
          page,
          region: 'US',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      return null;
    }
  }

  async getTrendingMovies(
    timeWindow: 'day' | 'week' = 'week',
    page: number = 1
  ): Promise<TMDBResponse | null> {
    try {
      if (!this.apiKey) {
        console.warn('TMDB_API_KEY not configured');
        return null;
      }

      const response = await this.getAxiosInstance().get(
        `/trending/movie/${timeWindow}`,
        {
          params: {
            page,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      return null;
    }
  }

  getPosterUrl(posterPath: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!posterPath) return null;
    return `${IMAGE_BASE_URL}/${size}${posterPath}`;
  }

  getBackdropUrl(backdropPath: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    if (!backdropPath) return null;
    return `${IMAGE_BASE_URL}/${size}${backdropPath}`;
  }
}

export const tmdbClient = new TMDBClient();
