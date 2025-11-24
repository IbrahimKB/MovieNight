# Setup & Testing Guide - MovieNight

**Last Updated**: November 24, 2025  
**Status**: ✅ Ready for setup and testing

---

## Pre-Setup Verification

### ✅ Current Build Status
```
TypeScript: PASSING ✓
ESLint: 1 warning (circular config - non-blocking)
Production Build: PASSING ✓
Pages Generated: 40 ✓
API Routes: 29 + debug endpoint ✓
```

### ✅ All Code Changes Applied
- [x] Authentication system (login/signup)
- [x] Friends system (add, request, accept)
- [x] Suggestion system (to friends)
- [x] Movie browsing and search
- [x] Watch history and watchlist
- [x] Event calendar system
- [x] Cron job scheduling (TMDB syncs)
- [x] Debug endpoints
- [x] Notification system (framework)

---

## Setup Phase 1: Database (15 minutes)

### Option A: Docker (Recommended)
```bash
# Run PostgreSQL in Docker
docker run -d \
  --name movienight-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=boksh_apps \
  -p 5432:5432 \
  postgres:15

# Verify running
docker ps | grep movienight-db
```

### Option B: Local PostgreSQL
```bash
# macOS (brew)
brew install postgresql@15
brew services start postgresql@15

# Linux (Ubuntu)
sudo apt-get install postgresql-15
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

---

## Setup Phase 2: Environment & Dependencies (10 minutes)

### Create .env File
```bash
# In project root, create .env
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/boksh_apps

# Environment
NODE_ENV=development

# TMDB API (for movie syncs)
TMDB_API_KEY=265324a90fd3ab4851c19f5f5393d3c0
EOF
```

### Install Dependencies
```bash
npm install
```

---

## Setup Phase 3: Database Schema (5 minutes)

### Generate Prisma Client
```bash
npx prisma generate
```

### Deploy Migration
```bash
# First time setup - creates all tables
npx prisma migrate deploy

# If no migrations exist, create initial one
npx prisma migrate dev --name init
```

### Verify Schema
```bash
# Open Prisma Studio
npx prisma studio
# Opens http://localhost:5555 in your browser
# Verify all 13 tables exist
```

---

## Testing Phase 1: Local Development (10 minutes)

### Start Development Server
```bash
npm run dev
```
Runs on http://localhost:3000

### Test 1: API Debug Endpoint
```bash
curl http://localhost:3000/api/debug
```
Expected response:
```json
{
  "database": "connected",
  "user_count": 0,
  "movie_count": 0,
  "tmdb_api_key": "configured"
}
```

### Test 2: Signup Flow
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "username": "testuser1",
    "password": "Test123!@"
  }'
```
Expected response:
```json
{
  "user": {
    "id": "uuid",
    "username": "testuser1",
    "email": "test1@example.com"
  },
  "token": "jwt-token"
}
```

### Test 3: Login Flow
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "password": "Test123!@"
  }'
```

### Test 4: Get Current User
```bash
# Replace with token from signup
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Test 5: Movies Endpoint
```bash
curl http://localhost:3000/api/movies?limit=5
```

### Test 6: Cron Status
```bash
curl http://localhost:3000/api/cron/init
```
Expected: Shows if cron jobs are scheduled

### Test 7: Manual Sync Trigger (Optional)
```bash
curl "http://localhost:3000/api/cron/init?action=run-now"
# Syncs 1000 popular movies + upcoming releases
# Takes ~80 seconds
```

---

## Testing Phase 2: UI Testing (15 minutes)

### Manual Testing Checklist
1. **Home Page** (localhost:3000)
   - [ ] Redirects to login if not authenticated
   - [ ] Shows dashboard after login

2. **Signup** (localhost:3000/signup)
   - [ ] Form loads
   - [ ] Can enter email, username, password
   - [ ] "Sign up" button works
   - [ ] Redirects to home after signup

3. **Login** (localhost:3000/login)
   - [ ] Form loads
   - [ ] Can login with email/username
   - [ ] Redirects to home
   - [ ] Token stored in localStorage

4. **Movies** (localhost:3000/movies)
   - [ ] Page loads
   - [ ] Shows movie list
   - [ ] Can search movies

5. **Watchlist** (localhost:3000/watchlist)
   - [ ] Page loads
   - [ ] Can add movies
   - [ ] Shows added movies

6. **Calendar** (localhost:3000/calendar)
   - [ ] Calendar view loads
   - [ ] Can create events
   - [ ] Events display on calendar

7. **Friends** (localhost:3000/friends)
   - [ ] Can search for users
   - [ ] Can send friend requests
   - [ ] Can accept requests

8. **Suggestions** (localhost:3000/suggestions)
   - [ ] Can select a movie
   - [ ] Can select friends
   - [ ] Can submit suggestion

9. **Settings** (localhost:3000/settings)
   - [ ] Page loads
   - [ ] Can logout
   - [ ] Logout clears auth

---

## Testing Phase 3: API Endpoint Testing

### All 29 API Endpoints

#### Authentication (5)
```bash
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/search-users
```

#### Friends (6)
```bash
GET    /api/friends
POST   /api/friends/request
GET    /api/friends/incoming
GET    /api/friends/outgoing
PATCH  /api/friends/[id]
DELETE /api/friends/[id]
```

#### Notifications (4)
```bash
GET    /api/notifications
GET    /api/notifications/unread-count
POST   /api/notifications/mark-read
DELETE /api/notifications/[id]
```

#### Movies (3)
```bash
GET    /api/movies
GET    /api/movies/[id]
PATCH  /api/movies/[id]
```

#### Events (5)
```bash
POST   /api/events
GET    /api/events
GET    /api/events/[id]
PATCH  /api/events/[id]
DELETE /api/events/[id]
```

#### Watch Tracking (3)
```bash
POST   /api/watch/desire (add to watchlist)
GET    /api/watch/desire (get watchlist)
POST   /api/watch/mark-watched
GET    /api/watch/history
```

#### Other (3)
```bash
POST   /api/suggestions
GET    /api/suggestions
GET    /api/releases/upcoming
```

#### Debug (2)
```bash
GET    /api/debug
GET    /api/cron/init
```

---

## Testing Phase 4: Production Build (5 minutes)

### Build Production Version
```bash
npm run build
```
Should complete without errors (except ESLint warning)

### Start Production Server
```bash
npm start
```
Runs on http://localhost:3000

### Test Same Endpoints
```bash
curl http://localhost:3000/api/debug
curl http://localhost:3000/api/movies
```

---

## Post-Setup Verification Checklist

### Database
- [ ] PostgreSQL running
- [ ] Database `boksh_apps` created
- [ ] All 13 tables exist (verify in Prisma Studio)
- [ ] Migrations applied successfully

### Environment
- [ ] `.env` file created with DATABASE_URL
- [ ] TMDB_API_KEY configured
- [ ] NODE_ENV=development

### Code
- [ ] TypeScript compiles (npm run typecheck)
- [ ] Production build succeeds (npm run build)
- [ ] Development server starts (npm run dev)

### API
- [ ] /api/debug returns database connected
- [ ] /api/auth/signup creates users
- [ ] /api/auth/login returns tokens
- [ ] All endpoints respond

### UI
- [ ] Login/signup pages work
- [ ] Dashboard loads after auth
- [ ] Navigation works
- [ ] No console errors

---

## Common Issues & Fixes

### Issue: "relation does not exist"
**Cause**: Migrations not applied
```bash
npx prisma migrate deploy
```

### Issue: "ECONNREFUSED" (PostgreSQL)
**Cause**: Database not running
```bash
# Docker
docker start movienight-db

# Or restart Docker container
docker run -d -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=boksh_apps -p 5432:5432 postgres:15
```

### Issue: "no password supplied"
**Cause**: DATABASE_URL incorrect
```env
# Fix in .env
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/boksh_apps
```

### Issue: Build fails with ESLint error
**Current**: Only circular config warning (non-blocking)
**Fix**: Not needed, build completes successfully

### Issue: Movies not appearing
**Cause**: Cron hasn't run yet (scheduled for 3 AM)
**Fix**: Manually trigger sync
```bash
curl "http://localhost:3000/api/cron/init?action=run-now"
# Wait 80 seconds for sync to complete
curl http://localhost:3000/api/movies
```

---

## Full End-to-End Test Flow

### Step 1: Start Everything
```bash
# Terminal 1: PostgreSQL
docker run -d -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=boksh_apps -p 5432:5432 postgres:15

# Terminal 2: Development server
npm run dev
```

### Step 2: Create Test Users
```bash
# User 1
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "username": "alice",
    "password": "Test123!@"
  }'

# User 2
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "username": "bob",
    "password": "Test123!@"
  }'
```

### Step 3: Sync Movies (Optional)
```bash
curl "http://localhost:3000/api/cron/init?action=run-now"
# Takes ~80 seconds
```

### Step 4: Test Features
- [ ] Login as alice
- [ ] Search for bob (friends page)
- [ ] Send friend request
- [ ] Login as bob
- [ ] Accept friend request
- [ ] Back to alice
- [ ] Suggest a movie to bob
- [ ] Check watchlist
- [ ] Create a movie night event

### Step 5: Verify Database
```bash
npx prisma studio
# Check tables have data:
# - users (2 records)
# - friendships (1 accepted)
# - suggestions (1 pending)
# - movies (1000+ if synced)
```

---

## Next Steps

1. [ ] Complete Setup Phase 1-3 (30 minutes)
2. [ ] Run Testing Phase 1-4 (30 minutes)
3. [ ] Verify all checklist items
4. [ ] Deploy to production (or push to repo)

---

## Support

- **Build Issues**: `npm run build`
- **TypeScript Errors**: `npm run typecheck`
- **Database Issues**: `npx prisma studio`
- **API Issues**: Check `/api/debug` endpoint
- **Documentation**: See `IMPLEMENTATION_COMPLETE_FINAL.md`

---

**Everything is ready. Start with Setup Phase 1!** 🚀
