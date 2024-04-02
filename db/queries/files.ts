/**
 * Queries centered around files.
 *
 * TODO: Update these so that they don't select the sourceData column.
 * See: https://orm.drizzle.team/docs/goodies#get-typed-table-columns
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
 * Get simple file record given file id
 */
export const fileRecord = async function (fileId: string): Promise<typeof files.$inferSelect> {
  await dbConnect();
  const found = await db.select().from(files).where(eq(files.fileId, fileId));
  return found?.[0] || null;
};

/**
 * Get detailed record with tafs, lines, and footnotes
 */
export const fileDetails = async function (fileId: string) {
  await dbConnect();

  // Get file record
  const fileRecords = await db.select().from(files).where(eq(files.fileId, fileId));
  if (!fileRecords || fileRecords.length !== 1) {
    return null;
  }

  const fileRecord = fileRecords[0];

  // Get tafs records
  const tafsRecords = await db.select().from(tafs).where(eq(tafs.fileId, fileId));

  // Get lines records
  const linesRecords = await db
    .select()
    .from(lines)
    .where(eq(lines.fileId, fileId))
    .orderBy(lines.lineNumber, lines.lineSplit);

  // Get footnote records
  const footnotesRecords = await db
    .select()
    .from(footnotes)
    .where(eq(footnotes.fileId, fileId))
    .orderBy(footnotes.footnoteNumber);

  // Combine lines and footnotes
  const linesWithFootnotes = linesRecords.map((l) => {
    const footnotes = footnotesRecords.filter((f) => f.lineIndex === l.lineIndex);
    return {
      ...l,
      footnotes
    };
  });

  // Combined lines to tafs
  const tafsWithLines = tafsRecords.map((t) => {
    const lines = linesWithFootnotes.filter((l) => l.tafsTableId === t.tafsTableId);
    return {
      ...t,
      lines,
      iterations: []
    };
  });

  // Get iterations for each tafs
  for (const tafsRecord of tafsWithLines) {
    tafsRecord.iterations =
      (await db
        .select({
          fileId: tafs.fileId,
          tafsId: tafs.tafsId,
          fiscalYear: tafs.fiscalYear,
          iteration: tafs.iteration,
          tafsTableId: tafs.tafsTableId
        })
        .from(tafs)
        .where(and(eq(tafs.tafsId, tafsRecord.tafsId), eq(tafs.fiscalYear, tafsRecord.fiscalYear)))
        .orderBy(tafs.iteration)) || [];
  }

  // Combine all into files
  return {
    ...fileRecord,
    tafs: tafsWithLines,
    footnotes: uniqBy(footnotesRecords, 'footnoteNumber')
  };
};

/**
 * Recently approved.
 */
export const recentlyApproved = async function (limit: number = 20) {
  await dbConnect();
  return (await db.select().from(files).orderBy(desc(files.approvalTimestamp)).limit(limit)) || [];
};

/**
 * Recently removed.
 */
export const recentlyRemoved = async function (limit: number = 20) {
  await dbConnect();
  return (
    (await db
      .select()
      .from(files)
      .where(eq(files.removed, true))
      .orderBy(desc(files.approvalTimestamp))
      .limit(limit)) || []
  );
};

/**
 * Distinct folders with file counts
 */
export const folders = async function () {
  await dbConnect();
  return (
    (await db
      .select({ folder: files.folder, folderId: files.folderId, count: count(files.fileId) })
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
