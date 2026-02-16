/**
 * Tests for cache.ts
 */

// Dependencies
import { expect, test, describe } from 'vitest';
import { cache, memoizeAsync } from './cache';

cache.ttlResolution = 100;

const awaitSleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('cache object', () => {
  test('cache object exists', () => {
    expect(!!cache).toBe(true);
  });

  test('cache size', () => {
    const testObject = { test: true };
    const testSize = Buffer.byteLength(JSON.stringify(testObject));

    cache.set('test', testObject, { ttl: 5000 });
    const info = cache.info('test');
    expect(info?.size).closeTo(testSize, 0.001);
  });
});

describe('memoizeAsync()', () => {
  test('memoizeAsync() returns a function', () => {
    expect(memoizeAsync(() => 1)).toBeInstanceOf(Function);
  });

  test('memoizeAsync() returns correct value', async () => {
    // Note that since the cache is global, function names
    // will be used across tests
    const testFn = async () => 1;
    const m = memoizeAsync(testFn);
    expect(m).toBeInstanceOf(Function);
    expect(await m()).toBe(1);
    expect(await m()).toBe(1);
    expect(await m()).toBe(1);
    expect(await m()).toBe(1);
    expect(await m()).toBe(1);
  });

  test('memoizeAsync() value should be cached', async () => {
    let externalCounter = 1;

    // Note that since the cache is global, function names
    // will be used across tests
    const testFn2 = async () => {
      externalCounter = externalCounter + 1;
      return externalCounter;
    };
    const m = memoizeAsync(testFn2);

    expect(externalCounter).toBe(1);
    expect(await m()).toBe(2);
    expect(await m()).toBe(2);
    expect(await m()).toBe(2);
    expect(await testFn2()).toBe(3);
    expect(await m()).toBe(2);
  });

  test('memoizeAsync() value should be cached with parameters', async () => {
    let externalCounter = 1;

    // Note that since the cache is global, function names
    // will be used across tests
    const testFn3 = async (parameter: number = 1) => {
      externalCounter = externalCounter + parameter;
      return externalCounter;
    };
    const m = memoizeAsync(testFn3);

    expect(externalCounter).toBe(1);
    // First call should set it to 2 and keep it there
    expect(await m()).toBe(2);
    expect(await m()).toBe(2);
    expect(await m()).toBe(2);
    // Un-memoized should add
    expect(await testFn3(2)).toBe(4);
    // Cached with no parameter should still be 2
    expect(await m()).toBe(2);
    // New cache key so should add to actual value
    expect(await m(2)).toBe(6);
    expect(await m(2)).toBe(6);
    // Cached with no parameter should still be 2
    expect(await m()).toBe(2);
    // Add 3 more
    expect(await testFn3(3)).toBe(9);
    expect(await m(3)).toBe(12);
    expect(await m(3)).toBe(12);
    expect(await m(2)).toBe(6);
    expect(await m()).toBe(2);
  });

  test('memoizeAsync() with specific ttl', async () => {
    const ttl = 100;
    let externalCounter = 1;

    // Note that since the cache is global, function names
    // will be used across tests
    const testFn4 = async () => {
      externalCounter = externalCounter + 1;
      return externalCounter;
    };
    const m = memoizeAsync(testFn4, { ttl });

    expect(externalCounter).toBe(1);
    expect(await m()).toBe(2);
    expect(await m()).toBe(2);
    expect(await m()).toBe(2);

    await awaitSleep(10);
    expect(await m()).toBe(2);
    expect(await m()).toBe(2);

    // Resolution matters, we set it manually for testing
    await awaitSleep(200);
    expect(await m()).toBe(3);
    expect(await m()).toBe(3);
  });
});
