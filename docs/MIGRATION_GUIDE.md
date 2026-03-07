# Migration Guide

This project uses Prisma migrations against PostgreSQL.

## Source of Truth

- Data model: `prisma/schema.prisma`
- Migration files: `prisma/migrations/`

Current migration chain in this repo:

1. `init`
2. `20260307130000_schema_alignment`

The alignment migration brings legacy DBs up to the current schema (missing enums, tables, columns, indexes, and FK delete behavior).

## Commands

```bash
# Generate Prisma client
npx prisma generate

# Apply pending migrations in deployment environments
npx prisma migrate deploy

# Check migration status (requires reachable DB)
npx prisma migrate status
```

## Local DB URL

Set `DATABASE_URL` in `.env` for your environment.

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/boksh_apps
```

## Validation Workflow

```bash
npm run typecheck
npm run build
```

If `migrate status` fails with connection errors, verify database host/network first.
