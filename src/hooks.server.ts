/**
 * Server hooks
 */

// Dependencies
import * as Sentry from '@sentry/sveltekit';
import { environmentVariables } from '../server/utilities';

// Environment variables
const env = environmentVariables();

// Only setup if there is the APPORTIONMENTS_SENTRY_DSN provided
if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.environment
  });
}

export const handleError = Sentry.handleErrorWithSentry();
export const handle = Sentry.sentryHandle();
