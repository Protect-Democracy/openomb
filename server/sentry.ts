/**
 * Sentry integration
 */

// Dependencies
import * as Sentry from '@sentry/node';
import { environmentVariables } from './utilities';

// Environment variables
const env = environmentVariables();

/**
 * Setup Node Sentry integration.
 */
function setupNodeSentry() {
  if (!env.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.environment

    // TODO: Do we want to do some performance monitoring here?
    // https://docs.sentry.io/platforms/node/
  });
}

export { setupNodeSentry };
