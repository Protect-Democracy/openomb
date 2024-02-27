/**
 * Request and caching functions.
 */

// Dependencies
import { ensureDirSync } from 'fs-extra';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { environment_variables } from './utilities';

// Type for request options
export type RequestOptions = {
  expectedType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
  baseUrl?: string;
  ttl?: number;
  cacheDir?: string;
  cacheMissOnNot200?: boolean;
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
export type RequestData = string | object | Buffer | ArrayBuffer | JSON | null | undefined;

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
  const env = environment_variables();
  options.expectedType = options.expectedType || 'json';
  options.baseUrl = options.baseUrl || env.baseUrl;
  options.ttl = options.ttl || env.cacheTtl;
  options.cacheDir = options.cacheDir || env.cacheDir;
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
      const data: RequestData =
        options.expectedType === 'json'
          ? JSON.parse(readFileSync(cachePath).toString())
          : readFileSync(cachePath, 'utf8');
      const meta: RequestMeta = {
        cacheHit: true,
        ...existingMeta
      };
      return { data, meta };
    }

    // Make fetch request
    const response = await fetch(fetchResource, fetchOptions);
    const data = await response[options.expectedType]();

    // Meta
    const meta = {
      created: Date.now(),
      expires: Date.now() + options.ttl,
      response: responseForCache(response)
    };

    // Save to cache
    writeFileSync(cachePath, options.expectedType === 'json' ? JSON.stringify(data) : data);
    writeFileSync(cacheMeta, JSON.stringify(meta));

    return { data, meta: { cacheHit: false, ...meta } };
  }
  else {
    // Make fetch request and no save since TTL is nothing
    const response = await fetch(fetchResource, fetchOptions);
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

export { request, cacheKey };
