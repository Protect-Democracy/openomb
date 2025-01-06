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
import { tracer } from 'drizzle-orm/tracing';
import { startSpan } from '@sentry/node';
import pg from 'pg';
import { environmentVariables } from '../server/utilities';
// Schemas
import * as files from './schema/files';
import * as footnotes from './schema/footnotes';
import * as lines from './schema/lines';
import * as tafs from './schema/tafs';
import * as collections from './schema/collections';
import * as users from './schema/users';
import * as subscriptions from './schema/subscriptions';
import * as searches from './schema/searches';

// Constants
const env = environmentVariables();

// Path to migrations
const _dirname = dirname(fileURLToPath(import.meta.url));
export const migrationsDir = joinPath(_dirname, 'migrations');

// Client.
const pool = new pg.Pool({
  connectionString: dbConnectionString()
});

// Drizzle connection
// NOTE: Debug with { schema: ..., logger: true }
export const db = drizzle(pool, {
  schema: {
    ...files,
    ...footnotes,
    ...lines,
    ...tafs,
    ...collections,
    ...users,
    ...subscriptions,
    ...searches,
  }
});
console.info('Database connected');

/**
 * This allows us to tap into drizzle's tracer
 *  implementation and track our own queries.
 *
 * @todo - We can hopefully remove this if opentelemetry fixes
 *  their own pgsql implementation
 */
export function overrideDrizzleTracer() {
  let query;
  tracer.startActiveSpan = (name, fn) => {
    // Drizzle prepares queries, then executes them.
    //    We need to get the SQL from the prepared query
    if (name == 'drizzle.prepareQuery') {
      const prepared = fn();
      query = prepared.query.sql;
      return prepared;
    }

    // When we execute, we will use the sql to name our span tracking
    //   the actual query performance
    if (name == 'drizzle.execute') {
      return startSpan(
        {
          name: query || name,
          op: 'db.sql.execute',
          attributes: {
            'db.system': 'postgresql',
            'db.namespace': env.dbName,
            'server.port': env.dbPort,
            'server.address': env.dbHost
          }
        },
        async (span) => await fn(span)
      );
    }

    // Other events don't need tracked right now
    return fn();
  };
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
