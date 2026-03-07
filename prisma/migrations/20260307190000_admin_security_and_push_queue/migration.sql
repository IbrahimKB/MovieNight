-- Add super admin role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'super_admin';

-- Add account security + soft-delete columns
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "disabled_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users" ("deleted_at");
CREATE INDEX IF NOT EXISTS "users_disabled_at_idx" ON "users" ("disabled_at");
CREATE INDEX IF NOT EXISTS "users_locked_until_idx" ON "users" ("locked_until");

-- Create push job status enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PushJobStatus') THEN
    CREATE TYPE "PushJobStatus" AS ENUM ('queued', 'processing', 'sent', 'failed');
  END IF;
END $$;

-- Admin audit logs
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" UUID NOT NULL,
  "target_user_id" UUID,
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "admin_audit_logs_actor_id_idx" ON "admin_audit_logs" ("actor_id");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_target_user_id_idx" ON "admin_audit_logs" ("target_user_id");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_idx" ON "admin_audit_logs" ("action");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_created_at_idx" ON "admin_audit_logs" ("created_at");

ALTER TABLE "admin_audit_logs"
  DROP CONSTRAINT IF EXISTS "admin_audit_logs_actor_id_fkey",
  ADD CONSTRAINT "admin_audit_logs_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_audit_logs"
  DROP CONSTRAINT IF EXISTS "admin_audit_logs_target_user_id_fkey",
  ADD CONSTRAINT "admin_audit_logs_target_user_id_fkey"
    FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Push delivery queue
CREATE TABLE IF NOT EXISTS "push_delivery_jobs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "preference_key" TEXT,
  "payload" JSONB NOT NULL,
  "status" "PushJobStatus" NOT NULL DEFAULT 'queued',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "next_run_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "last_error" TEXT,
  "sent_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "push_delivery_jobs_user_id_idx" ON "push_delivery_jobs" ("user_id");
CREATE INDEX IF NOT EXISTS "push_delivery_jobs_status_next_run_at_idx" ON "push_delivery_jobs" ("status", "next_run_at");
CREATE INDEX IF NOT EXISTS "push_delivery_jobs_created_at_idx" ON "push_delivery_jobs" ("created_at");

ALTER TABLE "push_delivery_jobs"
  DROP CONSTRAINT IF EXISTS "push_delivery_jobs_user_id_fkey",
  ADD CONSTRAINT "push_delivery_jobs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

