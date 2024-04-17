import { secondsToZonedTime, isProduction } from '$lib/utilities.js';
import { cacheHeadersHour, cacheHeadersMinute, securityHeaders, collectionTimezone } from '$config';

/** @type {import('./$types').PageLoad} */
export async function load({ setHeaders }) {
  const secondsForCache = secondsToZonedTime(
    cacheHeadersHour,
    cacheHeadersMinute,
    collectionTimezone
  );
  const revalidateSeconds = 60 * 60;

  // Common headers.
  //
  // Note: These only apply to code routes and not assets or static files.
  // Though it does look like the default headers for assets are reasonable
  // and they use hashes.  On the other hand, static files don't look to
  // have any cache headers which is not great.
  //
  // Note: These specific headers cannot be set again otherwise an error
  // will be thrown.
  //
  // Note: CSP headers are configured in `svelte.config.js`
  setHeaders({
    // Cache headers
    'Cache-Control': `public, max-age=${isProduction() ? secondsForCache : 1}, stale-while-revalidate=${revalidateSeconds}`,

    ...securityHeaders
  });
}
