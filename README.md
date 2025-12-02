# MovieNight - Next.js with PostgreSQL

A modern movie discovery and sharing platform built with Next.js App Router and PostgreSQL.

<!-- swoosh-verse branch merge marker -->

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Database**: PostgreSQL with raw SQL queries (no Prisma)
- **Authentication**: Session-based with HttpOnly cookies
- **Frontend**: React 18 with TailwindCSS
- **Validation**: Zod
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL 12+ running with the `boksh_apps` database
- Database schema already exists (auth and movienight schemas)

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your PostgreSQL connection string:

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/boksh_apps
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── api/                    # API routes
│   ├── auth/              # Authentication routes
│   ├── movies/            # Movie routes
│   ├── suggestions/       # Suggestion routes
│   ├── watch/             # Watchlist and watch history routes
│   └── friends/           # Friend management routes
├── (auth)/                # Auth pages (login, signup)
├── (app)/                 # Protected app pages
└── layout.tsx             # Root layout

lib/
├── db.ts                  # Database connection helper
├── auth.ts                # Session and auth utilities
└── ...                    # Other utilities

types/
└── index.ts               # TypeScript type definitions

styles/
└── globals.css            # Global styles and Tailwind config
```

## API Routes

### Authentication

- `POST /api/auth/signup` - Create a new account
- `POST /api/auth/login` - Sign in with email/username and password
- `POST /api/auth/logout` - Log out and clear session
- `GET /api/auth/me` - Get current authenticated user

### Movies

- `GET /api/movies` - List movies with optional search
- `GET /api/movies/[id]` - Get movie details
- `PATCH /api/movies/[id]` - Update movie (admin only)

### Suggestions

- `POST /api/suggestions` - Create a movie suggestion
- `GET /api/suggestions` - Get suggestions sent to/by current user

### Watchlist

- `POST /api/watch/desire` - Add movie to watchlist
- `GET /api/watch/desire` - Get watchlist
- `POST /api/watch/mark-watched` - Mark movie as watched
- `GET /api/watch/history` - Get watch history

### Friends

- `POST /api/friends/request` - Send friend request
- `GET /api/friends` - Get friends and pending requests
- `PATCH /api/friends/[id]` - Accept/reject/remove friend request
- `DELETE /api/friends/[id]` - Remove friend

## Database Schema Overview

The application uses two main schemas:

### `auth` schema

- **User** - User accounts with internal ID (id) and public ID (puid)
- **Session** - Session tokens for authentication

### `movienight` schema

- **Movie** - Movie information
- **Release** - Specific releases (platform, date)
- **Suggestion** - Movie suggestions between users
- **WatchDesire** - Movies users want to watch
- **WatchedMovie** - Movies marked as watched
- **Friendship** - Friendship relationships between users
- **Notification** - User notifications
- **UserPushSubscription** - WebPush subscriptions
- **UserNotificationPreferences** - User notification settings

## Key Features

### Session-Based Authentication

- User login creates a session stored in the database
- Session token stored in HttpOnly cookie
- Automatic session validation on protected routes

### User ID Mapping

- Internal IDs (UUID) stored as `auth.User.id`
- Public IDs (UUID) stored as `auth.User.puid`
- APIs use `puid` externally, `id` internally for joins

### Type-Safe API

- All routes use Zod for request validation
- Consistent JSON response format: `{ success, data?, error? }`
- Full TypeScript support

## Development

### Running the development server

```bash
npm run dev
```

### Building for production

```bash
npm run build
```

### Starting production server

```bash
npm start
```

### Type checking

```bash
npm run typecheck
```

## Deployment

The application can be deployed to any Node.js hosting platform. Ensure:

1. `DATABASE_URL` environment variable is set
2. Node.js 18+ is available
3. Port 3000 is accessible (or configure via PORT env var)

## API Response Format

All endpoints return a consistent JSON format:

**Success:**

```json
{
  "success": true,
  "data": {
    /* response data */
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Error message or validation errors array"
}
```

## Next Steps

- [ ] Complete remaining page components (movies list, suggestions, watchlist, friends)
- [ ] Add notifications system
- [ ] Implement releases browsing
- [ ] Add TMDB integration for movie data sync
- [ ] Add WebPush notifications
- [ ] Implement more detailed error handling
- [ ] Add pagination to list endpoints
- [ ] Add caching strategies

## License

MIT
