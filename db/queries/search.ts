// Dependencies
import {
  ilike,
  and,
  or,
  eq,
  gte,
  lte,
  isNotNull,
  isNull,
  count,
  countDistinct,
  asc,
  desc,
  inArray,
  sql,
  SQL
} from 'drizzle-orm';
import { type PgColumn, type SelectedFields } from 'drizzle-orm/pg-core';
import { db } from '../connection';
import { files } from '../schema/files';
import { tafs } from '../schema/tafs';
import { lines } from '../schema/lines';
import { footnotes } from '../schema/footnotes';
import { searches, type searchesSelect } from '../schema/searches';
import { users } from '../schema/users';
import { lineTypes } from '../schema/line-types';
import { lineDescriptions } from '../schema/line-descriptions';
import { memoizeDataAsync } from '../../server/cache';

// Types
export type ColumnObject = {
  [key: string]: PgColumn | SelectedFields | SQL;
};

export type SearchParams = {
  term: string;
  tafs: string;
  agency: string;
  bureau: string;
  account: string;
  approver: string;
  approvedStart?: Date;
  approvedEnd?: Date;
  apportionmentType: string;
  year: string;
  lineNum: string;
  footnoteNum: string;

  // Notification specific fields
  folder?: string;
  createdStart?: Date;
  createdEnd?: Date;
};

export type PaginationParams = {
  offset: number;
  limit: number;
  sort: string;
};

export type AccountPaginationParams = {
  accountOffset?: number;
  accountLimit?: number;
  accountSort?: string;
};

export type SearchPaginationParams = SearchParams & PaginationParams & AccountPaginationParams;

export type FormattedSearchParamsFields = {
  years: number[];
  lineNumbers: string[];
  approverIds: string[];
  footnoteNumbers: string[];
  keywordTerms: string[];
  apportionmentTypes: string[];
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
 * Get all existing approver title options
 */
export async function approverTitleOptions() {
  const approverOptions = await db
    .selectDistinct({ value: files.approverTitleId, label: files.approverTitle })
    .from(files)
    .where(isNotNull(files.approverTitleId))
    .orderBy(files.approverTitle);

  return approverOptions;
}

export const mApproverTitleOptions = memoizeDataAsync(approverTitleOptions);

/**
 * Get line description options.
 */
export const lineNumberOptions = async function () {
  // Get line descriptions for line numbers that are in the data
  // as line descriptions data is a full set of line numbers but not
  // necessarily all are used.
  const results = await db
    .selectDistinct({
      lineNumber: lines.lineNumber,
      description: lineDescriptions.description,
      lineTypeId: lines.lineTypeId,
      lineType: lineTypes.name
    })
    .from(lines)
    .leftJoin(lineDescriptions, eq(lines.lineNumber, lineDescriptions.lineNumber))
    .leftJoin(lineTypes, eq(lines.lineTypeId, lineTypes.lineTypeId))
    .where(isNotNull(lines.lineNumber))
    .orderBy(asc(lines.lineNumber));

  if (!results) {
    return [];
  }

  // Format for options
  return results.map((v) => {
    return {
      value: v.lineNumber,
      label: v.description ? `${v.lineNumber} - ${v.description}` : `${v.lineNumber} - (unknown)`,
      groupValue: v.lineTypeId || 'other',
      groupLabel: v.lineType || 'Other'
    };
  });
};

export const mLineNumberOptions = memoizeDataAsync(lineNumberOptions);

/**
 * Format the search parameters to make it easier to turn into query.
 *
 * @param searchParams Search params (optionally including pagination)
 * @returns
 */
export function formatSearchParams(
  searchParams: SearchPaginationParams | SearchParams
): FormattedSearchParams {
  // Format
  const years = (searchParams.year ? searchParams.year.split(',') : [])
    .map((v) => parseInt(v))
    .filter((t) => !!t);
  const lineNumbers = (searchParams.lineNum ? searchParams.lineNum.split(',') : [])
    .map((v) => (v.match(/[0-9]+/) ? v.trim() : ''))
    .filter((t) => !!t);
  const approverIds = (searchParams.approver ? searchParams.approver.split(',') : [])
    .map((v) => v.trim())
    .filter((t) => !!t);
  const footnoteNumbers = (searchParams.footnoteNum ? searchParams.footnoteNum.split(',') : [])
    .map((v) => v.trim())
    .filter((t) => !!t);
  const keywordTerms = (searchParams.term ? searchParams.term.split(',') : [])
    .map((v) => v.trim())
    .filter((t) => !!t);
  const apportionmentTypes = (
    searchParams.apportionmentType ? searchParams.apportionmentType.split(',') : []
  )
    .map((v) => {
      return v.match(/letter/i) ? 'letter' : 'spreadsheet';
    })
    .filter((t) => !!t);

  const formattedSearchParams: FormattedSearchParams | FormattedSearchPaginationParams = {
    ...searchParams,
    years,
    lineNumbers,
    approverIds,
    footnoteNumbers,
    keywordTerms,
    apportionmentTypes
  };

  return formattedSearchParams;
}

/**
 * Ensure that our file contains all keywords at least once.
 * Multiple keywords are expected to be separated by commas within string
 *
 * @param searchTerm Keywords
 * @param column Table column to compare against
 * @returns
 */
function keywordSearch(keywordTerms: string[], mainTable: 'files' | 'tafs' = 'files') {
  const lineSearch = (keyword: string) => {
    if (mainTable === 'tafs') {
      return inArray(
        tafs.tafsTableId,
        db
          .selectDistinct({ tafsTableId: lines.tafsTableId })
          .from(lines)
          .where(ilike(lines.lineDescription, `%${keyword}%`))
      );
    }

    return inArray(
      files.fileId,
      db
        .selectDistinct({ fileId: lines.fileId })
        .from(lines)
        .where(ilike(lines.lineDescription, `%${keyword}%`))
    );
  };

  const footnoteSearch = (keyword: string) => {
    if (mainTable === 'tafs') {
      return inArray(
        tafs.tafsTableId,
        db
          .selectDistinct({ tafsTableId: lines.tafsTableId })
          .from(lines)
          .innerJoin(
            footnotes,
            and(eq(lines.fileId, footnotes.fileId), eq(lines.lineIndex, footnotes.lineIndex))
          )
          .where(ilike(footnotes.footnoteText, `%${keyword}%`))
      );
    }
    return inArray(
      files.fileId,
      db
        .selectDistinct({ fileId: footnotes.fileId })
        .from(footnotes)
        .where(ilike(footnotes.footnoteText, `%${keyword}%`))
    );
  };

  // If we have keywords separated by commas, separate these and use in search
  // TODO: Is this more expensive than doing a LIKE ALL|ANY (ARRAY['%term%', '%other%', '%thing%'])
  return and(
    ...keywordTerms.map((keyword) =>
      or(
        ilike(tafs.accountTitle, `%${keyword}%`),
        ilike(tafs.budgetAgencyTitle, `%${keyword}%`),
        ilike(tafs.budgetBureauTitle, `%${keyword}%`),
        ilike(files.fundsProvidedByParsed, `%${keyword}%`),
        ilike(files.sourceText, `%${keyword}%`),
        lineSearch(keyword),
        footnoteSearch(keyword)
      )
    )
  );
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
    searchParams.keywordTerms.length
      ? keywordSearch(searchParams.keywordTerms, mainTable)
      : undefined
  );

  // Other search terms
  where.push(searchParams.tafs ? ilike(tafs.tafsId, `%${searchParams.tafs}%`) : undefined);
  where.push(
    searchParams.account ? ilike(tafs.accountTitle, `%${searchParams.account}%`) : undefined
  );

  // Identifiers
  where.push(searchParams.folder ? eq(files.folderId, searchParams.folder) : undefined);
  where.push(searchParams.agency ? eq(tafs.budgetAgencyTitleId, searchParams.agency) : undefined);
  where.push(searchParams.bureau ? eq(tafs.budgetBureauTitleId, searchParams.bureau) : undefined);
  where.push(
    searchParams.approverIds?.length > 0
      ? inArray(files.approverTitleId, searchParams.approverIds)
      : undefined
  );
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
      : searchParams.footnoteNumbers?.length > 1 && mainTable === 'files'
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
  where.push(
    searchParams.createdStart ? gte(files.createdAt, searchParams.createdStart) : undefined
  );
  where.push(searchParams.createdEnd ? lte(files.createdAt, searchParams.createdEnd) : undefined);

  // Apportionemnt type.  Only need to search on a single one
  if (
    searchParams.apportionmentTypes.length === 1 &&
    searchParams.apportionmentTypes[0] === 'letter'
  ) {
    where.push(isNotNull(files.pdfUrl));
  }
  if (
    searchParams.apportionmentTypes.length === 1 &&
    searchParams.apportionmentTypes[0] === 'spreadsheet'
  ) {
    where.push(isNull(files.pdfUrl));
  }

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
export async function searchSetup(
  searchParams: SearchPaginationParams | SearchParams,
  mainTable: 'files' | 'tafs' = 'files'
) {
  const formattedSearchParams = formatSearchParams(searchParams);
  const searchHasLines = !!formattedSearchParams.term || !!formattedSearchParams.lineNumbers.length;
  const searchHasFootnotes =
    !!formattedSearchParams.term || !!formattedSearchParams.footnoteNumbers.length;

  // Where
  const finalWhere = generalSearchFilters(formattedSearchParams, mainTable);

  // File order parameters.  Since we are grouping, we need to  order
  // by aggregate values.  Default is just to order by approval.
  let order = [desc(files.approvalTimestamp)];
  // TODO: Unsure why this throws the type issue
  if (searchParams?.sort === 'approved_asc') {
    order = [asc(files.approvalTimestamp)];
  }
  if (searchParams?.sort === 'account_asc') {
    const aggField = sql`STRING_AGG(${tafs.accountTitle}, ',' ORDER BY ${tafs.accountTitle})`;
    order = [asc(aggField), desc(files.approvalTimestamp)];
  }
  else if (searchParams?.sort === 'bureau_asc') {
    const aggField = sql`STRING_AGG(${tafs.budgetBureauTitle}, ',' ORDER BY ${tafs.budgetBureauTitle})`;
    order = [asc(aggField), desc(files.approvalTimestamp)];
  }
  else if (searchParams?.sort === 'agency_asc') {
    const aggField = sql`STRING_AGG(${tafs.budgetAgencyTitle}, ',' ORDER BY ${tafs.budgetAgencyTitle})`;
    order = [asc(aggField), desc(files.approvalTimestamp)];
  }

  // Account ordering
  let accountOrder = [
    sql`STRING_AGG(${tafs.accountTitle}, ',' ORDER BY ${tafs.accountTitle})`,
    sql`string_agg(${tafs.budgetAgencyTitle}, ',' ORDER BY ${tafs.budgetAgencyTitle})`
  ];
  if (searchParams?.accountSort === 'account_desc') {
    accountOrder = [
      sql`STRING_AGG(${tafs.accountTitle}, ',' ORDER BY ${tafs.accountTitle} DESC) DESC`,
      sql`string_agg(${tafs.budgetAgencyTitle}, ',' ORDER BY ${tafs.budgetAgencyTitle} DESC) DESC`
    ];
  }
  else if (searchParams?.accountSort === 'file_count_desc') {
    accountOrder = [
      desc(countDistinct(tafs.fileId)),
      sql`STRING_AGG(${tafs.accountTitle}, ',' ORDER BY ${tafs.accountTitle})`
    ];
  }

  return {
    searchParams: formattedSearchParams,
    hasLines: searchHasLines,
    hasFootnotes: searchHasFootnotes,
    where: finalWhere,
    order,
    accountOrder
  };
}

export const mSearchSetup = memoizeDataAsync(searchSetup);

/**
 * Determine full count of tafs search.  Return just query so to be used
 * asynchronously if needed.  See tafsSearchFullCount() for direct results.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function tafsSearchFullCountQuery(searchParams: SearchParams) {
  const { where } = await searchSetup(searchParams, 'tafs');

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
  const { where } = await searchSetup(searchParams, 'tafs');

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
  const { where, order, orderFields } = await searchSetup(searchParams, 'tafs');

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

/**
 * Find full count of accounts for a search; just query version for possible
 * asynchronous usage.
 *
 * @param searchParams
 * @returns
 */
export async function accountSearchFullCountQuery(searchParams: SearchParams) {
  const { where } = await searchSetup(searchParams, 'tafs');

  const countSubquery = db
    .selectDistinct({
      fullAccountTitleId: sql`CONCAT(${tafs.budgetAgencyTitleId}, ${tafs.budgetBureauTitleId}, ${tafs.accountTitleId})`
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .leftJoin(lines, eq(tafs.fileId, lines.fileId))
    // Explicitly not joining footnotes and searching via subquery (see where)
    //.leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(where)
    .as('countSubquery');

  return db.select({ count: count() }).from(countSubquery);
}

export const mAccountSearchFullCountQuery = memoizeDataAsync(accountSearchFullCountQuery);

/**
 * Determine full count of files in tafs search.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function accountSearchFullCount(searchParams: SearchParams) {
  console.time('accountSearchFullCount');
  const fullCount = await accountSearchFullCountQuery(searchParams);
  console.timeEnd('accountSearchFullCount');

  return fullCount[0].count || 0;
}

export const mAccountSearchFullCount = memoizeDataAsync(accountSearchFullCount);

/**
 * Find relevant accounts from a general search.
 *
 * @param searchParams
 * @returns
 */
export async function accountSearchPaged(searchParams: SearchPaginationParams) {
  const { where, accountOrder } = await searchSetup(searchParams, 'tafs');

  // Find accounts.  We want to get a distinct list of accounts while
  // still searching many fields across multiple tables and also be able
  // to order and offset.  We're limited by having a sort as those fields
  // need to appear in a DISTINCT or in a GROUP BY
  console.time('accountSearchPaged');
  // Subquery to filter the accounts
  const allAccounts = await db
    .select({
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      accountTitleId: tafs.accountTitleId,
      // There is at least one account that has the same ID
      // but different title (mismatching case); this should be
      // fixed in the data, but just to make sure
      budgetAgencyTitle: sql`(array_agg(${tafs.budgetAgencyTitle} ORDER BY ${tafs.budgetAgencyTitle}))[1]`,
      budgetBureauTitle: sql`(array_agg(${tafs.budgetBureauTitle} ORDER BY ${tafs.budgetBureauTitle}))[1]`,
      accountTitle: sql`(array_agg(${tafs.accountTitle} ORDER BY ${tafs.accountTitle}))[1]`
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .leftJoin(lines, eq(tafs.fileId, lines.fileId))
    // Explicitly not joining footnotes and searching via subquery (see where)
    //.leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(where)
    .groupBy(tafs.budgetAgencyTitleId, tafs.budgetBureauTitleId, tafs.accountTitleId)
    .orderBy(...accountOrder)
    .offset(searchParams.accountOffset || 0)
    .limit(searchParams.accountLimit || 10);
  console.timeEnd('accountSearchPaged');

  return allAccounts;
}

export const mAccountSearchPaged = memoizeDataAsync(accountSearchPaged);

/**
 * Query for full count of a file search, separated for asynchronous usage.
 *
 * @param searchParams
 * @returns
 */
export async function fileSearchFullCountQuery(searchParams: SearchPaginationParams) {
  const { where } = await searchSetup(searchParams, 'files');

  const countSubquery = db
    .selectDistinct({
      fileId: files.fileId
    })
    .from(files)
    .leftJoin(tafs, eq(files.fileId, tafs.fileId))
    .leftJoin(lines, eq(files.fileId, lines.fileId))
    // Explicitly not joining footnotes and searching via subquery (see where)
    //.leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(where)
    .as('countSubquery');

  return db.select({ count: count() }).from(countSubquery);
}

export const mFileSearchFullCountQuery = memoizeDataAsync(fileSearchFullCountQuery);

/**
 * Perform full count of a file search.
 *
 * @param searchParams
 * @returns
 */
export async function fileSearchFullCount(searchParams: SearchPaginationParams) {
  console.time('fileSearchFullCount');
  const fullCount = await fileSearchFullCountQuery(searchParams);
  console.timeEnd('fileSearchFullCount');

  return fullCount[0].count || 0;
}

export const mFileSearchFullCount = memoizeDataAsync(fileSearchFullCount);

/**
 * Search files with common search parameters for a specific page.
 *
 * @param searchParams
 * @returns
 */
export async function fileSearchPaged(searchParams: SearchPaginationParams) {
  const { where, hasLines, hasFootnotes, order } = await searchSetup(searchParams, 'files');

  // The meat of the query is that we want to find a set of distinct File IDs
  // but we want to order by an arbitrary set of fields.  We could use a DISTINCT
  // but then the ORDER BY has to be included in the select which makes the distinct
  // part different.  A GROUP BY and Window function have similar limitations.
  //
  // A subquery method to get the distinct list of File IDs could work but gets complicated
  // when we want to order on fields on TAFS or other one-to-many tables that
  // will cause more than one row to be returned for each File ID.
  //
  //
  console.time('fileSearchPaged');
  const limitedIds = await db
    .select({
      fileId: files.fileId
    })
    .from(files)
    .leftJoin(tafs, eq(files.fileId, tafs.fileId))
    .leftJoin(lines, eq(files.fileId, lines.fileId))
    // Explicitly not joining footnotes and searching via subquery (see where),
    // but if we need to order by or select from footnotes we need to join
    //.leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(where)
    .groupBy(files.fileId)
    .orderBy(...order)
    .offset(searchParams.offset)
    .limit(searchParams.limit);
  console.timeEnd('fileSearchPaged');

  // Details.  Is there a better way to do this
  console.time('fileSearchPaged-details');
  const detailsWith = {
    tafs: {
      // Specifically when ordering by account, we want the account
      // titles to be in alphabetical order.
      orderBy: (tafs, { asc }) => [asc(tafs.accountTitle)]
    }
  };
  if (hasLines) {
    detailsWith.tafs.with = {
      lines: {
        orderBy: (lines, { asc }) => [asc(lines.lineNumber)]
      }
    };
  }
  if (hasFootnotes) {
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
  console.timeEnd('fileSearchPaged-details');

  return fileDetails;
}

export const mFileSearchPaged = memoizeDataAsync(fileSearchPaged);

/**
 * Save a search for the specified user
 * (Currently used only by subscriptions)
 */
export async function saveUserSearch(email: string, criterion: SearchParams) {
  // Cut out of saving the search if it has already been saved
  const existingSearch = await userSearch(email, criterion);
  if (existingSearch) {
    return existingSearch;
  }

  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }
  const newSearch = {
    userId: userResults[0].id,
    criterion
  };
  const newRecords = await db.insert(searches).values(newSearch).returning({ id: searches.id });
  return newRecords[0];
}

/**
 * Remove saved search(es) for user
 * (Currently used only by subscriptions)
 */
export async function removeUserSearches(email: string, searchId: string | Array<string>) {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }

  await db
    .delete(searches)
    .where(
      and(
        eq(searches.userId, userResults[0].id),
        Array.isArray(searchId) ? inArray(searches.id, searchId) : eq(searches.id, searchId)
      )
    );
}

/**
 * Get a user's saved search with a given criterion
 * (Currently used only by subscriptions)
 */
export async function userSearch(
  email: string,
  criterion: SearchParams
): Promise<searchesSelect | undefined> {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return;
  }
  const newRecords = await db
    .select()
    .from(searches)
    .where(
      and(
        eq(searches.userId, userResults[0].id),
        sql`${searches.criterion}::json::text = ${criterion}::json::text`
      )
    );
  return newRecords[0];
}
