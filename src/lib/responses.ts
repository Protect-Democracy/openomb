import { json } from '@sveltejs/kit';

import { secondsToZonedTime, isProduction } from '$lib/utilities.js';
import { cacheHeadersHour, cacheHeadersMinute, collectionTimezone } from '$config';

/**
 * Wrap around SvelteKit's json to set cache headers
 */
export const cachedJson = (data: any, options: { headers?: Record<string, string> } = {}) => {
  const secondsForCache = secondsToZonedTime(
    cacheHeadersHour,
    cacheHeadersMinute,
    collectionTimezone
  );
  const revalidateSeconds = 60 * 60;

  const headers = {
    'Cache-Control': `public, max-age=${isProduction() ? secondsForCache : 1}, stale-while-revalidate=${revalidateSeconds}`,
    ...options.headers
  };

  return json(data, {
    headers
  });
};
