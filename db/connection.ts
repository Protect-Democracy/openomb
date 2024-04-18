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

// Client.
export const pool = new pg.Pool({
  connectionString: dbConnectionString()
});
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
  if (!poolClient) {
    poolClient = await pool.connect();
  }

  return poolClient;
}

export async function dbDisconnect() {
  if (poolClient) {
    poolClient.release();
    poolClient.end();
    poolClient = undefined;
  }
}

function dbConnectionString() {
  // If Uri is provided, use that
  if (env.dbUri) {
    return env.dbUri;
  }

  // Try to create authentication string using the _AUTHENTICATION
  // value first if available.
  let possibleDbAuth = '';
  if (env.dbAuth && env.dbAuth.username) {
    possibleDbAuth = `${env.dbAuth.username}:${env.dbAuth.password}@`;
  }
  else if (env.dbUser) {
    possibleDbAuth = `${env.dbUser}:${env.dbPassword}@`;
  }

  // Try to create host and port
  let hostPort = env.dbHost;
  if (env.dbHost && env.dbPort) {
    hostPort = `${env.dbHost}:${env.dbPort}`;
  }

  return `postgresql://${possibleDbAuth}${hostPort}/${env.dbName}`;
}
