# MovieNight Migration to Next.js

## Summary of Changes

This project has been migrated from a Vite + Express SPA with Prisma/JSON storage to a modern Next.js App Router application with PostgreSQL as the single source of truth.

## What Was Done

### 1. **Project Structure**
- Converted from Express + Vite structure to Next.js App Router
- Organized routes under `app/api/` for backend and `app/` for pages
- Established `lib/` and `types/` directories for shared utilities

### 2. **Database & ORM**
- ✅ **Removed**: All Prisma dependencies and migration files
- ✅ **Removed**: JSON file-based database (`data/database.json`) and fallback logic
- ✅ **Implemented**: Direct PostgreSQL queries using `pg` (node-postgres)
- ✅ **Created**: `lib/db.ts` - lightweight database connection helper
- ✅ **Schema**: Using existing `auth` and `movienight` schemas in `boksh_apps` database

### 3. **Authentication**
- ✅ **Replaced**: JWT with session-based authentication
- ✅ **Implemented**: HttpOnly cookies for secure session storage
- ✅ **Created**: `lib/auth.ts` with session management utilities
- ✅ **Public User IDs**: Using `puid` field from `auth.User` for external APIs
- ✅ **Routes**:
  - `POST /api/auth/signup` - create account
  - `POST /api/auth/login` - sign in
  - `POST /api/auth/logout` - sign out
  - `GET /api/auth/me` - get current user

### 4. **Core Features**

#### Movies
- `GET /api/movies` - list movies with search support
- `GET /api/movies/[id]` - get movie details
- `PATCH /api/movies/[id]` - update movie (admin only)

#### Suggestions
- `POST /api/suggestions` - create suggestion
- `GET /api/suggestions` - list suggestions sent to/by user
- Full user validation and puid-to-id mapping

#### Watchlist
- `POST /api/watch/desire` - add to watchlist
- `GET /api/watch/desire` - get wishlist items
- `POST /api/watch/mark-watched` - mark as watched
- `GET /api/watch/history` - view watch history

#### Friends
- `POST /api/friends/request` - send friend request
- `GET /api/friends` - get friends and pending requests
- `PATCH /api/friends/[id]` - accept/reject requests
- `DELETE /api/friends/[id]` - remove friend

### 5. **Frontend Pages**
- ✅ `app/(auth)/login` - user login
- ✅ `app/(auth)/signup` - user registration
- ✅ `app/(app)/page.tsx` - home dashboard
- ✅ `app/(app)/movies/page.tsx` - movie browsing
- ✅ `app/(app)/suggestions/page.tsx` - suggestion management
- ✅ `app/(app)/watchlist/page.tsx` - watchlist and history
- ✅ `app/(app)/friends/page.tsx` - friend management

### 6. **Validation & Error Handling**
- ✅ All routes use Zod for request validation
- ✅ Consistent JSON response format: `{ success: boolean, data?, error? }`
- ✅ Proper HTTP status codes (400, 401, 403, 404, 500)
- ✅ Validation error details in responses

### 7. **Configuration**
- ✅ `next.config.ts` - Next.js configuration
- ✅ `tailwind.config.js` - TailwindCSS setup
- ✅ `postcss.config.js` - PostCSS configuration
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `.env.example` - environment template
- ✅ `types/index.ts` - TypeScript type definitions

## What Was Removed

- ❌ Express server code (`server/`)
- ❌ Vite configuration (`vite.config.ts`, `vite.config.server.ts`)
- ❌ Prisma schema, migrations, and client imports
- ❌ JSON database files and fallback logic
- ❌ Netlify serverless functions (`netlify/functions/`)
- ❌ React Router (replaced with Next.js routing)
- ❌ JSON transaction wrapper logic
- ❌ TMDB sync in cron jobs (can be re-implemented as API routes)

## Database Setup

No migrations needed! The PostgreSQL database already exists with the required schemas:

```
boksh_apps/
├── auth schema
│   ├── User (id, username, email, passwordHash, name, role, puid, joinedAt, createdAt, updatedAt)
│   └── Session (id, sessionToken, userId, expires, createdAt)
├── movienight schema
│   ├── Movie
│   ├── Release
│   ├── Suggestion
│   ├── WatchDesire
│   ├── WatchedMovie
│   ├── Friendship
│   ├── Notification
│   ├── UserPushSubscription
│   └── UserNotificationPreferences
```

## Environment Variables

Set in `.env.local`:
```
DATABASE_URL=postgresql://user:password@host:5432/boksh_apps
NODE_ENV=development
```

## Running the Project

```bash
# Install dependencies
npm install

# Start development server (port 3000 by default)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Key Architectural Decisions

1. **No Prisma**: Direct SQL queries via `pg` library for:
   - Better control over complex queries
   - No ORM overhead
   - Alignment with deployment requirements
   - Easier to debug and optimize

2. **Session-Based Auth**: HttpOnly cookies instead of JWT:
   - More secure by default (XSS protection)
   - Session stored in database for easy revocation
   - Better suited for server-rendered pages

3. **Public/Internal User IDs**:
   - External APIs use `puid` (public user ID)
   - Internal joins use `id` (internal user ID)
   - Prevents leaking of internal database UUIDs

4. **Consistent API Response Format**:
   - All endpoints return `{ success, data?, error? }`
   - Makes client error handling predictable
   - Validation errors return detailed field-level info

## Next Steps & TODOs

- [ ] Notifications system implementation
- [ ] Releases browsing and filtering by platform
- [ ] TMDB integration for movie sync (as Next.js API route)
- [ ] WebPush notifications
- [ ] Admin dashboard for managing users/content
- [ ] Advanced search and filtering
- [ ] Pagination for list endpoints
- [ ] Rate limiting and security headers
- [ ] Error logging and monitoring (Sentry integration)
- [ ] Testing (unit and integration tests)
- [ ] API documentation (OpenAPI/Swagger)

## Breaking Changes for Clients

If you have existing clients (mobile apps, other frontends):

1. **Auth Flow**: JWT bearer tokens → Session cookies
   - Set credentials mode to `include` in fetch requests
   - Read session cookie from response

2. **User ID Format**: Various formats → standardized to UUID strings
   - Always use `puid` from API responses when displaying to users
   - Store and reference user IDs as UUID strings

3. **API Base URL**: May have changed if moving hosting
   - Update all API endpoint URLs in clients

4. **Error Format**: May have changed
   - Always check `success` field first
   - Look for `error` field for error messages

## Database Queries & Performance

All database queries are logged during development. To monitor performance:

```
NODE_ENV=development npm run dev
```

Check the terminal for query logs showing execution time.

## Security Considerations

✅ **Implemented**:
- HttpOnly cookies (XSS protection)
- Secure flag on cookies (HTTPS in production)
- Password hashing with bcrypt
- Session token validation on every request
- User authentication checks on protected routes
- Admin role checks for privileged operations

⚠️ **Not Yet Implemented**:
- CSRF protection (consider adding)
- Rate limiting (prevent brute force)
- SQL injection protection via parameterized queries (already using)
- Security headers (helmet middleware)
- Input sanitization beyond Zod validation

## API Response Examples

Success:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john",
    "email": "john@example.com"
  }
}
```

Validation Error:
```json
{
  "success": false,
  "error": [
    { "field": "email", "message": "Invalid email" },
    { "field": "password", "message": "Minimum 8 characters" }
  ]
}
```

Authentication Error:
```json
{
  "success": false,
  "error": "Unauthenticated"
}
```

## Useful Commands

```bash
# Type checking
npm run typecheck

# Format code
npx prettier --write .

# Start dev server with clear terminal
clear && npm run dev

# Build and verify
npm run build && npm start
```

## Support & Questions

See README.md for more information about the project structure and API documentation.
