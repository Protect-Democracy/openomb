import { groupBy, orderBy } from 'lodash-es';
import { eq, and, countDistinct, max, sql, inArray, isNotNull } from 'drizzle-orm';
import { union } from 'drizzle-orm/pg-core';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { spendPlans } from '$schema/spend-plans';
import { tafs } from '$schema/tafs';
import { memoizeDataAsync } from '$server/cache';

/**
 * Distinct agencies with file counts
 *
 * @param {['approval', 'names']} orderBy - How to order results
 */
export const agencies = async function (orderResultsBy: 'approval' | 'names' = 'names') {
  const fileAgencies = db
    .selectDistinctOn([tafs.budgetAgencyTitle, tafs.budgetAgencyTitleId], {
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      fileCount: countDistinct(tafs.fileId).as('fileCount'),
      latestApprovalTimestamp: max(files.approvalTimestamp).as('latestApprovalTimestamp')
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .groupBy(tafs.budgetAgencyTitle, tafs.budgetAgencyTitleId)
    .orderBy(tafs.budgetAgencyTitle)
    .as('fileAgencies');

  const spendPlanAgencies = db
    .selectDistinctOn([spendPlans.budgetAgencyTitle, spendPlans.budgetAgencyTitleId], {
      budgetAgencyTitle: spendPlans.budgetAgencyTitle,
      budgetAgencyTitleId: spendPlans.budgetAgencyTitleId,
      spendPlanCount: countDistinct(spendPlans.fileId).as('spendPlanCount')
    })
    .from(spendPlans)
    .groupBy(spendPlans.budgetAgencyTitle, spendPlans.budgetAgencyTitleId)
    .orderBy(spendPlans.budgetAgencyTitle)
    .as('spendPlanAgencies');

  const results =
    (await db
      .select({
        budgetAgencyTitle: sql`COALESCE(${fileAgencies.budgetAgencyTitle}, ${spendPlanAgencies.budgetAgencyTitle})`,
        budgetAgencyTitleId: sql`COALESCE(${fileAgencies.budgetAgencyTitleId}, ${spendPlanAgencies.budgetAgencyTitleId})`,
        fileCount: sql`cast(COALESCE(${fileAgencies.fileCount}, 0) as int)`,
        spendPlanCount: sql`cast(COALESCE(${spendPlanAgencies.spendPlanCount}, 0) as int)`,
        latestApprovalTimestamp: fileAgencies.latestApprovalTimestamp
      })
      .from(fileAgencies)
      .fullJoin(
        spendPlanAgencies,
        eq(fileAgencies.budgetAgencyTitleId, spendPlanAgencies.budgetAgencyTitleId)
      )) || [];

  // Have to manually order results
  const orderByField = orderResultsBy === 'names' ? 'budgetAgencyTitle' : 'latestApprovalTimestamp';
  const orderByDirection = orderResultsBy === 'names' ? 'asc' : 'desc';
  return orderBy(results, orderByField, [orderByDirection]);
};

/**
 * Distinct agencies with file counts and associated bureaus/accounts
 */
export const agenciesWithChildren = async function (
  orderResultsBy: 'approval' | 'names' = 'names'
) {
  const agencyResults = await agencies(orderResultsBy);

  const fileBureaus = db
    .selectDistinctOn(
      [tafs.budgetAgencyTitleId, tafs.budgetBureauTitleId, tafs.budgetBureauTitle],
      {
        budgetAgencyTitleId: tafs.budgetAgencyTitleId,
        budgetBureauTitleId: tafs.budgetBureauTitleId,
        budgetBureauTitle: tafs.budgetBureauTitle,
        fileCount: countDistinct(tafs.fileId).as('fileCount')
      }
    )
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .groupBy(tafs.budgetAgencyTitleId, tafs.budgetBureauTitleId, tafs.budgetBureauTitle)
    .orderBy(tafs.budgetAgencyTitleId, tafs.budgetBureauTitleId, tafs.budgetBureauTitle)
    .as('fileBureaus');

  const spendPlanBureaus = db
    .selectDistinctOn(
      [
        spendPlans.budgetAgencyTitleId,
        spendPlans.budgetBureauTitleId,
        spendPlans.budgetBureauTitle
      ],
      {
        budgetAgencyTitleId: spendPlans.budgetAgencyTitleId,
        budgetBureauTitleId: spendPlans.budgetBureauTitleId,
        budgetBureauTitle: spendPlans.budgetBureauTitle,
        spendPlanCount: countDistinct(spendPlans.fileId).as('spendPlanCount')
      }
    )
    .from(spendPlans)
    .where(isNotNull(spendPlans.budgetBureauTitle))
    .groupBy(
      spendPlans.budgetAgencyTitleId,
      spendPlans.budgetBureauTitleId,
      spendPlans.budgetBureauTitle
    )
    .orderBy(
      spendPlans.budgetAgencyTitleId,
      spendPlans.budgetBureauTitleId,
      spendPlans.budgetBureauTitle
    )
    .as('spendPlanBureaus');

  const bureauResults =
    (await db
      .select({
        budgetAgencyTitleId: sql`COALESCE(${fileBureaus.budgetAgencyTitleId}, ${spendPlanBureaus.budgetAgencyTitleId})`,
        budgetBureauTitle: sql`COALESCE(${fileBureaus.budgetBureauTitle}, ${spendPlanBureaus.budgetBureauTitle})`,
        budgetBureauTitleId: sql`COALESCE(${fileBureaus.budgetBureauTitleId}, ${spendPlanBureaus.budgetBureauTitleId})`,
        fileCount: sql`cast(COALESCE(${fileBureaus.fileCount}, 0) as int)`,
        spendPlanCount: sql`cast(COALESCE(${spendPlanBureaus.spendPlanCount}, 0) as int)`
      })
      .from(fileBureaus)
      .fullJoin(
        spendPlanBureaus,
        eq(fileBureaus.budgetBureauTitleId, spendPlanBureaus.budgetBureauTitleId)
      )) || [];
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
  const agencyIds = (
    await union(
      db
        .select({
          budgetAgencyTitleId: tafs.budgetAgencyTitleId
        })
        .from(tafs)
        .innerJoin(files, eq(tafs.fileId, files.fileId))
        .where(eq(files.folderId, folderId)),
      db
        .select({
          budgetAgencyTitleId: spendPlans.budgetAgencyTitleId
        })
        .from(spendPlans)
        .where(eq(spendPlans.folderId, folderId))
    )
  ).map((entry) => entry.budgetAgencyTitleId);

  const fileAgencies = db
    .select({
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      fileCount: countDistinct(tafs.fileId).as('fileCount')
    })
    .from(tafs)
    .where(inArray(tafs.budgetAgencyTitleId, agencyIds))
    .groupBy(tafs.budgetAgencyTitle, tafs.budgetAgencyTitleId)
    .orderBy(tafs.budgetAgencyTitle)
    .as('fileAgencies');

  const spendPlanAgencies = db
    .select({
      budgetAgencyTitle: spendPlans.budgetAgencyTitle,
      budgetAgencyTitleId: spendPlans.budgetAgencyTitleId,
      spendPlanCount: countDistinct(spendPlans.fileId).as('spendPlanCount')
    })
    .from(spendPlans)
    .where(inArray(spendPlans.budgetAgencyTitleId, agencyIds))
    .groupBy(spendPlans.budgetAgencyTitle, spendPlans.budgetAgencyTitleId)
    .orderBy(spendPlans.budgetAgencyTitle)
    .as('spendPlanAgencies');

  return (
    (await db
      .select({
        budgetAgencyTitle: sql`COALESCE(${fileAgencies.budgetAgencyTitle}, ${spendPlanAgencies.budgetAgencyTitle})`,
        budgetAgencyTitleId: sql`COALESCE(${fileAgencies.budgetAgencyTitleId}, ${spendPlanAgencies.budgetAgencyTitleId})`,
        fileCount: sql`cast(COALESCE(${fileAgencies.fileCount}, 0) as int)`,
        spendPlanCount: sql`cast(COALESCE(${spendPlanAgencies.spendPlanCount}, 0) as int)`
      })
      .from(fileAgencies)
      .fullJoin(
        spendPlanAgencies,
        eq(fileAgencies.budgetAgencyTitleId, spendPlanAgencies.budgetAgencyTitleId)
      )) || []
  );
};
export type AgenciesByFolderResult = Awaited<ReturnType<typeof agenciesByFolder>>;

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

  const spendPlansFromAgency = await db
    .selectDistinct({
      budgetAgencyTitle: spendPlans.budgetAgencyTitle,
      budgetAgencyTitleId: spendPlans.budgetAgencyTitleId,
      fileId: spendPlans.fileId
    })
    .from(spendPlans)
    .where(eq(spendPlans.budgetAgencyTitleId, budgetAgencyTitleId));

  // If none found
  if (
    (!filesFromAgency || filesFromAgency.length === 0) &&
    (!spendPlansFromAgency || spendPlansFromAgency.length === 0)
  ) {
    return null;
  }

  // Get folders
  let foldersFromAgency = await db
    .selectDistinct({ folder: files.folder, folderId: files.folderId })
    .from(files)
    .innerJoin(tafs, eq(files.fileId, tafs.fileId))
    .where(eq(tafs.budgetAgencyTitleId, budgetAgencyTitleId))
    .orderBy(files.folder);

  if (!!foldersFromAgency || foldersFromAgency.length === 0) {
    foldersFromAgency = await db
      .selectDistinct({ folder: spendPlans.folder, folderId: spendPlans.folderId })
      .from(spendPlans)
      .where(eq(spendPlans.budgetAgencyTitleId, budgetAgencyTitleId))
      .orderBy(spendPlans.folder);
  }

  // Just some data sanity
  if (!foldersFromAgency || foldersFromAgency.length === 0) {
    throw new Error(`Agency "${budgetAgencyTitleId}" has not folder`);
  }
  else if (foldersFromAgency.length > 1) {
    throw new Error(`Agency "${budgetAgencyTitleId}" has more than 1 folder`);
  }

  return {
    budgetAgencyTitleId,
    budgetAgencyTitle:
      filesFromAgency?.at(0)?.budgetAgencyTitle || spendPlansFromAgency?.at(0)?.budgetAgencyTitle,
    fileCount: filesFromAgency?.length || 0,
    spendPlanCount: spendPlansFromAgency?.length || 0,
    folder: foldersFromAgency[0]
  };
};
export type AgencyDetailsResult = Awaited<ReturnType<typeof agencyDetails>>;

/**
 * Distinct bureaus with file counts (used for search options)
 */
export const bureaus = async function () {
  const fileBureaus = db
    .select({
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      fileCount: countDistinct(tafs.fileId).as('fileCount')
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .groupBy(
      tafs.budgetAgencyTitle,
      tafs.budgetAgencyTitleId,
      tafs.budgetBureauTitle,
      tafs.budgetBureauTitleId
    )
    .orderBy(tafs.budgetBureauTitle)
    .as('fileBureaus');

  const spendPlanBureaus = db
    .select({
      budgetAgencyTitle: spendPlans.budgetAgencyTitle,
      budgetAgencyTitleId: spendPlans.budgetAgencyTitleId,
      budgetBureauTitle: spendPlans.budgetBureauTitle,
      budgetBureauTitleId: spendPlans.budgetBureauTitleId,
      spendPlanCount: countDistinct(spendPlans.fileId).as('spendPlanCount')
    })
    .from(spendPlans)
    .where(isNotNull(spendPlans.budgetBureauTitle))
    .groupBy(
      spendPlans.budgetAgencyTitle,
      spendPlans.budgetAgencyTitleId,
      spendPlans.budgetBureauTitle,
      spendPlans.budgetBureauTitleId
    )
    .orderBy(spendPlans.budgetBureauTitle)
    .as('spendPlanBureaus');

  return (
    (await db
      .select({
        budgetAgencyTitle: sql`COALESCE(${fileBureaus.budgetAgencyTitle}, ${spendPlanBureaus.budgetAgencyTitle})`,
        budgetAgencyTitleId: sql`COALESCE(${fileBureaus.budgetAgencyTitleId}, ${spendPlanBureaus.budgetAgencyTitleId})`,
        budgetBureauTitle: sql`COALESCE(${fileBureaus.budgetBureauTitle}, ${spendPlanBureaus.budgetBureauTitle})`,
        budgetBureauTitleId: sql`COALESCE(${fileBureaus.budgetBureauTitleId}, ${spendPlanBureaus.budgetBureauTitleId})`,
        fileCount: sql`cast(COALESCE(${fileBureaus.fileCount}, 0) as int)`,
        spendPlanCount: sql`cast(COALESCE(${spendPlanBureaus.spendPlanCount}, 0) as int)`
      })
      .from(fileBureaus)
      .fullJoin(
        spendPlanBureaus,
        eq(fileBureaus.budgetBureauTitleId, spendPlanBureaus.budgetBureauTitleId)
      )) || []
  );
};
export type BureausResult = Awaited<ReturnType<typeof bureaus>>;

/**
 * Get bureaus for a specifc agency.
 */
export const bureausByAgency = async function (budgetAgencyTitleId: string) {
  const fileBureaus = db
    .select({
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      fileCount: countDistinct(tafs.fileId).as('fileCount')
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .where(eq(tafs.budgetAgencyTitleId, budgetAgencyTitleId))
    .groupBy(tafs.budgetBureauTitle, tafs.budgetBureauTitleId)
    .orderBy(tafs.budgetBureauTitle)
    .as('fileBureaus');

  const spendPlanBureaus = db
    .select({
      budgetBureauTitle: spendPlans.budgetBureauTitle,
      budgetBureauTitleId: spendPlans.budgetBureauTitleId,
      spendPlanCount: countDistinct(spendPlans.fileId).as('spendPlanCount')
    })
    .from(spendPlans)
    .where(
      and(
        eq(spendPlans.budgetAgencyTitleId, budgetAgencyTitleId),
        isNotNull(spendPlans.budgetBureauTitle)
      )
    )
    .groupBy(spendPlans.budgetBureauTitle, spendPlans.budgetBureauTitleId)
    .orderBy(spendPlans.budgetBureauTitle)
    .as('spendPlanBureaus');

  return (
    (await db
      .select({
        budgetBureauTitle: sql`COALESCE(${fileBureaus.budgetBureauTitle}, ${spendPlanBureaus.budgetBureauTitle})`,
        budgetBureauTitleId: sql`COALESCE(${fileBureaus.budgetBureauTitleId}, ${spendPlanBureaus.budgetBureauTitleId})`,
        fileCount: sql`cast(COALESCE(${fileBureaus.fileCount}, 0) as int)`,
        spendPlanCount: sql`cast(COALESCE(${spendPlanBureaus.spendPlanCount}, 0) as int)`
      })
      .from(fileBureaus)
      .fullJoin(
        spendPlanBureaus,
        eq(fileBureaus.budgetBureauTitleId, spendPlanBureaus.budgetBureauTitleId)
      )) || []
  );
};
export type BureausByAgencyResult = Awaited<ReturnType<typeof bureausByAgency>>;

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

  const spendPlansFromBureau = await db
    .selectDistinct({
      budgetBureauTitle: spendPlans.budgetBureauTitle,
      budgetBureauTitleId: spendPlans.budgetBureauTitleId,
      budgetAgencyTitle: spendPlans.budgetAgencyTitle,
      budgetAgencyTitleId: spendPlans.budgetAgencyTitleId,
      fileId: spendPlans.fileId
    })
    .from(spendPlans)
    .where(
      and(
        eq(spendPlans.budgetAgencyTitleId, budgetAgencyTitleId),
        eq(spendPlans.budgetBureauTitleId, budgetBureauTitleId)
      )
    );

  // If none found
  if (
    (!filesFromBureau || filesFromBureau.length === 0) &&
    (!spendPlansFromBureau || spendPlansFromBureau.length === 0)
  ) {
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
    budgetBureauTitle:
      filesFromBureau?.at(0)?.budgetBureauTitle || spendPlansFromBureau?.at(0)?.budgetBureauTitle,
    budgetBureauTitleId:
      filesFromBureau?.at(0)?.budgetBureauTitleId ||
      spendPlansFromBureau?.at(0)?.budgetBureauTitleId,
    budgetAgencyTitle:
      filesFromBureau?.at(0)?.budgetAgencyTitle || spendPlansFromBureau?.at(0)?.budgetAgencyTitle,
    budgetAgencyTitleId:
      filesFromBureau?.at(0)?.budgetAgencyTitleId ||
      spendPlansFromBureau?.at(0)?.budgetAgencyTitleId,
    fileCount: filesFromBureau?.length || 0,
    spendPlanCount: spendPlansFromBureau?.length || 0,
    agency
  };
};
export type BureauDetailsResult = Awaited<ReturnType<typeof bureauDetails>>;

// Memoized
export const mAgenciesWithChildren = memoizeDataAsync(agenciesWithChildren);
export const mAgencies = memoizeDataAsync(agencies);
export const mBureaus = memoizeDataAsync(bureaus);
