-- Align legacy init migration output with current Prisma schema.prisma
-- This migration is additive/safe for databases previously created from init.

-- Create missing enums
DO $$
BEGIN
    CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "VoteType" AS ENUM ('yes', 'maybe', 'no');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add missing columns
ALTER TABLE "movies" ADD COLUMN IF NOT EXISTS "tmdb_id" INTEGER;
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "tmdb_id" INTEGER;
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "country_code" TEXT;

-- Backfill country_code for existing rows before NOT NULL enforcement
UPDATE "releases"
SET "country_code" = COALESCE("country_code", 'US')
WHERE "country_code" IS NULL;

ALTER TABLE "releases" ALTER COLUMN "country_code" SET NOT NULL;

-- Create missing tables
CREATE TABLE IF NOT EXISTS "event_invitations" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "movie_night_votes" (
    "id" UUID NOT NULL,
    "movie_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "voteType" "VoteType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "movie_night_votes_pkey" PRIMARY KEY ("id")
);

-- De-duplicate data where new unique constraints may fail
DELETE FROM "watch_history"
WHERE "id" IN (
    SELECT "id"
    FROM (
        SELECT
            "id",
            ROW_NUMBER() OVER (
                PARTITION BY "user_id", "movie_id"
                ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
            ) AS rn
        FROM "watch_history"
    ) t
    WHERE t.rn > 1
);

DELETE FROM "watch_desire"
WHERE "id" IN (
    SELECT "id"
    FROM (
        SELECT
            "id",
            ROW_NUMBER() OVER (
                PARTITION BY "user_id", "movie_id"
                ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
            ) AS rn
        FROM "watch_desire"
    ) t
    WHERE t.rn > 1
);

DELETE FROM "friendships"
WHERE "id" IN (
    SELECT "id"
    FROM (
        SELECT
            "id",
            ROW_NUMBER() OVER (
                PARTITION BY "user_id_1", "user_id_2"
                ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
            ) AS rn
        FROM "friendships"
    ) t
    WHERE t.rn > 1
);

DELETE FROM "user_push_subscriptions"
WHERE "id" IN (
    SELECT "id"
    FROM (
        SELECT
            "id",
            ROW_NUMBER() OVER (
                PARTITION BY "endpoint"
                ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
            ) AS rn
        FROM "user_push_subscriptions"
    ) t
    WHERE t.rn > 1
);

DELETE FROM "releases"
WHERE "id" IN (
    SELECT "id"
    FROM (
        SELECT
            "id",
            ROW_NUMBER() OVER (
                PARTITION BY "tmdb_id", "country_code", "platform"
                ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
            ) AS rn
        FROM "releases"
        WHERE "tmdb_id" IS NOT NULL
    ) t
    WHERE t.rn > 1
);

-- Replace legacy FK delete behavior (RESTRICT/SET NULL) to match current Prisma schema
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_fkey";
ALTER TABLE "releases" DROP CONSTRAINT IF EXISTS "releases_movie_id_fkey";
ALTER TABLE "watch_history" DROP CONSTRAINT IF EXISTS "watch_history_user_id_fkey";
ALTER TABLE "watch_history" DROP CONSTRAINT IF EXISTS "watch_history_movie_id_fkey";
ALTER TABLE "watch_desire" DROP CONSTRAINT IF EXISTS "watch_desire_user_id_fkey";
ALTER TABLE "watch_desire" DROP CONSTRAINT IF EXISTS "watch_desire_movie_id_fkey";
ALTER TABLE "watch_desire" DROP CONSTRAINT IF EXISTS "watch_desire_suggestion_id_fkey";
ALTER TABLE "suggestions" DROP CONSTRAINT IF EXISTS "suggestions_movie_id_fkey";
ALTER TABLE "suggestions" DROP CONSTRAINT IF EXISTS "suggestions_from_user_id_fkey";
ALTER TABLE "suggestions" DROP CONSTRAINT IF EXISTS "suggestions_to_user_id_fkey";
ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "friendships_user_id_1_fkey";
ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "friendships_user_id_2_fkey";
ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "friendships_requested_by_fkey";
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_movie_id_fkey";
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_host_user_id_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";
ALTER TABLE "user_push_subscriptions" DROP CONSTRAINT IF EXISTS "user_push_subscriptions_user_id_fkey";
ALTER TABLE "user_notification_preferences" DROP CONSTRAINT IF EXISTS "user_notification_preferences_user_id_fkey";
ALTER TABLE "event_invitations" DROP CONSTRAINT IF EXISTS "event_invitations_event_id_fkey";
ALTER TABLE "event_invitations" DROP CONSTRAINT IF EXISTS "event_invitations_user_id_fkey";
ALTER TABLE "event_invitations" DROP CONSTRAINT IF EXISTS "event_invitations_invited_by_fkey";
ALTER TABLE "movie_night_votes" DROP CONSTRAINT IF EXISTS "movie_night_votes_movie_id_fkey";
ALTER TABLE "movie_night_votes" DROP CONSTRAINT IF EXISTS "movie_night_votes_user_id_fkey";

-- Missing unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "movies_tmdb_id_key" ON "movies"("tmdb_id");
CREATE UNIQUE INDEX IF NOT EXISTS "releases_tmdb_id_country_code_platform_key" ON "releases"("tmdb_id", "country_code", "platform");
CREATE UNIQUE INDEX IF NOT EXISTS "watch_history_user_id_movie_id_key" ON "watch_history"("user_id", "movie_id");
CREATE UNIQUE INDEX IF NOT EXISTS "watch_desire_user_id_movie_id_key" ON "watch_desire"("user_id", "movie_id");
CREATE UNIQUE INDEX IF NOT EXISTS "friendships_user_id_1_user_id_2_key" ON "friendships"("user_id_1", "user_id_2");
CREATE UNIQUE INDEX IF NOT EXISTS "event_invitations_event_id_user_id_key" ON "event_invitations"("event_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "movie_night_votes_movie_id_user_id_key" ON "movie_night_votes"("movie_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_push_subscriptions_endpoint_key" ON "user_push_subscriptions"("endpoint");

-- Missing non-unique indexes
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX IF NOT EXISTS "releases_movie_id_idx" ON "releases"("movie_id");
CREATE INDEX IF NOT EXISTS "releases_release_date_idx" ON "releases"("release_date");
CREATE INDEX IF NOT EXISTS "releases_country_code_idx" ON "releases"("country_code");
CREATE INDEX IF NOT EXISTS "watch_history_user_id_idx" ON "watch_history"("user_id");
CREATE INDEX IF NOT EXISTS "watch_history_movie_id_idx" ON "watch_history"("movie_id");
CREATE INDEX IF NOT EXISTS "watch_history_user_id_watched_at_idx" ON "watch_history"("user_id", "watched_at");
CREATE INDEX IF NOT EXISTS "watch_desire_user_id_idx" ON "watch_desire"("user_id");
CREATE INDEX IF NOT EXISTS "watch_desire_movie_id_idx" ON "watch_desire"("movie_id");
CREATE INDEX IF NOT EXISTS "watch_desire_suggestion_id_idx" ON "watch_desire"("suggestion_id");
CREATE INDEX IF NOT EXISTS "suggestions_from_user_id_idx" ON "suggestions"("from_user_id");
CREATE INDEX IF NOT EXISTS "suggestions_to_user_id_idx" ON "suggestions"("to_user_id");
CREATE INDEX IF NOT EXISTS "suggestions_movie_id_idx" ON "suggestions"("movie_id");
CREATE INDEX IF NOT EXISTS "suggestions_status_idx" ON "suggestions"("status");
CREATE INDEX IF NOT EXISTS "suggestions_from_user_id_to_user_id_idx" ON "suggestions"("from_user_id", "to_user_id");
CREATE INDEX IF NOT EXISTS "suggestions_to_user_id_status_idx" ON "suggestions"("to_user_id", "status");
CREATE INDEX IF NOT EXISTS "friendships_user_id_1_idx" ON "friendships"("user_id_1");
CREATE INDEX IF NOT EXISTS "friendships_user_id_2_idx" ON "friendships"("user_id_2");
CREATE INDEX IF NOT EXISTS "friendships_requested_by_idx" ON "friendships"("requested_by");
CREATE INDEX IF NOT EXISTS "friendships_status_idx" ON "friendships"("status");
CREATE INDEX IF NOT EXISTS "friendships_user_id_1_user_id_2_idx" ON "friendships"("user_id_1", "user_id_2");
CREATE INDEX IF NOT EXISTS "events_host_user_id_idx" ON "events"("host_user_id");
CREATE INDEX IF NOT EXISTS "events_movie_id_idx" ON "events"("movie_id");
CREATE INDEX IF NOT EXISTS "events_date_idx" ON "events"("date");
CREATE INDEX IF NOT EXISTS "event_invitations_user_id_idx" ON "event_invitations"("user_id");
CREATE INDEX IF NOT EXISTS "event_invitations_status_idx" ON "event_invitations"("status");
CREATE INDEX IF NOT EXISTS "event_invitations_event_id_idx" ON "event_invitations"("event_id");
CREATE INDEX IF NOT EXISTS "movie_night_votes_movie_id_idx" ON "movie_night_votes"("movie_id");
CREATE INDEX IF NOT EXISTS "movie_night_votes_user_id_idx" ON "movie_night_votes"("user_id");
CREATE INDEX IF NOT EXISTS "movie_night_votes_voteType_idx" ON "movie_night_votes"("voteType");
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_idx" ON "notifications"("user_id", "read");
CREATE INDEX IF NOT EXISTS "user_push_subscriptions_user_id_idx" ON "user_push_subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "user_notification_preferences_user_id_idx" ON "user_notification_preferences"("user_id");

-- Recreate foreign keys to match current Prisma schema
ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "releases"
ADD CONSTRAINT "releases_movie_id_fkey"
FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "watch_history"
ADD CONSTRAINT "watch_history_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "watch_history"
ADD CONSTRAINT "watch_history_movie_id_fkey"
FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "watch_desire"
ADD CONSTRAINT "watch_desire_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "watch_desire"
ADD CONSTRAINT "watch_desire_movie_id_fkey"
FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "watch_desire"
ADD CONSTRAINT "watch_desire_suggestion_id_fkey"
FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "suggestions"
ADD CONSTRAINT "suggestions_movie_id_fkey"
FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "suggestions"
ADD CONSTRAINT "suggestions_from_user_id_fkey"
FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "suggestions"
ADD CONSTRAINT "suggestions_to_user_id_fkey"
FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "friendships"
ADD CONSTRAINT "friendships_user_id_1_fkey"
FOREIGN KEY ("user_id_1") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "friendships"
ADD CONSTRAINT "friendships_user_id_2_fkey"
FOREIGN KEY ("user_id_2") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "friendships"
ADD CONSTRAINT "friendships_requested_by_fkey"
FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "events"
ADD CONSTRAINT "events_movie_id_fkey"
FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "events"
ADD CONSTRAINT "events_host_user_id_fkey"
FOREIGN KEY ("host_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_invitations"
ADD CONSTRAINT "event_invitations_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_invitations"
ADD CONSTRAINT "event_invitations_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_invitations"
ADD CONSTRAINT "event_invitations_invited_by_fkey"
FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "movie_night_votes"
ADD CONSTRAINT "movie_night_votes_movie_id_fkey"
FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "movie_night_votes"
ADD CONSTRAINT "movie_night_votes_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_push_subscriptions"
ADD CONSTRAINT "user_push_subscriptions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_notification_preferences"
ADD CONSTRAINT "user_notification_preferences_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
