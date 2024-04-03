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
export const client = new pg.Client({
  connectionString: env.dbUri
});
let clientConnected = false;

// Drizzle connection
export const db = drizzle(client, {
  schema: {
    ...files,
    ...footnotes,
    ...lines,
    ...tafs,
  },
});

export async function dbConnect() {
  // TODO: This seems to cause issues with hot-reloading and the
  // dev server.  A restart of the dev server should fix this,
  // but this is less that ideal.
  if (!clientConnected) {
    await client.connect();
    clientConnected = true;
  }
}
