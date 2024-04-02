/**
 * Queries centered around tafs.
 */

// Dependencies
import { eq, desc, count, and } from 'drizzle-orm';
import { db, dbConnect } from '../connection';
import { files } from '../schema/files';
import { tafs } from '../schema/tafs';
import { lines } from '../schema/lines';
import { footnotes } from '../schema/footnotes';
import { uniqBy } from 'lodash-es';

/**
 * Get agencies for a specifc folder (file)
 */
export const agenciesByFolder = async function (folderId: string) {
  return db
    .select({
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      fileCount: count(tafs.fileId)
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
  await dbConnect();
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

  return {
    budgetAgencyTitleId,
    budgetAgencyTitle: filesFromAgency[0].budgetAgencyTitle,
    fileCount: filesFromAgency.length
  };
};

/**
 * Get bureaus for a specifc agency.
 */
export const bureausByAgency = async function (budgetAgencyTitleId: string) {
  return db
    .select({
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      fileCount: count(tafs.fileId)
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .where(eq(tafs.budgetAgencyTitleId, budgetAgencyTitleId))
    .groupBy(tafs.budgetBureauTitle, tafs.budgetBureauTitleId)
    .orderBy(tafs.budgetBureauTitle);
  return [];
};
