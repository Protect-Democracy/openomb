# Database management

## Database changes

The following is the basic flow for making database changes:

1. Code changes to the scheme files (`db/schema/`) or other relevant places.
1. Create migrations with: `npm run db:generate-migration`
   - This should create new migration files in `db/migrations/`
1. Update migrations if needed to handle any data shifts or nuance that was not accounted for with Drizzle's migration tool.
1. Run migrations scripts: `npm run db:migrate`
1. Check that everything is working as expected.

### In production

For production updates, the above should be preformed locally and all migrations and code changes should be committed and reviewed.

There needs to be coordination with [deployment](./BUILD_DEPLOYMENT.md) and running the migrations likely locally while connected to the production environment.
