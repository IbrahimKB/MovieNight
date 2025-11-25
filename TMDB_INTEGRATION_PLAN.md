# TMDB API Integration Plan
**Status:** NOT IMPLEMENTED  
**Priority:** HIGH  
**Estimated Work:** 2-3 hours

---

## Current Situation

### What Exists:
- ✅ `TMDB_API_KEY` defined in `.env.example`
- ✅ Environment variable placeholder ready
- ❌ No TMDB service layer
- ❌ No API client implementation
- ❌ No data syncing mechanism

### What's Currently Used:
- Mock hardcoded movie data in routes
- No external API calls
- Routes that should use TMDB:
  - `/api/movies` - Should fetch from TMDB
  - `/api/movies/[id]` - Should fetch from TMDB
  - `/api/releases/upcoming` - Should fetch from TMDB
  - Background job should periodically sync data

---

## Implementation Plan

### Step 1: Create TMDB Service Layer (30 min)

Create file: `lib/tmdb.ts`

```typescript
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genres?: { id: number; name: string }[];
  runtime?: number;
}

export interface TMDBSearchResponse {
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

class TMDBClient {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY not configured');
    }
    this.apiKey = TMDB_API_KEY;
    this.baseURL = TMDB_BASE_URL;
  }

  async searchMovies(query: string, page = 1): Promise<TMDBSearchResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query,
          page,
          language: 'en-US',
        },
      });
      return response.data;
    } catch (error) {
      console.error('TMDB Search Error:', error);
      throw error;
    }
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovie> {
    try {
      const response = await axios.get(
        `${this.baseURL}/movie/${movieId}`,
        {
          params: {
            api_key: this.apiKey,
            language: 'en-US',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('TMDB Details Error:', error);
      throw error;
    }
  }

  async getUpcomingMovies(page = 1): Promise<TMDBSearchResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/movie/upcoming`,
        {
          params: {
            api_key: this.apiKey,
            page,
            language: 'en-US',
            region: 'US',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('TMDB Upcoming Error:', error);
      throw error;
    }
  }

  async getTrendingMovies(timeWindow = 'week'): Promise<TMDBSearchResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/trending/movie/${timeWindow}`,
        {
          params: {
            api_key: this.apiKey,
            language: 'en-US',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('TMDB Trending Error:', error);
      throw error;
    }
  }

  getPosterUrl(posterPath: string | null, size = 'w500'): string {
    if (!posterPath) return '/placeholder-poster.jpg';
    return `https://image.tmdb.org/t/p/${size}${posterPath}`;
  }
}

export const tmdbClient = new TMDBClient();
```

---

### Step 2: Update Movies API Route (30 min)

File: `app/api/movies/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { tmdbClient } from '@/lib/tmdb';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');

    let movies;

    if (query) {
      // Search for movies
      const tmdbResponse = await tmdbClient.searchMovies(query, page);
      movies = tmdbResponse.results.map(movie => ({
        id: movie.id.toString(),
        title: movie.title,
        year: new Date(movie.release_date).getFullYear(),
        description: movie.overview,
        poster: tmdbClient.getPosterUrl(movie.poster_path),
        rating: movie.vote_average,
      }));
    } else {
      // Get trending movies
      const tmdbResponse = await tmdbClient.getTrendingMovies('week');
      movies = tmdbResponse.results.map(movie => ({
        id: movie.id.toString(),
        title: movie.title,
        year: new Date(movie.release_date).getFullYear(),
        description: movie.overview,
        poster: tmdbClient.getPosterUrl(movie.poster_path),
        rating: movie.vote_average,
      }));
    }

    return NextResponse.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}
```

---

### Step 3: Update Upcoming Releases Route (20 min)

File: `app/api/releases/upcoming/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { tmdbClient } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    
    const tmdbResponse = await tmdbClient.getUpcomingMovies(page);
    
    const releases = tmdbResponse.results.map(movie => ({
      id: movie.id.toString(),
      title: movie.title,
      releaseDate: movie.release_date,
      description: movie.overview,
      poster: tmdbClient.getPosterUrl(movie.poster_path),
      rating: movie.vote_average,
      year: new Date(movie.release_date).getFullYear(),
    }));

    return NextResponse.json({
      success: true,
      data: releases,
      pagination: {
        page,
        totalPages: tmdbResponse.total_pages,
        totalResults: tmdbResponse.total_results,
      },
    });
  } catch (error) {
    console.error('Error fetching upcoming releases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch upcoming releases' },
      { status: 500 }
    );
  }
}
```

---

### Step 4: Create Data Sync Background Job (45 min)

File: `lib/tmdb-sync.ts`

```typescript
import { tmdbClient } from './tmdb';
import { prisma } from './prisma';

export async function syncTrendingMovies() {
  try {
    console.log('[TMDB Sync] Starting trending movies sync...');
    
    const tmdbResponse = await tmdbClient.getTrendingMovies('week');
    
    for (const tmdbMovie of tmdbResponse.results) {
      const existingMovie = await prisma.movie.findUnique({
        where: { tmdbId: tmdbMovie.id.toString() },
      });

      if (!existingMovie) {
        await prisma.movie.create({
          data: {
            tmdbId: tmdbMovie.id.toString(),
            title: tmdbMovie.title,
            year: new Date(tmdbMovie.release_date).getFullYear(),
            description: tmdbMovie.overview,
            poster: tmdbClient.getPosterUrl(tmdbMovie.poster_path),
            imdbRating: tmdbMovie.vote_average,
            genres: [], // You'll need to fetch genres separately
          },
        });
      } else {
        // Update existing movie with latest data
        await prisma.movie.update({
          where: { id: existingMovie.id },
          data: {
            imdbRating: tmdbMovie.vote_average,
          },
        });
      }
    }
    
    console.log('[TMDB Sync] ✅ Completed successfully');
  } catch (error) {
    console.error('[TMDB Sync] ❌ Failed:', error);
  }
}

export async function syncUpcomingMovies() {
  try {
    console.log('[TMDB Sync] Starting upcoming releases sync...');
    
    const tmdbResponse = await tmdbClient.getUpcomingMovies();
    
    for (const tmdbMovie of tmdbResponse.results) {
      const existingRelease = await prisma.release.findUnique({
        where: { tmdbId: tmdbMovie.id.toString() },
      });

      if (!existingRelease) {
        await prisma.release.create({
          data: {
            tmdbId: tmdbMovie.id.toString(),
            title: tmdbMovie.title,
            releaseDate: tmdbMovie.release_date,
            description: tmdbMovie.overview,
            poster: tmdbClient.getPosterUrl(tmdbMovie.poster_path),
            year: new Date(tmdbMovie.release_date).getFullYear(),
            platform: 'Theatrical', // Could be enhanced
          },
        });
      }
    }
    
    console.log('[TMDB Sync] ✅ Completed successfully');
  } catch (error) {
    console.error('[TMDB Sync] ❌ Failed:', error);
  }
}
```

---

### Step 5: Add TMDB Fields to Database Schema (20 min)

Update your Prisma schema to include TMDB IDs:

```prisma
model Movie {
  id        String   @id @default(cuid())
  tmdbId    String   @unique // For linking to TMDB
  title     String
  year      Int
  // ... existing fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Release {
  id        String   @id @default(cuid())
  tmdbId    String   @unique // For linking to TMDB
  title     String
  releaseDate String
  // ... existing fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Deployment Checklist

- [ ] Add `TMDB_API_KEY` to production `.env`
- [ ] Install axios: `npm install axios`
- [ ] Test TMDB connection locally
- [ ] Update Prisma schema with tmdbId fields
- [ ] Run migrations: `npx prisma migrate dev`
- [ ] Update API routes to use TMDB client
- [ ] Set up scheduled background job
- [ ] Test search functionality
- [ ] Verify poster images load correctly
- [ ] Monitor API rate limits

---

## API Rate Limits (TMDB)

- Free tier: 40 requests per 10 seconds
- No caching required by TMDB (but recommended)
- Consider implementing request batching
- Add retry logic with exponential backoff

---

## Testing

```bash
# Test TMDB connection
npm run dev

# Visit:
# http://localhost:3000/api/movies?q=Inception

# Check console for TMDB logs
# Verify response contains real movie data
```

---

## Future Enhancements

- [ ] Genre filtering
- [ ] Director/cast information
- [ ] Review aggregation
- [ ] Recommendation engine
- [ ] Movie ratings history
- [ ] Watchlist integration with TMDB
- [ ] Multi-language support

---

**Priority:** HIGH - Complete before wide deployment  
**Estimated Time:** 2-3 hours  
**Difficulty:** MEDIUM  
**Blockers:** None
