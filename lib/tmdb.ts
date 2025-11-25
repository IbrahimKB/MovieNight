import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
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

      const response = await this.getAxiosInstance().get('/search/movie', {
        params: {
          query,
          page,
          include_adult: false,
        },
      });
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
    } catch (error) {
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
