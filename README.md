# MovieNight

MovieNight is a Next.js 15 App Router application with PostgreSQL and Prisma.
It includes authenticated social movie features (watchlist, suggestions, friends, events, releases, notifications) and TMDB integrations.

## Stack

- Next.js 15 + React 18 + TypeScript
- Prisma ORM + PostgreSQL
- TailwindCSS + Radix UI
- Socket.io (server + client)

## Run Locally

```bash
npm ci --legacy-peer-deps
npx prisma generate
npm run dev
```

## Database

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Apply migrations:

```bash
npx prisma migrate deploy
```

## Key Commands

```bash
npm run dev
npm run typecheck
npm run build
npm start
```

## Docker Runtime

`docker-compose.yml` defines:

- `postgres` (database)
- `movienight` (Next.js app)
- `proxy` (nginx)

The app container runs:

```bash
prisma migrate deploy && tsx server.ts
```

## API Surface

API handlers live under `app/api/**/route.ts`.
Frontend pages live under `app/(app)/**/page.tsx` and `app/(auth)/**/page.tsx`.
