import { expect, test } from 'vitest';
import { isRateLimitError } from './send';

test('isRateLimitError returns true for 420 (MailGun rate limit)', () => {
  expect(isRateLimitError({ status: 420 })).toBe(true);
});

test('isRateLimitError returns true for 429 (standard too-many-requests)', () => {
  expect(isRateLimitError({ status: 429 })).toBe(true);
});

test('isRateLimitError returns false for other HTTP status codes', () => {
  expect(isRateLimitError({ status: 500 })).toBe(false);
  expect(isRateLimitError({ status: 400 })).toBe(false);
  expect(isRateLimitError({ status: 200 })).toBe(false);
});

test('isRateLimitError returns false for non-status errors', () => {
  expect(isRateLimitError(new Error('network error'))).toBe(false);
  expect(isRateLimitError('420')).toBe(false);
  expect(isRateLimitError(null)).toBe(false);
  expect(isRateLimitError(undefined)).toBe(false);
  expect(isRateLimitError(420)).toBe(false);
});
