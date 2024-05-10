// Dependencies
import { json } from '@sveltejs/kit';
import { secondsToCacheInvalidation } from './cache';
import { isProduction } from './utilities';
import { securityHeaders, cacheRevalidateSeconds } from '$config';

/**
 * Common response handler for JSON endpoints
 */
export const apiResponse = function (
  data: unknown,
  status: number = 200,
  headers: { [key: string]: string } = {}
) {
  const secondsForCache = secondsToCacheInvalidation();

  return json(data, {
    status,
    headers: {
      'Cache-Control': `public, max-age=${isProduction() ? secondsForCache : 1}, stale-while-revalidate=${isProduction() ? cacheRevalidateSeconds : 10}`,
      ...securityHeaders,
      ...headers
    }
  });
};
