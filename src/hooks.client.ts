import * as Sentry from '@sentry/sveltekit';
import env from '$lib/environment';

// Only setup if there is a Sentry DSN provided
if (env.sentrySvelteDsn) {
  Sentry.init({
    dsn: env.sentrySvelteDsn,
    environment: env.environment,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    profilesSampleRate: 0.2,
    integrations: [Sentry.replayIntegration(), Sentry.browserProfilingIntegration()]
  });
}

export const handleError = Sentry.handleErrorWithSentry();
