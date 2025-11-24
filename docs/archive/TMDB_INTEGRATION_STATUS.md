# TMDB Integration Status Report

**Date**: November 24, 2025  
**Status**: ⚠️ **NOT IMPLEMENTED** (but infrastructure ready)

---

## Current State

### ❌ What's Missing
- **No TMDB API integration** — Not pulling real movie data from TMDB
- **No movie seeding script** — Database must be manually populated
- **No automatic releases sync** — Release dates must be added manually
- **No movie search from TMDB** — Only searching local database
- **No environment variables** for TMDB API key

### ✅ What's Ready
- Database schema supports all TMDB fields:
  - `imdbId` (for TMDB linking)
  - `title`, `year`, `genres`, `description`
  - `poster`, `imdbRating`, `rtRating`
  - `releaseDate` (for upcoming releases)
  - `platform` (streaming availability)
- Movie API endpoints exist
- Releases endpoint filters by date correctly
- Movie detail pages ready

---

## How It Currently Works

### Movies Endpoint
```typescript
GET /api/movies
→ Searches local database
→ Returns movies from Prisma (PostgreSQL)
→ No real-time TMDB data
```

**Issue**: Unless you manually seed movies, the database is empty.

### Releases Endpoint
```typescript
GET /api/releases/upcoming
→ Filters Movie table by releaseDate
→ Returns next 90 days
→ Only works if movies have release dates in DB
```

**Issue**: Without TMDB sync, no upcoming releases exist.

---

## Implementation Options

### Option A: Manual Seeding (Quick, Limited)
**Effort**: 30 minutes  
**Scope**: 50-100 movies manually added

```bash
# Add Prisma seed script
npx prisma db seed

# Populate database with sample movies
# Include release dates for some upcoming releases
```

**Pros**: Fast, works immediately  
**Cons**: Not scalable, no real data, no updates

---

### Option B: One-Time TMDB Import (Medium, Better)
**Effort**: 2-3 hours  
**Scope**: Pull 500+ movies from TMDB, seed database

**Implementation**:
1. Add TMDB API key to `.env`
2. Create script: `scripts/seed-movies-tmdb.ts`
3. Query TMDB popular/trending movies
4. Store in local database
5. Run once on deployment

**Code outline**:
```typescript
// scripts/seed-movies-tmdb.ts
import axios from 'axios';
import { prisma } from '@/lib/prisma';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function seedMovies() {
  // 1. Fetch popular movies from TMDB
  const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
    params: { api_key: TMDB_API_KEY }
  });

  // 2. Transform and save to database
  for (const movie of response.data.results) {
    await prisma.movie.upsert({
      where: { imdbId: movie.id.toString() },
      update: {},
      create: {
        imdbId: movie.id.toString(),
        title: movie.title,
        year: new Date(movie.release_date).getFullYear(),
        description: movie.overview,
        poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        genres: movie.genre_ids.map(String),
        imdbRating: movie.vote_average,
        releaseDate: new Date(movie.release_date)
      }
    });
  }
}

seedMovies();
```

**Pros**: Scalable, real data, includes upcoming releases  
**Cons**: Requires TMDB API key, one-time event

---

### Option C: Real-Time TMDB API (Best, Complex)
**Effort**: 4-6 hours  
**Scope**: Live search, cache popular movies

**Implementation**:
1. Add TMDB API key to `.env`
2. Create proxy endpoint: `GET /api/movies/search-tmdb`
3. Cache results in database (optional)
4. Use for movie suggestions workflow

**Code outline**:
```typescript
// app/api/movies/search-tmdb/route.ts
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  
  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${q}&api_key=${process.env.TMDB_API_KEY}`
  );
  
  const data = await response.json();
  return NextResponse.json({ success: true, data: data.results });
}
```

**Pros**: Real-time data, searchable, always fresh  
**Cons**: API rate limits, requires key management, network latency

---

## Recommended Path

### For v1.0 (Launch Ready)
**Option B (One-Time Import)** — Best balance

1. Get TMDB API key (free at tmdb.org)
2. Add to `.env`:
   ```
   TMDB_API_KEY=your_api_key_here
   ```
3. Create seed script (~1 hour)
4. Run before deployment:
   ```bash
   npm run seed:movies
   ```

### For v1.1+ (Growth Phase)
**Option C (Real-Time API)** — Add movie search from TMDB
- Users search TMDB directly
- Popular/trending movies cached locally
- Automatic sync of popular content

---

## Quick Setup (Option B)

### 1. Update `.env.example`
```diff
DATABASE_URL=postgresql://user:password@localhost:5432/boksh_apps
NODE_ENV=development
+TMDB_API_KEY=your_api_key_here
```

### 2. Create `scripts/seed-movies-tmdb.ts`
```typescript
import axios from 'axios';
import { prisma } from '@/lib/prisma';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function seedMovies() {
  try {
    console.log('Fetching movies from TMDB...');
    
    // Fetch popular movies
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: { api_key: TMDB_API_KEY, pages: 5 }
    });

    console.log(`Found ${response.data.results.length} movies`);

    for (const movie of response.data.results) {
      await prisma.movie.upsert({
        where: { imdbId: movie.id.toString() },
        update: {},
        create: {
          imdbId: movie.id.toString(),
          title: movie.title,
          year: new Date(movie.release_date).getFullYear(),
          description: movie.overview,
          poster: movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null,
          genres: movie.genre_ids?.map(String) || [],
          imdbRating: movie.vote_average,
          releaseDate: new Date(movie.release_date),
        }
      });
    }

    console.log('✅ Seed complete!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedMovies();
```

### 3. Add npm script in `package.json`
```json
{
  "scripts": {
    "seed:movies": "ts-node --transpile-only scripts/seed-movies-tmdb.ts"
  }
}
```

### 4. Run before deployment
```bash
npm install axios ts-node  # if not already installed
npm run seed:movies
npm start
```

---

## Environment Setup

### Get TMDB API Key
1. Visit https://www.themoviedb.org/settings/api
2. Sign up (free)
3. Create API key
4. Add to `.env`:
   ```
   TMDB_API_KEY=sk_live_...
   ```

### Install Dependencies
```bash
npm install axios  # for HTTP requests
npm install -D ts-node  # for running TypeScript scripts
```

---

## Current Blockers

| Feature | Status | Blocker |
|---------|--------|---------|
| Movie Search | ✅ Works locally | Database empty without seed |
| Releases Page | ✅ Works locally | No movies with release dates |
| Suggestions | ✅ Works locally | Can't suggest (no movies) |
| Trending | ✅ Works locally | No watch history (no movies) |
| Movie Details | ✅ Works locally | 404 on all IDs |

**All endpoints work perfectly — they just need data.**

---

## Deployment Checklist

Before going to production:
- [ ] Obtain TMDB API key
- [ ] Add `TMDB_API_KEY` to production `.env`
- [ ] Create and test seed script locally
- [ ] Run seed script on fresh database
- [ ] Verify `/api/movies` returns results
- [ ] Verify `/api/releases/upcoming` shows upcoming movies
- [ ] Test suggestions workflow
- [ ] Test movie detail page navigation

---

## Summary

**Current State**: Database ready, endpoints ready, **just needs movie data**

**Minimum to Launch**: Run seed script with 500+ TMDB movies

**Time to Add**: 1-2 hours total (setup + first run)

**Recommendation**: 
1. ✅ **Use Option B (one-time import)** for v1.0 launch
2. ⏰ **Add Option C (real-time search)** in v1.1 if users want discovery

The infrastructure is complete. Just need to populate it with real movie data.
