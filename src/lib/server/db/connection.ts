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
import { startSpan, captureException } from '@sentry/node';
import pg from 'pg';
import debug from 'debug';
import { environmentVariables } from '../../../../server/utilities';
// Schemas
import * as files from './schema/files';
import * as footnotes from './schema/footnotes';
import * as lines from './schema/lines';
import * as tafs from './schema/tafs';
import * as collections from './schema/collections';
import * as users from './schema/users';
import * as subscriptions from './schema/subscriptions';
import * as searches from './schema/searches';
import * as lineTypes from './schema/line-types';
import * as lineDescriptions from './schema/line-descriptions';

// Debugger
const debugLogger = debug('apportionments:db');

// Path to migrations
const _dirname = dirname(fileURLToPath(import.meta.url));
export const migrationsDir = joinPath(_dirname, 'migrations');

// Track pool connection
let pool: pg.Pool | undefined;

// Shared object for connection
export let db = dbConnection();

/**
 * Make connection string based on environment variables.
 *
 */
export function dbConnection() {
  const connectionString = dbConnectionString();

  // Given that we provide the db object as a module export, this ends up being hard to handle
  // for testing.  So, if the connection string is empty, then just return and if for some
  // reason we are in the actual application, another error will be thrown down the line.
  //
  // TODO: This sucks, find a better way.
  if (process.env.NODE_ENV === 'test' && connectionString === 'postgresql:///') {
    return null;
  }

  // Reuse pool if already created.
  if (!pool) {
    pool = new pg.Pool({
      connectionString: connectionString
    });

    // Error listener
    pool.on('error', (err) => {
      // CODE 57P01: Admin Shutdown / Terminate Connection
      // If this happens during tests, it's usually just the teardown cleanup
      // killing a connection that was already closing. We can safely ignore it.
      //
      // TODO: This seems hacky, but also tried many ways to handle this with
      // testing and wasn't able to find a better way.
      if (process.env.NODE_ENV === 'test' && (err as any).code === '57P01') {
        return;
      }

      console.error('Unexpected Postgres Pool Error:', err);
      captureException(err);
    });
  }

  // Drizzle connection
  // NOTE: Debug with { schema: ..., logger: true }
  const db = drizzle(pool, {
    schema: {
      ...files,
      ...footnotes,
      ...lines,
      ...tafs,
      ...collections,
      ...users,
      ...subscriptions,
      ...searches,
      ...lineTypes,
      ...lineDescriptions
    }
  });
  debugLogger('Connected to database');

  return db;
}

/**
 * Reset the connection, mostly for testing purposes to ensure we pick up new environment variables.
 */
export async function resetDbConnection() {
  await closeDbConnection();
  db = dbConnection();
  return db;
}

/**
 * Explicitly close the pool connection.
 */
export async function closeDbConnection() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export function dbConnectionString() {
  const env = environmentVariables();

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

/**
 * This allows us to tap into drizzle's tracer
 *  implementation and track our own queries.
 *
 * @todo - We can hopefully remove this if opentelemetry fixes
 *  their own pgsql implementation
 */
export function overrideDrizzleTracer() {
  const env = environmentVariables();

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
