// Dependencies
import { DateTime } from 'luxon';
import { expect, test, beforeEach, afterEach, vi } from 'vitest';

// To test
import { includeDailyNotification, includeWeeklyNotification } from './subscriptions';

// Use mock timers to allow date control
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

test('includeDailyNotification', () => {
  // set system date to 2025-1-12 6:00
  const date = new Date(2025, 0, 12, 6);
  vi.setSystemTime(date);

  // Last notified at current time, expect false
  expect(
    includeDailyNotification({
      frequency: 'daily',
      lastNotifiedAt: DateTime.fromJSDate(date)
    })
  ).toBe(false);

  // Last notified 2 hours before current time, expect false
  expect(
    includeDailyNotification({
      frequency: 'daily',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ hours: 2 }).toJSDate()
    })
  ).toBe(false);

  // Last notified 12 hours before current time, expect false
  expect(
    includeDailyNotification({
      frequency: 'daily',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ hours: 12 }).toJSDate()
    })
  ).toBe(false);

  // Last notified 18 hours before current time, expect false
  expect(
    includeDailyNotification({
      frequency: 'daily',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ hours: 18 }).toJSDate()
    })
  ).toBe(false);

  // Last notified 19 hours before current time, expect true
  expect(
    includeDailyNotification({
      frequency: 'daily',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ hours: 19 }).toJSDate()
    })
  ).toBe(true);

  // Last notified 24 hours before current time, expect true
  expect(
    includeDailyNotification({
      frequency: 'daily',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ hours: 24 }).toJSDate()
    })
  ).toBe(true);

  // Last notified 3 days before current time, expect true
  expect(
    includeDailyNotification({
      frequency: 'daily',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ days: 3 }).toJSDate()
    })
  ).toBe(true);
});

test('includeWeeklyNotification', () => {
  // set system date to 2025-1-12 6:00
  // Date is a Sunday
  let date = new Date(2025, 0, 12, 6);
  vi.setSystemTime(date);

  // Last notified 7 days ago, expect false (wrong date)
  expect(
    includeWeeklyNotification({
      frequency: 'weekly',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ days: 7 }).toJSDate()
    })
  ).toBe(false);

  // set system date to 2025-1-13 6:00
  // Date is a Monday
  date = new Date(2025, 0, 13, 6);
  vi.setSystemTime(date);

  // Last notified 7 days ago, expect true
  expect(
    includeWeeklyNotification({
      frequency: 'weekly',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ days: 7 }).toJSDate()
    })
  ).toBe(true);

  // Last notified 6 days ago, expect false
  expect(
    includeWeeklyNotification({
      frequency: 'weekly',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ days: 6 }).toJSDate()
    })
  ).toBe(false);

  // Last notified 6 days, 18 hours ago, expect true
  expect(
    includeWeeklyNotification({
      frequency: 'weekly',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ days: 6, hours: 18 }).toJSDate()
    })
  ).toBe(true);

  // Last notified 6 days, 12 hours ago, expect false
  expect(
    includeWeeklyNotification({
      frequency: 'weekly',
      lastNotifiedAt: DateTime.fromJSDate(date).minus({ days: 6, hours: 12 }).toJSDate()
    })
  ).toBe(false);
});
