# SQL Migrations

This directory is the single source of truth for database schema changes.

## Naming convention

- `<timestamp>_<name>.up.sql`
- `<timestamp>_<name>.down.sql`

Example:

- `20260407090000_create_tenants.up.sql`
- `20260407090000_create_tenants.down.sql`

Use a 14-digit UTC timestamp (`YYYYMMDDHHMMSS`) and lowercase snake_case names.

## Commands

From repository root:

- `npm run migrate:up --workspace=backend`
- `npm run migrate:down --workspace=backend -- --steps 1`
- `npm run migrate:status --workspace=backend`
