/**
 * Sentry initialization needs to come before anything else
 * https://docs.sentry.io/platforms/javascript/guides/sveltekit/migration/v7-to-v8/#updated-sdk-initialization
 */
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as Sentry from '@sentry/sveltekit';
import env from '$lib/environment';

// Only setup if there is a Sentry DSN provided
if (env.sentrySvelteDsn) {
  Sentry.init({
    dsn: env.sentrySvelteDsn,
    environment: env.environment,
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.2,
    integrations: [nodeProfilingIntegration()]
  });
}

/**
 * Now we can set up our server hooks
 */
// Dependencies
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { dateForCacheInvalidation } from '$lib/utilities';
import { cacheRevalidateSeconds, securityHeaders } from '$config';
import { overrideDrizzleTracer } from '$db/connection';

// Is production
export const isProduction = (): boolean => env.environment == 'production' || import.meta.env.PROD;

// Override our drizzle tracing so that we see queries
overrideDrizzleTracer();

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

    // Sentry profiling header
    // https://docs.sentry.io/platforms/javascript/guides/sveltekit/profiling/#step-2-add-document-policy-js-profiling-header
    'Document-Policy': 'js-profiling',

    // Security headers
    ...securityHeaders
  });
  return await resolve(event);
};

// Sentry handle
// With our current version of svelte, we shouldn't need the fetch proxy script
//   - https://github.com/getsentry/sentry-javascript/pull/9969
const sentryHandle = Sentry.sentryHandle({ injectFetchProxyScript: false });

// Add our handlers to each request
export const handle = sequence(sentryHandle, addHeaders);
