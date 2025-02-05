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
import { files, footnotes, lines, tafs } from '../db/schema';
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
  const startDate = new Date('2024-10-01');
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

  // Use pg_dump to export specific tables
  try {
    const { stderr } = await execP(
      [
        `pg_dump "${connectionString}" --data-only --no-owner --schema=public -t files -t lines -t tafs -t footnotes > ${options.output}.data-temp`,
        `sed -i '' 's/^INSERT INTO public\\./INSERT INTO /' ${options.output}.data-temp`,
        `sed -i '' 's/^COPY public\\./COPY /' ${options.output}.data-temp`
      ].join(' && ')
    );
    if (stderr) {
      console.error('Error exporting data:', stderr);
      process.exit(1);
    }
  }
  catch (error) {
    console.error('Error exporting data:', error);
    process.exit(1);
  }

  // Write file
  await execP(
    `echo "CREATE EXTENSION IF NOT EXISTS pg_trgm;\n\n${schemaOutput}\n\n" > ${options.output}`
  );
  await execP(`cat ${options.output}.data-temp >> ${options.output}`);
  await execP(`rm ${options.output}.data-temp`);

  // End
  console.log('Export completed.');
}

cli();
