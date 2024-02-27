/**
 * Tests for utilities.js.
 */

// Dependencies
import { expect, test } from 'vitest';
import { unique, parseIntegerFromString, parseTimestampFromString } from './utilities';

test('unique()', () => {
  // Basics
  expect(unique()).toEqual([]);
  expect(unique([1, 1, 1, 1, 1, 1])).toEqual([1]);
  expect(unique(['a', 2, 1.0, true, true, false, 2])).toEqual(['a', 2, 1.0, true, false]);
});

test('parseIntegerFromString()', () => {
  // Basics
  expect(parseIntegerFromString('')).toEqual(null);
  expect(parseIntegerFromString('abc')).toEqual(null);
  expect(parseIntegerFromString('0')).toEqual(0);
  expect(parseIntegerFromString('1')).toEqual(1);
  expect(parseIntegerFromString('123')).toEqual(123);
  expect(parseIntegerFromString('123.456')).toEqual(123);
  expect(parseIntegerFromString('123,456')).toEqual(123456);
  expect(parseIntegerFromString('$123,456')).toEqual(123456);
});

test('parseTimestampFromString()', () => {
  // Basics
  expect(parseTimestampFromString('')).toEqual(null);
  expect(parseTimestampFromString('abc')).toEqual(null);
  expect(parseTimestampFromString('2024-01-01-00.01.01.001')).toEqual(
    new Date(Date.UTC(2024, 0, 1, 0, 1, 1, 1))
  );
  expect(parseTimestampFromString('2024-01-01-00.01.01.001', false)).toEqual(
    new Date(2024, 0, 1, 0, 1, 1, 1)
  );
  expect(parseTimestampFromString('33-38', false)).toEqual(null);
});
