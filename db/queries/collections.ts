/**
 * Queries centered around files.
 */

// Dependencies
import { desc, isNotNull } from 'drizzle-orm';
import { db, dbConnect } from '../connection';
import { collections } from '../schema/collections';

/**
 * Get complete list of completed collections.
 */
export const completed = async function () {
  await dbConnect();

  const found = await db
    .select()
    .from(collections)
    .where(isNotNull(collections.complete))
    .orderBy(desc(collections.complete));

  return found || [];
};
