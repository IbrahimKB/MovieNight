# Setup and Test

## Prerequisites

- Node.js 20+
- PostgreSQL reachable from this app
- `DATABASE_URL` configured
- `TMDB_API_KEY` configured for TMDB-backed routes

## Environment

Create/update `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/boksh_apps
TMDB_API_KEY=your_tmdb_api_key_here
NODE_ENV=development
```

## Install and Run

```bash
npm ci --legacy-peer-deps
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## Verify Build and Types

```bash
npm run typecheck
npm run build
```

## Quick API Checks

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/debug
```

Authenticated routes require a valid session cookie.

## Notes

- Runtime database schema must match Prisma migrations in `prisma/migrations/`.
- `schema.sql` is empty and not used by runtime code.
