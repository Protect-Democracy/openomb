# Database management

## Database changes

The following is the basic flow for making database changes:

1. Code changes to the scheme files (`db/schema/`) or other relevant places.
1. Create migrations with: `npm run db:generate-migration`
   - This should create new migration files in `db/migrations/`
   - If you want to load variables from a `.env` file, the run: `npx dotenvx run -- npm run db:generate-migration`
1. Update migrations if needed to handle any data shifts or nuance that was not accounted for with Drizzle's migration tool.
1. Run migrations scripts: `npm run db:migrate`
   - If you want to load variables from a `.env` file, the run: `npx dotenvx run -- npm run db:migrate`
1. Check that everything is working as expected.

### In production

For production updates, the above should be preformed locally and all migrations and code changes should be committed and reviewed.

Migrations run automatically during [deployment](./BUILD_DEPLOYMENT.md#deploy), after the new image is pushed and **before** the web service is updated. If a migration fails, the deploy stops and the current app keeps running.

Because the old app keeps serving traffic while the migration runs, migrations must be **backwards compatible** with the currently deployed code:

- Additive changes (new tables, new nullable or defaulted columns, new indexes) are safe in a single release.
- Destructive changes (dropping or renaming columns or tables, adding `NOT NULL` without a default) need two releases:
  1. Release code that no longer uses the old column or table.
  2. Release the migration that removes it.
- Large index builds lock the table while they run. Consider `CREATE INDEX CONCURRENTLY` in a hand-edited migration for big tables.
