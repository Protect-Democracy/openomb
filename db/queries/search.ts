import { db, dbConnect } from '../connection';
import { files } from '../schema/files';
import { tafs } from '../schema/tafs';
import { lines } from '../schema/lines';
import { footnotes } from '../schema/footnotes';
import { tafsSort, fileSort } from '$config/search';
import { ilike, and, or, sql, eq, gte, lte, isNotNull, count, exists, not } from 'drizzle-orm';
import assert from 'assert';

export type SearchParams = {
  term: string;
  tafs: string;
  agency: string;
  bureau: string;
  account: string;
  approver: string;
  approvedStart: Date | string;
  approvedEnd: Date | string;
  year: number | string;
  lineNum: string;
  footnoteNum: string;
};

export type PaginationParams = {
  offset: number;
  limit: number;
  sort: string;
};

/**
 * Return only footnotes that are relevant to search criterion
 *  - Footnote number overrides content search
 * These filters need to remain consistent between calls (and cannot
 *    conditionally add criterion) in order to leverage prepared statements
 */
function getFootnoteResults() {
  return db
    .select()
    .from(footnotes)
    .where(
      and(
        // Content Search
        or(
          ilike(footnotes.footnoteText, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),

          // Allow for footnote number override
          not(eq(sql.placeholder('footnoteNum'), ''))
        ),
        // Footnote Number Filter
        or(
          eq(sql.placeholder('footnoteNum'), ''),
          and(
            isNotNull(footnotes.footnoteText),
            ilike(
              footnotes.footnoteNumber,
              sql`concat(${sql.placeholder('footnoteNum')}::text, '%')`
            )
          )
        )
      )
    )
    .as('filtered_footnotes');
}

/**
 * Return only lines that are relevant to search criterion
 *  - Line number and footnote number override content search
 *  - Line number does not override footnote number (and vice versa)
 * These filters need to remain consistent between calls (and cannot
 *    conditionally add criterion) in order to leverage prepared statements
 */
function getLineResults() {
  const footnoteResults = getFootnoteResults();

  return db
    .select()
    .from(lines)
    .where(
      and(
        // Content Search
        or(
          ilike(lines.lineDescription, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),

          // Content Search on footnote
          exists(
            db
              .select()
              .from(footnoteResults)
              .where(
                and(
                  eq(footnoteResults.fileId, lines.fileId),
                  eq(footnoteResults.lineIndex, lines.lineIndex),
                  ilike(
                    footnoteResults.footnoteText,
                    sql`concat('%', ${sql.placeholder('term')}::text, '%')`
                  )
                )
              )
          ),

          // Allow for line number and footnote number override
          not(eq(sql.placeholder('lineNum'), '')),
          not(eq(sql.placeholder('footnoteNum'), ''))
        ),
        // Line Number Filter
        or(
          eq(sql.placeholder('lineNum'), ''),
          and(
            eq(
              lines.lineNumber,
              sql`any(string_to_array(${sql.placeholder('lineNum')}, ',')::varchar[])`
            ),
            or(isNotNull(lines.approvedAmount), isNotNull(lines.lineDescription))
          )
        ),

        // If filtering on footnote number, must have footnote
        or(
          eq(sql.placeholder('footnoteNum'), ''),
          exists(
            db
              .select()
              .from(footnoteResults)
              .where(
                and(
                  eq(footnoteResults.fileId, lines.fileId),
                  eq(footnoteResults.lineIndex, lines.lineIndex)
                )
              )
          )
        )
      )
    )
    .as('filtered_lines');
}

/**
 * Return only TAFS that are relevant to search criterion
 * - Some content must match content search (if provided)
 * These filters need to remain consistent between calls (and cannot
 *    conditionally add criterion) in order to leverage prepared statements
 */
function getTafsResults() {
  const lineResults = getLineResults();

  return db
    .select()
    .from(tafs)
    .where(
      and(
        // Content Search
        or(
          ilike(tafs.accountTitle, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
          ilike(tafs.budgetAgencyTitle, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
          ilike(tafs.budgetBureauTitle, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
          ilike(tafs.cgacAcct, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
          ilike(tafs.cgacAgency, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),

          // Content Search on lines/footnotes
          exists(
            db
              .select()
              .from(lineResults)
              .where(
                and(
                  eq(lineResults.fileId, tafs.fileId),
                  eq(lineResults.tafsTableId, tafs.tafsTableId),
                  ilike(
                    lineResults.lineDescription,
                    sql`concat('%', ${sql.placeholder('term')}::text, '%')`
                  )
                )
              )
          )
        ),
        // TAFS Filter
        ilike(tafs.tafsId, sql`concat('%', ${sql.placeholder('tafs')}::text, '%')`),
        // Agency Filter
        or(
          eq(sql.placeholder('agency'), ''),
          eq(tafs.budgetAgencyTitleId, sql.placeholder('agency'))
        ),
        // Bureau Filter
        or(
          eq(sql.placeholder('bureau'), ''),
          eq(tafs.budgetBureauTitleId, sql.placeholder('bureau'))
        ),
        // Account Filter
        ilike(tafs.accountTitle, sql`concat('%', ${sql.placeholder('account')}::text, '%')`),

        // If filtering on Line or Footnote, must have line
        or(
          and(eq(sql.placeholder('lineNum'), ''), eq(sql.placeholder('footnoteNum'), '')),
          exists(
            db
              .select()
              .from(lineResults)
              .where(
                and(
                  eq(lineResults.fileId, tafs.fileId),
                  eq(lineResults.tafsTableId, tafs.tafsTableId)
                )
              )
          )
        )
      )
    )
    .as('filtered_tafs');
}

/**
 * Return only files that are relevant to search criterion
 * - Some content must match content search (if provided)
 * These filters need to remain consistent between calls (and cannot
 *    conditionally add criterion) in order to leverage prepared statements
 */
function getFileResults() {
  return db
    .select()
    .from(files)
    .where(
      and(
        // Year Filter
        or(eq(sql.placeholder('year'), 0), eq(files.fiscalYear, sql.placeholder('year'))),
        // Approved By Filter
        ilike(files.approverTitle, sql`concat('%', ${sql.placeholder('approver')}::text, '%')`),
        // Approval Date Filter
        and(
          or(
            eq(sql.placeholder('approvedStart'), ''),
            gte(files.approvalTimestamp, sql.placeholder('approvedStart'))
          ),
          or(
            eq(sql.placeholder('approvedEnd'), ''),
            lte(files.approvalTimestamp, sql.placeholder('approvedEnd'))
          )
        )
      )
    )
    .as('filtered_files');
}

/**
 * Get number of files overall based on the provided search criterion
 */
export async function fileCountByCriterion(searchParams: SearchParams): Promise<number> {
  await dbConnect();
  // Assertions
  assert(searchParams.year !== '', 'year cannot be empty string');
  assert(searchParams.approvedStart !== '', 'approvedStart cannot be empty string');
  assert(searchParams.approvedEnd !== '', 'approvedEnd cannot be empty string');

  const fileResults = getFileResults();
  const tafsResults = getTafsResults();

  // Prepared statement to get result count
  const countQuery = db
    .select({ count: count() })
    .from(fileResults)
    .where(exists(db.select().from(tafsResults).where(eq(tafsResults.fileId, fileResults.fileId))))
    .prepare('search_count_files');

  const results = await countQuery.execute(searchParams);

  return results && results.length ? results[0].count : 0;
}

/**
 * Get number of files overall based on the provided search criterion
 */
export async function tafsCountByCriterion(searchParams: SearchParams): Promise<number> {
  await dbConnect();
  // Assertions
  assert(searchParams.year !== '', 'year cannot be empty string');
  assert(searchParams.approvedStart !== '', 'approvedStart cannot be empty string');
  assert(searchParams.approvedEnd !== '', 'approvedEnd cannot be empty string');

  const tafsResults = getTafsResults();
  const fileResults = getFileResults();

  // Prepared statement to get result count
  const countQuery = db
    .select({ count: count() })
    .from(tafsResults)
    .where(exists(db.select().from(fileResults).where(eq(tafsResults.fileId, fileResults.fileId))))
    .prepare('search_count_tafs');

  const results = await countQuery.execute(searchParams);

  return results && results.length ? results[0].count : 0;
}

/**
 * Get subset of files that match provided search criterion and
 *  offset for pagination
 */
export async function filesByCriterion(searchParams: SearchParams & PaginationParams) {
  await dbConnect();
  // Assertions
  assert(searchParams.year !== '', 'year cannot be empty string');
  assert(searchParams.approvedStart !== '', 'approvedStart cannot be empty string');
  assert(searchParams.approvedEnd !== '', 'approvedEnd cannot be empty string');

  // SQL partials for filtering
  const fileResults = getFileResults();
  const tafsResults = getTafsResults();

  const sortKey = searchParams.sort || 'approved_desc';

  if (tafsSort[searchParams.sort]) {
    // Sorting by tafs column
    const sortedTafs = db
      .select()
      .from(tafsResults)
      .orderBy(tafsSort[sortKey].sort(tafsResults))
      .as('sorted_tafs');

    // Get our paginated (limited) list of file ids based on tafs order
    const paginatedFiles = db
      .selectDistinctOn([sortedTafs.fileId])
      .from(sortedTafs)
      .where(exists(db.select().from(fileResults).where(eq(sortedTafs.fileId, fileResults.fileId))))
      .offset(sql.placeholder('offset'))
      .limit(sql.placeholder('limit'))
      .as('paginated_files');

    // Get our tafs results for the paginated files
    const searchStatement = db
      .select()
      .from(sortedTafs)
      .innerJoin(fileResults, eq(sortedTafs.fileId, fileResults.fileId))
      .where(
        exists(db.select().from(paginatedFiles).where(eq(sortedTafs.fileId, paginatedFiles.fileId)))
      )
      .prepare(`search_results_tafs_${sortKey}`);

    const results = await searchStatement.execute(searchParams);

    // Return an array of files containing grouped tafs
    const sortedFiles: Array<
      (typeof results)[0]['filtered_files'] & {
        tafs: Array<(typeof results)[0]['sorted_tafs']>;
      }
    > = [];
    results.forEach((result) => {
      const file = sortedFiles.find((f) => f.fileId == result.filtered_files.fileId);
      if (file) {
        file.tafs.push(result.sorted_tafs);
      }
      else {
        sortedFiles.push({
          ...result.filtered_files,
          tafs: [result.sorted_tafs]
        });
      }
    });
    return sortedFiles;
  }

  // Sorting by file column
  // Prepared Statement to perform search
  const searchStatement = db.query.files
    .findMany({
      columns: {
        fileId: true,
        folder: true,
        fileName: true,
        approverTitle: true,
        approvalTimestamp: true,
        fiscalYear: true
      },
      where: and(
        exists(db.select().from(fileResults).where(eq(files.fileId, fileResults.fileId))),
        exists(db.select().from(tafsResults).where(eq(tafsResults.fileId, files.fileId)))
      ),
      orderBy: fileSort[sortKey].sort(files),
      with: {
        tafs: {
          // Fetch associated relevant tafs and lines (with footnotes)
          where: exists(
            db
              .select()
              .from(tafsResults)
              .where(
                and(
                  eq(tafsResults.fileId, sql`"files_tafs"."file_id"`),
                  eq(tafsResults.tafsTableId, sql`"files_tafs"."tafs_table_id"`)
                )
              )
          )
        }
      },
      offset: sql.placeholder('offset'),
      limit: sql.placeholder('limit')
    })
    .prepare(`search_results_file_${sortKey}`);

  return await searchStatement.execute(searchParams);
}

/**
 * Get all existing fiscal year values
 */
export async function yearOptions() {
  await dbConnect();
  const yearOptions = await db
    .selectDistinct({ data: files.fiscalYear })
    .from(files)
    .where(isNotNull(files.fiscalYear));

  return yearOptions.map((v) => v.data);
}

/**
 * Get all existing line number values
 */
export async function lineNumberOptions() {
  await dbConnect();
  const lineNumberOptions = await db
    .selectDistinct({ data: lines.lineNumber })
    .from(lines)
    .where(isNotNull(lines.lineNumber));

  return lineNumberOptions.map((v) => v.data);
}
