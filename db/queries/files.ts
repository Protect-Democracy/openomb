/**
 * Queries centered around files.
 */

// Dependencies
import { eq, gte, desc, asc, count, and, isNull, inArray } from 'drizzle-orm';
import { db, dbConnect } from '../connection';
import { files } from '../schema/files';
import { tafs } from '../schema/tafs';
import { uniqBy, flatten, orderBy, omit } from 'lodash-es';
import { subDays, startOfWeek, startOfDay } from 'date-fns';

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
        tafsTableId: tafs.tafsTableId,
        approvalTimestamp: files.approvalTimestamp
      })
      .from(tafs)
      .leftJoin(files, eq(tafs.fileId, files.fileId))
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
 * Recently approved with tafs with optional filters.
 */
export const recentlyApprovedWithTafs = async function (
  limit: number = 20,
  filters?: { folderId?: string; agencyId?: string; bureauId?: string }
) {
  await dbConnect();

  // Check that we have both agency and bureau if bureau provided
  if (filters?.bureauId && !filters?.agencyId) {
    throw new Error('Must provide both agency and bureau identifiers.');
  }

  // This doesn't seem like the best way to do this, i.e. with subqueries and IN, but doesn't seem like
  // you can limit the top level findMany based on joined (with) where.  We could do a manualy query, but
  // the findMany and with paradigm creates a preferred way and output.
  const findFilesByTafsFiltersQuery = db
    .selectDistinct({ fileId: tafs.fileId })
    .from(tafs)
    .where(
      filters?.bureauId
        ? and(
            eq(tafs.budgetAgencyTitleId, filters?.agencyId || ''),
            eq(tafs.budgetBureauTitleId, filters?.bureauId || '')
          )
        : eq(tafs.budgetAgencyTitleId, filters?.agencyId || '')
    );

  const tafsFilters = filters?.agencyId || filters?.bureauId;
  const where =
    filters?.folderId && tafsFilters
      ? and(
          eq(files.folderId, filters?.folderId),
          inArray(files.fileId, findFilesByTafsFiltersQuery)
        )
      : filters?.folderId
        ? eq(files.folderId, filters?.folderId)
        : tafsFilters
          ? inArray(files.fileId, findFilesByTafsFiltersQuery)
          : undefined;

  const recentFiles = await db.query.files.findMany({
    columns: { sourceData: false },
    where: where,
    with: {
      tafs: {
        orderBy: (tafs, { asc }) => [asc(tafs.tafsTableId)]
      }
    },
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
 * File statistics
 */
export const fileStats = async function () {
  await dbConnect();
  const now = new Date();

  // Set date to start of week, get files approved since
  const dateWeek = startOfWeek(new Date());
  const filesApprovedThisWeek = db
    .select({ fileCount: count(files.fileId) })
    .from(files)
    .where(gte(files.approvalTimestamp, dateWeek));

  // Set date to week ago, get files approved since
  const weekAgo = startOfDay(subDays(new Date(), 7));
  const filesApprovedPastWeek = db
    .select({ fileCount: count(files.fileId) })
    .from(files)
    .where(gte(files.approvalTimestamp, weekAgo));

  // Set date to start of month, get files approved since
  const dateMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const filesApprovedThisMonth = db
    .select({ fileCount: count(files.fileId) })
    .from(files)
    .where(gte(files.approvalTimestamp, dateMonth));

  // Get files for the current fiscal year
  const filesCurrentFiscalYear = db
    .select({ fileCount: count(files.fileId) })
    .from(files)
    .where(eq(files.fiscalYear, now.getFullYear()));

  return {
    filesApprovedThisWeek: (await filesApprovedThisWeek)?.at(0)?.fileCount,
    filesApprovedPastWeek: (await filesApprovedPastWeek)?.at(0)?.fileCount,
    filesApprovedThisMonth: (await filesApprovedThisMonth)?.at(0)?.fileCount,
    filesCurrentFiscalYear: (await filesCurrentFiscalYear)?.at(0)?.fileCount
  };
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

/**
 * Get files without any tafs entries (i.e. not agencies)
 */
export const filesWithoutTafs = async function (folderId: string | undefined = undefined) {
  await dbConnect();

  const where = folderId
    ? and(eq(files.folderId, folderId), isNull(tafs.fileId))
    : isNull(tafs.fileId);

  const foundFiles = await db
    .select()
    .from(files)
    .leftJoin(tafs, eq(files.fileId, tafs.fileId))
    .where(where)
    .orderBy(desc(files.approvalTimestamp));

  return foundFiles ? foundFiles.map((f) => f.files) : null;
};
