import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Server hooks
 */

// Dependencies
import * as Sentry from '@sentry/sveltekit';
import { environmentVariables } from '../server/utilities';

// Environment variables
const env = environmentVariables();

// Only setup if there is the VITE_SENTRY_DSN provided
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: env.environment,
    tracesSampleRate: 1,
    profilesSampleRate: 1,
    integrations: [nodeProfilingIntegration()]
  });
}

export const handleError = Sentry.handleErrorWithSentry();
export const handle = Sentry.sentryHandle();
