import { db, dbConnect } from '../connection';
import { files } from '../schema/files';
import { tafs } from '../schema/tafs';
import { lines } from '../schema/lines';
import { footnotes } from '../schema/footnotes';
import { ilike, and, or, sql, desc, eq, isNotNull, isNull, count, exists, not } from 'drizzle-orm';

export type SearchParams = {
  term: string,
  tafs: string,
  agency: string,
  bureau: string,
  account: string,
  approver: string,
  year: number,
  lineNum: string,
  footnoteNum: string,
}

export type PaginationParams = {
  offset: number,
  limit: number,
}

/**
 * Return only footnotes that are relevant to search criterion
 *  - Footnote number overrides content search
 * These filters need to remain consistent between calls (and cannot
 *    conditionally add criterion) in order to leverage prepared statements
 */
function getFootnoteResults() {
  return db.select().from(footnotes).where(and(
    // Content Search
    or(
      ilike(footnotes.footnoteText, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),

      // Allow for footnote number override
      not(eq(sql.placeholder('footnoteNum'), '')),
    ),
    // Footnote Number Filter
    or(
      eq(sql.placeholder('footnoteNum'), ''),
      and(
        isNotNull(footnotes.footnoteText),
        ilike(footnotes.footnoteNumber, sql`concat(${sql.placeholder('footnoteNum')}::text, '%')`)
      ),
    ),
  )).as('filtered_footnotes');
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

  return db.select().from(lines).where(and(
    // Content Search
    or(
      ilike(lines.lineDescription, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),

      // Content Search on footnote
      exists(
        db.select().from(footnoteResults).where(and(
          eq(footnoteResults.fileId, lines.fileId),
          eq(footnoteResults.lineIndex, lines.lineIndex),
          ilike(footnoteResults.footnoteText, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
        ))
      ),

      // Allow for line number and footnote number override
      not(eq(sql.placeholder('lineNum'), '')),
      not(eq(sql.placeholder('footnoteNum'), '')),
    ),
    // Line Number Filter
    or(
      eq(sql.placeholder('lineNum'), ''),
      and(
        eq(lines.lineNumber, sql.placeholder('lineNum')),
        or(isNotNull(lines.approvedAmount), isNotNull(lines.lineDescription))
      ),
    ),

    // If filtering on footnote number, must have footnote
    or(
      eq(sql.placeholder('footnoteNum'), ''),
      exists(
        db.select().from(footnoteResults).where(and(
          eq(footnoteResults.fileId, lines.fileId),
          eq(footnoteResults.lineIndex, lines.lineIndex),
        ))
      ),
    ),
  )).as('filtered_lines');
}

/**
 * Return only TAFS that are relevant to search criterion
 * - Some content must match content search (if provided)
 * These filters need to remain consistent between calls (and cannot
 *    conditionally add criterion) in order to leverage prepared statements
 */
function getTafsResults() {
  const lineResults = getLineResults();

  return db.select().from(tafs).where(and(
    // Content Search
    or(
      ilike(tafs.accountTitle, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
      ilike(tafs.budgetAgencyTitle, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
      ilike(tafs.budgetBureauTitle, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
      ilike(tafs.cgacAcct, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
      ilike(tafs.cgacAgency, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),

      // Content Search on lines/footnotes
      exists(
        db.select().from(lineResults).where(and(
          eq(lineResults.fileId, tafs.fileId),
          eq(lineResults.tafsTableId, tafs.tafsTableId),
          ilike(lineResults.lineDescription, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
        )),
      ),
    ),
    // TAFS Filter
    ilike(tafs.tafsId, sql`concat('%', ${sql.placeholder('tafs')}::text, '%')`),
    // Agency Filter
    ilike(tafs.budgetAgencyTitle, sql`concat('%', ${sql.placeholder('agency')}::text, '%')`),
    // Bureau Filter
    ilike(tafs.budgetBureauTitle, sql`concat('%', ${sql.placeholder('bureau')}::text, '%')`),
    // Account Filter
    ilike(tafs.accountTitle, sql`concat('%', ${sql.placeholder('account')}::text, '%')`),

    // If filtering on Line or Footnote, must have line
    or(
      and(
        eq(sql.placeholder('lineNum'), ''),
        eq(sql.placeholder('footnoteNum'), ''),
      ),
      exists(
        db.select().from(lineResults).where(and(
          eq(lineResults.fileId, tafs.fileId),
          eq(lineResults.tafsTableId, tafs.tafsTableId),
        )),
      ),
    ),
  )).as('filtered_tafs');
}

/**
 * Get number of results overall based on the provided search criterion
 */
export async function fileCountByCriterion(searchParams: SearchParams): Promise<number> {
  // SQL partials for filtering
  const tafsResults = getTafsResults();
  const footnoteResults = getFootnoteResults();

  // Prepared statement to get result count
  const countQuery = db
    .select({ count: count() })
    .from(files)
    .where(and(
      // Year Filter
      or(eq(sql.placeholder('year'), 0), eq(files.fiscalYear, sql.placeholder('year'))),
      // Approved By Filter
      ilike(files.approverTitle, sql`concat('%', ${sql.placeholder('approver')}::text, '%')`),

      // Needs relevant tafs to return result
      or(
        exists(db.select().from(tafsResults).where(eq(tafsResults.fileId, files.fileId))),
        // Can also return if file has unassociated footnote (is this possible?)
        exists(db.select().from(footnoteResults).where(and(
          isNull(footnoteResults.lineIndex),
          eq(footnoteResults.fileId, files.fileId)),
        )),
      )
    )).prepare('search_count');

  const results = await countQuery.execute(searchParams);

  return results && results.length ? results[0].count : 0;
}

/**
 * Get subset of files that match provided search criterion and
 *  offset for pagination
 */
export async function filesByCriterion(searchParams: SearchParams & PaginationParams) {
  // SQL partials for filtering
  const tafsResults = getTafsResults();
  const lineResults = getLineResults();
  const footnoteResults = getFootnoteResults();

  // Prepared Statement to perform search
  const searchStatement = db.query.files.findMany({
    columns: {
      fileId: true,
      fileName: true,
      approverTitle: true,
      approvalTimestamp: true,
      fiscalYear: true,
    },
    orderBy: [
      desc(files.approvalTimestamp),
    ],
    where: and(
      // Year Filter
      or(eq(sql.placeholder('year'), 0), eq(files.fiscalYear, sql.placeholder('year'))),
      // Approved By Filter
      ilike(files.approverTitle, sql`concat('%', ${sql.placeholder('approver')}::text, '%')`),

      // Needs relevant tafs to return result
      or(
        exists(db.select().from(tafsResults).where(eq(tafsResults.fileId, files.fileId))),
        // Can also return if file has unassociated footnote (is this possible?)
        exists(db.select().from(footnoteResults).where(and(
          isNull(footnoteResults.lineIndex),
          eq(footnoteResults.fileId, files.fileId)),
        )),
      )
    ),
    with: {
      tafs: {
        // Fetch associated relevant tafs and lines (with footnotes)
        where: exists(db.select().from(tafsResults).where(and(
          eq(tafsResults.fileId, sql`"files_tafs"."file_id"`),
          eq(tafsResults.tafsTableId, sql`"files_tafs"."tafs_table_id"`),
        ))),
        with: {
          lines: {
            where: exists(db.select().from(lineResults).where(and(
              eq(lineResults.fileId, sql`"files_tafs"."file_id"`),
              eq(lineResults.tafsTableId, sql`"files_tafs"."tafs_table_id"`),
              eq(lineResults.lineIndex, sql`"files_tafs_lines"."line_index"`),
            ))),
            with: {
              footnotes: true,
            }
          },
        }
      },
      footnotes: {
        // Fetch associated relevant (file-wide) footnotes (is this relevant?)
        where: exists(db.select().from(footnoteResults).where(and(
          isNull(footnoteResults.lineIndex),
          eq(footnoteResults.fileId,  sql`"files_footnotes"."file_id"`),
          eq(footnoteResults.lineIndex,  sql`"files_footnotes"."line_index"`),
          eq(footnoteResults.footnoteNumber,  sql`"files_footnotes"."footnote_number"`),
        ))),
      },
    },
    offset: sql.placeholder('offset'),
    limit: sql.placeholder('limit'),
  }).prepare('search_results');

  return await searchStatement.execute(searchParams);
}

/**
 * Get all existing fiscal year values
 */
export async function yearOptions(): Promise<number[]> {
  const yearOptions = await db.selectDistinct({ data: files.fiscalYear }).from(files).where(isNotNull(files.fiscalYear));

  return yearOptions.map(value => Number(value.data));
}

/**
 * Get all existing line number values
 */
export async function lineNumberOptions(): Promise<string[]> {
  const lineNumberOptions = await db.selectDistinct({ data: lines.lineNumber }).from(lines).where(isNotNull(lines.lineNumber));

  return lineNumberOptions.map(value => `${value.data}`);
}
