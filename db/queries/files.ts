/**
 * Queries centered around files.
 */

// Dependencies
import { eq, desc, asc, count, and } from 'drizzle-orm';
import { db, dbConnect } from '../connection';
import { files } from '../schema/files';
import { tafs } from '../schema/tafs';
import { uniqBy, flatten, orderBy, omit } from 'lodash-es';

/**
 * Get simple file record given file id
 */
export const fileRecord = async function (fileId: string): Promise<typeof files.$inferSelect> {
  await dbConnect();
  const found = await db.select().from(files).where(eq(files.fileId, fileId));
  return found?.[0] || null;
};

/**
 * Get detailed record with tafs, lines, and footnotes.
 *
 * Adds iterations to tafs data and a unique footnotes array to
 * top-level object.
 *
 * @param fileId Id of the file
 * @param includeSourceData Include source data with response
 */
export const fileDetails = async function (fileId: string, includeSourceData: boolean = false) {
  await dbConnect();

  // Get file record
  const file = await db.query.files.findFirst({
    where: eq(files.fileId, fileId),
    columns: includeSourceData
      ? undefined
      : {
          sourceData: false
        },
    with: {
      tafs: {
        orderBy: (tafs, { asc }) => [asc(tafs.tafsTableId)],
        with: {
          lines: {
            orderBy: (lines, { asc }) => [asc(lines.lineNumber)],
            with: {
              footnotes: {
                orderBy: (footnotes, { asc }) => [asc(footnotes.footnoteNumber)]
              }
            }
          }
        }
      }
    }
  });

  // Check that we found something
  if (!file) {
    return null;
  }

  // Include references to iterations
  const tafsWithIterations = file.tafs || [];
  for (const t of tafsWithIterations) {
    t.iterations = await db
      .select({
        fileId: tafs.fileId,
        tafsId: tafs.tafsId,
        fiscalYear: tafs.fiscalYear,
        iteration: tafs.iteration,
        tafsTableId: tafs.tafsTableId
      })
      .from(tafs)
      .where(and(eq(tafs.tafsId, t.tafsId), eq(tafs.fiscalYear, t.fiscalYear)))
      .orderBy(asc(tafs.iteration));
  }

  // Pull out footnotes
  const uniqFootnotes = orderBy(
    uniqBy(
      flatten(flatten(file.tafs.map((t) => t.lines)).map((l) => l.footnotes)),
      'footnoteNumber'
    ).map((f) => omit(f, 'lineIndex')),
    'footnoteNumber'
  );

  // Attach footnotes as a top level property
  return {
    ...file,
    tafs: tafsWithIterations,
    footnotes: uniqFootnotes
  };
};

/**
 * Recently approved.
 */
export const recentlyApproved = async function (limit: number = 20) {
  await dbConnect();

  const recentFiles = await db.query.files.findMany({
    columns: { sourceData: false },
    orderBy: desc(files.approvalTimestamp),
    limit: limit
  });

  return recentFiles || [];
};

/**
 * Recently removed.
 */
export const recentlyRemoved = async function (limit: number = 20) {
  await dbConnect();

  const removedFiles = await db.query.files.findMany({
    columns: { sourceData: false },
    where: eq(files.removed, true),
    orderBy: desc(files.approvalTimestamp),
    limit: limit
  });

  return removedFiles || [];
};

/**
 * Distinct folders with file counts
 */
export const folders = async function () {
  await dbConnect();
  return (
    (await db
      .select({ folder: files.folder, folderId: files.folderId, fileCount: count(files.fileId) })
      .from(files)
      .groupBy(files.folder, files.folderId)
      .orderBy(files.folder)) || []
  );
};

/**
 * Distinct approvers with file counts
 */
export const approvers = async function () {
  await dbConnect();
  return (
    (await db
      .select({ approverTitle: files.approverTitle, count: count(files.fileId) })
      .from(files)
      .groupBy(files.approverTitle)
      .orderBy(files.approverTitle)) || []
  );
};

/**
 * Get details of a single folder.
 */
export const folderDetails = async function (folderId: string) {
  await dbConnect();
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
