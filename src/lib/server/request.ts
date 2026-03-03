/**
 * Request and caching functions.
 */

// Dependencies
import { ensureDirSync } from 'fs-extra';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { setContext } from '@sentry/node';
import { environmentVariables } from './utilities';

// Expected types
export type ExpectedFetchTypes = 'json' | 'text' | 'blob';

// Type for request options
export type RequestOptions = {
  expectedType?: ExpectedFetchTypes;
  baseUrl?: string;
  ttl?: number;
  cacheDir?: string;
  cacheMissOnNot200?: boolean;
  retries?: number;
  waitTime?: number;
};

// Request meta type
export type RequestMeta = {
  cacheHit?: boolean;
  created?: number;
  expires?: number;
  response: {
    headers: object;
    status: number;
    statusText: string;
    ok: boolean;
    url: string;
  };
};

// Request/HTTP response type
export type RequestData = string | object | Blob | null | undefined;

// Return type for request
export type RequestReturn = {
  data: RequestData;
  meta: RequestMeta;
};

// Type for fetch() resource
export type FetchResource = string | URL;

/**
 * Create a wrapper around fetch to scrape and cache data from the OMB website.
 *
 * We do this ourselves so that we can save the data to disk in a specific way
 * to zip up later and create an archive if needed.
 */
async function request(
  fetchResource: FetchResource,
  fetchOptions: RequestInit = {},
  options: RequestOptions = {}
): Promise<RequestReturn> {
  const env = environmentVariables();
  options.expectedType = options.expectedType || 'json';
  options.baseUrl = options.baseUrl || env.baseUrl;
  options.ttl = options.ttl || env.cacheTtl;
  options.cacheDir = options.cacheDir || env.collectionCacheDir;
  options.cacheMissOnNot200 = options.cacheMissOnNot200 === false ? false : true;

  // Make sure cache location exists
  ensureDirSync(options.cacheDir);

  // Make key from URL.
  // TODO: Make this a hash of the URL and options.
  let key = cacheKey(fetchResource, options.baseUrl);
  key = key || 'homepage';

  // Paths
  const cachePath = `${options.cacheDir}/${key}.data`;
  const cacheMeta = `${options.cacheDir}/${key}.meta`;

  // Check if there is a TTL (0 means don't use cache)
  if (options.ttl) {
    // Check for meta file
    const existingMeta: RequestMeta =
      existsSync(cachePath) && existsSync(cacheMeta)
        ? JSON.parse(readFileSync(cacheMeta).toString())
        : {};

    // Use cache if not expired, or if not 200 and we want to miss on that
    const expired = existingMeta.expires && existingMeta.expires < Date.now();
    const cacheIs200 =
      options.cacheMissOnNot200 && existingMeta.response && existingMeta.response.status === 200;
    if (!expired && cacheIs200) {
      const data: RequestData = readDataFromExpectedType(cachePath, options.expectedType);
      const meta: RequestMeta = {
        cacheHit: true,
        ...existingMeta
      };
      return { data, meta };
    }

    // Make fetch request
    const response = await fetchWithRetries(
      fetchResource,
      fetchOptions,
      options.retries,
      options.waitTime
    );
    const data = await response[options.expectedType]();

    // Meta
    const meta = {
      created: Date.now(),
      expires: Date.now() + options.ttl,
      response: responseForCache(response)
    };

    // Save to cache
    writeDataFromExpectedType(cachePath, data, options.expectedType);
    writeFileSync(cacheMeta, JSON.stringify(meta));

    return { data, meta: { cacheHit: false, ...meta } };
  } else {
    // Make fetch request and no save since TTL is nothing
    const response = await fetchWithRetries(
      fetchResource,
      fetchOptions,
      options.retries,
      options.waitTime
    );
    const data = await response[options.expectedType]();

    return {
      data,
      meta: {
        cacheHit: false,
        response: responseForCache(response)
      }
    };
  }
}

/**
 * Wrapper around fetch to allow for retries when not 200.
 */
async function fetchWithRetries(
  fetchResource: FetchResource,
  fetchOptions: RequestInit = {},
  retries: number = 3,
  waitTime: number = 1000
): Promise<Response> {
  // Check retries value
  if (retries < 0) {
    retries = 0;
  }
  if (retries > 0 && retries < 1) {
    retries = 1;
  }

  let response;

  // We want to fetch up to retries + 1 times, so loop through retries amount of times (as
  // there is a final attempt afterwards to fetch.
  for (let i = 1; i <= retries; i++) {
    try {
      response = await fetch(fetchResource, fetchOptions);
    } catch (error) {
      console.error(`fetchWithRetries failure [Attempt ${i}] (${error}) for "${fetchResource}"`);
    }

    if (response && response.status < 300) {
      return response;
    }

    // Wait a bit before trying again, progressively getting longer
    await new Promise((resolve) => setTimeout(resolve, waitTime * i));
  }

  try {
    // Unsure why, but Typescript seems to think response could be undefined here
    // so making sure it is not.
    return response || (await fetch(fetchResource, fetchOptions));
  } catch (error) {
    // This is a critical error for scraping, so let's make sure we get some
    // good info.
    const newError = new Error(
      `fetchWithRetries failure on final attempt [${retries + 1}] (${error}) for "${fetchResource}"`
    );

    setContext('tags', { fetch: fetchResource.toString() });
    setContext('extra', {
      fetchResource: fetchResource,
      fetchOptions: fetchOptions,
      originalError: error
    });

    throw newError;
  }
}

/**
 * Read data from file based on expected type.
 */
function readDataFromExpectedType(path: string, expectedType: ExpectedFetchTypes): RequestData {
  if (expectedType === 'json') {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } else if (expectedType === 'blob') {
    return readFileSync(path, { encoding: 'binary' });
  } else {
    return readFileSync(path, 'utf-8');
  }
}

/**
 * Write data based on expected type.
 *
 * TODO: Unsure how to handle typing here.
 */
async function writeDataFromExpectedType(
  path: string,
  data: RequestData,
  expectedType: ExpectedFetchTypes
): Promise<void> {
  if (!data) {
    writeFileSync(path, '');
  } else if (expectedType === 'json') {
    writeFileSync(path, JSON.stringify(data));
  } else if (expectedType === 'blob' && data instanceof Blob) {
    writeFileSync(path, Buffer.from(await data.arrayBuffer()));
  } else {
    // @ts-expect-error: TODO
    writeFileSync(path, data);
  }
}

/**
 * Check if URL has a 200 even if in cache.
 */
async function urlExists(url: string, options: RequestOptions = {}): Promise<boolean> {
  try {
    const response = await request(url, {}, { ...options, cacheMissOnNot200: true });
    return response.meta.response.status === 200;
  } catch (error) {
    // TODO: We probably only want to catch network errors here.
    console.error(error);
    return false;
  }
}

/**
 * URL to file cache key
 */
function cacheKey(url: FetchResource, baseUrl: string): string {
  let transformed = url.toString().replace(baseUrl, '');
  transformed = decodeURI(transformed);
  transformed = transformed
    .replace(/\//g, '---')
    .replace(/[^-a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

  return transformed;
}

/**
 * Relevant response data to save for caching
 */
function responseForCache(response: Response) {
  return {
    headers: response.headers ? Object.fromEntries(response.headers) : {},
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url
  };
}

export { request, cacheKey, urlExists, fetchWithRetries };
