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
export const db = drizzle(client);

export async function dbConnect() {
  if (!clientConnected) {
    await client.connect();
    clientConnected = true;
  }
}
