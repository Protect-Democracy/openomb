/**
 * Queries centered around files.
 */

// Dependencies
import { eq, countDistinct } from 'drizzle-orm';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { memoizeDataAsync } from '$server/cache';
import { reduceByFileType } from '$server/query-utilities';

/**
 * Distinct folders with file counts
 */
export const folders = async function () {
  const folders =
    (await db
      .select({
        folder: files.folder,
        folderId: files.folderId,
        fileType: files.fileType,
        fileCount: countDistinct(files.fileId)
      })
      .from(files)
      .groupBy(files.folder, files.folderId, files.fileType)
      .orderBy(files.folder)) || [];

  return reduceByFileType(folders);
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

  // If none found
  if (!filesFromFolder || filesFromFolder.length === 0) {
    return null;
  }

  return {
    folderId,
    folder: filesFromFolder[0].folder,
    fileCount: filesFromFolder.length
  };
};
export type FolderDetailsResult = Awaited<ReturnType<typeof folderDetails>>;

// Memoized
export const mFolders = memoizeDataAsync(folders);
