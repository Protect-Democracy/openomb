/**
 * Methods for handling URLs
 */

import { memoizeDataAsync } from './cache';

/**
 * Check if a URL is reachable.
 *
 * @param url URL ro check
 */
export async function urlIsReachable(url: string, timeout: number = 4000) {
  if (!url) {
    return false;
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(timeout)
    });
    return response?.status === 200;
  }
  catch (error) {
    return false;
  }
}

// Cached version
export const mUrlIsReachable = memoizeDataAsync(urlIsReachable);
