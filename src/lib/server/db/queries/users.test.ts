/**
 * Tests for users.ts
 */

// Dependencies
import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { createIsolatedDb } from '$tests/helpers/db';
import { db } from '$db/connection';
import { users } from '$schema/users';
import { subscriptions } from '$schema/subscriptions';
import { listUsersPaged, usersFullCount } from './users';

describe('listUsersPaged() / usersFullCount()', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();
  });

  afterEach(async () => {
    await dbSetup.teardown();
  });

  test('subscriptionCount is 0 for a user with no subscriptions', async () => {
    const [user] = await db.insert(users).values({ email: 'no-subs@example.com' }).returning();

    const results = await listUsersPaged({ offset: 0, limit: 10 });
    const found = results.find((result) => result.id === user.id);
    expect(found?.subscriptionCount).toBe(0);
  });

  test('subscriptionCount reflects multiple subscriptions for a single user', async () => {
    const [user] = await db.insert(users).values({ email: 'many-subs@example.com' }).returning();
    await db.insert(subscriptions).values([
      { userId: user.id, type: 'folder', itemId: 'folder-1' },
      { userId: user.id, type: 'agency', itemId: 'agency-1' }
    ]);

    const results = await listUsersPaged({ offset: 0, limit: 10 });
    const found = results.find((result) => result.id === user.id);
    expect(found?.subscriptionCount).toBe(2);
  });

  test('orders users by createdAt descending', async () => {
    const [older] = await db
      .insert(users)
      .values({ email: 'older@example.com', createdAt: new Date('2020-01-01') })
      .returning();
    const [newer] = await db
      .insert(users)
      .values({ email: 'newer@example.com', createdAt: new Date('2024-01-01') })
      .returning();

    const results = await listUsersPaged({ offset: 0, limit: 10 });
    const olderIndex = results.findIndex((result) => result.id === older.id);
    const newerIndex = results.findIndex((result) => result.id === newer.id);
    expect(newerIndex).toBeLessThan(olderIndex);
  });

  test('offset/limit paginate results', async () => {
    await db.insert(users).values([
      { email: 'page-a@example.com', createdAt: new Date('2020-01-01') },
      { email: 'page-b@example.com', createdAt: new Date('2021-01-01') },
      { email: 'page-c@example.com', createdAt: new Date('2022-01-01') }
    ]);

    const firstPage = await listUsersPaged({ offset: 0, limit: 2 });
    const secondPage = await listUsersPaged({ offset: 2, limit: 2 });
    expect(firstPage).toHaveLength(2);
    expect(secondPage.length).toBeGreaterThanOrEqual(1);
    expect(secondPage.map((result) => result.id)).not.toContain(firstPage[0].id);
  });

  test('usersFullCount() reflects total number of users', async () => {
    const countBefore = await usersFullCount();
    await db
      .insert(users)
      .values([{ email: 'count-a@example.com' }, { email: 'count-b@example.com' }]);
    const countAfter = await usersFullCount();
    expect(countAfter).toBe(countBefore + 2);
  });
});
