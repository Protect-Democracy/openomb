// Dependencies
import { DateTime } from 'luxon';
import { expect, test, beforeEach, afterEach, vi, describe } from 'vitest';

// Mocks — hoisted by vitest before module imports
vi.mock('$db/queries/subscriptions', () => ({
  subscriptionsByUser: vi.fn(),
  setSubscriptionAsNotified: vi.fn().mockResolvedValue(undefined),
  userSubscriptionDetails: vi.fn()
}));
vi.mock('$db/queries/search', () => ({
  mFileSearchFullCount: vi.fn().mockResolvedValue(1),
  mFileSearchPaged: vi.fn().mockResolvedValue([{ id: 'file-1' }])
}));
vi.mock('$email/send', async (importOriginal) => {
  const mod = await importOriginal<typeof import('$email/send')>();
  // Keep real isRateLimitError; mock sendEmail only
  return { ...mod, sendEmail: vi.fn().mockResolvedValue(undefined) };
});
vi.mock('$email/render', () => ({
  renderTemplate: vi.fn().mockReturnValue('<p>test</p>')
}));
vi.mock('$config/subscriptions', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  // Set delay to 0 so tests run instantly without timer management
  return { ...mod, notificationDelayMs: 0, notificationRetryCount: 3 };
});

// To test
import {
  includeDailyNotification,
  includeWeeklyNotification,
  sendNotifications
} from './subscriptions';
import { subscriptionsByUser, setSubscriptionAsNotified } from '$db/queries/subscriptions';
import { sendEmail } from '$email/send';

// Use mock timers to allow date control
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
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

describe('sendNotifications', () => {
  // Use real timers so sleep(0) resolves naturally via microtask queue
  beforeEach(() => {
    vi.useRealTimers();
  });

  // Minimal subscription that satisfies includeDailyNotification (20 hours since last notify).
  // itemDetails must be truthy — getSubscriptionWithFiles returns early if it's null/undefined.
  const makeSub = (overrides = {}) => ({
    id: 'sub-1',
    type: 'folder',
    itemId: 'folder-1',
    frequency: 'daily',
    lastNotifiedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    itemDetails: {},
    ...overrides
  });

  test('continues sending to other users after one exhausts retries', async () => {
    vi.mocked(subscriptionsByUser).mockResolvedValue({
      'user1@test.com': [makeSub()],
      'user2@test.com': [makeSub({ id: 'sub-2' })]
    });
    // user1 fails all attempts (initial + 3 retries), user2 succeeds
    vi.mocked(sendEmail)
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(undefined);

    const { notificationsSent, notificationsFailed } = await sendNotifications();

    expect(notificationsSent).toHaveLength(1);
    expect(notificationsSent[0].email).toBe('user2@test.com');
    expect(notificationsFailed).toHaveLength(1);
    expect(notificationsFailed[0].email).toBe('user1@test.com');
  });

  test('retries once after a 420 rate-limit error and succeeds', async () => {
    vi.mocked(subscriptionsByUser).mockResolvedValue({
      'user1@test.com': [makeSub()]
    });
    vi.mocked(sendEmail)
      .mockRejectedValueOnce({ status: 420, message: 'rate limited' })
      .mockResolvedValueOnce(undefined);

    const { notificationsSent, notificationsFailed } = await sendNotifications();

    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(2);
    expect(notificationsSent).toHaveLength(1);
    expect(notificationsFailed).toHaveLength(0);
  });

  test('records failure after exhausting all retries on 420', async () => {
    vi.mocked(subscriptionsByUser).mockResolvedValue({
      'user1@test.com': [makeSub()]
    });
    vi.mocked(sendEmail).mockRejectedValue({ status: 420, message: 'rate limited' });

    const { notificationsSent, notificationsFailed } = await sendNotifications();

    // initial attempt + 3 retries (notificationRetryCount = 3)
    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(4);
    expect(notificationsSent).toHaveLength(0);
    expect(notificationsFailed).toHaveLength(1);
    expect(notificationsFailed[0].email).toBe('user1@test.com');
  });

  test('updates subscriptions as notified after successful send', async () => {
    const sub = makeSub();
    vi.mocked(subscriptionsByUser).mockResolvedValue({
      'user1@test.com': [sub]
    });
    vi.mocked(sendEmail).mockResolvedValue(undefined);

    await sendNotifications();

    expect(vi.mocked(setSubscriptionAsNotified)).toHaveBeenCalledWith('user1@test.com', sub.id);
  });
});
