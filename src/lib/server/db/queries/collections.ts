/**
 * Queries centered around collections.
 */

// Dependencies
import { desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '$db/connection';
import { collections } from '$schema/collections';

/**
 * Get complete list of completed collections.
 */
export const completed = async function () {
  const found = await db
    .select()
    .from(collections)
    .where(isNotNull(collections.complete))
    .orderBy(desc(collections.complete));

  return found || [];
};

/**
 * Last updated date of collections
 */
export const lastUpdated = async function () {
  return await db.query.collections.findFirst({
    where: eq(collections.status, 'completed'),
    orderBy: desc(collections.complete)
  });
};
