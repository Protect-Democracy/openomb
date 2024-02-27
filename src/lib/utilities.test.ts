/**
 * Tests for utilities.js.
 */

// Dependencies
import { expect, test } from 'vitest';
import { unique } from './utilities';

test('unique()', () => {
  // Basics
  expect(unique()).toEqual([]);
  expect(unique([1, 1, 1, 1, 1, 1])).toEqual([1]);
  expect(unique(['a', 2, 1.0, true, true, false, 2])).toEqual(['a', 2, 1.0, true, false]);
});
