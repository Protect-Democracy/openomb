/**
 * Methods for some basic, in-memory caching
 *
 * Note that we are using LRU cache because it is highly used
 * and has some
 */

// Dependencies
import { LRUCache } from 'lru-cache';
import { environmentVariables } from './utilities';
import { secondsToZonedTime } from '../src/lib/utilities';
import { cacheHeadersHour, cacheHeadersMinute, collectionTimezone } from '../src/config';

// Types
type JSONStringifyable =
  | string
  | number
  | { [key: string]: JSONStringifyable[] }
  | JSONStringifyable[];

type SetCacheOptions = {
  ttl?: number;
};

// Env
const env = environmentVariables();

// Defaults for caching
const cacheOptions = {
  // Just in case
  max: 1000000,
  // 200MB
  maxSize: 1000000 * 200,
  // Convert items to bytes
  sizeCalculation: (value: JSONStringifyable) => {
    let stringified;
    try {
      stringified = JSON.stringify(value);
    }
    catch {
      throw new Error(`Could not stringify cache value`);
    }

    return Buffer.byteLength(stringified);
  },
  allowStale: false,
  // At most check time every second
  ttlResolution: 1000
};
export const cache = new LRUCache(cacheOptions);

/**
 * Default TTL for anything
 */
export function defaultTtl() {
  return env.environment === 'production' ? 1000 * 60 * 60 * 1 : 2000;
}

/**
 * Default TTL for data which gets updated daily
 */
export function defaultTtlData() {
  if (env.environment === 'production') {
    return secondsToZonedTime(cacheHeadersHour, cacheHeadersMinute, collectionTimezone);
  }

  return 2000;
}

/**
 * Wrapper around cache get
 */
export function cacheGet(key: string) {
  return cache.get(key);
}

/**
 * Wrapper around cache set
 */
export function cacheSet(key: string, value: JSONStringifyable, options: SetCacheOptions = {}) {
  options.ttl = options.ttl || defaultTtl();
  return cache.set(key, value, options);
}

/**
 * Make cache id
 *
 * This will not create a unique id necessarily.
 */
export function cacheId(identifiers: JSONStringifyable | [] | null | undefined) {
  if (!identifiers || (Array.isArray(identifiers) && identifiers.length === 0)) {
    return '';
  }

  try {
    return JSON.stringify(identifiers);
  }
  catch (e) {
    throw new Error(`Could not stringify identifiers to make cache Id: ${e.message}`);
  }
}

/**
 * Memoize an async function
 *
 * Make sure any function that is memoized
 */
/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
export function memoizeAsync(fn: (...args: any[]) => any, options: SetCacheOptions = {}) {
  /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
  return async (...args: any[]) => {
    const id = `${fn.name}-${cacheId(args)}`;

    const value = cacheGet(id);
    if (value) {
      return cacheGet(id);
    }
    else {
      const result = await fn(...args);
      cacheSet(id, result, options);
      return result;
    }
  };
}

/**
 * Memoize data function such as a query
 *
 * Defaults TTL to our daily time.
 */
/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
export function memoizeDataAsync(fn: (...args: any[]) => any, options: SetCacheOptions = {}) {
  const ttl = defaultTtlData();
  return memoizeAsync(fn, { ...options, ttl });
}

/**
 * Clear entire cache
 */
export function clearAll() {
  cache.clear();
}
