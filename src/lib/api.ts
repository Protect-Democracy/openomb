// Dependencies
import { json } from '@sveltejs/kit';
import { secondsToZonedTime, isProduction } from '$lib/utilities.js';
import { cacheHeadersHour, cacheHeadersMinute, securityHeaders, collectionTimezone } from '$config';

/**
 * Common response handler for JSON endpoints
 */
export const apiResponse = function (
  data: unknown,
  status: number = 200,
  headers: { [key: string]: string } = {}
) {
  const secondsForCache = secondsToZonedTime(
    cacheHeadersHour,
    cacheHeadersMinute,
    collectionTimezone
  );
  const revalidateSeconds = 60 * 60;

  return json(data, {
    status,
    headers: {
      'Cache-Control': `public, max-age=${isProduction() ? secondsForCache : 1}, stale-while-revalidate=${revalidateSeconds}`,
      ...securityHeaders,
      ...headers
    }
  });
};
