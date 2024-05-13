/**
 * Custom sentry integration
 * This is required for our task scripts since Sentry only has an integration for cron scheduled tasks
 *    @todo - if we switch to a scheduled cron this can potentially be revisted
 */

// Dependencies
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { MonitorConfig, StartSpanOptions } from '@sentry/types';
import { environmentVariables } from './utilities';
import { Query } from 'drizzle-orm';

// Environment variables
const env = environmentVariables();

/**
 * Setup Node Sentry integration.
 */
export function setupCustomSentry() {
  if (!env.sentryNodeDsn) {
    return;
  }

  Sentry.init({
    dsn: env.sentryNodeDsn,
    environment: env.environment,
    profilesSampleRate: 1,
    tracesSampleRate: 1,
    integrations: [nodeProfilingIntegration()]
  });
}

export type Span = Sentry.Span;
export type ObservedFunction<T> = (span: Span) => T;
type SpanOptions = StartSpanOptions | string;

function getSpanOptions(opts: SpanOptions): StartSpanOptions {
  if (typeof opts == 'string') {
    return { name: opts };
  }
  return opts;
}

/**
 * Manual implementation wrapper to create a new (isolated) sentry context
 */
export async function createTransaction<T>(opts: SpanOptions, observe: ObservedFunction<T>) {
  return Sentry.withIsolationScope(async (scope) => {
    return await Sentry.startSpan(
      {
        op: 'function',
        ...getSpanOptions(opts),
        forceTransaction: true,
        scope
      },
      (span) => observe(span)
    );
  });
}

/**
 * Manual implementation wrapper to run cron tasks with sentry
 * https://docs.sentry.io/platforms/javascript/guides/node/crons/#upserting-cron-monitors
 */
export async function createCron<T>(
  opts: SpanOptions,
  observe: () => Promise<T>,
  config: MonitorConfig
) {
  const spanOptions = getSpanOptions(opts);
  return Sentry.withMonitor(spanOptions.name, async () => await observe(), config);
}

/**
 * Manual implementation wrapper to create a span
 *  This span will automatically become a child of the current active parent
 *  To create an isolated span, use `createTransaction`
 */
export async function createSpan<T>(opts: SpanOptions, observe: ObservedFunction<T>) {
  return Sentry.withActiveSpan(Sentry.getActiveSpan() || null, async () => {
    return await Sentry.startSpan(
      {
        op: 'function',
        ...getSpanOptions(opts)
      },
      (span) => observe(span)
    );
  });
}

/**
 * Manual implementation wrapper to create a postgres query span
 *  https://docs.sentry.io/product/performance/queries/#span-eligibility
 *  This span will automatically become a child of the current active parent
 */
interface DrizzleQuery<T> extends Promise<T> {
  toSQL: () => Query;
}
export async function createQuerySpan<T>(query: DrizzleQuery<T>) {
  return Sentry.withActiveSpan(Sentry.getActiveSpan() || null, async () => {
    return await Sentry.startSpan(
      {
        name: query.toSQL().sql,
        op: 'db.query',
        attributes: {
          'db.system': 'postgresql',
          'server.address': env.dbHost,
          'db.name': env.dbName,
          'server.port': env.dbPort
        }
      },
      () => query
    );
  });
}
