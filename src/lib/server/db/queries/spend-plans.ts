/**
 * Queries centered around files.
 */

// Dependencies
import { eq, desc, and } from 'drizzle-orm';
import { db } from '$db/connection';
import { spendPlans } from '$schema/spend-plans';
import { memoizeDataAsync } from '$server/cache';

/**
 * Get simple file record given file id
 */
export const spendPlanRecord = async function (
  fileId: string
): Promise<typeof spendPlans.$inferSelect> {
  const found = await db.select().from(spendPlans).where(eq(spendPlans.fileId, fileId));
  return found?.[0] || null;
};

/**
 * Recently added.
 */
export const recentlyAdded = async function (
  limit: number = 20,
  filters?: { folderId?: string; agencyId?: string; bureauId?: string }
) {
  // Check that we have both agency and bureau if bureau provided
  if (filters?.bureauId && !filters?.agencyId) {
    throw new Error('Must provide both agency and bureau identifiers.');
  }

  const criterion = [];
  if (filters.folderId) {
    criterion.push(eq(spendPlans.folderId, filters.folderId));
  }
  if (filters.agencyId) {
    criterion.push(eq(spendPlans.budgetAgencyTitleId, filters.agencyId));
  }
  if (filters.bureauId) {
    criterion.push(eq(spendPlans.budgetBureauTitleId, filters.bureauId));
  }

  const recentSpendPlans = await db.query.spendPlans.findMany({
    columns: { sourceData: false },
    orderBy: desc(spendPlans.createdAt),
    where: and(...criterion),
    limit: limit
  });

  return recentSpendPlans || [];
};

/**
 * Recently removed.
 */
export const recentlyRemoved = async function (limit: number = 20) {
  const removedSpendPlans = await db.query.spendPlans.findMany({
    columns: { sourceData: false },
    where: eq(spendPlans.removed, true),
    orderBy: desc(spendPlans.createdAt),
    limit: limit
  });

  return removedSpendPlans || [];
};

/**
 * Get spend plans for the given agency
 */
export const spendPlansByAgency = async function (budgetAgencyTitleId: string) {
  return db
    .select()
    .from(spendPlans)
    .where(eq(spendPlans.budgetAgencyTitleId, budgetAgencyTitleId))
    .orderBy(desc(spendPlans.createdAt));
};

/**
 * Get spend plans for the given bureau
 */
export const spendPlansByBureau = async function (budgetBureauTitleId: string) {
  return db
    .select()
    .from(spendPlans)
    .where(eq(spendPlans.budgetBureauTitleId, budgetBureauTitleId))
    .orderBy(desc(spendPlans.createdAt));
};

/**
 * All spend plans
 */
export const allSpendPlans = async function () {
  return await db
    .select({ fileId: spendPlans.fileId, createdAt: spendPlans.createdAt })
    .from(spendPlans)
    .orderBy(desc(spendPlans.createdAt));
};

// Memoized
export const mAllSpendPlans = memoizeDataAsync(allSpendPlans);
export const mRecentlyAdded = memoizeDataAsync(recentlyAdded);
