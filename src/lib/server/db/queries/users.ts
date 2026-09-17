/**
 * Queries centered around user accounts, for the admin section.
 *
 * Not memoized like most read queries in this codebase - the admin section is
 * low-traffic, and staleness here (e.g. not seeing a user who just subscribed)
 * would be actively unhelpful.
 */

// Dependencies
import { eq, count, countDistinct, desc } from 'drizzle-orm';
import { db } from '$db/connection';
import { users } from '$schema/users';
import { subscriptions } from '$schema/subscriptions';

// Types
import type { usersSelect } from '$schema/users';

export type AdminUserListItem = {
  id: string;
  email: string | null;
  createdAt: Date | null;
  emailVerified: Date | null;
  subscriptionCount: number;
};

export type AdminUserListParams = {
  offset: number;
  limit: number;
};

/**
 * Paged list of users for the admin list view, with a subscription count per user.
 */
export async function listUsersPaged({
  offset,
  limit
}: AdminUserListParams): Promise<AdminUserListItem[]> {
  return await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      emailVerified: users.emailVerified,
      subscriptionCount: countDistinct(subscriptions.id)
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .offset(offset)
    .limit(limit);
}

/**
 * Total user count, for pagination.
 */
export async function usersFullCount(): Promise<number> {
  const result = await db.select({ count: count() }).from(users);
  return result[0]?.count || 0;
}

/**
 * Single user by primary key, for the admin detail page.
 */
export async function getUserById(userId: string): Promise<usersSelect | undefined> {
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result[0];
}
