/**
 * Run DB migrations.
 *
 * @see: https://orm.drizzle.team/docs/migrations
 */

// Dependencies
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Command } from 'commander';
import { overrideDrizzleTracer, db } from '../db/connection';
import packageJson from '../package.json' assert { type: 'json' };
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupCustomSentry, createTransaction, createSpan } from '../server/sentry-custom';

// Make sure Sentry is setup if DSN is provided
setupCustomSentry();
// Override our drizzle tracing so that we see queries
overrideDrizzleTracer();

// Main
// @todo this should let us monitor our migration job in sentry, but isn't working currently
createTransaction('db-migrations', cli);

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

  // Start
  console.log('Running migrations if necessary...');

  // Path to migrations (needed here for how build works)
  const _dirname = dirname(fileURLToPath(import.meta.url));
  const migrationsDir = joinPath(_dirname, '..', 'db', 'migrations');

  // This will run migrations on the database, skipping the ones already applied
  await createSpan({ name: 'migrate', op: 'db.transaction' }, () =>
    migrate(db, { migrationsFolder: migrationsDir })
  );

  // End
  console.log('Migrations completed.');
}
