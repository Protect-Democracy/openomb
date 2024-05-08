import * as Sentry from '@sentry/sveltekit';
import { isProduction } from '$lib/utilities';

// Only setup Sentry if VITE_SENTRY_DSN is defined
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: isProduction() ? 'production' : 'development',
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    profilesSampleRate: 1,
    integrations: [
      Sentry.replayIntegration(),
      Sentry.browserProfilingIntegration(),
      Sentry.browserTracingIntegration()
    ]
  });
}

export const handleError = Sentry.handleErrorWithSentry();
