/**
 * DB connection stuff.
 *
 * Unsure why this is necessary given the config file, but Drizzle's
 * docs don't really go into it.  This is utilizing the migrations
 * docs from here:
 * https://orm.drizzle.team/docs/migrations
 */

// Dependencies
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { environmentVariables } from '../server/utilities';
// Schemas
import * as files from './schema/files';
import * as footnotes from './schema/footnotes';
import * as lines from './schema/lines';
import * as tafs from './schema/tafs';

// Constants
const env = environmentVariables();

// Path to migrations
const _dirname = dirname(fileURLToPath(import.meta.url));
export const migrationsDir = joinPath(_dirname, 'migrations');

// Client
export const pool = new pg.Pool({
  connectionString: env.dbUri
});
export let poolConnected = false;
export let poolClient: pg.PoolClient;

// Drizzle connection
export const db = drizzle(pool, {
  schema: {
    ...files,
    ...footnotes,
    ...lines,
    ...tafs
  }
});

export async function dbConnect() {
  // TODO: The idea was that we could make it explicit to connect
  // which might be useful for testing, but unsure if this is
  // actually the case.
  //
  // TODO: This seems to cause issues with hot-reloading and the
  // dev server.  A restart of the dev server should fix this,
  // but this is less that ideal.
  if (!poolConnected) {
    poolClient = await pool.connect();
    poolConnected = true;
  }

  return poolClient;
}
