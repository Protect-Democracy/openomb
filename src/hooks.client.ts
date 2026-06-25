import * as Sentry from '@sentry/sveltekit';
import type { HandleClientError } from '@sveltejs/kit';
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

const CHUNK_RELOAD_KEY = 'chunk_reload_attempted';

// When old cached HTML references chunk hashes that no longer exist after a
// new deployment, reload once to fetch fresh HTML. sessionStorage prevents
// a loop: if the error persists after the reload, fall through to Sentry.
const chunkErrorRecovery: HandleClientError = ({ error }) => {
  const message = error instanceof Error ? error.message : String(error);
  const isChunkError =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Importing a module script failed');

  if (isChunkError && typeof sessionStorage !== 'undefined') {
    if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      window.location.reload();
      return;
    }
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  }
};

export const handleError = Sentry.handleErrorWithSentry(chunkErrorRecovery);
