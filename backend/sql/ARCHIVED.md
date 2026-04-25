# Archived SQL Scripts

`backend/sql` is legacy and archived.

- Do not run SQL from this directory in development, CI, or production.
- `backend/db/migrations` is the only source of truth for schema changes.
- New schema changes must be added as paired `*.up.sql` and `*.down.sql` migrations.
