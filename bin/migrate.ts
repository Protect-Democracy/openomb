/**
 * Run DB migrations.
 *
 * @see: https://orm.drizzle.team/docs/migrations
 */

// Dependencies
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Command } from 'commander';
import { db, dbConnect, dbDisconnect } from '../db/connection';
import packageJson from '../package.json' assert { type: 'json' };
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';

// Main
cli();

/**
 * Main CLI handler.
 */
async function cli(): Promise<void> {
  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Perform any database migrations.')
    .parse(process.argv);

  // Connect to DB
  await dbConnect();

  // Start
  console.log('Running migrations if necessary...');

  // Path to migrations (needed here for how build works)
  const _dirname = dirname(fileURLToPath(import.meta.url));
  const migrationsDir = joinPath(_dirname, '..', 'db', 'migrations');

  // This will run migrations on the database, skipping the ones already applied
  await migrate(db, { migrationsFolder: migrationsDir });

  // Close connection
  await dbDisconnect();

  // End
  console.log('Migrations completed.');
}
