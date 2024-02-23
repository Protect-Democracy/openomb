// Dependencies
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';import { assert, expect, test, beforeEach, afterEach, vi } from 'vitest'
import { removeSync, ensureDirSync } from 'fs-extra/esm';

// To test
import { scraper, cacheKey } from './index.js'

// Cache place; TODO, make sure this happens without requiring
// test to pass.
const __dirname = dirname(fileURLToPath(import.meta.url));
const testCacheDir = join(__dirname, '.cache-test');

// Make fetch mockable; TODO: move to a helper or setup
global.fetch = vi.fn();
function mockFetch(data, response) {
  response = response || { ok: true, status: 200, statusText: 'OK'};
  const dataType = typeof data === 'string' ? 'text' : 'json';

  return Promise.resolve({
    ...response,
    [dataType]: () => Promise.resolve(data)
  });
}

// Clear cache before/after each
beforeEach(() => {
  removeSync(testCacheDir);
  ensureDirSync(testCacheDir);
});
afterEach(() => {
  removeSync(testCacheDir);
});


test('fetch() mocking', async () => {
  const url = 'https://example.com';

  // JSON
  const jsonData = { test: true };
  fetch.mockResolvedValue(mockFetch(jsonData));

  const response = await fetch(url);
  const responseData = await response.json();

  expect(fetch).toHaveBeenCalledWith(url);
  expect(responseData).toEqual(jsonData);

  // Text
  const textData = "test";
  fetch.mockResolvedValue(mockFetch(textData));

  const textResponse = await fetch(url);
  const textResponseData = await textResponse.text();

  expect(fetch).toHaveBeenCalledWith(url);
  expect(textResponseData).toEqual(textData);
});

test('scraper() basic fetch', async () => {
  const url = 'https://apportionment-public.max.gov/';
  const data = "test";
  fetch.mockResolvedValue(mockFetch(data));

  const scrape = await scraper(url, { cacheDir: testCacheDir, expectedType: 'text' });

  expect(fetch).toHaveBeenCalledWith(url);
  expect(scrape.data).toEqual(data);
  expect(scrape.meta.cacheHit).toEqual(false);
  expect(scrape.meta.response.ok).toEqual(true);
  expect(scrape.meta.response.status).toEqual(200);
});

test('scraper() use cache', async () => {
  const url = 'https://apportionment-public.max.gov/';
  const data = "test";
  fetch.mockResolvedValue(mockFetch(data));

  // Create cache with specific contents
  const cacheContents = "cached test";
  const cacheMetaContents = JSON.stringify({
    created: Date.now(),
    expires: Date.now() + 1000 * 60 * 60 * 24,
    response: {
      ok: true,
      status: 200,
    }
  });
  const cachePath = `${testCacheDir}/homepage.data`;
  const cacheMeta = `${testCacheDir}/homepage.meta`;
  writeFileSync(cachePath, cacheContents);
  writeFileSync(cacheMeta, cacheMetaContents);

  // Make call
  const scrape = await scraper(url, {
    expectedType: 'text',
    cacheDir: testCacheDir,
    ttl: 1000 * 60 * 60 * 24
  });

  expect(fetch).toHaveBeenCalledWith(url);
  expect(scrape.data).toEqual(cacheContents);
  expect(scrape.meta.cacheHit).toEqual(true);
  expect(scrape.meta.response.ok).toEqual(true);
  expect(scrape.meta.response.status).toEqual(200);
});

test('scraper() expired cache', async () => {
  const url = 'https://apportionment-public.max.gov/';
  const data = "test";
  fetch.mockResolvedValue(mockFetch(data));

  // Create cache with specific contents
  const cacheContents = "cached test";
  const cacheMetaContents = JSON.stringify({
    created: Date.now() - 1000 * 60 * 60 * 24,
    expires: Date.now() - 1000,
    response: {
      ok: true,
      status: 200,
    }
  });
  const cachePath = `${testCacheDir}/homepage.data`;
  const cacheMeta = `${testCacheDir}/homepage.meta`;
  writeFileSync(cachePath, cacheContents);
  writeFileSync(cacheMeta, cacheMetaContents);

  // Make call
  const scrape = await scraper(url, {
    expectedType: 'text',
    cacheDir: testCacheDir,
    ttl: 1000
  });

  expect(fetch).toHaveBeenCalledWith(url);
  expect(scrape.data).toEqual(data);
  expect(scrape.meta.cacheHit).toEqual(false);
  expect(scrape.meta.response.ok).toEqual(true);
});


test('cacheKey()', () => {
  // Basics
  expect(cacheKey('https://example.com', 'https://example.com')).toEqual('');
  expect(cacheKey('https://example.com/', 'https://example.com')).toEqual('---');
  expect(cacheKey('https://example.com/test', 'https://example.com/')).toEqual('test');
  expect(cacheKey('https://example.com/test and other     things', 'https://example.com/')).toEqual('test_and_other_things');
});
