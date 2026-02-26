import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';

/**
 * Run DB migrations.
 *
 * @see: https://orm.drizzle.team/docs/migrations
 */

// Dependencies
import { dirname, join as joinPath } from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { schemas } from '$db/connection';
import packageJson from '../package.json' with { type: 'json' };
import journal from '$db/migrations/meta/_journal.json';

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
  console.log('Generating migrations...');

  // Path to migrations (needed here for how build works)
  const _dirname = dirname(fileURLToPath(import.meta.url));
  const migrationsDir = joinPath(_dirname, '..', 'src', 'lib', 'server', 'db', 'migrations');

  const lastEntry = journal.entries[journal.entries.length - 1];
  const lastEntryIndex = `${lastEntry.idx}`.padStart(4, '0');
  const prevSnapshot = await import(`${migrationsDir}/meta/${lastEntryIndex}_snapshot.json`);
  const curr = generateDrizzleJson(schemas, prevSnapshot.id);

  const migrationStatements = await generateMigration(prevSnapshot, curr);
  if (!migrationStatements.length) {
    // We have no new sql statements to run
    console.info('Schema is up to date, no new migration needed');
    return;
  }

  // Otherwise write new migration files
  const nextIndex = `${lastEntry.idx + 1}`.padStart(4, '0');
  const nextTag = `${nextIndex}_migration_statements`;
  const newJournal = {
    ...journal,
    entries: [
      ...journal.entries,
      {
        idx: lastEntry.idx + 1,
        version: `${curr.version}`,
        when: Date.now(),
        tag: nextTag,
        breakpoints: true
      }
    ]
  };

  await Promise.all([
    fs.writeFile(`${migrationsDir}/meta/${nextIndex}_snapshot.json`, JSON.stringify(curr, null, 2)),
    fs.writeFile(`${migrationsDir}/meta/_journal.json`, JSON.stringify(newJournal, null, 2)),
    fs.writeFile(`${migrationsDir}/${nextTag}.sql`, migrationStatements.join('\n'))
  ]);

  console.info(`Migration files written for ${nextTag}`);
}

cli();
