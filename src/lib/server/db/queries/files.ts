/**
 * Queries centered around files.
 */

// Dependencies
import {
  eq,
  gte,
  asc,
  count,
  countDistinct,
  and,
  or,
  isNull,
  inArray,
  sql,
  isNotNull
} from 'drizzle-orm';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { uniqBy, uniq, flatten, orderBy, omit } from 'lodash-es';
import { DateTime } from 'luxon';
import { memoizeDataAsync } from '$server/cache';
import { apportionmentTypeStandard } from '$config/files';

/**
 * Pull a unique, ordered footnotes array out of a file's nested tafs/lines.
 */
function computeUniqFootnotes(file: {
  tafs: Array<{ lines: Array<{ footnotes: Record<string, unknown>[] }> }>;
}) {
  return orderBy(
    uniqBy(
      flatten(flatten(file.tafs.map((t) => t.lines)).map((l) => l.footnotes)),
      'footnoteNumber'
    ).map((f) => omit(f, 'lineIndex')),
    'footnoteNumber'
  );
}

/**
 * Get simple file record given file id
 */
export const fileRecord = async function (fileId: string): Promise<typeof files.$inferSelect> {
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

  // Get iteration history for every tafs row on this file in a single batched
  // query, rather than one query per tafs row. Scoping by fiscalYear (shared
  // by every tafs row on this file, per the tafs row's own value -- taken
  // from the first row since it's guaranteed identical across all of them,
  // see src/lib/server/load-file.ts) is safe and reproduces the original
  // per-row eq(tafsId)+eq(fiscalYear) filter without a query per row.
  const uniqueTafsIds = uniq((file.tafs || []).map((t) => t.tafsId));
  const fiscalYear = file.tafs?.[0]?.fiscalYear;
  const allIterations =
    uniqueTafsIds.length && fiscalYear !== undefined
      ? await db
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
          .where(and(inArray(tafs.tafsId, uniqueTafsIds), eq(tafs.fiscalYear, fiscalYear)))
          .orderBy(asc(tafs.tafsId), asc(tafs.iteration))
      : [];

  const iterationsByTafsId = new Map<string, typeof allIterations>();
  for (const iter of allIterations) {
    if (!iterationsByTafsId.has(iter.tafsId)) {
      iterationsByTafsId.set(iter.tafsId, []);
    }
    iterationsByTafsId.get(iter.tafsId)?.push(iter);
  }

  const tafsWithIterations = (file.tafs || []).map((t) => ({
    ...t,
    iterations: iterationsByTafsId.get(t.tafsId) ?? []
  }));

  // Attach footnotes as a top level property
  return {
    ...file,
    tafs: tafsWithIterations,
    footnotes: computeUniqFootnotes(file)
  };
};

/**
 * Batched fetch of tafs/lines/footnotes for a set of file ids. Used where a
 * caller needs several files' schedule data at once (e.g. "previous
 * iteration" lookups) and doesn't need the per-tafs `iterations` history that
 * fileDetails() attaches -- that history isn't consumed when rendering a
 * previous iteration's TAFS row or footnotes.
 *
 * @param fileIds Ids of the files to fetch
 * @param includeSourceData Include source data with response
 * @returns Map of fileId to file details, containing only ids that were found
 */
export const fileTafsFootnotesByIds = async function (
  fileIds: string[],
  includeSourceData: boolean = false
) {
  const uniqueFileIds = uniq(fileIds);
  if (!uniqueFileIds.length) {
    return new Map();
  }

  const rows = await db.query.files.findMany({
    columns: includeSourceData ? undefined : { sourceData: false },
    where: inArray(files.fileId, uniqueFileIds),
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

  return new Map(rows.map((row) => [row.fileId, { ...row, footnotes: computeUniqFootnotes(row) }]));
};

/**
 * Recently approved.
 */
export const recentlyApproved = async function (limit: number = 20) {
  const recentFiles = await db.query.files.findMany({
    columns: { sourceData: false },
    orderBy: sql`COALESCE(${files.approvalTimestamp}, ${files.createdAt}) DESC NULLS LAST`,
    limit: limit
  });

  return recentFiles || [];
};

/**
 * Recently approved with tafs with optional filters.
 */
export const recentlyApprovedWithTafs = async function (
  limit: number = 20,
  filters?: { folderId?: string; approverId?: string; agencyId?: string; bureauId?: string }
) {
  // Check that we have both agency and bureau if bureau provided
  if (filters?.bureauId && !filters?.agencyId) {
    throw new Error('Must provide both agency and bureau identifiers.');
  }

  // This doesn't seem like the best way to do this, i.e. with subqueries and IN, but doesn't seem like
  // you can limit the top level findMany based on joined (with) where.  We could do a manual query, but
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
  const whereClauses = [
    tafsFilters ? inArray(files.fileId, findFilesByTafsFiltersQuery) : undefined,
    filters?.folderId ? eq(files.folderId, filters?.folderId) : undefined,
    filters?.approverId ? eq(files.approverTitleId, filters?.approverId) : undefined
  ].filter((w) => w !== undefined);
  const where =
    whereClauses.length === 1
      ? whereClauses[0]
      : whereClauses.length > 1
        ? and(...whereClauses)
        : undefined;

  const recentFiles = await db.query.files.findMany({
    columns: { sourceData: false },
    where: where,
    with: {
      tafs: {
        orderBy: (tafs, { asc }) => [asc(tafs.tafsTableId)]
      }
    },
    orderBy: sql`COALESCE(${files.approvalTimestamp}, ${files.createdAt}) DESC NULLS LAST`,
    limit: limit
  });

  return recentFiles || [];
};

/**
 * Recently added or approved with tafs (with optional filters).
 */
export const recentlyAddedOrApprovedWithTafs = async function (
  limit: number = 20,
  filters?: { folderId?: string; approverId?: string; agencyId?: string; bureauId?: string }
) {
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
  const whereClauses = [
    tafsFilters
      ? or(
          inArray(files.fileId, findFilesByTafsFiltersQuery),
          filters?.bureauId
            ? and(
                eq(files.budgetAgencyTitleId, filters?.agencyId),
                eq(files.budgetBureauTitleId, filters?.bureauId)
              )
            : eq(files.budgetAgencyTitleId, filters?.agencyId)
        )
      : undefined,
    filters?.folderId ? eq(files.folderId, filters?.folderId) : undefined,
    filters?.approverId ? eq(files.approverTitleId, filters?.approverId) : undefined
  ].filter((w) => w !== undefined);
  const where =
    whereClauses.length === 1
      ? whereClauses[0]
      : whereClauses.length > 1
        ? and(...whereClauses)
        : undefined;

  const recentFiles = await db.query.files.findMany({
    columns: { sourceData: false },
    where: where,
    with: {
      tafs: {
        orderBy: (tafs, { asc }) => [asc(tafs.tafsTableId)]
      }
    },
    orderBy: sql`COALESCE(${files.approvalTimestamp}, ${files.createdAt}) DESC NULLS LAST`,
    limit: limit
  });

  return recentFiles || [];
};

export type RecentlyAddedOrApprovedWithTafsResult = Awaited<
  ReturnType<typeof recentlyAddedOrApprovedWithTafs>
>;

/**
 * Recently removed.
 */
export const recentlyRemoved = async function (limit: number = 20) {
  const removedFiles = await db.query.files.findMany({
    columns: { sourceData: false },
    where: eq(files.removed, true),
    orderBy: sql`COALESCE(${files.approvalTimestamp}, ${files.createdAt}) DESC NULLS LAST`,
    limit: limit
  });

  return removedFiles || [];
};

/**
 * File statistics
 */
export const fileStats = async function () {
  const now = new Date();

  // Set date to start of week, get files approved since
  const dateWeek = DateTime.now().startOf('week').toJSDate();
  const filesApprovedThisWeek = db
    .select({ fileCount: count(files.fileId) })
    .from(files)
    .where(gte(files.approvalTimestamp, dateWeek));

  // Set date to week ago, get files approved since
  const weekAgo = DateTime.now().plus({ days: -7 }).startOf('day').toJSDate();
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
 * Distinct approvers with file counts
 */
export const approvers = async function () {
  return (
    (await db
      .select({ approverTitle: files.approverTitle, count: countDistinct(files.fileId) })
      .from(files)
      .groupBy(files.approverTitle)
      .orderBy(files.approverTitle)) || []
  );
};
export type ApproversResult = Awaited<ReturnType<typeof approvers>>;

/**
 * Details for specific approver.
 *
 */
export const approverDetails = async function (approverTitleId: string) {
  const filesFromApprover = await db
    .select({ approverTitle: files.approverTitle })
    .from(files)
    .where(eq(files.approverTitleId, approverTitleId));

  // If none found
  if (!filesFromApprover || filesFromApprover.length === 0) {
    return null;
  }

  return {
    approverTitleId,
    approverTitle: filesFromApprover[0].approverTitle,
    fileCount: filesFromApprover.length
  };
};
export type ApproverDetailsResult = Awaited<ReturnType<typeof approverDetails>>;

/**
 * Get files without any tafs entries (i.e. not agencies)
 */
export const filesWithoutTafs = async function (folderId: string | undefined = undefined) {
  const where = folderId
    ? and(
        eq(files.folderId, folderId),
        isNull(tafs.fileId),
        eq(files.fileType, apportionmentTypeStandard)
      )
    : and(isNull(tafs.fileId), eq(files.fileType, apportionmentTypeStandard));

  const foundFiles = await db
    .select()
    .from(files)
    .leftJoin(tafs, eq(files.fileId, tafs.fileId))
    .where(where)
    .orderBy(sql`COALESCE(${files.approvalTimestamp}, ${files.createdAt}) DESC NULLS LAST`);

  return foundFiles ? foundFiles.map((f) => f.files) : null;
};

/**
 * All files
 */
export const allFiles = async function () {
  return await db
    .select({ fileId: files.fileId, createdAt: files.createdAt })
    .from(files)
    .orderBy(sql`COALESCE(${files.approvalTimestamp}, ${files.createdAt}) DESC NULLS LAST`);
};

/**
 * Count of files by month and year with optional filters.
 */
export const fileCountByMonthByYear = async function (filters?: {
  folderId?: string;
  approverId?: string;
  agencyId?: string;
  bureauId?: string;
}) {
  // Check that we have both agency and bureau if bureau provided
  if (filters?.bureauId && !filters?.agencyId) {
    throw new Error('Must provide both agency and bureau identifiers.');
  }

  // Sub query to be able to search by tafs agency/bureau
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
  const whereClauses = [
    isNotNull(files.approvalTimestamp),
    tafsFilters ? inArray(files.fileId, findFilesByTafsFiltersQuery) : undefined,
    filters?.folderId ? eq(files.folderId, filters?.folderId) : undefined,
    filters?.approverId ? eq(files.approverTitleId, filters?.approverId) : undefined
  ].filter((w) => w !== undefined);
  const where =
    whereClauses.length === 1
      ? whereClauses[0]
      : whereClauses.length > 1
        ? and(...whereClauses)
        : undefined;

  // TODO: This doesn't account for files without approval timestamp (i.e. spend plans)
  const counts = await db
    .select({
      year: sql<number>`DATE_PART('year', ${files.approvalTimestamp})`.as('year'),
      month: sql<number>`DATE_PART('month', ${files.approvalTimestamp})`.as('month'),
      fileCount: count(files.fileId).as('fileCount')
    })
    .from(files)
    .where(where)
    .groupBy(sql`year`, sql`month`)
    .orderBy(sql`year`, sql`month`);

  return counts || [];
};

// Memoized
export const mFileStats = memoizeDataAsync(fileStats);
export const mAllFiles = memoizeDataAsync(allFiles);
export const mFilesWithoutTafs = memoizeDataAsync(filesWithoutTafs);
export const mRecentlyApprovedWithTafs = memoizeDataAsync(recentlyApprovedWithTafs);
export const mRecentlyAddedOrApprovedWithTafs = memoizeDataAsync(recentlyAddedOrApprovedWithTafs);
export const mFileCountByMonthByYear = memoizeDataAsync(fileCountByMonthByYear);
