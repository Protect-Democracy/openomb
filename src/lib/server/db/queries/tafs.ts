/**
 * Queries centered around tafs.
 */

// Dependencies
import { eq, and, countDistinct, max, count, avg } from 'drizzle-orm';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { memoizeDataAsync } from '$server/cache';

/**
 * TAFS statistics
 */
export const tafsStats = async function () {
  // Total number of accounts
  const totalAccounts = await db.select({ count: count() }).from(
    db
      .selectDistinct({
        budgetAgencyTitleId: tafs.budgetAgencyTitleId,
        budgetBureauTitleId: tafs.budgetBureauTitleId,
        accountId: tafs.accountId
      })
      .from(tafs)
      .as('accounts')
  );

  // Average iterations
  const maxIterations = db
    .select({
      tafsId: tafs.tafsId,
      fiscalYear: tafs.fiscalYear,
      maxIteration: max(tafs.iteration).as('maxIteration')
    })
    .from(tafs)
    .groupBy(tafs.tafsId, tafs.fiscalYear)
    .as('maxIterations');
  const averageIterations = await db
    .select({ avg: avg(maxIterations.maxIteration) })
    .from(maxIterations);

  return {
    totalAccounts: totalAccounts[0].count,
    averageIterations: averageIterations[0].avg
  };
};
export type TafsStatsResult = Awaited<ReturnType<typeof tafsStats>>;

/**
 * All accounts
 */
export const accounts = async function () {
  return db
    .selectDistinct({
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      accountTitle: tafs.accountTitle,
      accountTitleId: tafs.accountTitleId
    })
    .from(tafs)
    .orderBy(tafs.budgetAgencyTitle, tafs.budgetBureauTitle, tafs.accountTitle);
};
export type AccountsResult = Awaited<ReturnType<typeof accounts>>;

/**
 * Get accounts for a bureau (and agency).
 */
export const accountsByBureau = async function (
  budgetAgencyTitleId: string,
  budgetBureauTitleId: string
) {
  return db
    .select({
      accountTitle: tafs.accountTitle,
      accountTitleId: tafs.accountTitleId,
      fileCount: countDistinct(tafs.fileId)
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .where(
      and(
        eq(tafs.budgetAgencyTitleId, budgetAgencyTitleId),
        eq(tafs.budgetBureauTitleId, budgetBureauTitleId)
      )
    )
    .groupBy(tafs.accountTitle, tafs.accountTitleId)
    .orderBy(tafs.accountTitle);
};
export type AccountsByBureauResult = Awaited<ReturnType<typeof accountsByBureau>>;

/**
 * Account details given an account title ID.
 */
export const accountDetails = async function (
  budgetAgencyTitleId: string,
  budgetBureauTitleId: string,
  accountTitleId: string
) {
  const filesFromAccount = await db
    .selectDistinct({
      accountTitle: tafs.accountTitle,
      accountTitleId: tafs.accountTitleId,
      fileId: tafs.fileId
    })
    .from(tafs)
    .where(
      and(
        eq(tafs.budgetAgencyTitleId, budgetAgencyTitleId),
        eq(tafs.budgetBureauTitleId, budgetBureauTitleId),
        eq(tafs.accountTitleId, accountTitleId)
      )
    );

  // If none found
  if (!filesFromAccount || filesFromAccount.length === 0) {
    return null;
  }

  // Get bureau details
  const bureau = await bureauDetails(budgetAgencyTitleId, budgetBureauTitleId);
  if (!bureau) {
    throw new Error(
      `Unable to find Bureau "${budgetBureauTitleId}" when looking up Account "${accountTitleId}"`
    );
  }

  return {
    accountTitle: filesFromAccount[0].accountTitle,
    accountTitleId: filesFromAccount[0].accountTitleId,
    fileCount: filesFromAccount.length,
    bureau
  };
};

/**
 * Get TAFS by account title ID.
 */
export const tafsByAccount = async function (
  budgetAgencyTitleId: string,
  budgetBureauTitleId: string,
  accountTitleId: string
) {
  return await db
    .select({
      tafsId: tafs.tafsId,
      cgacAgency: tafs.cgacAgency,
      cgacAcct: tafs.cgacAcct,
      allocationAgencyCode: tafs.allocationAgencyCode,
      allocationSubacct: tafs.allocationSubacct,
      beginPoa: tafs.beginPoa,
      endPoa: tafs.endPoa,
      iteration: tafs.iteration,
      fiscalYear: tafs.fiscalYear,
      tafsTableId: tafs.tafsTableId,
      fileId: tafs.fileId,
      approvalTimestamp: files.approvalTimestamp
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .where(
      and(
        eq(tafs.budgetAgencyTitleId, budgetAgencyTitleId),
        eq(tafs.budgetBureauTitleId, budgetBureauTitleId),
        eq(tafs.accountTitleId, accountTitleId)
      )
    )
    .orderBy(tafs.tafsId, tafs.fiscalYear, tafs.iteration);
};

// Memoized
export const mAccounts = memoizeDataAsync(accounts);
export const mTafsStats = memoizeDataAsync(tafsStats);
