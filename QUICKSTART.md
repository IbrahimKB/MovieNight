# MovieNight Quick Start Guide

**Last Updated**: November 24, 2025  
**Status**: ✅ Build Passing | Ready to Deploy

---

## 5-Minute Setup

### Step 1: Database Setup (5 min)
```bash
# Option A: Docker (easiest)
docker run -d --name postgres -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=boksh_apps -p 5432:5432 postgres:15

# Option B: Use existing PostgreSQL
# Just create database: createdb boksh_apps
```

### Step 2: Prisma Migrations (1 min)
```bash
npx prisma generate
npx prisma migrate deploy
```

### Step 3: Start App (1 min)
```bash
npm run dev
```

### Step 4: Test (1 min)
```bash
# Check system status
curl http://localhost:3000/api/debug

# Go to http://localhost:3000/signup
# Create account and test
```

---

## Commands

### Development
```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm start           # Start production server
npm run typecheck   # Check TypeScript
```

### Database
```bash
npx prisma studio  # Open Prisma Studio (UI for database)
npx prisma migrate deploy  # Apply migrations
npx prisma db push # Sync schema
```

### Cron Jobs
```bash
# Manual sync (for testing, don't wait for 3 AM)
curl "http://localhost:3000/api/cron/init?action=run-now"

# Check cron status
curl "http://localhost:3000/api/cron/init"

# Check system
curl "http://localhost:3000/api/debug"
```

---

## Environment Variables

Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/boksh_apps
NODE_ENV=development
TMDB_API_KEY=265324a90fd3ab4851c19f5f5393d3c0
```

---

## Features

### ✅ Working Now
- User authentication (login/signup)
- Friend system (add, accept, remove)
- Movie search & browsing
- Watchlist management
- Event calendar
- Movie night planning
- Trending movies
- Activity tracking

### ⏰ Automated (3 AM & 3:15 AM)
- Popular movies sync (1000+ movies)
- Upcoming releases (next 30 days)

### 🚀 Coming Soon
- Activity feed UI
- Global search UI
- Push notifications
- Admin dashboard

---

## Useful URLs

| Feature | URL |
|---------|-----|
| Home | http://localhost:3000 |
| Login | http://localhost:3000/login |
| Signup | http://localhost:3000/signup |
| Movies | http://localhost:3000/movies |
| Releases | http://localhost:3000/releases |
| Calendar | http://localhost:3000/calendar |
| Friends | http://localhost:3000/friends |
| Events | http://localhost:3000/events |
| System Status | http://localhost:3000/api/debug |
| Cron Status | http://localhost:3000/api/cron/init |
| Prisma Studio | npx prisma studio |

---

## Troubleshooting

### Signup Returns "Internal Server Error"
```bash
# Check database connection
curl http://localhost:3000/api/debug

# If database error, run migrations
npx prisma migrate deploy

# Restart app
npm run dev
```

### No Movies Appearing
```bash
# Trigger sync immediately
curl "http://localhost:3000/api/cron/init?action=run-now"

# Check results
curl "http://localhost:3000/api/movies?limit=5"
```

### Port 3000 Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or specify different port
PORT=3001 npm run dev
```

### Database Connection Error
```bash
# Check .env DATABASE_URL
cat .env

# Start PostgreSQL (if using Docker)
docker start postgres

# Or verify PostgreSQL is running
psql -U user -d boksh_apps -c "SELECT 1"
```

---

## Project Structure

```
MovieNight/
├── app/
│   ├── api/              # API routes
│   ├── (app)/            # Protected pages
│   ├── (auth)/           # Auth pages
│   └── page.tsx          # Home
├── lib/
│   ├── auth.ts           # Auth utilities
│   ├── api.ts            # API client
│   ├── cron.ts           # Cron scheduler
│   └── sync/             # TMDB sync scripts
├── components/           # React components
├── contexts/             # React contexts
├── prisma/
│   └── schema.prisma     # Database schema
├── .env                  # Environment (create this)
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

---

## Common Tasks

### Create Test User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Check Database
```bash
# Open Prisma Studio UI
npx prisma studio

# Or use psql
psql -U user -d boksh_apps
> SELECT COUNT(*) FROM users;
> SELECT COUNT(*) FROM movies;
```

### View Logs
```bash
# All logs with SYNC tag
npm run dev 2>&1 | grep SYNC

# All cron logs
npm run dev 2>&1 | grep CRON
```

### Reset Database
```bash
# WARNING: Deletes all data
npx prisma migrate reset

# Then restart
npm run dev
```

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Movies
- `GET /api/movies` - Search movies
- `GET /api/movies/[id]` - Movie details
- `GET /api/releases/upcoming` - Upcoming releases

### Friends
- `GET /api/friends` - Friends list
- `POST /api/friends/request` - Send request
- `GET /api/friends/incoming` - Incoming requests
- `GET /api/friends/outgoing` - Sent requests
- `PATCH /api/friends/[id]` - Accept/reject
- `DELETE /api/friends/[id]` - Remove friend

### Watchlist
- `POST /api/watch/desire` - Add to watchlist
- `GET /api/watch/desire` - Get watchlist
- `POST /api/watch/mark-watched` - Mark as watched
- `GET /api/watch/history` - Watch history

### Events
- `POST /api/events` - Create event
- `GET /api/events` - List events
- `GET /api/events/[id]` - Event details
- `PATCH /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

### System
- `GET /api/debug` - System status
- `GET /api/cron/init` - Cron status
- `GET /api/cron/init?action=run-now` - Trigger syncs

---

## Deployment

### Docker
```bash
docker build -t movienight .
docker run -p 3000:3000 movienight
```

### Vercel / Netlify
```bash
npm run build
npm start
```

### Self-Hosted
```bash
npm install
npx prisma migrate deploy
npm run build
npm start
```

---

## Need Help?

Check these files:
- `CRON_IMPLEMENTATION_COMPLETE.md` — Cron job details
- `SIGNUP_FIX_AND_CRON_UPDATES.md` — Signup troubleshooting
- `SPEC_ALIGNMENT_REPORT.md` — Feature status
- `README.md` — Project overview

---

**That's it! You're ready to go.** 🎬
