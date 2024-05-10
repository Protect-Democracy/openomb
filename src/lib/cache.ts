/**
 * Caching utilities
 */

/**
 * Determine seconds to cache data invalidation
 *
 * The assumption is that data is collected daily, so we want to
 * invalidate the cache a couple hours after the collection.
 */
export function secondsToCacheInvalidation() {
  // Cloudfront reads the cache headers and caches it in the CDN according
  // to those headers.  That is what we want.  But, Cloudfront also sends along
  // those headers to the client.  If the client was hitting the server directly
  // it would get the dynamic cache, but Cloudfront only serves what it last saw.
  //
  // So, for now, we just set to an hour.
  //
  // What we want is:
  //
  // import { secondsToZonedTime } from '$lib/utilities.js';
  // import { collectionMinute, collectionHour, collectionTimezone } from '$config';
  // return secondsToZonedTime(collectionHour + 2, collectionMinute, collectionTimezone);
  return 60 * 60;
}
