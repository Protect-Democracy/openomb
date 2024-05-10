/**
 * Server hooks
 */
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { isProduction, dateForCacheInvalidation } from '$lib/utilities';
import { cacheRevalidateSeconds, securityHeaders } from '$config';
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

/**
 * Hook to add universal headers to requests
 *
 * Our layout load function has the potential to trigger more than once,
 *  especially when errors are thrown on our client pages.  This ensures we
 *  are only adding our headers once per server request.
 */
const addHeaders: Handle = async ({ event, resolve }) => {
  // Common headers.
  //
  // Note: These only apply to code routes and not assets or static files.
  // It does look like the default headers for assets are reasonable
  // and they use hashes.  On the other hand, static files don't look to
  // have any cache headers which is not great, so it makes sense to
  // host as much in src/ as possible as opposed to static/.
  //
  // Note: These specific headers cannot be set again otherwise an error
  // will be thrown.
  //
  // Note: CSP headers are configured in `svelte.config.js`
  event.setHeaders({
    // Cache headers.  Given that we know that we will be running the data collection
    // process daily at a certain time, we can use Expires header.  Make sure not to set
    // the max-age in Cache-Control as that will override Expires.
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires
    'Cache-Control': `public, stale-while-revalidate=${isProduction() ? cacheRevalidateSeconds : 10}`,
    Expires: dateForCacheInvalidation().toUTCString(),

    // Security headers
    ...securityHeaders
  });
  return await resolve(event);
};

// Add our handlers to each request
export const handle = sequence(Sentry.sentryHandle(), addHeaders);
