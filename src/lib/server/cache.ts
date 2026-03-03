/**
 * Methods for some basic, in-memory caching for the server
 *
 * Note that we are using LRU cache because it is highly used
 * and has some
 */

// Dependencies
import { LRUCache } from 'lru-cache';
import debug from 'debug';
import { environmentVariables } from './utilities';
import { secondsToCacheInvalidation } from '$lib/utilities';

// Debugger
const debugLogger = debug('apportionments:cache');

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
  sizeCalculation: (value: unknown) => {
    let stringified;
    try {
      return Buffer.byteLength(JSON.stringify(value));
    }
    catch {
      throw new Error(`Could not stringify cache value`);
    }
  },
  allowStale: false,
  // At most check time every second
  ttlResolution: 1000
};
export const cache = new LRUCache<string, any>(cacheOptions);

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
    return secondsToCacheInvalidation() * 1000;
  }

  return 2000;
}

/**
 * Wrapper around cache get
 */
export function cacheGet<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

/**
 * Wrapper around cache set
 */
export function cacheSet<T>(key: string, value: T, options: SetCacheOptions = {}) {
  options.ttl = options.ttl || defaultTtl();
  return cache.set(key, value, options);
}

/**
 * Make cache id
 *
 * This will not create a unique id necessarily.
 */
export function cacheId(identifiers: unknown) {
  if (!identifiers || (Array.isArray(identifiers) && identifiers.length === 0)) {
    return '';
  }

  try {
    return JSON.stringify(identifiers);
  }
  catch (e: Error | unknown) {
    throw new Error(
      `Could not stringify identifiers to make cache Id: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

/**
 * Memoize an async function
 *
 * Make sure any function that is memoized
 */
export function memoizeAsync<Args extends any[], Return>(
  fn: (...args: Args) => Promise<Return> | Return,
  options: SetCacheOptions = {}
) {
  return async (...args: Args): Promise<Return> => {
    const id = `${fn.name}-${cacheId(args)}`;

    const cachedValue = cacheGet<Return>(id);
    if (cachedValue) {
      debugLogger(`Cache hit for ${id}`);
      return cachedValue;
    }
    else {
      debugLogger(`Cache miss for ${id}, options: ${JSON.stringify(options)}`);
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
export function memoizeDataAsync<Args extends any[], Return>(
  fn: (...args: Args) => Promise<Return> | Return,
  options: SetCacheOptions = {}
) {
  const ttl = defaultTtlData();
  return memoizeAsync<Args, Return>(fn, { ...options, ttl });
}

/**
 * Clear entire cache
 */
export function clearAll() {
  cache.clear();
}
