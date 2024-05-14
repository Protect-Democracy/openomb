// Dependencies
import { db, dbConnect } from '../connection';
import { files } from '../schema/files';
import { tafs } from '../schema/tafs';
import { lines } from '../schema/lines';
import { footnotes } from '../schema/footnotes';
import { tafsSort, fileSort } from '$config/search';
import {
  ilike,
  and,
  or,
  sql,
  eq,
  gte,
  lte,
  isNotNull,
  count,
  exists,
  not,
  asc,
  desc,
  inArray
} from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

export type SearchParams = {
  term: string;
  tafs: string;
  agency: string;
  bureau: string;
  account: string;
  approver: string;
  approvedStart: Date;
  approvedEnd: Date;
  year: string;
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
      or(
        // We match the footnote number
        and(
          not(eq(sql.placeholder('footnoteNum'), '')),
          ilike(
            footnotes.footnoteNumber,
            sql`any(string_to_array(concat(replace(${sql.placeholder('footnoteNum')}, ',', '%,'), '%'), ',')::varchar[])`
          )
        ),
        // We don't need a specific number
        and(
          eq(sql.placeholder('footnoteNum'), ''),
          // Search footnote content
          ilike(footnotes.footnoteText, sql`concat('%', ${sql.placeholder('term')}::text, '%')`)
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
      or(
        // We match the line number
        and(
          not(eq(sql.placeholder('lineNum'), '')),
          eq(
            lines.lineNumber,
            sql`any(string_to_array(${sql.placeholder('lineNum')}, ',')::varchar[])`
          )
        ),
        // We don't need a specific line number
        and(
          eq(sql.placeholder('lineNum'), ''),
          or(
            // We have a footnote
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
            ),
            // We don't need a footnote and match on content
            and(
              eq(sql.placeholder('footnoteNum'), ''),
              ilike(lines.lineDescription, sql`concat('%', ${sql.placeholder('term')}::text, '%')`)
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
        // TAFS Specific filters
        ilike(tafs.tafsId, sql`concat('%', ${sql.placeholder('tafs')}::text, '%')`),
        or(
          eq(sql.placeholder('agency'), ''),
          eq(tafs.budgetAgencyTitleId, sql.placeholder('agency'))
        ),
        or(
          eq(sql.placeholder('bureau'), ''),
          eq(tafs.budgetBureauTitleId, sql.placeholder('bureau'))
        ),
        ilike(tafs.accountTitle, sql`concat('%', ${sql.placeholder('account')}::text, '%')`),

        or(
          // We have a line
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
          ),
          // We don't need a line and match on content
          and(
            and(eq(sql.placeholder('lineNum'), ''), eq(sql.placeholder('footnoteNum'), '')),
            or(
              ilike(tafs.accountTitle, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
              ilike(
                tafs.budgetAgencyTitle,
                sql`concat('%', ${sql.placeholder('term')}::text, '%')`
              ),
              ilike(
                tafs.budgetBureauTitle,
                sql`concat('%', ${sql.placeholder('term')}::text, '%')`
              ),
              ilike(tafs.cgacAcct, sql`concat('%', ${sql.placeholder('term')}::text, '%')`),
              ilike(tafs.cgacAgency, sql`concat('%', ${sql.placeholder('term')}::text, '%')`)
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
        // File Specific filters
        or(
          eq(sql.placeholder('year'), ''),
          eq(files.fiscalYear, sql`any(string_to_array(${sql.placeholder('year')}, ',')::int[])`)
        ),
        ilike(files.approverTitle, sql`concat('%', ${sql.placeholder('approver')}::text, '%')`),
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

  // SQL partials for filtering
  const fileResults = getFileResults();
  const tafsResults = getTafsResults();

  const sortKey = searchParams.sort || 'approved_desc';

  if (tafsSort[sortKey]) {
    const column = sortKey.includes('account')
      ? tafsResults.accountTitle
      : sortKey.includes('bureau')
        ? tafsResults.budgetBureauTitle
        : tafsResults.budgetAgencyTitle;

    // Get our paginated (limited) list of file ids based on tafs order
    const paginatedFiles = db
      .select({
        fileId: sql`DISTINCT ${tafsResults.fileId}`.as('file_id'),
        sortField: sql`FIRST_VALUE(${column})
          OVER(
            PARTITION BY ${tafsResults.fileId}
            ORDER BY ${tafsSort[sortKey].sort(tafsResults).getSQL()}
          )`.as('sort_field')
      })
      .from(tafsResults)
      .where(
        exists(db.select().from(fileResults).where(eq(tafsResults.fileId, fileResults.fileId)))
      )
      .orderBy((sortedTafs) => asc(sortedTafs.sortField))
      .offset(sql.placeholder('offset'))
      .limit(sql.placeholder('limit'))
      .as('paginated_files');

    // Get our tafs results for the paginated files
    const searchStatement = db
      .select()
      .from(tafsResults)
      .innerJoin(fileResults, eq(tafsResults.fileId, fileResults.fileId))
      .where(
        exists(
          db.select().from(paginatedFiles).where(eq(tafsResults.fileId, paginatedFiles.fileId))
        )
      )
      .orderBy(tafsSort[sortKey].sort(tafsResults))
      .prepare(`search_results_file_${sortKey}`);

    const results = await searchStatement.execute(searchParams);

    // Return an array of files containing grouped tafs
    const sortedFiles: Array<
      (typeof results)[0]['filtered_files'] & {
        tafs: Array<(typeof results)[0]['filtered_tafs']>;
      }
    > = [];
    results.forEach((result) => {
      const file = sortedFiles.find((f) => f.fileId == result.filtered_files.fileId);
      if (file) {
        file.tafs.push(result.filtered_tafs);
      }
      else {
        sortedFiles.push({
          ...result.filtered_files,
          tafs: [result.filtered_tafs]
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
 * Get subset of tafs that match provided search criterion and
 *  offset for pagination
 */
export async function tafsByCriterion(searchParams: SearchParams & PaginationParams) {
  await dbConnect();

  // SQL partials for filtering
  const fileResults = getFileResults();
  const tafsResults = getTafsResults();

  const sortKey = searchParams.sort || 'approved_desc';

  const sort = tafsSort[sortKey]
    ? tafsSort[sortKey].sort(tafsResults)
    : fileSort[sortKey].sort(fileResults);

  // Sorting by file column
  const searchStatement = db
    .select()
    .from(tafsResults)
    .innerJoin(fileResults, eq(tafsResults.fileId, fileResults.fileId))
    .where(exists(db.select().from(fileResults).where(eq(tafsResults.fileId, fileResults.fileId))))
    .orderBy(sort)
    .offset(sql.placeholder('offset'))
    .limit(sql.placeholder('limit'))
    .prepare(`search_results_tafs_${sortKey}`);

  return (await searchStatement.execute(searchParams)).map((result) => ({
    ...result.filtered_tafs,
    file: result.filtered_files
  }));
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

export type FormattedSearchParams = SearchParams &
  PaginationParams & { years: number[]; lineNumbers: string[]; footnoteNumbers: string[] };

function formatSearchParams(searchParams: SearchParams & PaginationParams): FormattedSearchParams {
  // {
  //   term: '',
  //   tafs: '',
  //   bureau: '',
  //   agency: '',
  //   account: '',
  //   approver: '',
  //   year: '',
  //   approvedStart: 2020-01-01T05:00:00.000Z,
  //   approvedEnd: 2024-05-08T19:45:22.257Z,
  //   lineNum: '',
  //   footnoteNum: ''
  // }

  // Format
  const years = (searchParams.year ? searchParams.year.split(',') : [])
    .map((v) => parseInt(v))
    .filter((t) => !!t);
  const lineNumbers = (searchParams.lineNum ? searchParams.lineNum.split(',') : [])
    .map((v) => v.trim())
    .filter((t) => !!t);
  const footnoteNumbers = (searchParams.footnoteNum ? searchParams.footnoteNum.split(',') : [])
    .map((v) => v.trim())
    .filter((t) => !!t);
  const formattedSearchParams: SearchParams &
    PaginationParams & { years: number[]; lineNumbers: string[]; footnoteNumbers: string[] } = {
    ...searchParams,
    years,
    lineNumbers,
    footnoteNumbers
  };
  return formattedSearchParams;
}

function fileSearchWhere(searchParams: FormattedSearchParams) {
  // Collect filters
  const where = [];

  // General search term
  where.push(
    searchParams.term
      ? or(
          ilike(tafs.accountTitle, `%${searchParams.term}%`),
          ilike(tafs.budgetAgencyTitle, `%${searchParams.term}%`),
          ilike(tafs.budgetBureauTitle, `%${searchParams.term}%`),
          // This is very expensive, even once indexes have been added,
          // but the subquery seems ot be efficient
          //ilike(lines.lineDescription, `%${searchParams.term}%`)
          inArray(
            files.fileId,
            db
              .selectDistinct({ fileId: lines.fileId })
              .from(lines)
              .where(ilike(lines.lineDescription, `%${searchParams.term}%`))
          ),
          inArray(
            files.fileId,
            db
              .selectDistinct({ fileId: footnotes.fileId })
              .from(footnotes)
              .where(ilike(footnotes.footnoteText, `%${searchParams.term}%`))
          )
        )
      : undefined
  );

  // Other search terms
  where.push(searchParams.tafs ? ilike(tafs.tafsId, `%${searchParams.tafs}%`) : undefined);
  where.push(
    searchParams.account ? ilike(tafs.accountTitle, `%${searchParams.account}%`) : undefined
  );
  where.push(
    searchParams.approver ? ilike(files.approverTitle, `%${searchParams.approver}%`) : undefined
  );

  // Identifiers
  where.push(searchParams.agency ? eq(tafs.budgetAgencyTitleId, searchParams.agency) : undefined);
  where.push(searchParams.bureau ? eq(tafs.budgetBureauTitleId, searchParams.bureau) : undefined);
  where.push(
    searchParams.lineNumbers?.length > 0
      ? inArray(lines.lineNumber, searchParams.lineNumbers)
      : undefined
  );
  where.push(
    searchParams.footnoteNumbers?.length > 0
      ? inArray(footnotes.footnoteNumber, searchParams.footnoteNumbers)
      : undefined
  );

  // Specific values
  where.push(searchParams.bureau ? eq(tafs.budgetBureauTitleId, searchParams.bureau) : undefined);
  where.push(
    searchParams.years?.length > 0 ? inArray(files.fiscalYear, searchParams.years) : undefined
  );
  where.push(
    searchParams.approvedStart
      ? gte(files.approvalTimestamp, searchParams.approvedStart)
      : undefined
  );
  where.push(
    searchParams.approvedEnd ? lte(files.approvalTimestamp, searchParams.approvedEnd) : undefined
  );

  // Complete AND wheres
  const filteredWhere = where.filter((v) => !!v);
  const finalWhere =
    filteredWhere.length > 1
      ? and(...filteredWhere)
      : filteredWhere.length === 1
        ? filteredWhere[0]
        : undefined;
  return finalWhere;
}

export async function accountSearchTest(searchParams: SearchParams & PaginationParams) {
  // Format
  const formattedSearchParams = formatSearchParams(searchParams);

  // Collect filters
  const finalWhere = fileSearchWhere(formattedSearchParams);

  // Find accounts
  const allAccounts = await db
    .selectDistinct({
      budgetAgencyTitle: tafs.budgetAgencyTitle,
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      budgetBureauTitle: tafs.budgetBureauTitle,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      accountTitle: tafs.accountTitle,
      accountTitleId: tafs.accountTitleId
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .where(finalWhere)
    .orderBy(asc(tafs.accountTitle));

  return {
    accounts: allAccounts
  };
}

export async function fileSearchTest(searchParams: SearchParams & PaginationParams) {
  await dbConnect();

  // Format
  const formattedSearchParams = formatSearchParams(searchParams);

  // Filters that will search line numbers
  const searchHasLines = !!formattedSearchParams.term || !!formattedSearchParams.lineNumbers.length;
  const searchHasFootnotes =
    !!formattedSearchParams.term || !!formattedSearchParams.footnoteNumbers.length;

  // Collect filters
  const finalWhere = fileSearchWhere(formattedSearchParams);

  // Order.  We need to include the field in the query for distinctness
  let order = [desc(files.approvalTimestamp)];
  const orderFields: { orderField: PgColumn; orderFieldSecondary?: PgColumn } = {
    orderField: files.approvalTimestamp
  };
  if (searchParams.sort === 'account_asc') {
    order = [asc(tafs.accountTitle), desc(files.approvalTimestamp)];
    orderFields.orderField = tafs.accountTitle;
    orderFields.orderFieldSecondary = files.approvalTimestamp;
  }
  else if (searchParams.sort === 'bureau_asc') {
    order = [asc(tafs.budgetBureauTitle), desc(files.approvalTimestamp)];
    orderFields.orderField = tafs.budgetBureauTitle;
    orderFields.orderFieldSecondary = files.approvalTimestamp;
  }
  else if (searchParams.sort === 'agency_asc') {
    order = [asc(tafs.budgetAgencyTitle), desc(files.approvalTimestamp)];
    orderFields.orderField = tafs.budgetAgencyTitle;
    orderFields.orderFieldSecondary = files.approvalTimestamp;
  }

  const countSubquery = db
    .selectDistinct({
      fileId: files.fileId,
      ...orderFields
    })
    .from(files)
    .innerJoin(tafs, eq(files.fileId, tafs.fileId))
    .leftJoin(lines, eq(files.fileId, lines.fileId))
    .leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(finalWhere)
    .as('countSubquery');
  const fullCount = await db.select({ count: count() }).from(countSubquery);

  // Specific ids
  const limitedIds = await db
    .selectDistinct({
      fileId: files.fileId,
      ...orderFields
    })
    .from(files)
    .innerJoin(tafs, eq(files.fileId, tafs.fileId))
    .leftJoin(lines, eq(files.fileId, lines.fileId))
    .leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(finalWhere)
    .orderBy(...order)
    .offset(searchParams.offset)
    .limit(searchParams.limit);

  // Details.  Is there a better way to do this
  const detailsWith = {
    tafs: {
      orderBy: (tafs, { asc }) => [asc(tafs.tafsTableId)]
    }
  };
  if (searchHasLines) {
    detailsWith.tafs.with = {
      lines: {
        orderBy: (lines, { asc }) => [asc(lines.lineNumber)]
      }
    };
  }
  if (searchHasFootnotes) {
    detailsWith.footnotes = {
      orderBy: (footnotes, { asc }) => [asc(footnotes.footnoteNumber)]
    };
  }
  const fileDetails = [];
  for (const limitedId of limitedIds) {
    const details = await db.query.files.findFirst({
      columns: {
        sourceData: false
      },
      where: eq(files.fileId, limitedId.fileId),
      with: detailsWith
    });
    fileDetails.push(details);
  }

  return {
    files: fileDetails,
    count: fullCount[0].count,
    formattedSearchParams
  };
}
