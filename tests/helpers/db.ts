import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import crypto from 'crypto';
import { db, resetDbConnection, migrationsDir, closeDbConnection } from '../../db/connection';

/**
 * Create an isolated database for testing in the testcontainers Postgres instance.
 *
 * @returns Returns the connection URI and a teardown function to clean up after the test.
 */
export async function createIsolatedDb(
  options: { runMigrations: boolean } = { runMigrations: true }
) {
  // Get connection string that should have been setup by global-setup
  const adminConnString = process.env.TEST_CONTAINER_URI;
  const defaultDbName = process.env.TEST_DEFAULT_DB_NAME;
  if (!adminConnString || !defaultDbName) {
    throw new Error('TEST_CONTAINER_URI or TEST_DEFAULT_DB_NAME not set. Did global-setup run?');
  }

  // Connect
  const adminClient = new pg.Client({ connectionString: adminConnString });
  await adminClient.connect();

  // Generate a unique name for this test's database
  const dbName = `test_db_${crypto.randomBytes(4).toString('hex')}`;

  // 3. Create the new database
  await adminClient.query(`CREATE DATABASE "${dbName}"`);
  await adminClient.end();

  // Construct the URI for this specific new database
  const isolatedUri = adminConnString.replace(new RegExp(`/${defaultDbName}$`), `/${dbName}`);

  // Set the environment variable for test
  process.env.APPORTIONMENTS_DB_URI = isolatedUri;

  // Reset the database object so it picks up new environment variables
  await resetDbConnection();

  // Run Migrations (if requested)
  if (options.runMigrations) {
    if (!db) {
      throw new Error('Database connection is not initialized.');
    }
    await migrate(db, { migrationsFolder: migrationsDir });
  }

  // 7. Return cleanup function
  return {
    uri: isolatedUri,
    teardown: async () => {
      await closeDbConnection();
      delete process.env.APPORTIONMENTS_DB_URI;

      // Drop the database to save disk space
      // (Requires reconnecting as admin)
      const cleanupClient = new pg.Client({ connectionString: adminConnString });
      await cleanupClient.connect();
      await cleanupClient.query(`
        DROP DATABASE "${dbName}";
      `);
      await cleanupClient.end();
    }
  };
}
