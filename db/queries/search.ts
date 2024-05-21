// Dependencies
import { ilike, and, or, eq, gte, lte, isNotNull, count, asc, desc, inArray } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { db } from '../connection';
import { files } from '../schema/files';
import { tafs } from '../schema/tafs';
import { lines } from '../schema/lines';
import { footnotes } from '../schema/footnotes';
import { memoizeDataAsync } from '../../server/cache';

// Types
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

export type SearchPaginationParams = SearchParams & PaginationParams;

export type FormattedSearchParamsFields = {
  years: number[];
  lineNumbers: string[];
  footnoteNumbers: string[];
};

export type FormattedSearchParams = SearchParams & FormattedSearchParamsFields;
export type FormattedSearchPaginationParams = SearchPaginationParams & FormattedSearchParamsFields;

/**
 * Get all existing fiscal year values
 */
export async function yearOptions() {
  const yearOptions = await db
    .selectDistinct({ data: files.fiscalYear })
    .from(files)
    .where(isNotNull(files.fiscalYear));

  return yearOptions.map((v) => v.data);
}

export const mYearOptions = memoizeDataAsync(yearOptions);

/**
 * Get all existing line number values
 */
export async function lineNumberOptions() {
  const lineNumberOptions = await db
    .selectDistinct({ data: lines.lineNumber })
    .from(lines)
    .where(isNotNull(lines.lineNumber));

  return lineNumberOptions.map((v) => v.data);
}

export const mLineNumberOptions = memoizeDataAsync(lineNumberOptions);

/**
 * Format the search parameters to make it easier to turn into query.
 *
 * @param searchParams Search params (optionally including pagination)
 * @returns
 */
function formatSearchParams(
  searchParams: SearchPaginationParams | SearchParams
): FormattedSearchParams {
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

  const formattedSearchParams: FormattedSearchParams | FormattedSearchPaginationParams = {
    ...searchParams,
    years,
    lineNumbers,
    footnoteNumbers
  };

  return formattedSearchParams;
}

/**
 * Create the set of WHERE clauses to use for searching.  Adjusts slightly
 * depending on the primary table that is being searched.
 *
 * @param searchParams Search (and optionally pagination) parameters
 * @param mainTable Should be tafs or files.
 * @returns
 */
function generalSearchFilters(
  searchParams: FormattedSearchParams | FormattedSearchPaginationParams,
  mainTable: 'files' | 'tafs' = 'files'
) {
  // Collect filters
  const where = [];

  // General search term
  where.push(
    searchParams.term
      ? or(
          ilike(tafs.accountTitle, `%${searchParams.term}%`),
          ilike(tafs.budgetAgencyTitle, `%${searchParams.term}%`),
          ilike(tafs.budgetBureauTitle, `%${searchParams.term}%`),
          // The ilike directly is very expensive, even once indexes have been added,
          // but the subquery seems ot be efficient
          //ilike(lines.lineDescription, `%${searchParams.term}%`)
          mainTable === 'tafs'
            ? inArray(
                tafs.tafsTableId,
                db
                  .selectDistinct({ tafsTableId: lines.tafsTableId })
                  .from(lines)
                  .where(ilike(lines.lineDescription, `%${searchParams.term}%`))
              )
            : inArray(
                files.fileId,
                db
                  .selectDistinct({ fileId: lines.fileId })
                  .from(lines)
                  .where(ilike(lines.lineDescription, `%${searchParams.term}%`))
              ),
          mainTable === 'tafs'
            ? inArray(
                tafs.tafsTableId,
                db
                  .selectDistinct({ tafsTableId: lines.tafsTableId })
                  .from(lines)
                  .innerJoin(
                    footnotes,
                    and(
                      eq(lines.fileId, footnotes.fileId),
                      eq(lines.lineIndex, footnotes.lineIndex)
                    )
                  )
                  .where(ilike(footnotes.footnoteText, `%${searchParams.term}%`))
              )
            : inArray(
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

  // Joining footnotes in our search is expensive, so we do a subquery
  const footnoteNumberFilters = (searchParams.footnoteNumbers || []).map((n) =>
    ilike(footnotes.footnoteNumber, `${n}%`)
  );
  where.push(
    searchParams.footnoteNumbers?.length > 1 && mainTable === 'tafs'
      ? inArray(
          tafs.tafsTableId,
          db
            .selectDistinct({ tafsTableId: lines.tafsTableId })
            .from(lines)
            .innerJoin(
              footnotes,
              and(eq(lines.fileId, footnotes.fileId), eq(lines.lineIndex, footnotes.lineIndex))
            )
            .where(
              footnoteNumberFilters.length > 1
                ? or(...footnoteNumberFilters)
                : footnoteNumberFilters[0]
            )
        )
      : mainTable === 'files'
        ? inArray(
            files.fileId,
            db
              .selectDistinct({ fileId: footnotes.fileId })
              .from(footnotes)
              .where(
                footnoteNumberFilters.length > 1
                  ? or(...footnoteNumberFilters)
                  : footnoteNumberFilters[0]
              )
          )
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

/**
 * Given the search options, create options needed for searching
 * such as the where clause.
 *
 * @param searchParams Search pagination options
 * @returns
 */
export async function tafsSearchSetup(searchParams: SearchPaginationParams | SearchParams) {
  const formattedSearchParams = formatSearchParams(searchParams);
  const searchHasLines = !!formattedSearchParams.term || !!formattedSearchParams.lineNumbers.length;
  const searchHasFootnotes =
    !!formattedSearchParams.term || !!formattedSearchParams.footnoteNumbers.length;

  // Where
  const finalWhere = generalSearchFilters(formattedSearchParams, 'tafs');

  // Order.  We need to include the field in the query for distinctness if we are
  // ordering
  let order = [desc(files.approvalTimestamp)];
  const orderFields: { orderField: PgColumn; orderFieldSecondary?: PgColumn } = {
    orderField: files.approvalTimestamp
  };
  // TODO: Unsure why this throws the type issue
  if (searchParams?.sort) {
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
  }

  return {
    searchParams: formattedSearchParams,
    hasLines: searchHasLines,
    hasFootnotes: searchHasFootnotes,
    where: finalWhere,
    order,
    orderFields
  };
}

export const mTafsSearchSetup = memoizeDataAsync(tafsSearchSetup);

/**
 * Determine full count of tafs search.  Return just query so to be used
 * asynchronously if needed.  See tafsSearchFullCount() for direct results.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function tafsSearchFullCountQuery(searchParams: SearchParams) {
  const { where } = await tafsSearchSetup(searchParams);

  const countSubquery = db
    .selectDistinct({
      tafsTableId: tafs.tafsTableId
    })
    .from(tafs)
    .leftJoin(files, eq(tafs.fileId, files.fileId))
    .leftJoin(lines, eq(tafs.fileId, lines.fileId))
    .where(where)
    .as('countSubquery');

  return db.select({ count: count() }).from(countSubquery);
}

export const mTafsSearchFullCountQuery = memoizeDataAsync(tafsSearchFullCountQuery);

/**
 * Determine full count of tafs search.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function tafsSearchFullCount(searchParams: SearchParams) {
  console.time('tafsSearchFullCount');
  const fullCount = await tafsSearchFullCountQuery(searchParams);
  console.timeEnd('tafsSearchFullCount');

  return fullCount[0].count || 0;
}

export const mTafsSearchFullCount = memoizeDataAsync(tafsSearchFullCount);

/**
 * Determine full count of files for tafs search.  Return just query so to be used
 * asynchronously if needed.  See tafsSearchFullCount() for direct results.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function tafsSearchFullFileCountQuery(searchParams: SearchParams) {
  const { where } = await tafsSearchSetup(searchParams);

  const countSubquery = db
    .selectDistinct({
      fileId: tafs.fileId
    })
    .from(tafs)
    .leftJoin(files, eq(tafs.fileId, files.fileId))
    .leftJoin(lines, eq(tafs.fileId, lines.fileId))
    .where(where)
    .as('countSubquery');

  return db.select({ count: count() }).from(countSubquery);
}

export const mTafsSearchFullFileCountQuery = memoizeDataAsync(tafsSearchFullFileCountQuery);

/**
 * Determine full count of files in tafs search.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function tafsSearchFullFileCount(searchParams: SearchParams) {
  console.time('tafsSearchFullFileCount');
  const fullCount = await tafsSearchFullFileCountQuery(searchParams);
  console.timeEnd('tafsSearchFullFileCount');

  return fullCount[0].count || 0;
}

export const mTafsSearchFullFileCount = memoizeDataAsync(tafsSearchFullFileCount);

/**
 * Get the detailed search results for a search and page.
 *
 * @param searchParams Search and pagination options
 * @returns
 */
export async function tafsSearchPaged(searchParams: SearchParams & PaginationParams) {
  const { where, order, orderFields } = await tafsSearchSetup(searchParams);

  // Specific ids
  console.time('tafsSearchPaged');
  const pagedResults = await db
    .selectDistinct({
      tafsTableId: tafs.tafsTableId,
      ...orderFields
    })
    .from(tafs)
    .leftJoin(files, eq(tafs.fileId, files.fileId))
    .leftJoin(lines, eq(tafs.fileId, lines.fileId))
    .leftJoin(footnotes, eq(tafs.fileId, footnotes.fileId))
    .where(where)
    .orderBy(...order)
    .offset(searchParams.offset)
    .limit(searchParams.limit);
  console.timeEnd('tafsSearchPaged');

  // Details.
  console.time('tafsSearchPaged DETAILS');
  const tafsDetails = [];
  for (const pagedResult of pagedResults) {
    const details = await db.query.tafs.findFirst({
      where: eq(tafs.tafsTableId, pagedResult.tafsTableId?.toString() || ''),
      with: {
        file: true
      }
    });

    tafsDetails.push(details);
  }
  console.timeEnd('tafsSearchPaged DETAILS');

  return tafsDetails;
}

export const mTafsSearchPaged = memoizeDataAsync(tafsSearchPaged);

export async function accountSearchTest(searchParams: SearchParams & PaginationParams) {
  // Format
  const formattedSearchParams = formatSearchParams(searchParams);

  // Collect filters
  const finalWhere = generalSearchFilters(formattedSearchParams, 'tafs');

  // Find accounts
  console.time('TEST - ACCOUNT SEARCH QUERY');
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
    .leftJoin(lines, eq(files.fileId, lines.fileId))
    .where(finalWhere)
    .orderBy(asc(tafs.accountTitle));
  console.timeEnd('TEST - ACCOUNT SEARCH QUERY');

  return {
    accounts: allAccounts
  };
}

export async function fileSearchTest(searchParams: SearchParams & PaginationParams) {
  console.log('-----------------');

  // Format
  const formattedSearchParams = formatSearchParams(searchParams);

  // Filters that will search line numbers
  const searchHasLines = !!formattedSearchParams.term || !!formattedSearchParams.lineNumbers.length;
  const searchHasFootnotes =
    !!formattedSearchParams.term || !!formattedSearchParams.footnoteNumbers.length;

  // Collect filters
  const finalWhere = generalSearchFilters(formattedSearchParams);

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

  console.time('TEST - ALL FILES QUERY');
  // TODO: This should be memoized since if someone is paging
  // through results, there's no reason to run this query again.
  const countSubquery = db
    .selectDistinct({
      fileId: files.fileId,
      ...orderFields
    })
    .from(files)
    .leftJoin(tafs, eq(files.fileId, tafs.fileId))
    .leftJoin(lines, eq(files.fileId, lines.fileId))
    .where(finalWhere)
    .as('countSubquery');
  const fullCount = await db.select({ count: count() }).from(countSubquery);
  console.timeEnd('TEST - ALL FILES QUERY');

  // Specific ids
  console.time('TEST - PAGED FILES QUERY');
  const limitedIds = await db
    .selectDistinct({
      fileId: files.fileId,
      ...orderFields
    })
    .from(files)
    .leftJoin(tafs, eq(files.fileId, tafs.fileId))
    .leftJoin(lines, eq(files.fileId, lines.fileId))
    .leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(finalWhere)
    .orderBy(...order)
    .offset(searchParams.offset)
    .limit(searchParams.limit);
  console.timeEnd('TEST - PAGED FILES QUERY');

  // Details.  Is there a better way to do this
  console.time('TEST - FILE DETAILS QUERY');
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
  console.timeEnd('TEST - FILE DETAILS QUERY');

  return {
    files: fileDetails,
    count: fullCount[0].count,
    formattedSearchParams
  };
}
