/**
 * Sentry integration for node task scripts
 */

// Dependencies
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { MonitorConfig } from '@sentry/types';
import { environmentVariables } from '../server/utilities';

// Environment variables
const env = environmentVariables();

/**
 * Setup Node Sentry integration.
 */
function setupTaskSentry() {
  if (!env.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.environment,

    integrations: [
      nodeProfilingIntegration(),
      Sentry.postgresIntegration(),
      ...Sentry.getAutoPerformanceIntegrations()
    ]
  });
}

/**
 * Wrapper to run our node tasks with sentry monitoring
 */
async function runMonitoredTask(name: string, task: () => Promise<void>) {
  return Sentry.startSpan({ name, op: 'function' }, async () => {
    return await task();
  });
}

/**
 * Wrapper to run our node cron tasks with sentry monitoring
 *  If no schedule config is provided, we run it as a singular task
 * @todo - We can use this function to set up our cron job monitoring in here if we wish!
 *      https://docs.sentry.io/platforms/javascript/guides/node/crons/#upserting-cron-monitors
 *        (otherwise we can remove & use AWS monitoring)
 */
function runMonitoredCron(
  name: string,
  task: () => Promise<void>,
  config: MonitorConfig | undefined = undefined
) {
  if (config) {
    return Sentry.withMonitor(
      name,
      async () => {
        await task();
      },
      config
    );
  }
  return runMonitoredTask(name, task);
}

export { setupTaskSentry, runMonitoredTask, runMonitoredCron };
