/**
 * Tests for subscriptions.ts
 */

// Dependencies
import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { createIsolatedDb } from '$tests/helpers/db';
import { db } from '$db/connection';
import { users } from '$schema/users';
import { subscriptions } from '$schema/subscriptions';
import { userSubscriptionsByItemIds } from './subscriptions';

describe('userSubscriptionsByItemIds()', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();

    await db.insert(users).values({
      id: 'batched-sub-user',
      email: 'batched-sub-user@example.com'
    });
    await db.insert(subscriptions).values([
      {
        id: 'batched-sub-1',
        userId: 'batched-sub-user',
        type: 'tafs',
        itemId: 'tafs-table-id-a'
      },
      {
        id: 'batched-sub-2',
        userId: 'batched-sub-user',
        type: 'tafs',
        itemId: 'tafs-table-id-b'
      }
    ]);
  });

  afterEach(async () => {
    // Restore unconditionally (not just on the happy path) so a spy from a
    // failing test never leaks captured calls into a later test.
    vi.restoreAllMocks();
    await dbSetup.teardown();
  });

  test('fetches subscriptions for multiple item ids with a single query, not one per item id', async () => {
    const selectSpy = vi.spyOn(db, 'select');

    const result = await userSubscriptionsByItemIds('batched-sub-user@example.com', 'tafs', [
      'tafs-table-id-a',
      'tafs-table-id-b',
      'tafs-table-id-c'
    ]);

    expect(result.size).toBe(2);

    // One call to look up the user by email, one batched call for all item
    // ids -- not one subscription lookup per item id (previously this was 2
    // queries per TAFS row via userSubscription()'s per-row user + subscription
    // lookups).
    expect(selectSpy).toHaveBeenCalledTimes(2);
  });

  test('returns a Map keyed by itemId containing only items that have an existing subscription', async () => {
    const result = await userSubscriptionsByItemIds('batched-sub-user@example.com', 'tafs', [
      'tafs-table-id-a',
      'tafs-table-id-c'
    ]);

    expect(Array.from(result.keys())).toEqual(['tafs-table-id-a']);
  });

  test('returns an empty Map and issues no subscription query for an empty item id list', async () => {
    const selectSpy = vi.spyOn(db, 'select');

    const result = await userSubscriptionsByItemIds('batched-sub-user@example.com', 'tafs', []);

    expect(result.size).toBe(0);
    expect(selectSpy).not.toHaveBeenCalled();
  });

  test('returns an empty Map without querying subscriptions when the email matches no user', async () => {
    const result = await userSubscriptionsByItemIds('no-such-user@example.com', 'tafs', [
      'tafs-table-id-a'
    ]);

    expect(result.size).toBe(0);
  });

  test('dedupes repeated item ids without extra queries', async () => {
    const selectSpy = vi.spyOn(db, 'select');

    const result = await userSubscriptionsByItemIds('batched-sub-user@example.com', 'tafs', [
      'tafs-table-id-a',
      'tafs-table-id-a',
      'tafs-table-id-b'
    ]);

    expect(selectSpy).toHaveBeenCalledTimes(2);
    expect(result.size).toBe(2);
  });
});
