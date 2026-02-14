import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import crypto from 'crypto';
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

import { db, resetDbConnection, migrationsDir, closeDbConnection } from '../../db/connection';

// Path to migrations
const _dirname = dirname(fileURLToPath(import.meta.url));
const defaultTestDataPath = joinPath(
  _dirname,
  '..',
  '..',
  'db',
  'test-data',
  'sample-test-data-10.sql'
);

/**
 * Create an isolated database for testing in the testcontainers Postgres instance.
 *
 * @returns Returns the connection URI and a teardown function to clean up after the test.
 */
export async function createIsolatedDb(
  options: { runMigrations?: boolean; loadDefaultSampleData?: boolean } = {
    runMigrations: true,
    loadDefaultSampleData: false
  }
) {
  // Default options
  options.loadDefaultSampleData = options.loadDefaultSampleData ?? false;
  options.runMigrations = options.runMigrations ?? true;

  // Get connection string that should have been setup by global-setup
  const adminConnString = process.env.TEST_POSTGRES_CONTAINER_URI;
  const defaultDbName = process.env.TEST_POSTGRES_DEFAULT_DB_NAME;
  if (!adminConnString || !defaultDbName) {
    throw new Error(
      'TEST_POSTGRES_CONTAINER_URI or TEST_POSTGRES_DEFAULT_DB_NAME not set. Did global-setup run?'
    );
  }

  // Connect
  const adminClient = new pg.Client({ connectionString: adminConnString });
  await adminClient.connect();

  // Generate a unique name for this test's database
  const dbName = `test_db_${crypto.randomBytes(4).toString('hex')}`;

  // Create the new database
  await adminClient.query(`CREATE DATABASE "${dbName}"`);
  await adminClient.end();

  // Construct the URI for this specific new database
  const isolatedUri = adminConnString.replace(new RegExp(`/${defaultDbName}$`), `/${dbName}`);

  // Set the environment variable for test
  process.env.APPORTIONMENTS_DB_URI = isolatedUri;

  // Reset the database object so it picks up new environment variables
  await resetDbConnection();

  // Run Migrations (if requested)
  if (options.runMigrations || options.loadDefaultSampleData) {
    if (!db) {
      throw new Error('Database connection is not initialized.');
    }
    await migrate(db, { migrationsFolder: migrationsDir });
  }

  // Load default sample data (if requested)
  if (options.loadDefaultSampleData) {
    const sql = await fs.readFile(defaultTestDataPath, 'utf-8');
    if (!db) {
      throw new Error('Database connection is not initialized.');
    }
    await db.execute(sql);
  }

  // Return cleanup function
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
