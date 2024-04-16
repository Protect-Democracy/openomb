import { expect, test, describe } from 'vitest';
import { secondsToZonedTime } from './utilities';

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
  });
});
