import { expect, test, describe } from 'vitest';
import { secondsToZonedTime, parsePageIndex, parsePageSize } from './utilities';

describe('secondsToZonedTime()', () => {
  test('basics', () => {
    // Works across timezones and dates
    expect(secondsToZonedTime(0, 0, 'America/New_York', '2022-01-01T05:00:00')).toEqual(
      (24 - 5) * 60 * 60
    );
    expect(secondsToZonedTime(0, 0, 'America/New_York', '2025-11-12T05:00:00')).toEqual(
      (24 - 5) * 60 * 60
    );
    expect(secondsToZonedTime(0, 0, 'Africa/Bissau', '2022-01-01T05:00:00')).toEqual(
      (24 - 5) * 60 * 60
    );
    expect(secondsToZonedTime(0, 0, 'Africa/Bissau', '2025-11-12T05:00:00')).toEqual(
      (24 - 5) * 60 * 60
    );
    expect(secondsToZonedTime(0, 0, 'Asia/Damascus', '2022-01-01T05:00:00')).toEqual(
      (24 - 5) * 60 * 60
    );
    expect(secondsToZonedTime(0, 0, 'Asia/Damascus', '2025-11-12T05:00:00')).toEqual(
      (24 - 5) * 60 * 60
    );
    expect(secondsToZonedTime(0, 0, 'Europe/Prague', '2022-01-01T05:00:00')).toEqual(
      (24 - 5) * 60 * 60
    );

    // Difference
    expect(secondsToZonedTime(4, 15, 'Europe/Prague', '2023-01-01T01:10:00')).toEqual(
      3 * 60 * 60 + 5 * 60
    );
    expect(secondsToZonedTime(15, 30, 'Africa/Bissau', '2023-12-01T18:50:00')).toEqual(
      20 * 60 * 60 + 40 * 60
    );

    // Minimum value
    expect(secondsToZonedTime(15, 30, 'Africa/Bissau', '2023-12-01T15:30:00')).toEqual(30);
    expect(secondsToZonedTime(15, 30, 'Africa/Bissau', '2023-12-01T15:30:00', 40)).toEqual(40);
    expect(secondsToZonedTime(15, 30, 'Africa/Bissau', 'inparsable', 40)).toEqual(40);
  });
});

describe('parsePageIndex()', () => {
  test('parses valid page numbers', () => {
    expect(parsePageIndex('1')).toEqual(1);
    expect(parsePageIndex('3')).toEqual(3);
  });

  // page=0 previously produced a negative OFFSET (e.g. offset=-100 for limit=100),
  // which Postgres rejects with "OFFSET must not be negative", 500ing
  // GET /api/v1/files/search (see PD-APPORTIONMENTS-BROWSER-HD).
  test('clamps invalid or missing values to page 1', () => {
    expect(parsePageIndex('0')).toEqual(1);
    expect(parsePageIndex('-1')).toEqual(1);
    expect(parsePageIndex('-100')).toEqual(1);
    expect(parsePageIndex('abc')).toEqual(1);
    expect(parsePageIndex(null)).toEqual(1);
    expect(parsePageIndex('1.5')).toEqual(1);
  });
});

describe('parsePageSize()', () => {
  test('parses valid sizes within bounds', () => {
    expect(parsePageSize('25', 50, 100)).toEqual(25);
    expect(parsePageSize('100', 50, 100)).toEqual(100);
  });

  test('clamps oversized values to the max', () => {
    expect(parsePageSize('500', 50, 100)).toEqual(100);
  });

  test('falls back to the default for invalid or missing values', () => {
    expect(parsePageSize('0', 50, 100)).toEqual(50);
    expect(parsePageSize('-10', 50, 100)).toEqual(50);
    expect(parsePageSize('abc', 50, 100)).toEqual(50);
    expect(parsePageSize(null, 50, 100)).toEqual(50);
  });
});
