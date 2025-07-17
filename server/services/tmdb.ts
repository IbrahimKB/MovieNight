import axios from "axios";

// TMDB API configuration
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY =
  process.env.TMDB_API_KEY || "265324a90fd3ab4851c19f5f5393d3c0";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Rate limiting (TMDB allows 40 requests per 10 seconds)
const rateLimitWindow = 10 * 1000; // 10 seconds
const rateLimitMax = 40;
let requestTimes: number[] = [];

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
}

interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  adult: boolean;
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
}

interface TMDBSearchResult {
  page: number;
  results: (TMDBMovie | TMDBTVShow)[];
  total_pages: number;
  total_results: number;
}

interface MovieNightSearchResult {
  id: string;
  title: string;
  year: number;
  description: string;
  poster: string | null;
  mediaType: "movie" | "tv";
  rating: number;
  genres: string[];
  tmdbId: number;
}

interface UpcomingRelease {
  id: string;
  title: string;
  platform: string;
  releaseDate: string;
  genres: string[];
  description?: string;
  poster?: string;
  year: number;
  mediaType: "movie" | "tv";
  tmdbId: number;
  createdAt: string;
  updatedAt: string;
}

// Genre mapping (TMDB genre IDs to names)
const genreMap: Record<number, string> = {
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
  37: "Western",
  // TV-specific genres
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

class TMDBService {
  private isRateLimited(): boolean {
    const now = Date.now();
    // Remove requests older than the rate limit window
    requestTimes = requestTimes.filter((time) => now - time < rateLimitWindow);
    return requestTimes.length >= rateLimitMax;
  }

  private recordRequest(): void {
    requestTimes.push(Date.now());
  }

  private async makeRequest(
    endpoint: string,
    params: Record<string, any> = {},
  ) {
    if (this.isRateLimited()) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
      throw new Error(
        "TMDB API key not configured. Please set TMDB_API_KEY environment variable.",
      );
    }

    this.recordRequest();

    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        ...params,
      },
      timeout: 10000, // 10 second timeout
    });

    return response.data;
  }

  private isValidReleaseDate(releaseDate: string, isMovie: boolean): boolean {
    if (!releaseDate) return false;

    const date = new Date(releaseDate);
    const currentYear = new Date().getFullYear();
    const releaseYear = date.getFullYear();

    // Valid release years: 1900 to current year + 3 (for announced future releases)
    // For movies: more strict future dating
    // For TV shows: allow slightly more flexibility
    const maxFutureYear = isMovie ? currentYear + 2 : currentYear + 3;

    return releaseYear >= 1900 && releaseYear <= maxFutureYear;
  }

  async searchMulti(
    query: string,
    page: number = 1,
  ): Promise<MovieNightSearchResult[]> {
    try {
      const data: TMDBSearchResult = await this.makeRequest("/search/multi", {
        query: query.trim(),
        page,
        include_adult: false,
      });

      return data.results
        .filter((item) => {
          const isMovie = "title" in item;
          const releaseDate = isMovie
            ? item.release_date
            : (item as TMDBTVShow).first_air_date;

          // Filter out people and adult content
          // Also filter out items with invalid or unrealistic release dates
          return (
            ("title" in item || "name" in item) &&
            !item.adult &&
            (item.vote_count > 0 || item.popularity > 1) &&
            (!releaseDate || this.isValidReleaseDate(releaseDate, isMovie))
          );
        })
        .map((item): MovieNightSearchResult => {
          const isMovie = "title" in item;
          const title = isMovie ? item.title : (item as TMDBTVShow).name;
          const releaseDate = isMovie
            ? item.release_date
            : (item as TMDBTVShow).first_air_date;

          return {
            id: `tmdb_${item.id}_${isMovie ? "movie" : "tv"}`,
            title,
            year: releaseDate ? new Date(releaseDate).getFullYear() : 0,
            description: item.overview || "No description available",
            poster: item.poster_path
              ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}`
              : null,
            mediaType: isMovie ? "movie" : "tv",
            rating: Math.round(item.vote_average * 10) / 10,
            genres: item.genre_ids.map((id) => genreMap[id]).filter(Boolean),
            tmdbId: item.id,
          };
        })
        .slice(0, 20); // Limit to 20 results
    } catch (error) {
      console.error("TMDB search error:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid TMDB API key");
        }
        if (error.response?.status === 429) {
          throw new Error("TMDB rate limit exceeded");
        }
      }
      throw new Error("Failed to search movies. Please try again.");
    }
  }

  async getMovieDetails(tmdbId: number): Promise<any> {
    try {
      return await this.makeRequest(`/movie/${tmdbId}`);
    } catch (error) {
      console.error("TMDB movie details error:", error);
      throw new Error("Failed to fetch movie details");
    }
  }

  async getTVDetails(tmdbId: number): Promise<any> {
    try {
      return await this.makeRequest(`/tv/${tmdbId}`);
    } catch (error) {
      console.error("TMDB TV details error:", error);
      throw new Error("Failed to fetch TV show details");
    }
  }

  async getUpcomingMovies(days: number = 30): Promise<UpcomingRelease[]> {
    try {
      const today = new Date();
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

      const todayStr = today.toISOString().split("T")[0];
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const data = await this.makeRequest("/discover/movie", {
        "primary_release_date.gte": todayStr,
        "primary_release_date.lte": futureDateStr,
        sort_by: "primary_release_date.asc",
        page: 1,
        include_adult: false,
        with_original_language: "en", // Focus on English releases
      });

      return this.formatReleases(data.results, "movie");
    } catch (error) {
      console.error("TMDB upcoming movies error:", error);
      throw new Error("Failed to fetch upcoming movies");
    }
  }

  async getUpcomingTVShows(days: number = 30): Promise<UpcomingRelease[]> {
    try {
      const today = new Date();
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

      const todayStr = today.toISOString().split("T")[0];
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const data = await this.makeRequest("/discover/tv", {
        "first_air_date.gte": todayStr,
        "first_air_date.lte": futureDateStr,
        sort_by: "first_air_date.asc",
        page: 1,
        include_adult: false,
        with_original_language: "en", // Focus on English releases
      });

      return this.formatReleases(data.results, "tv");
    } catch (error) {
      console.error("TMDB upcoming TV shows error:", error);
      throw new Error("Failed to fetch upcoming TV shows");
    }
  }

  async getUpcomingReleases(days: number = 30): Promise<UpcomingRelease[]> {
    try {
      const [movies, tvShows] = await Promise.all([
        this.getUpcomingMovies(days),
        this.getUpcomingTVShows(days),
      ]);

      // Combine and sort by release date
      const allReleases = [...movies, ...tvShows];
      return allReleases.sort(
        (a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
      );
    } catch (error) {
      console.error("TMDB upcoming releases error:", error);
      throw new Error("Failed to fetch upcoming releases");
    }
  }

  private formatReleases(
    items: (TMDBMovie | TMDBTVShow)[],
    mediaType: "movie" | "tv",
  ): UpcomingRelease[] {
    const now = new Date().toISOString();

    return items
      .filter((item) => {
        const releaseDate =
          mediaType === "movie"
            ? (item as TMDBMovie).release_date
            : (item as TMDBTVShow).first_air_date;

        return (
          releaseDate &&
          this.isValidReleaseDate(releaseDate, mediaType === "movie") &&
          item.vote_average > 0
        ); // Only include items with some ratings
      })
      .map((item): UpcomingRelease => {
        const isMovie = mediaType === "movie";
        const title = isMovie
          ? (item as TMDBMovie).title
          : (item as TMDBTVShow).name;
        const releaseDate = isMovie
          ? (item as TMDBMovie).release_date
          : (item as TMDBTVShow).first_air_date;

        // Map platform based on popularity and type
        let platform = "Theaters";
        if (!isMovie) {
          platform = "TV";
        } else if (item.popularity < 50) {
          platform = "Streaming";
        }

        return {
          id: `tmdb_${item.id}_${mediaType}_${Date.now()}`,
          title,
          platform,
          releaseDate,
          genres: item.genre_ids.map((id) => genreMap[id]).filter(Boolean),
          description: item.overview || "No description available",
          poster: item.poster_path
            ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}`
            : undefined,
          year: new Date(releaseDate).getFullYear(),
          mediaType,
          tmdbId: item.id,
          createdAt: now,
          updatedAt: now,
        };
      });
  }

  getRateLimitStatus() {
    const now = Date.now();
    const recentRequests = requestTimes.filter(
      (time) => now - time < rateLimitWindow,
    );
    return {
      remaining: rateLimitMax - recentRequests.length,
      resetTime:
        recentRequests.length > 0
          ? new Date(recentRequests[0] + rateLimitWindow)
          : null,
      isLimited: recentRequests.length >= rateLimitMax,
    };
  }
}

export const tmdbService = new TMDBService();
export type { MovieNightSearchResult };
