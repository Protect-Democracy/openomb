/**
 * Queries centered around files.
 */

// Dependencies
import { eq, countDistinct, sql } from 'drizzle-orm';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { spendPlans } from '$schema/spend-plans';
import { memoizeDataAsync } from '$server/cache';
/**
 * Distinct folders with file counts
 */
export const folders = async function () {
  const fileFolders = db
    .select({
      folder: files.folder,
      folderId: files.folderId,
      fileCount: countDistinct(files.fileId).as('fileCount')
    })
    .from(files)
    .groupBy(files.folder, files.folderId)
    .orderBy(files.folder)
    .as('fileFolders');

  const spendPlanFolders = db
    .select({
      folder: spendPlans.folder,
      folderId: spendPlans.folderId,
      spendPlanCount: countDistinct(spendPlans.fileId).as('spendPlanCount')
    })
    .from(spendPlans)
    .groupBy(spendPlans.folder, spendPlans.folderId)
    .orderBy(spendPlans.folder)
    .as('spendPlanFolders');

  return (
    (await db
      .select({
        folder: sql`COALESCE(${fileFolders.folder}, ${spendPlanFolders.folder})`,
        folderId: sql`COALESCE(${fileFolders.folderId}, ${spendPlanFolders.folderId})`,
        fileCount: sql`cast(COALESCE(${fileFolders.fileCount}, 0) as int)`,
        spendPlanCount: sql`cast(COALESCE(${spendPlanFolders.spendPlanCount}, 0) as int)`
      })
      .from(fileFolders)
      .fullJoin(spendPlanFolders, eq(fileFolders.folderId, spendPlanFolders.folderId))) || []
  );
};
export type FoldersResult = Awaited<ReturnType<typeof folders>>;

/**
 * Get details of a single folder.
 */
export const folderDetails = async function (folderId: string) {
  const filesFromFolder = await db
    .select({ folder: files.folder })
    .from(files)
    .where(eq(files.folderId, folderId));

  const spendPlansFromFolder = await db
    .select({ folder: spendPlans.folder })
    .from(spendPlans)
    .where(eq(spendPlans.folderId, folderId));

  // If none found
  if (
    (!filesFromFolder || filesFromFolder.length === 0) &&
    (!spendPlansFromFolder || spendPlansFromFolder.length === 0)
  ) {
    return null;
  }

  return {
    folderId,
    folder: filesFromFolder?.at(0)?.folder || spendPlansFromFolder?.at(0)?.folder,
    fileCount: filesFromFolder?.length || 0,
    spendPlanCount: spendPlansFromFolder?.length || 0
  };
};
export type FolderDetailsResult = Awaited<ReturnType<typeof folderDetails>>;

// Memoized
export const mFolders = memoizeDataAsync(folders);
