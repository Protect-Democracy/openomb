import { groupBy } from 'lodash-es';
import { eq, and, asc, desc, countDistinct, max, sql, isNotNull } from 'drizzle-orm';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { memoizeDataAsync } from '$server/cache';
import { reduceByFileType } from '$server/query-utilities';

/**
 * Distinct agencies with file counts
 *
 * @param {['approval', 'names']} orderBy - How to order results
 */
export const agencies = async function (orderResultsBy: 'approval' | 'names' = 'names') {
  const agencyFiles = db
    .selectDistinctOn([tafs.budgetAgencyTitle, files.fileId], {
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      fileId: files.fileId,
      fileType: files.fileType,
      approvalTimestamp: files.approvalTimestamp
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .union(
      db
        .selectDistinctOn([files.budgetAgencyTitle, files.fileId], {
          budgetAgencyTitle: files.budgetAgencyTitle,
          budgetAgencyTitleId: files.budgetAgencyTitleId,
          fileId: files.fileId,
          fileType: files.fileType,
          approvalTimestamp: files.approvalTimestamp
        })
        .from(files)
        .where(isNotNull(files.budgetAgencyTitle))
    )
    .as('agencyFiles');

  const orderTerms =
    orderResultsBy === 'names'
      ? asc(agencyFiles.budgetAgencyTitle)
      : desc(sql.identifier('latestApprovalTimestamp'));

  const results = await db
    .select({
      budgetAgencyTitle: agencyFiles.budgetAgencyTitle,
      budgetAgencyTitleId: agencyFiles.budgetAgencyTitleId,
      fileType: agencyFiles.fileType,
      fileCount: countDistinct(agencyFiles.fileId),
      latestApprovalTimestamp: max(agencyFiles.approvalTimestamp).as('latestApprovalTimestamp')
    })
    .from(agencyFiles)
    .groupBy(agencyFiles.budgetAgencyTitle, agencyFiles.budgetAgencyTitleId, agencyFiles.fileType)
    .orderBy(orderTerms);

  return reduceByFileType(results);
};

/**
 * Distinct agencies with file counts and associated bureaus/accounts
 */
export const agenciesWithChildren = async function (
  orderResultsBy: 'approval' | 'names' = 'names'
) {
  const agencyResults = await agencies(orderResultsBy);

  const bureauResults = await bureaus();
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
      budgetBureaus:
        groupedBureaus[`${agency.budgetAgencyTitleId}`]?.map((bureau) => ({
          ...bureau,
          accounts: groupedAgencyAccounts[`${bureau.budgetBureauTitleId}`] || []
        })) || []
    };
  });
};
export type AgenciesWithChildrenResult = Awaited<ReturnType<typeof agenciesWithChildren>>;

/**
 * Get agencies for a specifc folder (file)
 */
export const agenciesByFolder = async function (folderId: string) {
  const agencyFiles = db
    .selectDistinctOn([tafs.budgetAgencyTitle, files.fileId], {
      folderId: files.folderId,
      folder: files.folder,
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      fileId: files.fileId,
      fileType: files.fileType,
      approvalTimestamp: files.approvalTimestamp
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .union(
      db
        .selectDistinctOn([files.budgetAgencyTitle, files.fileId], {
          folderId: files.folderId,
          folder: files.folder,
          budgetAgencyTitle: files.budgetAgencyTitle,
          budgetAgencyTitleId: files.budgetAgencyTitleId,
          fileId: files.fileId,
          fileType: files.fileType,
          approvalTimestamp: files.approvalTimestamp
        })
        .from(files)
        .where(isNotNull(files.budgetAgencyTitle))
    )
    .as('agencyFiles');

  const results = await db
    .select({
      budgetAgencyTitle: agencyFiles.budgetAgencyTitle,
      budgetAgencyTitleId: agencyFiles.budgetAgencyTitleId,
      fileType: agencyFiles.fileType,
      fileCount: countDistinct(agencyFiles.fileId)
    })
    .from(agencyFiles)
    .where(eq(agencyFiles.folderId, folderId))
    .groupBy(agencyFiles.budgetAgencyTitle, agencyFiles.budgetAgencyTitleId, agencyFiles.fileType)
    .orderBy(agencyFiles.budgetAgencyTitle);

  return reduceByFileType(results);
};
export type AgenciesByFolderResult = Awaited<ReturnType<typeof agenciesByFolder>>;

/**
 * Get details for an agency
 */
export const agencyDetails = async function (budgetAgencyTitleId: string) {
  const agencyFiles = db
    .selectDistinctOn([tafs.budgetAgencyTitle, files.fileId], {
      folderId: files.folderId,
      folder: files.folder,
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      fileId: files.fileId,
      fileType: files.fileType,
      approvalTimestamp: files.approvalTimestamp
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .union(
      db
        .selectDistinctOn([files.budgetAgencyTitle, files.fileId], {
          folderId: files.folderId,
          folder: files.folder,
          budgetAgencyTitle: files.budgetAgencyTitle,
          budgetAgencyTitleId: files.budgetAgencyTitleId,
          fileId: files.fileId,
          fileType: files.fileType,
          approvalTimestamp: files.approvalTimestamp
        })
        .from(files)
        .where(isNotNull(files.budgetAgencyTitle))
    )
    .as('agencyFiles');

  const filesFromAgency = await db
    .selectDistinct({
      budgetAgencyTitle: agencyFiles.budgetAgencyTitle,
      budgetAgencyTitleId: agencyFiles.budgetAgencyTitleId,
      fileId: agencyFiles.fileId,
      fileType: agencyFiles.fileType
    })
    .from(agencyFiles)
    .where(eq(agencyFiles.budgetAgencyTitleId, budgetAgencyTitleId));

  // If none found
  if (!filesFromAgency || filesFromAgency.length === 0) {
    return null;
  }

  // Get folders
  const foldersFromAgency = await db
    .selectDistinct({
      folder: agencyFiles.folder,
      folderId: agencyFiles.folderId,
      fileType: agencyFiles.fileType
    })
    .from(agencyFiles)
    .where(eq(agencyFiles.budgetAgencyTitleId, budgetAgencyTitleId))
    // Ensure we get non spend plan folders first
    .orderBy(agencyFiles.fileType, agencyFiles.folder)
    .limit(1);

  // Just some data sanity
  if (!foldersFromAgency || foldersFromAgency.length === 0) {
    throw new Error(`Agency "${budgetAgencyTitleId}" has not folder`);
  } else if (foldersFromAgency.length > 1) {
    throw new Error(`Agency "${budgetAgencyTitleId}" has more than 1 folder`);
  }

  return {
    budgetAgencyTitleId,
    budgetAgencyTitle: filesFromAgency?.at(0)?.budgetAgencyTitle,
    fileCount: filesFromAgency?.length || 0,
    folder: foldersFromAgency[0]
  };
};
export type AgencyDetailsResult = Awaited<ReturnType<typeof agencyDetails>>;

/**
 * Distinct bureaus with file counts (used for search options)
 */
export const bureaus = async function () {
  const bureauFiles = db
    .selectDistinctOn([tafs.budgetAgencyTitle, tafs.budgetBureauTitle, files.fileId], {
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      fileId: files.fileId,
      fileType: files.fileType,
      approvalTimestamp: files.approvalTimestamp
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .union(
      db
        .selectDistinctOn([files.budgetAgencyTitle, files.budgetBureauTitle, files.fileId], {
          budgetAgencyTitle: files.budgetAgencyTitle,
          budgetAgencyTitleId: files.budgetAgencyTitleId,
          budgetBureauTitle: files.budgetBureauTitle,
          budgetBureauTitleId: files.budgetBureauTitleId,
          fileId: files.fileId,
          fileType: files.fileType,
          approvalTimestamp: files.approvalTimestamp
        })
        .from(files)
        .where(isNotNull(files.budgetBureauTitle))
    )
    .as('bureauFiles');

  const results = await db
    .select({
      budgetAgencyTitle: bureauFiles.budgetAgencyTitle,
      budgetAgencyTitleId: bureauFiles.budgetAgencyTitleId,
      budgetBureauTitle: bureauFiles.budgetBureauTitle,
      budgetBureauTitleId: bureauFiles.budgetBureauTitleId,
      fileType: bureauFiles.fileType,
      fileCount: countDistinct(bureauFiles.fileId),
      latestApprovalTimestamp: max(bureauFiles.approvalTimestamp).as('latestApprovalTimestamp')
    })
    .from(bureauFiles)
    .groupBy(
      bureauFiles.budgetAgencyTitle,
      bureauFiles.budgetAgencyTitleId,
      bureauFiles.budgetBureauTitle,
      bureauFiles.budgetBureauTitleId,
      bureauFiles.fileType
    );

  return reduceByFileType(results);
};
export type BureausResult = Awaited<ReturnType<typeof bureaus>>;

/**
 * Get bureaus for a specifc agency.
 */
export const bureausByAgency = async function (budgetAgencyTitleId: string) {
  const bureauFiles = db
    .selectDistinctOn([tafs.budgetAgencyTitle, tafs.budgetBureauTitle, files.fileId], {
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      fileId: files.fileId,
      fileType: files.fileType,
      approvalTimestamp: files.approvalTimestamp
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .union(
      db
        .selectDistinctOn([files.budgetAgencyTitle, files.budgetBureauTitle, files.fileId], {
          budgetAgencyTitle: files.budgetAgencyTitle,
          budgetAgencyTitleId: files.budgetAgencyTitleId,
          budgetBureauTitle: files.budgetBureauTitle,
          budgetBureauTitleId: files.budgetBureauTitleId,
          fileId: files.fileId,
          fileType: files.fileType,
          approvalTimestamp: files.approvalTimestamp
        })
        .from(files)
        .where(isNotNull(files.budgetBureauTitle))
    )
    .as('bureauFiles');

  const results = await db
    .select({
      budgetBureauTitle: bureauFiles.budgetBureauTitle,
      budgetBureauTitleId: bureauFiles.budgetBureauTitleId,
      fileType: bureauFiles.fileType,
      fileCount: countDistinct(bureauFiles.fileId)
    })
    .from(bureauFiles)
    .where(eq(bureauFiles.budgetAgencyTitleId, budgetAgencyTitleId))
    .groupBy(bureauFiles.budgetBureauTitle, bureauFiles.budgetBureauTitleId, bureauFiles.fileType)
    .orderBy(bureauFiles.budgetBureauTitle);

  return reduceByFileType(results);
};
export type BureausByAgencyResult = Awaited<ReturnType<typeof bureausByAgency>>;

/**
 * Bureau details.  Requires agency id as well.
 */
export const bureauDetails = async function (
  budgetAgencyTitleId: string,
  budgetBureauTitleId: string
) {
  const bureauFiles = db
    .selectDistinctOn([tafs.budgetAgencyTitle, tafs.budgetBureauTitle, files.fileId], {
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      fileId: files.fileId,
      fileType: files.fileType,
      approvalTimestamp: files.approvalTimestamp
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .union(
      db
        .selectDistinctOn([files.budgetAgencyTitle, files.budgetBureauTitle, files.fileId], {
          budgetAgencyTitle: files.budgetAgencyTitle,
          budgetAgencyTitleId: files.budgetAgencyTitleId,
          budgetBureauTitle: files.budgetBureauTitle,
          budgetBureauTitleId: files.budgetBureauTitleId,
          fileId: files.fileId,
          fileType: files.fileType,
          approvalTimestamp: files.approvalTimestamp
        })
        .from(files)
        .where(isNotNull(files.budgetBureauTitle))
    )
    .as('bureauFiles');

  const filesFromBureau = await db
    .selectDistinct({
      budgetBureauTitle: bureauFiles.budgetBureauTitle,
      budgetBureauTitleId: bureauFiles.budgetBureauTitleId,
      budgetAgencyTitle: bureauFiles.budgetAgencyTitle,
      budgetAgencyTitleId: bureauFiles.budgetAgencyTitleId,
      fileId: bureauFiles.fileId
    })
    .from(bureauFiles)
    .where(
      and(
        eq(bureauFiles.budgetAgencyTitleId, budgetAgencyTitleId),
        eq(bureauFiles.budgetBureauTitleId, budgetBureauTitleId)
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
export type BureauDetailsResult = Awaited<ReturnType<typeof bureauDetails>>;

// Memoized
export const mAgenciesWithChildren = memoizeDataAsync(agenciesWithChildren);
export const mAgencies = memoizeDataAsync(agencies);
export const mBureaus = memoizeDataAsync(bureaus);
export const mAgencyDetails = memoizeDataAsync(agencyDetails);
export const mBureauDetails = memoizeDataAsync(bureauDetails);
export const mAgenciesByFolder = memoizeDataAsync(agenciesByFolder);
export const mBureausByAgency = memoizeDataAsync(bureausByAgency);
