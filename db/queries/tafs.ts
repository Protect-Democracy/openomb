/**
 * Queries centered around tafs.
 */

// Dependencies
import { groupBy, orderBy } from 'lodash-es';
import { eq, and, countDistinct, asc, max, count, avg } from 'drizzle-orm';
import { db } from '../connection';
import { files } from '../schema/files';
import { tafs } from '../schema/tafs';
import { memoizeDataAsync } from '../../server/cache';

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

/**
 * Distinct agencies with file counts
 *
 * @param {['approval', 'names']} orderBy - How to order results
 */
export const agencies = async function (orderResultsBy: 'approval' | 'names' = 'names') {
  const results = await db
    .selectDistinctOn([tafs.budgetAgencyTitle, tafs.budgetAgencyTitleId], {
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      fileCount: countDistinct(tafs.fileId),
      latestApprovalTimestamp: max(files.approvalTimestamp)
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .groupBy(tafs.budgetAgencyTitle, tafs.budgetAgencyTitleId)
    .orderBy(asc(tafs.budgetAgencyTitle));

  // Have to manually order results
  const orderByField = orderResultsBy === 'names' ? 'budgetAgencyTitle' : 'latestApprovalTimestamp';
  const orderByDirection = orderResultsBy === 'names' ? 'asc' : 'desc';
  return orderBy(results, [orderByField], [orderByDirection]);
};

/**
 * Distinct agencies with file counts and associated bureaus/accounts
 */
export const agenciesWithChildren = async function (
  orderResultsBy: 'approval' | 'names' = 'names'
) {
  const agencyResults = await agencies(orderResultsBy);

  const bureauResults = await db
    .selectDistinctOn(
      [tafs.budgetAgencyTitleId, tafs.budgetBureauTitleId, tafs.budgetBureauTitle],
      {
        budgetAgencyTitleId: tafs.budgetAgencyTitleId,
        budgetBureauTitleId: tafs.budgetBureauTitleId,
        budgetBureauTitle: tafs.budgetBureauTitle,
        fileCount: countDistinct(tafs.fileId)
      }
    )
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .groupBy(tafs.budgetAgencyTitleId, tafs.budgetBureauTitleId, tafs.budgetBureauTitle)
    .orderBy(tafs.budgetAgencyTitleId, tafs.budgetBureauTitleId, tafs.budgetBureauTitle);
  const groupedBureaus = groupBy(bureauResults, 'budgetAgencyTitleId');

  const accountResults = await db
    .selectDistinctOn(
      [tafs.budgetAgencyTitleId, tafs.budgetBureauTitleId, tafs.accountTitleId, tafs.accountTitle],
      {
        budgetAgencyTitleId: tafs.budgetAgencyTitleId,
        budgetBureauTitleId: tafs.budgetBureauTitleId,
        accountTitleId: tafs.accountTitleId,
        accountTitle: tafs.accountTitle,
        fileCount: countDistinct(tafs.fileId)
      }
    )
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .groupBy(
      tafs.budgetAgencyTitleId,
      tafs.budgetBureauTitleId,
      tafs.accountTitleId,
      tafs.accountTitle
    )
    .orderBy(
      tafs.budgetAgencyTitleId,
      tafs.budgetBureauTitleId,
      tafs.accountTitleId,
      tafs.accountTitle
    );
  const groupedAccounts = groupBy(accountResults, 'budgetAgencyTitleId');

  return agencyResults.map((agency) => {
    const groupedAgencyAccounts = groupBy(
      groupedAccounts[`${agency.budgetAgencyTitleId}`],
      'budgetBureauTitleId'
    );
    return {
      ...agency,
      budgetBureaus: groupedBureaus[`${agency.budgetAgencyTitleId}`].map((bureau) => ({
        ...bureau,
        accounts: groupedAgencyAccounts[`${bureau.budgetBureauTitleId}`]
      }))
    };
  });
};

/**
 * Get agencies for a specifc folder (file)
 */
export const agenciesByFolder = async function (folderId: string) {
  return db
    .select({
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      fileCount: countDistinct(tafs.fileId)
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .where(eq(files.folderId, folderId))
    .groupBy(tafs.budgetAgencyTitle, tafs.budgetAgencyTitleId)
    .orderBy(tafs.budgetAgencyTitle);
};

/**
 * Get details for an agency
 */
export const agencyDetails = async function (budgetAgencyTitleId: string) {
  const filesFromAgency = await db
    .selectDistinct({
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      fileId: tafs.fileId
    })
    .from(tafs)
    .where(eq(tafs.budgetAgencyTitleId, budgetAgencyTitleId));

  // If none found
  if (!filesFromAgency || filesFromAgency.length === 0) {
    return null;
  }

  // Get folders
  const foldersFromAgency = await db
    .selectDistinct({ folder: files.folder, folderId: files.folderId })
    .from(files)
    .innerJoin(tafs, eq(files.fileId, tafs.fileId))
    .where(eq(tafs.budgetAgencyTitleId, budgetAgencyTitleId))
    .orderBy(files.folder);

  // Just some data sanity
  if (!foldersFromAgency || foldersFromAgency.length === 0) {
    throw new Error(`Agency "${budgetAgencyTitleId}" has not folder`);
  }
  else if (foldersFromAgency.length > 1) {
    throw new Error(`Agency "${budgetAgencyTitleId}" has more than 1 folder`);
  }

  return {
    budgetAgencyTitleId,
    budgetAgencyTitle: filesFromAgency[0].budgetAgencyTitle,
    fileCount: filesFromAgency.length,
    folder: foldersFromAgency[0]
  };
};

/**
 * Distinct bureaus with file counts (used for search options)
 */
export const bureaus = async function () {
  return db
    .select({
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      fileCount: countDistinct(tafs.fileId)
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .groupBy(
      tafs.budgetAgencyTitle,
      tafs.budgetAgencyTitleId,
      tafs.budgetBureauTitle,
      tafs.budgetBureauTitleId
    )
    .orderBy(tafs.budgetBureauTitle);
};

/**
 * Get bureaus for a specifc agency.
 */
export const bureausByAgency = async function (budgetAgencyTitleId: string) {
  return db
    .select({
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      fileCount: countDistinct(tafs.fileId)
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .where(eq(tafs.budgetAgencyTitleId, budgetAgencyTitleId))
    .groupBy(tafs.budgetBureauTitle, tafs.budgetBureauTitleId)
    .orderBy(tafs.budgetBureauTitle);
};

/**
 * Bureau details.  Requires agency id as well.
 */
export const bureauDetails = async function (
  budgetAgencyTitleId: string,
  budgetBureauTitleId: string
) {
  const filesFromBureau = await db
    .selectDistinct({
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      fileId: tafs.fileId
    })
    .from(tafs)
    .where(
      and(
        eq(tafs.budgetAgencyTitleId, budgetAgencyTitleId),
        eq(tafs.budgetBureauTitleId, budgetBureauTitleId)
      )
    );

  // If none found
  if (!filesFromBureau || filesFromBureau.length === 0) {
    return null;
  }

  // Get agency details
  const agency = await agencyDetails(budgetAgencyTitleId);
  if (!agency) {
    throw new Error(
      `Unable to find Agency "${budgetAgencyTitleId}" when looking up Bureau "${budgetBureauTitleId}"`
    );
  }

  return {
    budgetBureauTitle: filesFromBureau[0].budgetBureauTitle,
    budgetBureauTitleId: filesFromBureau[0].budgetBureauTitleId,
    budgetAgencyTitle: filesFromBureau[0].budgetAgencyTitle,
    budgetAgencyTitleId: filesFromBureau[0].budgetAgencyTitleId,
    fileCount: filesFromBureau.length,
    agency
  };
};

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
export const mAgenciesWithChildren = memoizeDataAsync(agenciesWithChildren);
export const mAgencies = memoizeDataAsync(agencies);
export const mBureaus = memoizeDataAsync(bureaus);
export const mAccounts = memoizeDataAsync(accounts);
