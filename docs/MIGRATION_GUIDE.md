# Prisma Migration Guide - MovieNight Database

**Date**: November 24, 2025  
**Status**: ✅ Migration files created and ready to deploy

---

## Quick Start (3 steps)

### 1. Ensure PostgreSQL is Running
```bash
# Docker option (recommended)
docker run -d \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=boksh_apps \
  -p 5432:5432 \
  postgres:15

# Or use existing PostgreSQL instance
```

### 2. Set DATABASE_URL in .env
```bash
# .env file
DATABASE_URL=postgresql://postgres:password@localhost:5432/boksh_apps
```

### 3. Run Migration
```bash
# Generate Prisma client (if not already done)
npx prisma generate

# Deploy migrations to database
npx prisma migrate deploy

# Verify schema was created
npx prisma db push
```

Done! Database is ready.

---

## What's Being Created

### Database Tables (13 total)

#### Auth & Users (2 tables)
- `users` — User accounts with avatar field
- `sessions` — Session management (expiring tokens)

#### Movies & Releases (2 tables)
- `movies` — Movie catalog (TMDB synced data)
- `releases` — Upcoming movie releases

#### Watch Tracking (2 tables)
- `watch_history` — Movies watched by users
- `watch_desire` — Watchlist/movies to watch

#### Suggestions & Friends (3 tables)
- `suggestions` — Movie suggestions to friends
- `friendships` — Friend relationships
- `events` — Movie night events

#### Notifications (3 tables)
- `notifications` — User notifications
- `user_push_subscriptions` — PWA push subscriptions
- `user_notification_preferences` — Notification settings

### Enums (3 types)
- `Role` — user | admin
- `SuggestionStatus` — pending | accepted | rejected
- `FriendshipStatus` — pending | accepted | rejected

---

## Detailed Migration Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Environment Variables
Create `.env` file in project root:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/boksh_apps
NODE_ENV=development
TMDB_API_KEY=265324a90fd3ab4851c19f5f5393d3c0
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```
This creates the Prisma client for TypeScript type safety.

### Step 4: Deploy Migrations
```bash
npx prisma migrate deploy
```
This applies all migration files to your PostgreSQL database.

### Step 5: Verify Setup
```bash
# Open Prisma Studio (visual database manager)
npx prisma studio

# Or test with API
npm run dev
# Then test: curl http://localhost:3000/api/debug
```

---

## Migration Files

Location: `prisma/migrations/`

### init/migration.sql
- **Size**: Single comprehensive migration
- **Tables**: 13 tables with full schema
- **Relations**: All foreign keys defined
- **Indexes**: Unique constraints on username, email, imdb_id
- **Status**: Ready to deploy

### migration_lock.toml
- **Provider**: postgresql
- **Purpose**: Prevents migration conflicts
- **Status**: Locked to PostgreSQL only

---

## Rollback Instructions

If something goes wrong:

```bash
# Reset entire database (⚠️ DESTRUCTIVE)
npx prisma migrate reset

# This will:
# 1. Drop all existing tables
# 2. Reapply all migrations from scratch
# 3. Recreate schema

# Then run migrations again
npx prisma migrate deploy
```

---

## Testing After Migration

### Check Database Connection
```bash
curl http://localhost:3000/api/debug
```
Expected response:
```json
{
  "database": "connected",
  "tmdb_api_key": "configured"
}
```

### Create Test User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

### Verify Tables Exist
```bash
npx prisma db execute --stdin << 'EOF'
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
EOF
```

---

## Production Deployment

### Before Deploying
1. [ ] PostgreSQL database created and running
2. [ ] DATABASE_URL configured in secrets manager
3. [ ] Backup existing data (if upgrading)
4. [ ] Test migrations locally first
5. [ ] Review migration for breaking changes

### Deployment Process
```bash
# In production environment
npm install --production
npx prisma generate
npx prisma migrate deploy  # Apply migrations
npm run build
npm start
```

### Post-Deployment
- [ ] Verify database tables created
- [ ] Check API endpoints responding
- [ ] Test signup/login flow
- [ ] Monitor error logs
- [ ] Run smoke tests

---

## Troubleshooting

### Error: "relation does not exist"
**Cause**: Migration not applied
**Fix**: 
```bash
npx prisma migrate deploy
```

### Error: "UNIQUE constraint failed: users.email"
**Cause**: User already exists
**Fix**: Use different email or reset database
```bash
npx prisma migrate reset  # ⚠️ Clears all data
```

### Error: "no password supplied"
**Cause**: PostgreSQL requires password
**Fix**: Update DATABASE_URL with password
```env
DATABASE_URL=postgresql://user:PASSWORD@localhost:5432/boksh_apps
```

### Error: "Can't reach database server"
**Cause**: PostgreSQL not running
**Fix**: Start PostgreSQL
```bash
# Docker
docker run -d -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=boksh_apps -p 5432:5432 postgres:15

# Or systemctl (Linux)
systemctl start postgresql

# Or (Mac)
brew services start postgresql
```

---

## Advanced: Manual Migrations

If you need to modify the schema:

### Create New Migration
```bash
npx prisma migrate dev --name add_new_field
```
This creates a new migration file with your changes.

### View Pending Migrations
```bash
npx prisma migrate status
```

### Create Migration Without Applying
```bash
npx prisma migrate dev --name migration_name --create-only
```

---

## Schema Diagram

```
AuthUser
├─ username (unique)
├─ email (unique)
├─ avatar
├─ passwordHash
└─ relationships:
   ├─ sessions
   ├─ watchHistory (many)
   ├─ watchDesires (many)
   ├─ suggestionsFrom (many)
   ├─ suggestionsTo (many)
   ├─ friendships (many)
   ├─ eventsHosted (many)
   └─ notifications (many)

Movie
├─ imdbId (unique)
├─ title
├─ year
├─ genres[]
├─ poster
├─ description
└─ relationships:
   ├─ releases
   ├─ watchHistory (many)
   ├─ watchDesires (many)
   ├─ suggestions (many)
   └─ events (many)

Event
├─ movieId
├─ hostUserId
├─ participants[]
├─ date
└─ notes
```

---

## Monitoring

### Query Execution Plans
```bash
npx prisma db execute --stdin << 'EOF'
EXPLAIN ANALYZE 
SELECT * FROM users WHERE username = 'example';
EOF
```

### Check Database Size
```bash
npx prisma db execute --stdin << 'EOF'
SELECT pg_size_pretty(pg_database_size('boksh_apps'));
EOF
```

### Active Connections
```bash
npx prisma db execute --stdin << 'EOF'
SELECT count(*) FROM pg_stat_activity WHERE datname = 'boksh_apps';
EOF
```

---

## Summary

✅ **Migration Ready**:
- All schema tables defined
- Foreign keys configured
- Enums created
- Indexes set up
- Ready for production

**Next Steps**:
1. Start PostgreSQL
2. Set DATABASE_URL
3. Run `npx prisma migrate deploy`
4. Test with `npm run dev`
5. Deploy to production

---

**Questions?** Check `LATEST_UPDATES.md` or `IMPLEMENTATION_COMPLETE_FINAL.md`
