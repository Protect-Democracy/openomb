/**
 * Export data for local testing.
 */

// Dependencies
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Command } from 'commander';
import { sql } from 'drizzle-orm';
import { dbConnectionString, db } from '../db/connection';
import {
  files,
  footnotes,
  lines,
  tafs,
  collections,
  searches,
  subscriptions,
  users,
  accounts,
  authenticators,
  sessions,
  verificationTokens
} from '../db/schema';
import packageJson from '../package.json' assert { type: 'json' };

// Constants
const execP = promisify(exec);

/**
 * Main CLI handler.
 */
async function cli(): Promise<void> {
  const _dirname = dirname(fileURLToPath(import.meta.url));

  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Perform database export for local testing.')
    .option(
      '--output <location>',
      'Location for the SQL.',
      joinPath(_dirname, '..', 'tests', 'data', 'sample.sql')
    )
    .parse(process.argv);
  const options = program.opts();

  // Dates
  const startDate = new Date('2024-06-01');
  const endDate = new Date('2025-01-31');

  // For DB Dump
  const connectionString = dbConnectionString();

  // Trim up the database
  console.log('Trimming data from database...');
  for (const schema of [footnotes, lines, tafs]) {
    await db.execute(
      sql`
        DELETE FROM ${schema}
        WHERE ${schema.fileId} IN (
          SELECT ${files.fileId}
          FROM ${files}
          WHERE ${files.approvalTimestamp} < ${startDate}
            OR ${files.approvalTimestamp} > ${endDate}
        )`
    );
  }

  await db.execute(
    sql`
      DELETE FROM ${files}
      WHERE ${files.approvalTimestamp} < ${startDate}
          OR ${files.approvalTimestamp} > ${endDate}`
  );

  // Truncate
  for (const schema of [
    collections,
    searches,
    subscriptions,
    users,
    accounts,
    authenticators,
    sessions,
    verificationTokens
  ]) {
    await db.execute(sql`TRUNCATE ${schema} CASCADE`);
  }

  for (const table of ['account', 'authenticator', 'session', 'verificationToken']) {
    await db.execute(`TRUNCATE ${table} CASCADE`);
  }

  // Use pg_dump to export schema
  let schemaOutput = '';
  try {
    const { stdout, stderr } = await execP(
      `pg_dump "${connectionString}" --schema-only --no-owner --schema=public`
    );
    if (stderr) {
      console.error('Error exporting schema:', stderr);
      process.exit(1);
    }

    schemaOutput = stdout
      .replace(/\spublic\./g, ' ')
      .replace(/SET\s(.*)\n/g, '')
      .replace(/SELECT pg_catalog(.*)\n/g, '')
      .replace(/CREATE SCHEMA public(.*)\n/g, '')
      .replace(/COMMENT ON SCHEMA public(.*)\n/g, '');
  }
  catch (error) {
    console.error('Error exporting schema:', error);
    process.exit(1);
  }

  // Write file
  await execP(`echo "${schemaOutput}" > ${options.output}`);

  // End
  console.log('Export completed.');
}

cli();
