# Documentation Index

This directory contains the active guides for running and maintaining MovieNight.
Legacy status/checklist/archive markdown files were removed to reduce documentation bloat.

## Core Docs

- `../README.md`: Project overview, architecture, and commands.
- `SETUP_AND_TEST.md`: Local setup, verification, and troubleshooting.
- `MIGRATION_GUIDE.md`: Prisma migration workflow and database operations.
- `CRON_SYNC_SETUP.md`: TMDB sync scheduling and cron behavior.

## Feature Guides

- `CALENDAR_FEATURE.md`: Calendar feature requirements/behavior.
- `CALENDAR_IMPLEMENTATION.md`: Calendar implementation details.
- `BRANDING_IMPLEMENTATION.md`: Branding implementation notes.
- `PWA_BRAND_ASSETS_GUIDE.md`: PWA/icon brand asset references.

## Notes

- `schema.sql` at project root is empty and not used by runtime.
- Canonical database definition is `prisma/schema.prisma` plus migrations in `prisma/migrations/`.
